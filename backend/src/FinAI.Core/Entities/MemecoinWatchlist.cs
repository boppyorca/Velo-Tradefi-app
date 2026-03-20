namespace FinAI.Core.Entities;

public class MemecoinWatchlist
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public required string CoinId { get; set; } // CoinGecko ID
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}
