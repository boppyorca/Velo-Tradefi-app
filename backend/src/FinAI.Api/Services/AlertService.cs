namespace FinAI.Api.Services;

using System.Text.Json;
using FinAI.Api.Hubs;
using FinAI.Core.Entities;
using FinAI.Core.Interfaces;
using FinAI.Core.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

public class AlertService : IAlertService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHubContext<StockPriceHub, IStockPriceClient> _hubContext;
    private readonly ILogger<AlertService> _logger;

    public AlertService(
        IServiceScopeFactory scopeFactory,
        IHubContext<StockPriceHub, IStockPriceClient> hubContext,
        ILogger<AlertService> logger)
    {
        _scopeFactory = scopeFactory;
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task CheckAndFireAlertsAsync(string symbol, decimal currentPrice)
    {
        // Only process if the symbol has alphanumeric characters (ignore special group names)
        if (string.IsNullOrWhiteSpace(symbol) || !symbol.All(c => char.IsLetterOrDigit(c)))
            return;

        var symbolUpper = symbol.ToUpperInvariant();

        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<FinAI.Infrastructure.Data.AppDbContext>();

        // Fetch active alerts for this symbol
        var alerts = await dbContext.PriceAlerts
            .Where(a => a.Symbol == symbolUpper && a.IsActive)
            .ToListAsync();

        if (alerts.Count == 0) return;

        foreach (var alert in alerts)
        {
            var conditions = ParseConditions(alert.ConditionsJson);
            var triggered = EvaluateConditions(conditions, alert.BasePrice, currentPrice);

            if (triggered == null) continue;

            // Fire notification via SignalR to the specific user's group
            var notification = new AlertNotification(
                AlertId: alert.Id,
                AlertName: alert.Name,
                Symbol: alert.Symbol,
                CurrentPrice: currentPrice,
                BasePrice: alert.BasePrice,
                TriggeredCondition: triggered.Value.type,
                TriggeredValue: triggered.Value.value,
                TriggeredAt: DateTime.UtcNow
            );

            try
            {
                // Send to the user-specific SignalR group
                await _hubContext.Clients
                    .Group($"user_{alert.UserId}")
                    .ReceiveAlertNotification(notification);

                _logger.LogInformation(
                    "Alert fired: [{AlertId}] {AlertName} for {Symbol} @ {Price}. Condition: {Condition} ({Value})",
                    alert.Id, alert.Name, alert.Symbol, currentPrice,
                    triggered.Value.type, triggered.Value.value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send alert notification for alert {AlertId}", alert.Id);
            }
        }
    }

    private static List<AlertConditionDto> ParseConditions(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<List<AlertConditionDto>>(json)
                   ?? new List<AlertConditionDto>();
        }
        catch
        {
            return new List<AlertConditionDto>();
        }
    }

    /// <summary>
    /// Evaluates all conditions with OR logic.
    /// Returns the first triggered condition (type, value), or null if none triggered.
    /// </summary>
    private static (string type, decimal value)? EvaluateConditions(
        List<AlertConditionDto> conditions,
        decimal basePrice,
        decimal currentPrice)
    {
        foreach (var condition in conditions)
        {
            var triggered = condition.Type switch
            {
                "price_above" => currentPrice >= condition.Value,
                "price_below" => currentPrice <= condition.Value,
                "percent_change" => basePrice > 0
                    && Math.Abs((currentPrice - basePrice) / basePrice * 100m) >= condition.Value,
                _ => false
            };

            if (triggered)
                return (condition.Type, condition.Value);
        }
        return null;
    }
}
