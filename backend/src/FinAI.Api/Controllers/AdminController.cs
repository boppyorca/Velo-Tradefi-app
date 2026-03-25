using FinAI.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinAI.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminController(AppDbContext db) => _db = db;

    /// <summary>Aggregated KPIs and recent platform activity derived from the database.</summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard(CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var start30 = now.AddDays(-30);
        var start60 = now.AddDays(-60);
        var start7 = now.AddDays(-7);
        var start14 = now.AddDays(-14);

        var totalUsers = await _db.Users.CountAsync(ct);

        var newUsersThis30 = await _db.Users.CountAsync(u => u.CreatedAt >= start30, ct);
        var newUsersPrev30 = await _db.Users.CountAsync(u => u.CreatedAt >= start60 && u.CreatedAt < start30, ct);

        var wlThis7 = await _db.StockWatchlists.CountAsync(w => w.AddedAt >= start7, ct);
        var wlPrev7 = await _db.StockWatchlists.CountAsync(
            w => w.AddedAt >= start14 && w.AddedAt < start7, ct);

        var failThis7 = await _db.SecurityAuditEvents.CountAsync(
            e => e.Kind == "login_failed" && e.OccurredAtUtc >= start7, ct);
        var failPrev7 = await _db.SecurityAuditEvents.CountAsync(
            e => e.Kind == "login_failed" && e.OccurredAtUtc >= start14 && e.OccurredAtUtc < start7, ct);

        var dbOk = await _db.Database.CanConnectAsync(ct);

        var stats = new[]
        {
            new
            {
                key = "totalUsers",
                label = "Total Users",
                value = totalUsers.ToString("N0"),
                change = FormatPctChangeLabel(newUsersThis30, newUsersPrev30),
                up = newUsersThis30 >= newUsersPrev30
            },
            new
            {
                key = "watchlistAdds7d",
                label = "Watchlist adds (7d)",
                value = wlThis7.ToString("N0"),
                change = FormatPctChangeLabel(wlThis7, wlPrev7),
                up = wlThis7 >= wlPrev7
            },
            new
            {
                key = "failedLogins7d",
                label = "Failed logins (7d)",
                value = failThis7.ToString("N0"),
                change = FormatPctChangeLabel(failThis7, failPrev7, lowerIsBetter: true),
                up = failThis7 <= failPrev7
            },
            new
            {
                key = "systemHealth",
                label = "System health",
                value = dbOk ? "OK" : "Degraded",
                change = dbOk ? "DB online" : "DB unreachable",
                up = dbOk
            }
        };

        var recentRaw = await BuildRecentActivityAsync(ct);
        var recentActivity = recentRaw
            .Select(a => new
            {
                occurredAtUtc = a.OccurredAtUtc,
                action = a.Action,
                user = a.ActorLabel,
                type = a.Type
            })
            .ToList();

        return Ok(new { success = true, data = new { stats, recentActivity } });
    }

    private static string FormatPctChangeLabel(long current, long previous, bool lowerIsBetter = false)
    {
        if (previous == 0)
            return current == 0 ? "0%" : "—";

        var raw = Math.Round((current - previous) * 100.0 / previous, 1);
        if (lowerIsBetter)
            raw = -raw;

        var sign = raw > 0 ? "+" : "";
        return $"{sign}{raw:0.#}%";
    }

    private async Task<List<ActivityRow>> BuildRecentActivityAsync(CancellationToken ct)
    {
        var buffer = new List<ActivityRow>(64);

        var recentUsers = await _db.Users
            .AsNoTracking()
            .OrderByDescending(u => u.CreatedAt)
            .Take(25)
            .ToListAsync(ct);
        foreach (var u in recentUsers)
        {
            buffer.Add(new ActivityRow(
                u.CreatedAt,
                "Registered new account",
                u.Email,
                "register"));
        }

        var recentPred = await _db.PredictionHistories
            .AsNoTracking()
            .Include(p => p.User)
            .OrderByDescending(p => p.CreatedAt)
            .Take(25)
            .ToListAsync(ct);
        foreach (var p in recentPred)
        {
            buffer.Add(new ActivityRow(
                p.CreatedAt,
                $"AI prediction · {p.Symbol} ({p.ModelUsed})",
                p.User.Email,
                "admin"));
        }

        var recentWl = await _db.StockWatchlists
            .AsNoTracking()
            .Include(w => w.User)
            .OrderByDescending(w => w.AddedAt)
            .Take(25)
            .ToListAsync(ct);
        foreach (var w in recentWl)
        {
            buffer.Add(new ActivityRow(
                w.AddedAt,
                $"Added {w.Symbol} to watchlist",
                w.User.Email,
                "trade"));
        }

        var recentMc = await _db.MemecoinWatchlists
            .AsNoTracking()
            .Include(m => m.User)
            .OrderByDescending(m => m.AddedAt)
            .Take(25)
            .ToListAsync(ct);
        foreach (var m in recentMc)
        {
            buffer.Add(new ActivityRow(
                m.AddedAt,
                $"Added memecoin {m.CoinId} to watchlist",
                m.User.Email,
                "trade"));
        }

        var security = await _db.SecurityAuditEvents
            .AsNoTracking()
            .OrderByDescending(e => e.OccurredAtUtc)
            .Take(40)
            .ToListAsync(ct);
        foreach (var e in security)
        {
            if (e.Kind == "login_failed")
            {
                buffer.Add(new ActivityRow(
                    e.OccurredAtUtc,
                    "Failed login attempt",
                    e.NormalizedEmail ?? "unknown",
                    "warning"));
            }
            else if (e.Kind == "login_ok")
            {
                buffer.Add(new ActivityRow(
                    e.OccurredAtUtc,
                    "Logged in",
                    e.NormalizedEmail ?? "user",
                    "login"));
            }
        }

        return buffer
            .OrderByDescending(a => a.OccurredAtUtc)
            .Take(20)
            .ToList();
    }

    private sealed record ActivityRow(DateTime OccurredAtUtc, string Action, string ActorLabel, string Type);
}
