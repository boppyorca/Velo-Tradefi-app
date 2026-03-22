using FinAI.Api.Hubs;
using FinAI.Core.Interfaces;
using FinAI.Core.Models;
using Microsoft.AspNetCore.SignalR;

namespace FinAI.Api.Services;

public class SignalRStockBroadcaster : IStockPriceBroadcaster
{
    private readonly IHubContext<StockPriceHub, IStockPriceClient> _hubContext;
    private readonly ILogger<SignalRStockBroadcaster> _logger;
    private readonly Dictionary<string, StockDto> _lastPrices = new();
    private readonly HashSet<string> _subscribedSymbols = new(StringComparer.OrdinalIgnoreCase);
    private readonly SemaphoreSlim _lock = new(1, 1);

    public SignalRStockBroadcaster(
        IHubContext<StockPriceHub, IStockPriceClient> hubContext,
        ILogger<SignalRStockBroadcaster> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task RegisterSymbolAsync(string symbol)
    {
        await _lock.WaitAsync();
        try
        {
            _subscribedSymbols.Add(symbol.ToUpperInvariant());
        }
        finally
        {
            _lock.Release();
        }
    }

    // ── IStockPriceBroadcaster implementation ─────────────────────────────────

    public async Task BroadcastStockUpdateAsync(StockDto stock)
    {
        var symbol = stock.Symbol.ToUpperInvariant();
        var update = new StockPriceUpdate(
            stock.Symbol,
            stock.Price,
            stock.Change,
            stock.ChangePercent,
            stock.Volume,
            DateTime.UtcNow
        );

        // Store last price for batch updates
        await _lock.WaitAsync();
        try
        {
            _lastPrices[symbol] = stock;
        }
        finally
        {
            _lock.Release();
        }

        // Broadcast to symbol-specific group
        await _hubContext.Clients
            .Group($"stock_{symbol}")
            .ReceiveStockUpdate(update);

        // Broadcast to market group (VN or US)
        var market = stock.Exchange.ToUpperInvariant() switch
        {
            "HOSE" or "HNX" => "VN",
            _ => "US"
        };
        await _hubContext.Clients
            .Group($"market_{market}")
            .ReceiveStockUpdate(update);

        _logger.LogDebug("Broadcasted update for {Symbol}: {Price}", symbol, stock.Price);
    }

    public async Task BroadcastBatchUpdateAsync(IEnumerable<StockDto> stocks)
    {
        var updates = stocks.Select(s => new StockPriceUpdate(
            s.Symbol,
            s.Price,
            s.Change,
            s.ChangePercent,
            s.Volume,
            DateTime.UtcNow
        )).ToList();

        // Store for batch updates
        await _lock.WaitAsync();
        try
        {
            foreach (var stock in stocks)
            {
                _lastPrices[stock.Symbol.ToUpperInvariant()] = stock;
            }
        }
        finally
        {
            _lock.Release();
        }

        // Broadcast to all clients
        await _hubContext.Clients.All.ReceiveBatchUpdate(updates);
        _logger.LogInformation("Broadcasted batch of {Count} stock updates", updates.Count);
    }

    public async Task<StockDto?> GetLastPriceAsync(string symbol)
    {
        await _lock.WaitAsync();
        try
        {
            return _lastPrices.TryGetValue(symbol.ToUpperInvariant(), out var price) ? price : null;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<IEnumerable<string>> GetSubscribedSymbolsAsync()
    {
        await _lock.WaitAsync();
        try
        {
            return _subscribedSymbols.ToList();
        }
        finally
        {
            _lock.Release();
        }
    }
}
