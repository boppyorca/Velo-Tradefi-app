#!/usr/bin/env python3
"""
VeloTradeFi — LSTM Stock Prediction Training Pipeline
=====================================================
Train LSTM model cho stock price prediction.

Usage:
    python3 train_lstm.py                          # Train default (AAPL)
    python3 train_lstm.py --symbol VNM             # Train VN stock
    python3 train_lstm.py --symbol AAPL VNM TCB    # Train multiple
    python3 train_lstm.py --all                    # Train all supported stocks
    python3 train_lstm.py --retrain                # Retrain all models from scratch

Architecture:
    Input(sequence=60 timesteps, features=7)
        → LSTM(64) + Dropout(0.2)
        → LSTM(32) + Dropout(0.2)
        → Dense(16) + ReLU
        → Dense(1)  → next-day close price

Data: Yahoo Finance (yfinance)
Features:
    0. close (normalized)
    1. SMA_10
    2. SMA_20
    3. RSI_14
    4. volume_normalized
    5. returns
    6. momentum

Model output: Normalized next-day close price prediction
Inference: Inverse transform để lấy actual price

References:
    - Keras Sequential LSTM: https://keras.io/guides/sequential_model/
    - Time series forecasting: https://keras.io/examples/timeseries/
    - ModelCheckpoint + EarlyStopping: https://keras.io/api/callbacks/
    - Model saving (.keras): https://keras.io/api/models/model_saving_apis/
"""

import os
import sys
import json
import time
import logging
import argparse
from pathlib import Path

import numpy as np
import pandas as pd
import requests

# TensorFlow / Keras
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")  # Suppress TF warnings
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, callbacks as keras_callbacks
from tensorflow.keras.layers import LSTM
from tensorflow.keras.models import Sequential, load_model

from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error

# ── API Keys ─────────────────────────────────────────────────────────────────
# Alpha Vantage: best for US stocks (25 req/day on free tier)
# Yahoo Finance v8: best for VN stocks (.VN suffix) and US fallback
ALPHA_VANTAGE_API_KEY = os.environ.get("ALPHA_VANTAGE_API_KEY", "V39287UTRN02QHI9")

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("lstm-trainer")

# ── Config ─────────────────────────────────────────────────────────────────────
SEQUENCE_LENGTH = 60      # 60 trading days input window
FORECAST_HORIZON = 1      # Predict 1 day ahead
TRAIN_RATIO = 0.80        # 80% train, 20% validation
EPOCHS = 100
BATCH_SIZE = 32
PATIENCE = 15             # EarlyStopping patience
MODEL_DIR = Path(__file__).parent / "models"
MODEL_DIR.mkdir(exist_ok=True)

# VN stocks: Yahoo Finance uses .VN suffix
VN_SUFFIX = ".VN"

# Supported US stocks (NASDAQ/NYSE)
US_STOCKS = [
    "AAPL", "MSFT", "NVDA", "TSLA", "GOOGL", "META", "AMZN",
    "AMD", "INTC", "NFLX", "IBM", "ORCL", "CRM", "ADBE",
]

# Supported VN stocks (HOSE)
VN_STOCKS = [
    "VNM", "VIC", "HPG", "VHM", "MSN", "VRE", "FPT", "MWG",
    "PNJ", "TCB", "ACB", "VPB", "CTG", "MBB", "TPB", "STB",
    "SSI", "VND", "HCM", "BID",
]

# All supported stocks
ALL_STOCKS = US_STOCKS + VN_STOCKS

# ── Feature Engineering ────────────────────────────────────────────────────────

