#!/usr/bin/env python3
"""
VeloTradeFi — LSTM Inference Script
====================================
Load trained LSTM model + scaler, run prediction.

Usage:
    python3 lstm_inference.py --symbol AAPL
    python3 lstm_inference.py --symbol AAPL --days 7
    python3 lstm_inference.py --symbol AAPL --compare    # Compare LSTM vs RF
"""

import os
import json
import logging
import argparse
from pathlib import Path
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
import requests

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
import tensorflow as tf
from tensorflow.keras.models import load_model

# ── Config ────────────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
MODEL_DIR = SCRIPT_DIR / "models"
SEQUENCE_LENGTH = 60
ALPHA_VANTAGE_API_KEY = os.environ.get("ALPHA_VANTAGE_API_KEY", "V39287UTRN02QHI9")
VN_SUFFIX = ".VN"
VN_STOCKS = {
    "VNM", "VIC", "HPG", "VHM", "MSN", "VRE", "FPT", "MWG",
    "PNJ", "TCB", "ACB", "VPB", "CTG", "MBB", "TPB", "STB",
    "SSI", "VND", "HCM", "BID",
}

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
logger = logging.getLogger("lstm-inference")


# ── Data Fetching (reuse from train_lstm.py logic) ────────────────────────────

def fetch_alpha_vantage(symbol: str) -> pd.DataFrame | None:
    url = (
        f"https://www.alphavantage.co/query"
        f"?function=TIME_SERIES_DAILY&symbol={symbol}"
        f"&apikey={ALPHA_VANTAGE_API_KEY}&outputsize=compact"
    )
    try:
        resp = requests.get(url, timeout=15)
        if resp.status_code != 200:
            return None
        data = resp.json()
        if "Time Series (Daily)" not in data:
            return None
        ts = data["Time Series (Daily)"]
        df = pd.DataFrame.from_dict(ts, orient="index")
        df = df.rename(columns={
            "1. open": "Open", "2. high": "High",
            "3. low": "Low", "4. close": "Close", "5. volume": "Volume"
        })
        for col in ["Open", "High", "Low", "Close", "Volume"]:
            df[col] = pd.to_numeric(df[col], errors="coerce")
        df.index = pd.to_datetime(df.index)
        df = df.sort_index().reset_index(drop=True)
        return df[["Open", "High", "Low", "Close", "Volume"]].dropna()
    except Exception as ex:
        logger.warning(f"Alpha Vantage failed: {ex}")
        return None


def fetch_yahoo_finance(symbol: str) -> pd.DataFrame | None:
    yf_sym = f"{symbol}{VN_SUFFIX}" if symbol in VN_STOCKS else symbol
    now = int(pd.Timestamp.utcnow().timestamp())
    period1 = now - 365 * 86400
    url = (
        f"https://query1.finance.yahoo.com/v8/finance/chart/{yf_sym}"
        f"?interval=1d&period1={period1}&period2={now}"
    )
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/122.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9,vi;q=0.8",
    }
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        if resp.status_code != 200:
            return None
        data = resp.json()
        result = data.get("chart", {}).get("result", [])
        if not result:
            return None
        r = result[0]
        ts = r.get("timestamp", [])
        quote = r.get("indicators", {}).get("quote", [{}])[0]
        df = pd.DataFrame({"timestamp": ts})
        for col, vals in {"Open": quote.get("open"), "High": quote.get("high"),
                          "Low": quote.get("low"), "Close": quote.get("close"),
                          "Volume": quote.get("volume")}.items():
            df[col] = vals
        df["timestamp"] = pd.to_datetime(df["timestamp"], unit="s")
        df = df.dropna(subset=["Close"]).sort_values("timestamp").reset_index(drop=True)
        return df if len(df) >= SEQUENCE_LENGTH else None
    except Exception as ex:
        logger.warning(f"Yahoo Finance failed: {ex}")
        return None


def fetch_stock_data(symbol: str) -> pd.DataFrame | None:
    sym = symbol.upper()
    if sym in VN_STOCKS:
        return fetch_yahoo_finance(sym)
    df = fetch_alpha_vantage(sym)
    if df is not None and len(df) >= SEQUENCE_LENGTH:
        return df
    return fetch_yahoo_finance(sym)


# ── Feature Engineering ──────────────────────────────────────────────────────

def build_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["SMA_10"] = df["Close"].rolling(window=10, min_periods=1).mean()
    df["SMA_20"] = df["Close"].rolling(window=20, min_periods=1).mean()
    delta = df["Close"].diff()
    gain = delta.where(delta > 0, 0.0).rolling(window=14, min_periods=1).mean()
    loss = (-delta.where(delta < 0, 0.0)).rolling(window=14, min_periods=1).mean()
    rs = gain / (loss + 1e-10)
    df["RSI"] = (100 - (100 / (1 + rs))).fillna(50.0)
    df["VolumeNorm"] = df["Volume"] / (df["Volume"].rolling(20, min_periods=1).mean() + 1)
    df["Returns"] = df["Close"].pct_change().fillna(0)
    df["Momentum"] = (df["Close"] / df["Close"].shift(5) - 1).fillna(0)
    return df.dropna()


