using FinAI.Core.Interfaces;
using FinAI.Core.Models;
using FinAI.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;

namespace FinAI.Api.Controllers;

[ApiController]
[Route("api/predictions")]
public class PredictionsController : ControllerBase
{
    private readonly IPredictionService _predictionService;
    private readonly IStockService _stockService;
    private readonly IRedisCacheService? _cache;
    private readonly ILogger<PredictionsController> _logger;

    public PredictionsController(
        IPredictionService predictionService,
        IStockService stockService,
        IRedisCacheService? cache,
        ILogger<PredictionsController> logger)
    {
        _predictionService = predictionService;
        _stockService = stockService;
        _cache = cache;
        _logger = logger;
    }

    [HttpGet("{symbol}")]
    public async Task<IActionResult> GetPrediction(string symbol, [FromQuery] string model = "lstm")
    {
        if (string.IsNullOrWhiteSpace(symbol))
            return BadRequest(new { success = false, message = "Symbol is required" });

        var sym = symbol.ToUpperInvariant();

        // Try cache first (only if Redis is enabled)
        if (_cache != null)
        {
            var cached = await _cache.GetOrSetAsync<PredictionDto>(
                $"prediction:{sym}",
                async () => await _predictionService.GetPredictionAsync(sym, model),
                TimeSpan.FromHours(1));
            return Ok(new { data = cached, success = true });
        }

        var prediction = await _predictionService.GetPredictionAsync(sym, model);
        return Ok(new { data = prediction, success = true });
    }

    /// <summary>
    /// Get the latest cached prediction for a symbol (fast, from Redis)
    /// </summary>
    [HttpGet("{symbol}/latest")]
    public async Task<IActionResult> GetLatestPrediction(string symbol)
    {
        if (string.IsNullOrWhiteSpace(symbol))
            return BadRequest(new { success = false, message = "Symbol is required" });

        var sym = symbol.ToUpperInvariant();

        if (_cache != null)
        {
            var cached = await _cache.GetAsync<PredictionDto>($"prediction:{sym}");
            if (cached != null)
            {
                _logger.LogDebug("Cache hit for prediction: {Symbol}", sym);
                return Ok(new { data = cached, success = true, from_cache = true });
            }
        }

        // Fallback: fetch fresh prediction
        var prediction = await _predictionService.GetPredictionAsync(sym, "lstm");

        // Store in cache if available
        if (_cache != null && prediction != null)
        {
            await _cache.SetAsync($"prediction:{sym}", prediction, TimeSpan.FromHours(1));
        }

        return Ok(new { data = prediction, success = true, from_cache = false });
    }

    [HttpGet("{symbol}/history")]
    public async Task<IActionResult> GetHistory(string symbol)
    {
        var userId = GetUserIdFromToken();
        var history = await _predictionService.GetPredictionHistoryAsync(symbol.ToUpperInvariant(), userId);
        return Ok(new { data = history, success = true });
    }

    private Guid? GetUserIdFromToken()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var userId) ? userId : null;
    }
}
