namespace FinAI.Core.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public required string FullName { get; set; }
    public string Role { get; set; } = "User";
    public string? WalletAddress { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<StockWatchlist> StockWatchlist { get; set; } = new List<StockWatchlist>();
    public ICollection<MemecoinWatchlist> MemecoinWatchlist { get; set; } = new List<MemecoinWatchlist>();
    public ICollection<PredictionHistory> PredictionHistories { get; set; } = new List<PredictionHistory>();
}
