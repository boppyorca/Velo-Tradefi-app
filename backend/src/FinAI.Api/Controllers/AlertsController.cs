using System.Security.Claims;
using System.Text.Json;
using FinAI.Core.Entities;
using FinAI.Core.Interfaces;
using FinAI.Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinAI.Api.Controllers;

[ApiController]
[Route("api/alerts")]
[Authorize]
public class AlertsController : ControllerBase
{
    private readonly IAlertRepository _alertRepo;

    public AlertsController(IAlertRepository alertRepo)
    {
        _alertRepo = alertRepo;
    }

    private Guid? GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
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

    private static PriceAlertDto ToDto(PriceAlert alert)
    {
        return new PriceAlertDto(
            Id: alert.Id,
            Name: alert.Name,
            Symbol: alert.Symbol,
            TargetType: alert.TargetType,
            BasePrice: alert.BasePrice,
            Conditions: ParseConditions(alert.ConditionsJson),
            IsActive: alert.IsActive,
            CreatedAt: alert.CreatedAt,
            UpdatedAt: alert.UpdatedAt
        );
    }

    /// <summary>Get all alerts for the authenticated user.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAlerts()
    {
        var userId = GetUserId();
        if (userId is null)
            return Unauthorized(new { success = false, message = "Invalid token" });

        var alerts = await _alertRepo.GetByUserIdAsync(userId.Value);
        var dtos = alerts.Select(ToDto).ToList();

        return Ok(new { data = dtos, success = true });
    }

    /// <summary>Create a new price alert.</summary>
    [HttpPost]
    public async Task<IActionResult> CreateAlert([FromBody] CreateAlertRequest request)
    {
        var userId = GetUserId();
        if (userId is null)
            return Unauthorized(new { success = false, message = "Invalid token" });

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { success = false, message = "Alert name is required" });
        if (string.IsNullOrWhiteSpace(request.Symbol))
            return BadRequest(new { success = false, message = "Symbol is required" });
        if (request.Conditions is null || request.Conditions.Count == 0)
            return BadRequest(new { success = false, message = "At least one condition is required" });

        var validTypes = new HashSet<string> { "price_above", "price_below", "percent_change" };
        foreach (var c in request.Conditions)
        {
            if (!validTypes.Contains(c.Type))
                return BadRequest(new { success = false, message = $"Invalid condition type: {c.Type}" });
            if (c.Value <= 0)
                return BadRequest(new { success = false, message = "Condition value must be positive" });
        }

        var alert = new PriceAlert
        {
            Id = Guid.NewGuid(),
            UserId = userId.Value,
            Name = request.Name.Trim(),
            Symbol = request.Symbol.ToUpperInvariant().Trim(),
            TargetType = (request.TargetType ?? "STOCK").ToUpperInvariant(),
            BasePrice = request.BasePrice,
            ConditionsJson = JsonSerializer.Serialize(request.Conditions),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _alertRepo.CreateAsync(alert);
        return Ok(new { data = ToDto(created), success = true, message = "Alert created" });
    }

    /// <summary>Update an existing alert (name and/or conditions).</summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateAlert(Guid id, [FromBody] UpdateAlertRequest request)
    {
        var userId = GetUserId();
        if (userId is null)
            return Unauthorized(new { success = false, message = "Invalid token" });

        var alert = await _alertRepo.GetByIdAsync(id, userId.Value);
        if (alert is null)
            return NotFound(new { success = false, message = "Alert not found" });

        if (!string.IsNullOrWhiteSpace(request.Name))
            alert.Name = request.Name.Trim();

        if (request.Conditions is not null && request.Conditions.Count > 0)
        {
            var validTypes = new HashSet<string> { "price_above", "price_below", "percent_change" };
            foreach (var c in request.Conditions)
            {
                if (!validTypes.Contains(c.Type))
                    return BadRequest(new { success = false, message = $"Invalid condition type: {c.Type}" });
                if (c.Value <= 0)
                    return BadRequest(new { success = false, message = "Condition value must be positive" });
            }
            alert.ConditionsJson = JsonSerializer.Serialize(request.Conditions);
        }

        var updated = await _alertRepo.UpdateAsync(alert);
        return Ok(new { data = ToDto(updated), success = true, message = "Alert updated" });
    }

    /// <summary>Delete an alert.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteAlert(Guid id)
    {
        var userId = GetUserId();
        if (userId is null)
            return Unauthorized(new { success = false, message = "Invalid token" });

        var deleted = await _alertRepo.DeleteAsync(id, userId.Value);
        if (!deleted)
            return NotFound(new { success = false, message = "Alert not found" });

        return Ok(new { success = true, message = "Alert deleted" });
    }

    /// <summary>Toggle alert active status.</summary>
    [HttpPatch("{id:guid}/toggle")]
    public async Task<IActionResult> ToggleAlert(Guid id)
    {
        var userId = GetUserId();
        if (userId is null)
            return Unauthorized(new { success = false, message = "Invalid token" });

        var alert = await _alertRepo.GetByIdAsync(id, userId.Value);
        if (alert is null)
            return NotFound(new { success = false, message = "Alert not found" });

        alert.IsActive = !alert.IsActive;
        var updated = await _alertRepo.UpdateAsync(alert);

        return Ok(new { data = ToDto(updated), success = true,
            message = alert.IsActive ? "Alert activated" : "Alert paused" });
    }
}
