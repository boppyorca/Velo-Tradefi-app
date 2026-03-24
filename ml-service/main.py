"""
VeloTradeFi — ML Prediction Service
===================================
Dual-model inference: LSTM (trained) + Random Forest (online).
Priority: LSTM if trained model exists → else Random Forest.

Usage:
    GET /predict/{symbol}?model=lstm&days=7    # LSTM if available
    GET /predict/{symbol}?model=random_forest  # Random Forest
    GET /predict/{symbol}                       # Best available
"""

import os
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path

import requests
import pandas as pd
import numpy as np

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import MinMaxScaler

# TensorFlow (only loaded when LSTM is needed — lazy import to save memory)
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ml-service")

app = FastAPI(title="VeloTradeFi ML Service", version="2.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Paths & Config ────────────────────────────────────────────────────────────
SERVICE_DIR = Path(__file__).parent
MODEL_DIR = SERVICE_DIR / "models"
SEQUENCE_LENGTH = 60
ALPHA_VANTAGE_API_KEY = os.environ.get("ALPHA_VANTAGE_API_KEY", "V39287UTRN02QHI9")

# VN stocks: Yahoo Finance uses .VN suffix
VN_SUFFIX = ".VN"
VN_STOCKS = {
    "VNM", "VIC", "HPG", "VHM", "MSN", "VRE", "FPT", "MWG",
    "PNJ", "TCB", "ACB", "VPB", "CTG", "MBB", "TPB", "STB",
    "SSI", "VND", "HCM", "BID",
}
VN_FALLBACK_PRICES = {
    "VNM": 78000, "VIC": 42000, "HPG": 28000, "VHM": 38000,
    "MSN": 72000, "VRE": 22000, "FPT": 145000, "MWG": 51000,
    "PNJ": 98000, "TCB": 24800, "ACB": 22000, "VPB": 18500,
    "CTG": 32000, "MBB": 15500, "TPB": 17500, "STB": 28000,
    "SSI": 35000, "VND": 12500, "HCM": 28000, "BID": 48500,
}


def is_vn_stock(symbol: str) -> bool:
    return symbol.upper() in VN_STOCKS


def get_yahoo_ticker(symbol: str) -> str:
    s = symbol.upper()
    if s.endswith(".VN"):
        return s
    suffix = VN_SUFFIX if is_vn_stock(s) else ""
    return f"{s}{suffix}"


# ── Pydantic Schemas ─────────────────────────────────────────────────────────
class PredictionPoint(BaseModel):
    date: str
    predictedPrice: float
    confidence: float
    upperBound: float
    lowerBound: float


class PredictionResponse(BaseModel):
    symbol: str
    model: str
    currentPrice: float
    trend: str
    confidence: float
    predictions: list[PredictionPoint]


# ── Data Fetching ────────────────────────────────────────────────────────────

def fetch_alpha_vantage(symbol: str) -> pd.DataFrame | None:
    """Fetch US stock data from Alpha Vantage (100 trading days)."""
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
        df = df.rename(columns={"4. close": "close"})
        df["close"] = df["close"].astype(float)
        df.index = pd.to_datetime(df.index)
        df = df.sort_index().reset_index(drop=True)
        return df[["close"]]
    except Exception as ex:
        logger.warning(f"Alpha Vantage failed for {symbol}: {ex}")
        return None


def fetch_yahoo_finance(symbol: str) -> pd.DataFrame | None:
    """Fetch stock data from Yahoo Finance v8 API (supports VN stocks via .VN)."""
    yf_sym = get_yahoo_ticker(symbol)
    now = int(datetime.utcnow().timestamp())
    period1 = now - 365 * 86400  # 1 year

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/122.0.0.0 Safari/537.36"
        ),
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9,vi;q=0.8",
    }

    url = (
        f"https://query1.finance.yahoo.com/v8/finance/chart/{yf_sym}"
        f"?interval=1d&period1={period1}&period2={now}"
    )

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
        closes = r.get("indicators", {}).get("quote", [{}])[0].get("close", [])
        if not ts or not closes:
            return None
        df = pd.DataFrame({"timestamp": ts, "close": closes})
        df["timestamp"] = pd.to_datetime(df["timestamp"], unit="s")
        df = df.dropna(subset=["close"]).sort_values("timestamp").reset_index(drop=True)
        return df[["close"]] if len(df) >= 10 else None
    except Exception as ex:
        logger.warning(f"Yahoo Finance failed for {yf_sym}: {ex}")
        return None


