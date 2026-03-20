using FinAI.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FinAI.Api.Controllers;

[ApiController]
[Route("api/predictions")]
public class PredictionsController : ControllerBase
{
    private readonly IPredictionService _predictionService;

    public PredictionsController(IPredictionService predictionService) => _predictionService = predictionService;

    [HttpGet("{symbol}")]
    public async Task<IActionResult> GetPrediction(string symbol, [FromQuery] string model = "lstm")
    {
        if (string.IsNullOrWhiteSpace(symbol))
            return BadRequest(new { success = false, message = "Symbol is required" });

        var prediction = await _predictionService.GetPredictionAsync(symbol.ToUpperInvariant(), model);
        return Ok(new { data = prediction, success = true });
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
