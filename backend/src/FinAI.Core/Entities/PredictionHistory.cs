namespace FinAI.Core.Entities;

public class PredictionHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public required string Symbol { get; set; }
    public required string ModelUsed { get; set; } // "lstm" | "prophet"
    public double Confidence { get; set; }
    public double CurrentPrice { get; set; }
    public double PredictedPrice { get; set; }
    public DateTime PredictedDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}
