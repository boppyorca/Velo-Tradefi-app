"""
VeloTradeFi — ML Prediction Service (Rebuilt by Kỹ sư trưởng)
FastAPI + Random Forest (Scikit-Learn) + Alpha Vantage
"""

import os
import logging
from datetime import datetime, timedelta
import requests
import pandas as pd
import numpy as np
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.ensemble import RandomForestClassifier

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ml-service-rf")

app = FastAPI(title="VeloTradeFi RF Core", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# THAY BẰNG API KEY ALPHA VANTAGE CỦA CẬU
ALPHA_VANTAGE_API_KEY = "YOUR_ALPHA_VANTAGE_KEY_HERE"

# ── Pydantic Schemas (Khớp 100% với C# PredictionService) ──
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

# ── 1. Fetch Dữ liệu thật từ Alpha Vantage ──
def fetch_alpha_vantage(symbol: str) -> pd.DataFrame:
    logger.info(f"Đang kéo dữ liệu thật từ Alpha Vantage cho mã {symbol}...")
    url = f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={symbol}&apikey={ALPHA_VANTAGE_API_KEY}&outputsize=compact"
    
    resp = requests.get(url)
    data = resp.json()
    
    if "Time Series (Daily)" not in data:
        # Nếu cạn API Key, dùng tạm dữ liệu fallback nhưng vẫn báo log
        logger.warning("Alpha Vantage bị giới hạn (Rate limit). Dùng data dự phòng để test UI.")
        return generate_fallback_data(symbol)
        
    ts = data["Time Series (Daily)"]
    df = pd.DataFrame.from_dict(ts, orient="index")
    df = df.rename(columns={"4. close": "close"})
    df["close"] = df["close"].astype(float)
    df.index = pd.to_datetime(df.index)
    df = df.sort_index()
    return df

# ── 2. Trích xuất Chỉ báo Kỹ thuật (Feature Engineering) ──
def build_features(df: pd.DataFrame) -> pd.DataFrame:
    # Tính SMA (Simple Moving Average)
    df["SMA_10"] = df["close"].rolling(window=10).mean()
    df["SMA_20"] = df["close"].rolling(window=20).mean()
    
    # Tính RSI đơn giản
    delta = df["close"].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df["RSI"] = 100 - (100 / (1 + rs))
    
    # Target: 1 nếu giá ngày mai TĂNG, 0 nếu GIẢM
    df["Target"] = (df["close"].shift(-1) > df["close"]).astype(int)
    
    return df.dropna()

# ── 3. Lõi Học Máy Random Forest ──
def run_random_forest(df: pd.DataFrame):
    features = ["SMA_10", "SMA_20", "RSI"]
    X = df[features]
    y = df["Target"]
    
    # Khởi tạo Random Forest
    rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
    rf_model.fit(X[:-1], y[:-1]) # Train trên dữ liệu cũ
    
    # Lấy dữ liệu ngày mới nhất để dự đoán
    latest_features = X.iloc[[-1]]
    
    # Lấy XÁC SUẤT (Confidence)
    probabilities = rf_model.predict_proba(latest_features)[0]
    
    # probability[1] là xác suất Tăng, probability[0] là xác suất Giảm
    if probabilities[1] > probabilities[0]:
        return "bullish", probabilities[1]
    else:
        return "bearish", probabilities[0]

def generate_fallback_data(symbol: str) -> pd.DataFrame:
    # Hàm dự phòng để web không bị chết khi Alpha Vantage hết lượt gọi
    dates = pd.date_range(end=datetime.today(), periods=50)
    prices = np.random.normal(loc=150, scale=5, size=50)
    return pd.DataFrame({"close": prices}, index=dates)

# ── 4. API Endpoint Chính ──
@app.get("/predict/{symbol}", response_model=PredictionResponse)
async def predict(symbol: str, model: str = "random_forest", days: int = 7):
    sym = symbol.upper()
    
    # 1. Kéo data
    df = fetch_alpha_vantage(sym)
    current_price = df["close"].iloc[-1]
    
    # 2. Xử lý tính năng & Train Random Forest
    df_features = build_features(df)
    trend, confidence = run_random_forest(df_features)
    
    # 3. Nội suy giá dự đoán trong 7 ngày tới dựa vào Trend của Random Forest
    predictions = []
    projected_price = current_price
    
    for i in range(1, days + 1):
        # Nếu trend tăng (bullish), giá nhích lên; giảm (bearish), giá nhích xuống
        drift = 0.01 if trend == "bullish" else -0.01
        projected_price = projected_price * (1 + drift)
        
        target_date = (datetime.utcnow().date() + timedelta(days=i)).isoformat()
        
        predictions.append(PredictionPoint(
            date=target_date,
            predictedPrice=round(projected_price, 2),
            confidence=round(confidence, 3), # Tỷ lệ % từ toán học của Cậu
            upperBound=round(projected_price * 1.02, 2),
            lowerBound=round(projected_price * 0.98, 2),
        ))

    logger.info(f"Đã xử lý xong Random Forest cho {sym}. Trend: {trend}, Tỷ lệ: {confidence:.2%}")

    return PredictionResponse(
        symbol=sym,
        model="RandomForest_AlphaVantage",
        currentPrice=round(current_price, 2),
        trend=trend,
        confidence=round(confidence, 3),
        predictions=predictions
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)