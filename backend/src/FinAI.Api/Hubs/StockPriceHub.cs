using FinAI.Core.Models;
using Microsoft.AspNetCore.Authorization;
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
        var userId = Context.User?.Identity?.Name ?? "anonymous";
        _logger.LogInformation(
            "Client connected: {ConnectionId}, User: {UserId}, Authenticated: {IsAuth}",
            Context.ConnectionId,
            userId,
            Context.User?.Identity?.IsAuthenticated ?? false);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.Identity?.Name ?? "anonymous";
        _logger.LogInformation(
            "Client disconnected: {ConnectionId}, User: {UserId}, Exception: {Exception}",
            Context.ConnectionId,
            userId,
            exception?.Message ?? "none");
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Subscribe to specific stock symbols.
    /// Public — no auth required (market data is public).
    /// </summary>
    public async Task SubscribeToSymbols(IEnumerable<string> symbols)
    {
        var symbolList = symbols.ToList();
        foreach (var symbol in symbolList)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"stock_{symbol.ToUpperInvariant()}");
        }
        _logger.LogDebug("Client {ConnectionId} subscribed to symbols: {Symbols}",
            Context.ConnectionId, string.Join(", ", symbolList));
    }

    /// <summary>
    /// Unsubscribe from specific stock symbols.
    /// </summary>
    public async Task UnsubscribeFromSymbols(IEnumerable<string> symbols)
    {
        var symbolList = symbols.ToList();
        foreach (var symbol in symbolList)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"stock_{symbol.ToUpperInvariant()}");
        }
        _logger.LogDebug("Client {ConnectionId} unsubscribed from symbols: {Symbols}",
            Context.ConnectionId, string.Join(", ", symbolList));
    }

    /// <summary>
    /// Subscribe to market-wide updates (all stocks on VN or US market).
    /// Public — no auth required.
    /// </summary>
    public async Task SubscribeToMarket(string market)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"market_{market.ToUpperInvariant()}");
        _logger.LogInformation("Client {ConnectionId} subscribed to market: {Market}",
            Context.ConnectionId, market);
    }

    /// <summary>
    /// Unsubscribe from market updates.
    /// </summary>
    public async Task UnsubscribeFromMarket(string market)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"market_{market.ToUpperInvariant()}");
        _logger.LogInformation("Client {ConnectionId} unsubscribed from market: {Market}",
            Context.ConnectionId, market);
    }

    /// <summary>
    /// Check if the current connection is authenticated (JWT was provided).
    /// Returns the user ID if authenticated, null otherwise.
    /// </summary>
    public string? GetAuthenticatedUserId()
    {
        return Context.User?.Identity?.IsAuthenticated == true
            ? Context.User.Identity.Name
            : null;
    }
}