def fetch_stock_data(symbol: str) -> pd.DataFrame:
    """
    Fetch stock data: VN → Yahoo Finance | US → Alpha Vantage → Yahoo Finance fallback.
    Returns DataFrame with 'close' column.
    """
    sym = symbol.upper()

    if is_vn_stock(sym):
        df = fetch_yahoo_finance(sym)
        if df is not None and len(df) >= 20:
            return df
        logger.warning(f"All sources failed for VN stock {sym}. Using fallback data.")
        return _fallback_data(sym, is_vn=True)
    else:
        df = fetch_alpha_vantage(sym)
        if df is not None and len(df) >= 20:
            return df
        df = fetch_yahoo_finance(sym)
        if df is not None and len(df) >= 20:
            return df
        logger.warning(f"All sources failed for {sym}. Using fallback data.")
        return _fallback_data(sym, is_vn=False)


def _fallback_data(symbol: str, is_vn: bool = False) -> pd.DataFrame:
    dates = pd.date_range(end=datetime.today(), periods=60)
    if is_vn:
        base = VN_FALLBACK_PRICES.get(symbol.upper(), 50000)
        prices = np.abs(np.random.normal(loc=base, scale=base * 0.02, size=60))
    else:
        bases = {"AAPL": 190, "NVDA": 135, "TSLA": 250, "MSFT": 415,
                 "AMZN": 196, "META": 512, "GOOGL": 172, "NFLX": 485}
        base = bases.get(symbol.upper(), 100)
        prices = np.abs(np.random.normal(loc=base, scale=base * 0.02, size=60))
    return pd.DataFrame({"close": prices}, index=dates)


# ── Feature Engineering ──────────────────────────────────────────────────────

def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """Compute all 7 features to match LSTM training pipeline."""
    df = df.copy()
    # 1. SMA 10-day
    df["SMA_10"] = df["close"].rolling(window=10, min_periods=1).mean()
    # 2. SMA 20-day
    df["SMA_20"] = df["close"].rolling(window=20, min_periods=1).mean()
    # 3. RSI-14
    delta = df["close"].diff()
    gain = delta.where(delta > 0, 0.0).rolling(window=14, min_periods=1).mean()
    loss = (-delta.where(delta < 0, 0.0)).rolling(window=14, min_periods=1).mean()
    rs = gain / (loss + 1e-10)
    df["RSI"] = (100 - (100 / (1 + rs))).fillna(50.0)
    # 4. VolumeNorm
    vol_avg = df["close"].rolling(window=20, min_periods=1).mean()
    df["VolumeNorm"] = df["close"] / (vol_avg + 1)
    # 5. Returns
    df["Returns"] = df["close"].pct_change().fillna(0)
    # 6. Momentum
    df["Momentum"] = (df["close"] / df["close"].shift(5) - 1).fillna(0)
    # 7. Target (for RF only)
    df["Target"] = (df["close"].shift(-1) > df["close"]).astype(int)
    return df.dropna()


# ── Random Forest ────────────────────────────────────────────────────────────

def run_random_forest(df: pd.DataFrame) -> tuple[str, float]:
    """Train Random Forest on the dataset and predict next-day direction."""
    features = ["SMA_10", "SMA_20", "RSI"]
    X = df[features]
    y = df["Target"]
    if len(X) < 5:
        return "neutral", 0.5
    rf = RandomForestClassifier(n_estimators=100, random_state=42)
    rf.fit(X.iloc[:-1], y.iloc[:-1])
    probs = rf.predict_proba(X.iloc[[-1]])[0]
    if probs[1] > probs[0]:
        return "bullish", float(probs[1])
    else:
        return "bearish", float(probs[0])


# ── LSTM Inference ────────────────────────────────────────────────────────────

_lstm_cache: dict[str, tuple] = {}  # symbol → (model, scaler_data)


def _load_lstm(symbol: str):
    """Lazy-load trained LSTM model and scaler (cached after first load)."""
    if symbol in _lstm_cache:
        return _lstm_cache[symbol]
    model_path = MODEL_DIR / f"lstm_{symbol}.keras"
    scaler_path = MODEL_DIR / f"scaler_{symbol}.json"
    if not model_path.exists() or not scaler_path.exists():
        return None, None
    try:
        from tensorflow.keras.models import load_model
        model = load_model(str(model_path))
        with open(scaler_path) as f:
            scaler_data = json.load(f)
        _lstm_cache[symbol] = (model, scaler_data)
        logger.info(f"LSTM model loaded for {symbol}")
        return model, scaler_data
    except Exception as ex:
        logger.warning(f"Failed to load LSTM for {symbol}: {ex}")
        return None, None


