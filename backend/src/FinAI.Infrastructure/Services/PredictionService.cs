namespace FinAI.Infrastructure.Services;

using FinAI.Core.Interfaces;
using FinAI.Core.Models;

public class PredictionService : IPredictionService
{
    private static readonly Random _rng = new();

    public Task<PredictionDto> GetPredictionAsync(string symbol, string model = "lstm")
    {
        var basePrice = GetBasePrice(symbol);
        var variance = basePrice * 0.015m;

        var predictions = Enumerable.Range(1, 7).Select(i =>
        {
            var date = DateTime.UtcNow.Date.AddDays(i);
            var drift = (decimal)(_rng.NextDouble() * 0.02 - 0.005);
            var predictedPrice = basePrice * (1 + (decimal)i * drift / 10);
            var confidence = Math.Max(0.45, 0.95 - i * 0.05 + (_rng.NextDouble() * 0.05));
            return new PredictionPointDto(
                Date: date.ToString("yyyy-MM-dd"),
                PredictedPrice: Math.Round(predictedPrice, 2),
                Confidence: Math.Round(confidence, 2),
                UpperBound: Math.Round(predictedPrice * 1.02m, 2),
                LowerBound: Math.Round(predictedPrice * 0.98m, 2)
            );
        }).ToList();

        var lastPrediction = predictions.Last().PredictedPrice;
        var diff = lastPrediction - basePrice;
        var trend = diff > basePrice * 0.001m ? "bullish" : diff < -basePrice * 0.001m ? "bearish" : "neutral";
        var avgConfidence = predictions.Average(p => p.Confidence);

        return Task.FromResult(new PredictionDto(
            Symbol: symbol.ToUpperInvariant(),
            Model: model,
            CurrentPrice: basePrice,
            Trend: trend,
            Confidence: Math.Round(avgConfidence, 2),
            Predictions: predictions
        ));
    }

    public Task<IEnumerable<PredictionDto>> GetPredictionHistoryAsync(string symbol, Guid? userId = null)
    {
        // Return recent mock history
        var history = Enumerable.Range(0, 5).Select(i =>
        {
            var date = DateTime.UtcNow.AddDays(-i * 7);
            return new PredictionDto(
                Symbol: symbol.ToUpperInvariant(),
                Model: i % 2 == 0 ? "lstm" : "prophet",
                CurrentPrice: GetBasePrice(symbol) * (1 - (decimal)i * 0.01m),
                Trend: "neutral",
                Confidence: 0.72 + _rng.NextDouble() * 0.15,
                Predictions: []
            );
        });
        return Task.FromResult(history);
    }

    private static decimal GetBasePrice(string symbol) => symbol.ToUpperInvariant() switch
    {
        "AAPL" => 192.10m,
        "NVDA" => 135.21m,
        "TSLA" => 248.50m,
        "MSFT" => 415.20m,
        "AMZN" => 196.40m,
        "VNM" => 78500m,
        "VIC" => 42100m,
        "HPG" => 28400m,
        _ => 100m
    };
}
