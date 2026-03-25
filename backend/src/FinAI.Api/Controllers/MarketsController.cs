using FinAI.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinAI.Api.Controllers;

[ApiController]
[Route("api/markets")]
public class MarketsController : ControllerBase
{
    private readonly IStockService _stockService;

    private static readonly (string Code, string ProbeSymbol)[] ExchangeProbes =
    [
        ("NASDAQ", "AAPL"),
        ("NYSE", "JPM"),
        ("HOSE", "VNM"),
        ("LSE", "BP.L")
    ];

    public MarketsController(IStockService stockService) => _stockService = stockService;

    /// <summary>Live/offline per exchange by probing a canonical symbol via the stock quote pipeline.</summary>
    [HttpGet("exchange-status")]
    [Authorize]
    public async Task<IActionResult> GetExchangeStatus(CancellationToken ct)
    {
        _ = ct;
        var rows = new List<object>(ExchangeProbes.Length);
        foreach (var (code, symbol) in ExchangeProbes)
        {
            var quote = await _stockService.GetStockQuoteAsync(symbol);
            rows.Add(new { code, live = quote != null });
        }

        return Ok(new { success = true, data = rows });
    }
}
