namespace FinAI.Core.Entities;

/// <summary>Append-only security / audit events for admin dashboards and forensics.</summary>
public class SecurityAuditEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime OccurredAtUtc { get; set; } = DateTime.UtcNow;
    /// <summary>e.g. login_ok, login_failed</summary>
    public required string Kind { get; set; }
    public string? NormalizedEmail { get; set; }
    public Guid? UserId { get; set; }
}
