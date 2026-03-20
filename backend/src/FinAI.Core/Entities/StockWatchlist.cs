namespace FinAI.Core.Entities;

public class StockWatchlist
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public required string Symbol { get; set; }
    public required string Market { get; set; } // "VN" | "US"
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}