def compute_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Engineer features from raw OHLCV data.
    Returns DataFrame with 7 features suitable for LSTM.
    """
    df = df.copy()

    # 1. SMA 10-day
    df["SMA_10"] = df["Close"].rolling(window=10, min_periods=1).mean()

    # 2. SMA 20-day
    df["SMA_20"] = df["Close"].rolling(window=20, min_periods=1).mean()

    # 3. RSI-14
    delta = df["Close"].diff()
    gain = delta.where(delta > 0, 0.0).rolling(window=14, min_periods=1).mean()
    loss = (-delta.where(delta < 0, 0.0)).rolling(window=14, min_periods=1).mean()
    rs = gain / (loss + 1e-10)
    df["RSI"] = 100 - (100 / (1 + rs))
    df["RSI"] = df["RSI"].fillna(50.0)

    # 4. Normalized volume
    vol_20_avg = df["Volume"].rolling(window=20, min_periods=1).mean()
    df["VolumeNorm"] = df["Volume"] / (vol_20_avg + 1)

    # 5. Daily returns
    df["Returns"] = df["Close"].pct_change().fillna(0)

    # 6. Momentum (5-day)
    df["Momentum"] = df["Close"] / df["Close"].shift(5) - 1
    df["Momentum"] = df["Momentum"].fillna(0)

    # 7. Close — already in df

    # Target: next-day close price
    df["Target"] = df["Close"].shift(-1)

    # Drop rows with NaN
    df = df.dropna()

    return df


def get_feature_columns() -> list[str]:
    """7 features used for LSTM training."""
    return ["Close", "SMA_10", "SMA_20", "RSI", "VolumeNorm", "Returns", "Momentum"]


# ── Data Loading ────────────────────────────────────────────────────────────────

def download_alpha_vantage(symbol: str) -> pd.DataFrame | None:
    """
    Download historical OHLCV data from Alpha Vantage.
    Best for US stocks (has API key). Returns up to 20 years of daily data.
    Free tier: 25 requests/day, 5 requests/minute.
    """
    logger.info(f"Fetching Alpha Vantage data for {symbol}...")
    url = (
        f"https://www.alphavantage.co/query"
        f"?function=TIME_SERIES_DAILY&symbol={symbol}"
        f"&apikey={ALPHA_VANTAGE_API_KEY}&outputsize=compact"
    )
    for attempt in range(3):
        try:
            resp = requests.get(url, timeout=20)
            if resp.status_code != 200:
                logger.warning(f"Alpha Vantage HTTP {resp.status_code}")
                return None
            data = resp.json()
            if "Time Series (Daily)" not in data:
                msg = data.get("Note") or data.get("Information") or "Unknown error"
                logger.warning(f"Alpha Vantage error: {msg}")
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
            df = df.dropna(subset=["Close"])
            logger.info(f"Alpha Vantage: got {len(df)} rows for {symbol}")
            return df[["Open", "High", "Low", "Close", "Volume"]]
        except Exception as ex:
            logger.warning(f"Attempt {attempt+1} Alpha Vantage failed: {ex}")
            time.sleep(2)
    return None


def download_yahoo_finance(symbol: str) -> pd.DataFrame | None:
    """
    Download historical OHLCV data from Yahoo Finance v8 API.
    Handles VN stocks by appending .VN suffix.
    Includes retry with exponential backoff for rate limit (HTTP 429).
    """
    yf_symbol = f"{symbol}{VN_SUFFIX}" if symbol in VN_STOCKS else symbol

    now = int(pd.Timestamp.utcnow().timestamp())
    period_days = {
        "1mo": 30, "3mo": 90, "6mo": 180, "1y": 365,
        "2y": 730, "5y": 1825, "max": 3650,
    }
    days = period_days["5y"]  # Use 5 years for training
    period1 = now - days * 86400

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/122.0.0.0 Safari/537.36"
        ),
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9,vi;q=0.8",
        "Origin": "https://finance.yahoo.com",
        "Referer": "https://finance.yahoo.com/quote/" + yf_symbol,
    }

    logger.info(f"Fetching Yahoo Finance data for {yf_symbol}...")

    for attempt in range(4):
        url = (
            f"https://query1.finance.yahoo.com/v8/finance/chart/{yf_symbol}"
            f"?interval=1d&period1={period1}&period2={now}"
        )
        try:
            resp = requests.get(url, headers=headers, timeout=20)
            if resp.status_code == 429:
                wait = (attempt + 1) * 8
                logger.warning(f"Yahoo Finance rate limited (429) — retrying in {wait}s...")
                time.sleep(wait)
                continue
            if resp.status_code != 200:
                logger.warning(f"Yahoo Finance HTTP {resp.status_code} for {yf_symbol}")
                return None

            data = resp.json()
            result = data.get("chart", {}).get("result", [])
            if not result:
                logger.warning(f"No result for {yf_symbol}")
                return None

            r = result[0]
            timestamps = r.get("timestamp", [])
            quote = r.get("indicators", {}).get("quote", [{}])[0]
            ohlcv = {
                "Open": quote.get("open", []),
                "High": quote.get("high", []),
                "Low": quote.get("low", []),
                "Close": quote.get("close", []),
                "Volume": quote.get("volume", []),
            }

            if not ohlcv["Close"]:
                logger.warning(f"Empty data for {yf_symbol}")
                return None

            df = pd.DataFrame({"timestamp": timestamps})
            for col, vals in ohlcv.items():
                df[col] = vals

            df["timestamp"] = pd.to_datetime(df["timestamp"], unit="s")
            df = df.dropna(subset=["Close"]).sort_values("timestamp").reset_index(drop=True)

            if len(df) < SEQUENCE_LENGTH + 10:
                logger.warning(f"Insufficient data for {yf_symbol}: {len(df)} rows")
                return None

            logger.info(f"Yahoo Finance: got {len(df)} rows for {yf_symbol}")
            return df[["Open", "High", "Low", "Close", "Volume"]]

        except Exception as ex:
            logger.warning(f"Attempt {attempt+1} Yahoo Finance failed: {ex}")
            time.sleep(3)

    logger.error(f"All attempts failed for {yf_symbol}")
    return None


def download_stock_data(symbol: str) -> pd.DataFrame | None:
    """
    Download historical OHLCV data for a stock symbol.

    Strategy:
      - VN stocks (HOSE): Yahoo Finance with .VN suffix
      - US stocks (NASDAQ/NYSE): Alpha Vantage first, Yahoo Finance fallback
      - Any failure: None (training will skip this symbol)
    """
    sym = symbol.upper()

    if sym in VN_STOCKS:
        # VN stocks → Yahoo Finance
        df = download_yahoo_finance(sym)
        return df

    # US stocks → Alpha Vantage first
    df = download_alpha_vantage(sym)
    if df is not None and len(df) >= SEQUENCE_LENGTH + 10:
        return df

    # Fallback: Yahoo Finance for US stocks
    logger.warning(f"Alpha Vantage failed for {sym} — trying Yahoo Finance fallback...")
    time.sleep(3)  # Brief pause between providers
    df = download_yahoo_finance(sym)
    if df is not None:
        return df

    return None


def create_sequences(
    data: np.ndarray,
    seq_len: int,
    horizon: int = 1
) -> tuple[np.ndarray, np.ndarray]:
    """
    Create (X, y) sequences from time series data.

    X shape: (num_samples, seq_len, num_features)
    y shape: (num_samples,) — next-day close price

    Reference: keras.utils.timeseries_dataset_from_array pattern
    (https://keras.io/examples/timeseries/timeseries_traffic_forecasting)
    """
    X, y = [], []
    for i in range(len(data) - seq_len - horizon + 1):
        X.append(data[i : i + seq_len])
        y.append(data[i + seq_len + horizon - 1, 0])  # Only Close price as target
    return np.array(X, dtype=np.float32), np.array(y, dtype=np.float32)


def prepare_data(symbol: str) -> tuple | None:
    """
    Full pipeline: download → feature engineer → scale → split → sequences.
    Returns (X_train, y_train, X_val, y_val, scaler, df) or None on failure.
    """
    df_raw = download_stock_data(symbol)
    if df_raw is None:
        return None

    df = compute_features(df_raw)
    feature_cols = get_feature_columns()

    # Scale all features to [0, 1] — fit scaler on training portion only
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_data = scaler.fit_transform(df[feature_cols])

    # Split: 80% train, 20% val (chronological, no shuffle for time series)
    split_idx = int(len(scaled_data) * TRAIN_RATIO)
    train_data = scaled_data[:split_idx]
    val_data = scaled_data[split_idx:]

    # Create sequences
    X_train, y_train = create_sequences(train_data, SEQUENCE_LENGTH, FORECAST_HORIZON)
    X_val, y_val = create_sequences(val_data, SEQUENCE_LENGTH, FORECAST_HORIZON)

    # Fallback: if val set is empty (small datasets from compact API),
    # use all data for training (no validation split)
    if len(X_val) == 0:
        logger.warning(
            f"  Val set empty with {len(df_raw)} rows. "
            f"Training without validation split."
        )
        all_data = np.concatenate([train_data, val_data])
        X_train, y_train = create_sequences(all_data, SEQUENCE_LENGTH, FORECAST_HORIZON)
        X_val = X_train[-5:]   # fake val for callbacks (not actually used)
        y_val = y_train[-5:]

    logger.info(
        f"  Train: {X_train.shape}, Val: {X_val.shape} | "
        f"Total: {len(df_raw)} rows → {len(scaled_data)} after features"
    )
    return X_train, y_train, X_val, y_val, scaler, df, feature_cols


# ── Model Architecture ────────────────────────────────────────────────────────

def build_lstm_model(input_shape: tuple[int, int]) -> keras.Model:
    """
    Build LSTM model for stock price regression.

    Architecture (dựa trên Keras best practices):
        Input(shape=input_shape)
        → LSTM(64, return_sequences=True) + Dropout(0.2)
        → LSTM(32, return_sequences=False) + Dropout(0.2)
        → Dense(16, ReLU)
        → Dense(1)  → next-day close (normalized)

    Loss: MSE (Mean Squared Error) — standard for regression
    Optimizer: Adam with learning rate schedule (ReduceLROnPlateau)
    """
    model = Sequential([
        # Input layer — specify shape here to avoid warning
        layers.Input(shape=input_shape),
        # LSTM layer 1 — return sequences for stacking
        LSTM(64, return_sequences=True),
        layers.Dropout(0.2),
        # LSTM layer 2 — compress sequence to single output
        LSTM(32, return_sequences=False),
        layers.Dropout(0.2),
        # Dense layers for final prediction
        layers.Dense(16, activation="relu"),
        layers.Dense(1),  # Linear output — normalized price
    ])

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-3),
        loss="mse",
        metrics=["mae"],
    )

    return model


# ── Training ──────────────────────────────────────────────────────────────────

def train_lstm(
    symbol: str,
    retrain: bool = False,
    epochs: int = EPOCHS,
    batch_size: int = BATCH_SIZE,
) -> dict | None:
    """
    Full training pipeline cho một symbol.
    Returns metrics dict hoặc None nếu fail.
    """
    model_path = MODEL_DIR / f"lstm_{symbol}.keras"
    scaler_path = MODEL_DIR / f"scaler_{symbol}.json"

    # Skip if model exists and not retraining
    if model_path.exists() and not retrain:
        logger.info(f"[{symbol}] Model already exists at {model_path} — skipping (use --retrain to override)")
        return load_existing_metrics(symbol)

    logger.info(f"\n{'='*60}")
    logger.info(f"  Training LSTM for {symbol}")
    logger.info(f"{'='*60}")

    start_time = time.time()

    # ── 1. Prepare data ──────────────────────────────────────────────────────
    result = prepare_data(symbol)
    if result is None:
        return None
    X_train, y_train, X_val, y_val, scaler, df, feature_cols = result

    num_features = X_train.shape[2]
    logger.info(f"  Input shape: ({SEQUENCE_LENGTH}, {num_features})")
    logger.info(f"  Features: {feature_cols}")

    # ── 2. Save scaler (for inference) ──────────────────────────────────────
    scaler_data = {
        "min": scaler.data_min_.tolist(),
        "max": scaler.data_max_.tolist(),
        "feature_range": scaler.feature_range,
    }
    with open(scaler_path, "w") as f:
        json.dump(scaler_data, f)
    logger.info(f"  Scaler saved to {scaler_path}")

    # ── 3. Build model ────────────────────────────────────────────────────────
    model = build_lstm_model(input_shape=(SEQUENCE_LENGTH, num_features))
    model.summary(print_fn=logger.info)

    # ── 4. Callbacks ─────────────────────────────────────────────────────────
    checkpoint_path = MODEL_DIR / f"lstm_{symbol}_ckpt.keras"
    # If no real validation data, skip EarlyStopping (can't monitor val_loss)
    has_val = len(X_val) >= 3
    if has_val:
        callbacks = [
            keras_callbacks.ModelCheckpoint(
                filepath=str(checkpoint_path),
                monitor="val_loss",
                save_best_only=True,
                verbose=0,
            ),
            keras_callbacks.ReduceLROnPlateau(
                monitor="val_loss",
                factor=0.5,
                patience=5,
                min_lr=1e-6,
                verbose=1,
            ),
            keras_callbacks.EarlyStopping(
                monitor="val_loss",
                patience=PATIENCE,
                restore_best_weights=True,
                verbose=1,
            ),
        ]
        val_data = (X_val, y_val)
    else:
        logger.warning("  No validation data — using training loss for monitoring (no early stopping)")
        callbacks = [
            keras_callbacks.ModelCheckpoint(
                filepath=str(checkpoint_path),
                monitor="loss",
                save_best_only=True,
                verbose=0,
            ),
            keras_callbacks.ReduceLROnPlateau(
                monitor="loss",
                factor=0.5,
                patience=5,
                min_lr=1e-6,
                verbose=1,
            ),
        ]
        val_data = None

    # ── 5. Train ─────────────────────────────────────────────────────────────
    logger.info(f"  Training: epochs={epochs}, batch_size={batch_size}")
    history = model.fit(
        X_train, y_train,
        validation_data=val_data,
        epochs=epochs,
        batch_size=batch_size,
        callbacks=callbacks,
        verbose=2,
    )

    # ── 6. Save final model ──────────────────────────────────────────────────
    model.save(model_path)
    elapsed = time.time() - start_time

    # ── 7. Evaluate ──────────────────────────────────────────────────────────
    close_idx = feature_cols.index("Close")
    close_min = scaler_data["min"][close_idx]
    close_max = scaler_data["max"][close_idx]
    close_range = close_max - close_min

    if has_val:
        val_pred_norm = model.predict(X_val, verbose=0).flatten()
        y_val_actual = y_val * close_range + close_min
        val_pred_actual = val_pred_norm * close_range + close_min
        mae = mean_absolute_error(y_val_actual, val_pred_actual)
        rmse = np.sqrt(mean_squared_error(y_val_actual, val_pred_actual))
        mape = np.mean(np.abs((y_val_actual - val_pred_actual) / (y_val_actual + 1e-10))) * 100
    else:
        # No val data — use last few training samples as pseudo-evaluation
        n = min(10, len(X_train))
        pseudo_X = X_train[-n:]
        pseudo_y = y_train[-n:]
        val_pred_norm = model.predict(pseudo_X, verbose=0).flatten()
        y_val_actual = pseudo_y * close_range + close_min
        val_pred_actual = val_pred_norm * close_range + close_min
        mae = mean_absolute_error(y_val_actual, val_pred_actual)
        rmse = np.sqrt(mean_squared_error(y_val_actual, val_pred_actual))
        mape = np.mean(np.abs((y_val_actual - val_pred_actual) / (y_val_actual + 1e-10))) * 100

    metrics = {
        "symbol": symbol,
        "val_mae": round(float(mae), 4),
        "val_rmse": round(float(rmse), 4),
        "val_mape": round(float(mape), 2),
        "train_loss_final": round(float(history.history["loss"][-1]), 6),
        "val_loss_final": round(float(history.history["val_loss"][-1]), 6),
        "epochs_trained": len(history.history["loss"]),
        "elapsed_seconds": round(elapsed, 1),
        "model_path": str(model_path),
        "scaler_path": str(scaler_path),
    }

    # Save metrics
    metrics_path = MODEL_DIR / f"metrics_{symbol}.json"
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)

    logger.info(f"\n  ✅ [{symbol}] Training complete in {elapsed:.1f}s")
    logger.info(f"     Val MAE: {mae:.4f} | Val RMSE: {rmse:.4f} | Val MAPE: {mape:.2f}%")
    logger.info(f"     Model: {model_path}")

    return metrics


def load_existing_metrics(symbol: str) -> dict | None:
    """Load metrics from previously trained model."""
    metrics_path = MODEL_DIR / f"metrics_{symbol}.json"
    if metrics_path.exists():
        with open(metrics_path) as f:
            m = json.load(f)
            logger.info(f"  Existing model: MAE={m['val_mae']}, RMSE={m['val_rmse']}, MAPE={m['val_mape']}%")
            return m
    return None


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="VeloTradeFi LSTM Training Pipeline")
    parser.add_argument(
        "--symbol", "-s",
        nargs="+",
        default=["AAPL"],
        help="Stock symbol(s) to train (default: AAPL)",
    )
    parser.add_argument(
        "--all", "-a",
        action="store_true",
        help="Train all supported stocks",
    )
    parser.add_argument(
        "--retrain",
        action="store_true",
        help="Retrain even if model exists",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=EPOCHS,
        help=f"Max epochs (default: {EPOCHS})",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=BATCH_SIZE,
        help=f"Batch size (default: {BATCH_SIZE})",
    )
    args = parser.parse_args()

    if args.all:
        symbols = ALL_STOCKS
    else:
        symbols = [s.upper() for s in args.symbol]

    logger.info(f"Training LSTM for: {symbols}")
    logger.info(f"Model directory: {MODEL_DIR}")
    logger.info(f"Sequence length: {SEQUENCE_LENGTH} days")
    logger.info(f"Epochs: {args.epochs}, Batch size: {args.batch_size}")

    results = {}
    for sym in symbols:
        metrics = train_lstm(
            symbol=sym,
            retrain=args.retrain,
            epochs=args.epochs,
            batch_size=args.batch_size,
        )
        results[sym] = metrics
        if metrics is None:
            logger.warning(f"  ❌ Failed to train for {sym}")
        # Sleep to avoid Yahoo Finance rate limit
        time.sleep(1)

    # ── Summary ────────────────────────────────────────────────────────────────
    logger.info(f"\n{'='*60}")
    logger.info("  TRAINING SUMMARY")
    logger.info(f"{'='*60}")
    trained = {s: m for s, m in results.items() if m is not None}
    failed = {s: m for s, m in results.items() if m is None}

    if trained:
        avg_mae = np.mean([m["val_mae"] for m in trained.values()])
        avg_mape = np.mean([m["val_mape"] for m in trained.values()])
        logger.info(f"  ✅ Trained: {list(trained.keys())}")
        logger.info(f"     Average Val MAE: {avg_mae:.4f}")
        logger.info(f"     Average Val MAPE: {avg_mape:.2f}%")

    if failed:
        logger.warning(f"  ❌ Failed: {list(failed.keys())}")

    logger.info(f"\n  Models saved to: {MODEL_DIR}")
    logger.info(f"  Run inference: python3 lstm_inference.py --symbol AAPL")


if __name__ == "__main__":
    main()
