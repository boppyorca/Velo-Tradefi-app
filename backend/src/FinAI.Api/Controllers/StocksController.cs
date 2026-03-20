using FinAI.Core.Interfaces;
using FinAI.Core.Models;
using Microsoft.AspNetCore.Mvc;

namespace FinAI.Api.Controllers;

[ApiController]
[Route("api/stocks")]
public class StocksController : ControllerBase
{
    private readonly IStockService _stockService;

    public StocksController(IStockService stockService) => _stockService = stockService;

    [HttpGet]
    public async Task<IActionResult> GetStocks(
        [FromQuery] string? exchange = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var stocks = await _stockService.GetStocksAsync(exchange, page, pageSize);
        return Ok(new { data = stocks, success = true });
    }

    [HttpGet("{symbol}")]
    public async Task<IActionResult> GetStockQuote(string symbol)
    {
        var stock = await _stockService.GetStockQuoteAsync(symbol);
        if (stock is null)
            return NotFound(new { success = false, message = $"Stock '{symbol}' not found" });
        return Ok(new { data = stock, success = true });
    }

    [HttpGet("{symbol}/history")]
    public async Task<IActionResult> GetStockHistory(string symbol, [FromQuery] string period = "1mo")
    {
        var history = await _stockService.GetHistoryAsync(symbol, period);
        if (history is null || !history.Any())
            return NotFound(new { success = false, message = $"History not found for '{symbol}'" });
        return Ok(new { data = history, success = true });
    }

    [HttpGet("search")]
    public async Task<IActionResult> SearchStocks([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q))
            return BadRequest(new { success = false, message = "Query parameter 'q' is required" });

        var stocks = await _stockService.SearchStocksAsync(q);
        return Ok(new { data = stocks, success = true });
    }
}
