namespace FinAI.Core.Entities;

/// <summary>
/// A price alert created by a user. Contains a name and one or more conditions
/// (price above / below a threshold, or percent change from the creation price).
/// When ANY condition is met, the alert fires and triggers a notification.
/// </summary>
public class PriceAlert
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public required string Name { get; set; }

    /// <summary>Target symbol, e.g. "BTC", "AAPL", "ETH"</summary>
    public required string Symbol { get; set; }

    /// <summary>"STOCK" or "TOKEN"</summary>
    public required string TargetType { get; set; } = "STOCK";

    /// <summary>
    /// The base price captured at alert creation time.
    /// Used as the reference for percent-change conditions.
    /// </summary>
    public decimal BasePrice { get; set; }

    /// <summary>
    /// JSON array of AlertCondition objects.
    /// </summary>
    public required string ConditionsJson { get; set; }

    /// <summary>Whether the alert is currently active.</summary>
    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation
    public User? User { get; set; }
}
