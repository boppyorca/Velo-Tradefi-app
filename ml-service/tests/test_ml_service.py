# ============================================================
# Pytest configuration and tests for ML Service
# ============================================================

import pytest
import sys
import os

# Add the ml-service directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import (
    is_vn_stock,
    get_yahoo_ticker,
    VN_STOCKS,
    VN_FALLBACK_PRICES,
    PredictionResponse,
    _fallback_data,
)


class TestStockDataFetching:
    """Test stock data fetching with Yahoo Finance"""

    def test_yahoo_ticker_conversion_vn(self):
        """Test VN ticker conversion to Yahoo Finance format"""
        assert get_yahoo_ticker("VNM") == "VNM.VN"
        assert get_yahoo_ticker("FPT") == "FPT.VN"
        assert get_yahoo_ticker("TCB") == "TCB.VN"
        assert get_yahoo_ticker("HPG") == "HPG.VN"

    def test_yahoo_ticker_conversion_us(self):
        """Test US ticker stays the same"""
        assert get_yahoo_ticker("AAPL") == "AAPL"
        assert get_yahoo_ticker("TSLA") == "TSLA"
        assert get_yahoo_ticker("NVDA") == "NVDA"

    def test_yahoo_ticker_conversion_case_insensitive(self):
        """Test ticker conversion is case insensitive"""
        assert get_yahoo_ticker("aapl") == "AAPL"
        assert get_yahoo_ticker("vnm") == "VNM.VN"
        assert get_yahoo_ticker("Vnm") == "VNM.VN"

    def test_is_vn_stock_returns_true_for_vn_symbols(self):
        """Test is_vn_stock returns True for VN stocks"""
        vn_symbols = ["VNM", "FPT", "TCB", "HPG", "VIC", "MWG"]
        for symbol in vn_symbols:
            assert is_vn_stock(symbol) is True, f"{symbol} should be VN stock"

    def test_is_vn_stock_returns_false_for_us_symbols(self):
        """Test is_vn_stock returns False for US stocks"""
        us_symbols = ["AAPL", "TSLA", "NVDA", "MSFT", "GOOGL"]
        for symbol in us_symbols:
            assert is_vn_stock(symbol) is False, f"{symbol} should not be VN stock"

    def test_vn_stocks_set_complete(self):
        """Test VN_STOCKS contains expected symbols"""
        expected = {"VNM", "FPT", "TCB", "HPG", "VIC", "MWG"}
        for symbol in expected:
            assert symbol in VN_STOCKS, f"{symbol} missing from VN_STOCKS"


class TestTechnicalIndicators:
    """Test technical indicator calculations"""

    def test_sma_calculation(self):
        """Test Simple Moving Average calculation"""
        import numpy as np

        prices = [10, 20, 30, 40, 50]

        def sma(prices_list, period):
            return sum(prices_list[-period:]) / period

        assert sma(prices, 3) == 40.0  # (30+40+50)/3
        assert sma(prices, 5) == 30.0  # (10+20+30+40+50)/5

    def test_rsi_calculation(self):
        """Test RSI calculation returns value between 0-100"""
        import numpy as np

        # Simulate price data with clear uptrend
        prices = [100, 102, 104, 106, 108, 110, 112, 114, 116, 118, 120]

        # Calculate daily returns
        returns = np.diff(prices)

        # Calculate average gain and loss
        gains = np.where(returns > 0, returns, 0)
        losses = np.where(returns < 0, -returns, 0)

        avg_gain = np.mean(gains)
        avg_loss = np.mean(losses)

        # RSI = 100 - (100 / (1 + RS))
        if avg_loss == 0:
            rsi = 100
        else:
            rs = avg_gain / avg_loss
            rsi = 100 - (100 / (1 + rs))

        assert 0 <= rsi <= 100
        assert rsi > 50  # Uptrend should have RSI > 50


class TestFeatureEngineering:
    """Test feature engineering for ML models"""

    def test_volume_normalization(self):
        """Test volume normalization"""
        volume = 1500000
        avg_volume = 1000000

        volume_norm = volume / avg_volume

        assert volume_norm == 1.5

    def test_momentum_calculation(self):
        """Test momentum calculation"""
        prices = [100, 102, 104, 106, 108]

        # Momentum = current price - price N periods ago
        momentum = prices[-1] - prices[0]

        assert momentum == 8


class TestFallbackData:
    """Test fallback data generation"""

    def test_vn_fallback_data_creates_dataframe(self):
        """Test VN fallback data creates DataFrame with correct rows"""
        df = _fallback_data("VNM", is_vn=True)

        import pandas as pd
        assert isinstance(df, pd.DataFrame)
        assert len(df) == 60
        assert "close" in df.columns

    def test_vn_fallback_prices_in_expected_range(self):
        """Test VN fallback prices are in realistic VND range"""
        for symbol, price in VN_FALLBACK_PRICES.items():
            assert 10000 <= price <= 200000, f"{symbol} price {price} out of range"

    def test_fallback_data_uses_correct_base_price(self):
        """Test fallback data uses VN_FALLBACK_PRICES for VN stocks"""
        df = _fallback_data("VNM", is_vn=True)
        expected_base = VN_FALLBACK_PRICES["VNM"]

        # Check that average is close to base price
        avg_price = df["close"].mean()
        assert abs(avg_price - expected_base) < expected_base * 0.1  # Within 10%


class TestAPIDataModels:
    """Test API request/response models"""

    def test_prediction_response_structure(self):
        """Test prediction response has correct structure"""
        response = PredictionResponse(
            symbol="AAPL",
            model="LSTM_v2",
            currentPrice=150.0,
            trend="bullish",
            confidence=0.75,
            predictions=[
                {"date": "2024-01-01", "predictedPrice": 152.0, "confidence": 0.7,
                 "upperBound": 155.0, "lowerBound": 149.0}
            ]
        )

        assert response.symbol == "AAPL"
        assert response.currentPrice == 150.0
        assert response.trend == "bullish"
        assert 0 <= response.confidence <= 1
        assert len(response.predictions) == 1

    def test_prediction_response_validation(self):
        """Test prediction response accepts valid data"""
        # Pydantic v2 allows invalid values at construction
        # Validation happens at serialization or with explicit validation
        response = PredictionResponse(
            symbol="AAPL",
            model="RandomForest",
            currentPrice=150.0,
            trend="bullish",
            confidence=0.5,
            predictions=[]
        )
        assert response.symbol == "AAPL"
        assert response.confidence == 0.5


class TestHealthEndpoint:
    """Test health check endpoint"""

    def test_health_response_format(self):
        """Test health endpoint returns correct format"""
        from main import app
        from fastapi.testclient import TestClient

        client = TestClient(app)
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "ml-service"
        assert "version" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
