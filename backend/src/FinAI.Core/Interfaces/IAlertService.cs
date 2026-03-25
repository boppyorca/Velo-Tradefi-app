namespace FinAI.Core.Interfaces;

using FinAI.Core.Models;

public interface IAlertService
{
    /// <summary>
    /// Check all active alerts for a given symbol against the current price.
    /// Evaluates each condition with OR logic — fires if ANY condition is met.
    /// Sends SignalR notifications to each affected user.
    /// </summary>
    Task CheckAndFireAlertsAsync(string symbol, decimal currentPrice);
}