# ── LSTM Inference ────────────────────────────────────────────────────────────

def load_lstm_model(symbol: str):
    """Load trained LSTM model and scaler for a symbol."""
    model_path = MODEL_DIR / f"lstm_{symbol}.keras"
    scaler_path = MODEL_DIR / f"scaler_{symbol}.json"
    if not model_path.exists() or not scaler_path.exists():
        return None, None
    model = load_model(str(model_path))
    with open(scaler_path) as f:
        scaler_data = json.load(f)
    return model, scaler_data


def predict_lstm(
    symbol: str,
    model,
    scaler_data: dict,
    df: pd.DataFrame,
    days: int = 7,
) -> dict:
    """
    Run LSTM prediction.
    Returns dict with current price, trend, confidence, and future prices.
    """
    feature_cols = ["Close", "SMA_10", "SMA_20", "RSI", "VolumeNorm", "Returns", "Momentum"]
    df_feat = build_features(df)
    scaled = scaler_data["min"], scaler_data["max"]
    fmin, fmax = np.array(scaled[0]), np.array(scaled[1])
    rng = fmax - fmin

    # Scale last SEQUENCE_LENGTH rows
    recent = df_feat[feature_cols].tail(SEQUENCE_LENGTH).values
    scaled_recent = (recent - fmin) / (rng + 1e-10)
    X = scaled_recent.reshape(1, SEQUENCE_LENGTH, len(feature_cols)).astype(np.float32)

    # Predict direction
    prob = float(model.predict(X, verbose=0)[0, 0])

    # Get current price for projection
    current_price = float(df["Close"].iloc[-1])

    # Trend: prob > 0.5 → bullish, else bearish
    # confidence = abs(prob - 0.5) * 2 maps to [0, 1]
    if prob > 0.5:
        trend = "bullish"
        confidence = (prob - 0.5) * 2
    else:
        trend = "bearish"
        confidence = (0.5 - prob) * 2

    # Project prices for next `days` days
    predictions = []
    projected = current_price
    drift = 0.01 if trend == "bullish" else -0.01

    for i in range(1, days + 1):
        projected = projected * (1 + drift)
        target_date = (datetime.utcnow().date() + timedelta(days=i)).isoformat()
        predictions.append({
            "date": target_date,
            "predictedPrice": round(projected, 2),
            "confidence": round(float(confidence), 3),
            "upperBound": round(projected * 1.02, 2),
            "lowerBound": round(projected * 0.98, 2),
        })

    # Denormalize probability to [0, 1]
    close_idx = feature_cols.index("Close")
    close_min = fmin[close_idx]
    close_max = fmax[close_idx]

    return {
        "symbol": symbol,
        "model": f"LSTM",
        "currentPrice": round(current_price, 2),
        "trend": trend,
        "confidence": round(float(confidence), 3),
        "raw_prob": round(float(prob), 4),
        "currentPriceUSD": round(current_price, 2),
        "predictions": predictions,
    }


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="LSTM Inference")
    parser.add_argument("--symbol", "-s", default="AAPL", help="Stock symbol")
    parser.add_argument("--days", "-d", type=int, default=7, help="Days to forecast")
    parser.add_argument("--compare", action="store_true", help="Compare with Random Forest")
    args = parser.parse_args()

    sym = args.symbol.upper()
    logger.info(f"Loading LSTM model for {sym}...")

    model, scaler_data = load_lstm_model(sym)
    if model is None:
        logger.error(f"No trained model found for {sym}. Run: python3 train_lstm.py --symbol {sym}")
        return

    logger.info(f"Fetching stock data...")
    df = fetch_stock_data(sym)
    if df is None:
        logger.error("Failed to fetch stock data")
        return

    current = df["Close"].iloc[-1]
    logger.info(f"Current price: {current:.2f}")

    # Run LSTM prediction
    lstm_result = predict_lstm(sym, model, scaler_data, df, days=args.days)

    print(f"\n{'='*50}")
    print(f"  LSTM Prediction for {sym}")
    print(f"{'='*50}")
    print(f"  Current Price: {lstm_result['currentPrice']}")
    print(f"  Trend: {lstm_result['trend']}")
    print(f"  Confidence: {lstm_result['confidence']:.1%}")
    print(f"  Model: {lstm_result['model']}")
    print(f"  Days Forecasted: {args.days}")
    print(f"  Projections:")
    for p in lstm_result["predictions"]:
        print(f"    {p['date']}: ${p['predictedPrice']:.2f} "
              f"(±{abs(p['upperBound']-p['lowerBound'])/2:.2f})")

    # Compare with Random Forest if requested
    if args.compare:
        print(f"\n  Note: Random Forest comparison not yet implemented.")
        print(f"  (Run main.py for Random Forest baseline)")

    print(f"\n  Model path: {MODEL_DIR / f'lstm_{sym}.keras'}")


if __name__ == "__main__":
    main()