def _lstm_predict(symbol: str, df: pd.DataFrame) -> tuple[str, float] | None:
    """
    Run LSTM inference. Returns (trend, confidence) or None if model unavailable.
    """
    model, scaler_data = _load_lstm(symbol)
    if model is None:
        return None

    # IMPORTANT: Must match training feature list exactly
    # Training: ["Close", "SMA_10", "SMA_20", "RSI", "VolumeNorm", "Returns", "Momentum"]
    # Inference uses same 7 features for consistency
    feature_cols = ["close", "SMA_10", "SMA_20", "RSI", "VolumeNorm", "Returns", "Momentum"]
    df_feat = build_features(df)

    fmin = np.array(scaler_data["min"])
    fmax = np.array(scaler_data["max"])
    rng = fmax - fmin

    # Ensure feature count matches scaler (7 features)
    if df_feat[feature_cols].shape[1] != len(fmin):
        logger.warning(f"Feature mismatch: scaler has {len(fmin)} features, data has {df_feat[feature_cols].shape[1]}")
        return None

    # Scale last SEQUENCE_LENGTH rows
    recent = df_feat[feature_cols].tail(SEQUENCE_LENGTH).values
    scaled = (recent - fmin) / (rng + 1e-10)
    X = scaled.reshape(1, SEQUENCE_LENGTH, len(feature_cols)).astype(np.float32)

    prob = float(model.predict(X, verbose=0)[0, 0])
    # The model predicts a normalized price value — compare to 0.5 threshold
    if prob > 0.5:
        trend = "bullish"
        confidence = float(min(abs(prob - 0.5) * 2, 1.0))
    else:
        trend = "bearish"
        confidence = float(min(abs(prob - 0.5) * 2, 1.0))

    return trend, max(confidence, 0.3)  # minimum 30% confidence


# ── Projection ─────────────────────────────────────────────────────────────

def project_prices(
    current_price: float,
    trend: str,
    confidence: float,
    days: int,
) -> list[PredictionPoint]:
    """Project future prices based on trend direction."""
    predictions = []
    projected = current_price
    drift = 0.01 if trend == "bullish" else -0.01

    for i in range(1, days + 1):
        projected = projected * (1 + drift)
        target_date = (datetime.utcnow().date() + timedelta(days=i)).isoformat()
        predictions.append(PredictionPoint(
            date=target_date,
            predictedPrice=round(projected, 2),
            confidence=round(confidence, 3),
            upperBound=round(projected * 1.02, 2),
            lowerBound=round(projected * 0.98, 2),
        ))
    return predictions


# ── API Endpoints ───────────────────────────────────────────────────────────

@app.get("/predict/{symbol}", response_model=PredictionResponse)
async def predict(symbol: str, model: str = "auto", days: int = 7):
    """
    Stock price prediction endpoint.

    model parameter:
      - auto     → LSTM if trained model exists, else Random Forest
      - lstm     → LSTM (fails if not trained)
      - random_forest → Random Forest (always available)
    """
    sym = symbol.upper()

    # 1. Fetch data
    df = fetch_stock_data(sym)
    current_price = float(df["close"].iloc[-1])

    # 2. Select model
    if model == "lstm":
        lstm_result = _lstm_predict(sym, df)
        if lstm_result is None:
            raise HTTPException(
                status_code=404,
                detail=f"LSTM model not trained for {sym}. "
                       f"Run: python3 train_lstm.py --symbol {sym}",
            )
        trend, confidence = lstm_result
        model_used = f"LSTM_v2"

    elif model == "random_forest":
        df_feat = build_features(df)
        trend, confidence = run_random_forest(df_feat)
        model_used = "RandomForest"

    else:  # auto
        lstm_result = _lstm_predict(sym, df)
        if lstm_result is not None:
            trend, confidence = lstm_result
            model_used = "LSTM_v2"
        else:
            df_feat = build_features(df)
            trend, confidence = run_random_forest(df_feat)
            model_used = "RandomForest"

    # 3. Project prices
    predictions = project_prices(current_price, trend, confidence, days)

    logger.info(
        f"Prediction [{sym}] model={model_used}: "
        f"price={current_price:.2f}, trend={trend}, conf={confidence:.1%}"
    )

    return PredictionResponse(
        symbol=sym,
        model=model_used,
        currentPrice=round(current_price, 2),
        trend=trend,
        confidence=round(confidence, 3),
        predictions=predictions,
    )


@app.get("/models")
async def list_models():
    """List all trained LSTM models."""
    trained = []
    for f in MODEL_DIR.glob("lstm_*.keras"):
        sym = f.stem.replace("lstm_", "")
        trained.append(sym)
    return {"trained_models": sorted(trained), "cache": list(_lstm_cache.keys())}


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ml-service", "version": "2.2.0"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
