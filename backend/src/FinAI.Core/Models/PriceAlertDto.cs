namespace FinAI.Core.Models;

using System.Text.Json.Serialization;

// ── DTOs ─────────────────────────────────────────────────────────────────────

public record PriceAlertDto(
    Guid Id,
    string Name,
    string Symbol,
    string TargetType,
    decimal BasePrice,
    List<AlertConditionDto> Conditions,
    bool IsActive,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record AlertConditionDto(
    string Type,
    decimal Value
);

public record CreateAlertRequest(
    string Name,
    string Symbol,
    string TargetType,
    decimal BasePrice,
    List<AlertConditionDto> Conditions
);

public record UpdateAlertRequest(
    string? Name,
    List<AlertConditionDto>? Conditions
);
