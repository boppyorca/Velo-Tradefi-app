namespace FinAI.Core.Entities;

/// <summary>
/// Represents a single condition within a PriceAlert.
/// Serialized as JSON and stored in PriceAlert.ConditionsJson.
/// </summary>
public record AlertCondition
{
    /// <summary>"price_above" | "price_below" | "percent_change"</summary>
    public required string Type { get; init; }

    /// <summary>
    /// For price_above / price_below: the threshold price.
    /// For percent_change: the percentage magnitude (e.g. 5 for 5%).
    /// </summary>
    public decimal Value { get; init; }
}
