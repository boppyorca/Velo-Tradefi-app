namespace FinAI.Infrastructure.Services;

using System.Net.Http.Json;
using System.Text.Json;
using FinAI.Core.Interfaces;
using FinAI.Core.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

public class PredictionService : IPredictionService
{
    private readonly HttpClient _mlClient;
    private readonly ILogger<PredictionService> _logger;
    private readonly string _mlServiceUrl;

    public PredictionService(
        HttpClient mlClient,
        ILogger<PredictionService> logger,
        IConfiguration config)
    {
        _mlClient = mlClient;
        _logger = logger;
        _mlServiceUrl = config["PYTHON_AI_SERVICE_URL"]?.TrimEnd('/') ?? "http://localhost:8000";
    }

    public async Task<PredictionDto> GetPredictionAsync(string symbol, string model = "lstm")
    {
        var sym = symbol.ToUpperInvariant();
        var days = 7;

        try
        {
            var mlUrl = $"{_mlServiceUrl}/predict/{sym}?model={model}&days={days}";
            _logger.LogInformation("Calling ML service: {Url}", mlUrl);

            var response = await _mlClient.GetAsync(mlUrl);

            if (response.IsSuccessStatusCode)
            {
                var mlResult = await response.Content.ReadFromJsonAsync<MlPredictionResponse>();
                if (mlResult is not null)
                {
                    _logger.LogInformation(
                        "ML prediction received for {Symbol}: trend={Trend}, confidence={Confidence}",
                        sym, mlResult.Trend, mlResult.Confidence);

                    return new PredictionDto(
                        Symbol: mlResult.Symbol,
                        Model: mlResult.Model,
                        CurrentPrice: mlResult.CurrentPrice,
                        Trend: mlResult.Trend,
                        Confidence: mlResult.Confidence,
                        Predictions: mlResult.Predictions.Select(p => new PredictionPointDto(
                            Date: p.Date,
                            PredictedPrice: p.PredictedPrice,
                            Confidence: p.Confidence,
                            UpperBound: p.UpperBound,
                            LowerBound: p.LowerBound
                        ))
                    );
                }
            }
            else
            {
                _logger.LogWarning(
                    "ML service returned {Status} for {Symbol}. Falling back to heuristic.",
                    response.StatusCode, sym);
            }
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "ML service unreachable at {Url}. Falling back to heuristic.", _mlServiceUrl);
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogWarning(ex, "ML service request timed out. Falling back to heuristic.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error calling ML service for {Symbol}. Falling back.", sym);
        }

        // ── Fallback: heuristic prediction ─────────────────────────────────────
        return await GetHeuristicPredictionAsync(sym, model);
    }

    public Task<IEnumerable<PredictionDto>> GetPredictionHistoryAsync(string symbol, Guid? userId = null)
    {
        var sym = symbol.ToUpperInvariant();
        var rng = new Random(sym.GetHashCode());
        var basePrice = GetBasePrice(sym);

        var history = Enumerable.Range(0, 5).Select(i =>
        {
            var drift = (decimal)(rng.NextDouble() * 0.03 - 0.01);
            var predicted = basePrice * (1 + drift);
            var lastPred = basePrice * (1 + drift * 1.5m);
            var diff = lastPred - basePrice;
            var trend = diff > basePrice * 0.002m ? "bullish" :
                        diff < -basePrice * 0.002m ? "bearish" : "neutral";
            return new PredictionDto(
                Symbol: sym,
                Model: i % 2 == 0 ? "lstm" : "prophet",
                CurrentPrice: predicted,
                Trend: trend,
                Confidence: 0.68 + rng.NextDouble() * 0.20,
                Predictions: []
            );
        });

        return Task.FromResult(history);
    }

    private Task<PredictionDto> GetHeuristicPredictionAsync(string symbol, string model)
    {
        var basePrice = GetBasePrice(symbol);
        var rng = new Random(symbol.GetHashCode());

        // Trend simulation: slightly biased random walk
        var trendBias = (decimal)(rng.NextDouble() * 0.01 - 0.003);

        var predictions = Enumerable.Range(1, 7).Select(i =>
        {
            var drift = trendBias + (decimal)(rng.NextDouble() * 0.015 - 0.007);
            var predictedPrice = basePrice * (1 + drift * i / 5m);
            var confidence = Math.Max(0.45, 0.88 - i * 0.06);

            return new PredictionPointDto(
                Date: DateTime.UtcNow.Date.AddDays(i).ToString("yyyy-MM-dd"),
                PredictedPrice: Math.Round(predictedPrice, 2),
                Confidence: Math.Round(confidence, 2),
                UpperBound: Math.Round(predictedPrice * 1.025m, 2),
                LowerBound: Math.Round(predictedPrice * 0.975m, 2)
            );
        }).ToList();

        var lastPred = predictions.Last().PredictedPrice;
        var diff = lastPred - basePrice;
        var trend = diff > basePrice * 0.002m ? "bullish" :
                     diff < -basePrice * 0.002m ? "bearish" : "neutral";
        var avgConf = predictions.Average(p => p.Confidence);

        _logger.LogInformation(
            "Heuristic prediction for {Symbol}: trend={Trend}, confidence={Confidence}",
            symbol, trend, avgConf);

        return Task.FromResult(new PredictionDto(
            Symbol: symbol,
            Model: model,
            CurrentPrice: basePrice,
            Trend: trend,
            Confidence: Math.Round(avgConf, 2),
            Predictions: predictions
        ));
    }

    private static decimal GetBasePrice(string symbol) => symbol.ToUpperInvariant() switch
    {
        "AAPL" => 192.10m,
        "NVDA" => 135.21m,
        "TSLA" => 248.50m,
        "MSFT" => 415.20m,
        "AMZN" => 196.40m,
        "GOOGL" => 175.00m,
        "META" => 520.00m,
        "VNM" => 78500m,
        "VIC" => 42100m,
        "HPG" => 28400m,
        "FPT" => 134000m,
        "SSI" => 23500m,
        _ => 100m
    };
}

// ── ML Service Response DTOs ─────────────────────────────────────────────────

internal sealed class MlPredictionResponse
{
    public string Symbol { get; set; } = "";
    public string Model { get; set; } = "";
    public decimal CurrentPrice { get; set; }
    public string Trend { get; set; } = "neutral";
    public double Confidence { get; set; }
    public List<MlPredictionPoint> Predictions { get; set; } = [];
}

internal sealed class MlPredictionPoint
{
    public string Date { get; set; } = "";
    public decimal PredictedPrice { get; set; }
    public double Confidence { get; set; }
    public decimal UpperBound { get; set; }
    public decimal LowerBound { get; set; }
}
