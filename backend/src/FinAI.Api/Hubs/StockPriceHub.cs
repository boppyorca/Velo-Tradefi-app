using FinAI.Core.Models;
using Microsoft.AspNetCore.SignalR;

namespace FinAI.Api.Hubs;

public interface IStockPriceClient
{
    Task ReceiveStockUpdate(StockPriceUpdate update);
    Task ReceiveBatchUpdate(IEnumerable<StockPriceUpdate> updates);
}

public record StockPriceUpdate(
    string Symbol,
    decimal Price,
    decimal Change,
    decimal ChangePercent,
    long Volume,
    DateTime Timestamp
);

public class StockPriceHub : Hub<IStockPriceClient>
{
    private readonly ILogger<StockPriceHub> _logger;

    public StockPriceHub(ILogger<StockPriceHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Client connected: {ConnectionId}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Client disconnected: {ConnectionId}", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Subscribe to specific stock symbols
    /// </summary>
    public async Task SubscribeToSymbols(IEnumerable<string> symbols)
    {
        var symbolList = symbols.ToList();
        foreach (var symbol in symbolList)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"stock_{symbol.ToUpperInvariant()}");
        }
        _logger.LogInformation("Client {ConnectionId} subscribed to {Count} symbols", 
            Context.ConnectionId, symbolList.Count);
    }

    /// <summary>
    /// Unsubscribe from specific stock symbols
    /// </summary>
    public async Task UnsubscribeFromSymbols(IEnumerable<string> symbols)
    {
        var symbolList = symbols.ToList();
        foreach (var symbol in symbolList)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"stock_{symbol.ToUpperInvariant()}");
        }
        _logger.LogInformation("Client {ConnectionId} unsubscribed from {Count} symbols", 
            Context.ConnectionId, symbolList.Count);
    }

    /// <summary>
    /// Subscribe to market-wide updates (all stocks)
    /// </summary>
    public async Task SubscribeToMarket(string market)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"market_{market.ToUpperInvariant()}");
        _logger.LogInformation("Client {ConnectionId} subscribed to market: {Market}", 
            Context.ConnectionId, market);
    }

    /// <summary>
    /// Unsubscribe from market updates
    /// </summary>
    public async Task UnsubscribeFromMarket(string market)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"market_{market.ToUpperInvariant()}");
        _logger.LogInformation("Client {ConnectionId} unsubscribed from market: {Market}", 
            Context.ConnectionId, market);
    }
}
