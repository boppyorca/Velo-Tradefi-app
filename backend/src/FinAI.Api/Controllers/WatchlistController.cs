using System.Security.Claims;
using FinAI.Core.Entities;
using FinAI.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinAI.Api.Controllers;

[ApiController]
[Route("api/watchlist")]
[Authorize]
public class WatchlistController : ControllerBase
{
    private readonly IWatchlistRepository _watchlist;
    private readonly IStockService _stockService;

    public WatchlistController(
        IWatchlistRepository watchlist,
        IStockService stockService)
    {
        _watchlist = watchlist;
        _stockService = stockService;
    }

    private Guid? GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }

    /// <summary>Get all watchlist items for current user, enriched with live prices.</summary>
    [HttpGet]
    public async Task<IActionResult> GetWatchlist()
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized(new { success = false, message = "Invalid token" });

        var items = await _watchlist.GetByUserIdAsync(userId.Value);
        var symbols = items.Select(i => i.Symbol).ToList();

        // Fetch live quotes for all watched symbols in parallel
        var quotesTasks = symbols.Select(async s =>
        {
            var q = await _stockService.GetStockQuoteAsync(s);
            return (symbol: s, quote: q);
        });
        var quotes = await Task.WhenAll(quotesTasks);
        var quoteMap = quotes
            .Where(q => q.quote is not null)
            .ToDictionary(q => q.symbol, q => q.quote!);

        var result = items.Select(item =>
        {
            var q = quoteMap.TryGetValue(item.Symbol, out var quote) ? quote : null;
            return new WatchlistItemDto(
                Id: item.Id,
                Symbol: item.Symbol,
                Market: item.Market,
                AddedAt: item.AddedAt,
                Price: q?.Price ?? 0m,
                ChangePercent: q?.ChangePercent ?? 0m,
                Name: q?.Name ?? item.Symbol
            );
        });

        return Ok(new { data = result, success = true });
    }

    /// <summary>Add a stock to the user's watchlist.</summary>
    [HttpPost]
    public async Task<IActionResult> AddToWatchlist([FromBody] AddWatchlistRequest request)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized(new { success = false, message = "Invalid token" });

        if (string.IsNullOrWhiteSpace(request.Symbol))
            return BadRequest(new { success = false, message = "Symbol is required" });

        var alreadyExists = await _watchlist.ExistsAsync(userId.Value, request.Symbol, request.Market ?? "US");
        if (alreadyExists)
            return Conflict(new { success = false, message = "Already in watchlist" });

        var item = new StockWatchlist
        {
            Id = Guid.NewGuid(),
            UserId = userId.Value,
            Symbol = request.Symbol.ToUpperInvariant(),
            Market = (request.Market ?? "US").ToUpperInvariant(),
            AddedAt = DateTime.UtcNow
        };

        await _watchlist.AddAsync(item);
        return Ok(new { success = true, message = $"Added {item.Symbol} to watchlist" });
    }

    /// <summary>Remove a stock from the user's watchlist.</summary>
    [HttpDelete("{symbol}")]
    public async Task<IActionResult> RemoveFromWatchlist(
        string symbol,
        [FromQuery] string market = "US")
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized(new { success = false, message = "Invalid token" });

        var removed = await _watchlist.RemoveAsync(userId.Value, symbol, market);
        if (!removed)
            return NotFound(new { success = false, message = "Not found in watchlist" });

        return Ok(new { success = true, message = $"Removed {symbol.ToUpperInvariant()} from watchlist" });
    }
}

// ── Request / Response DTOs ─────────────────────────────────────────────────

public record WatchlistItemDto(
    Guid Id,
    string Symbol,
    string Market,
    DateTime AddedAt,
    decimal Price,
    decimal ChangePercent,
    string Name
);

public record AddWatchlistRequest(
    string Symbol,
    string? Market = null
);
