namespace FinAI.Infrastructure.Data;

using FinAI.Core.Entities;
using FinAI.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

public class AlertRepository : IAlertRepository
{
    private readonly AppDbContext _context;

    public AlertRepository(AppDbContext context) => _context = context;

    public async Task<IEnumerable<PriceAlert>> GetByUserIdAsync(Guid userId)
        => await _context.PriceAlerts
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

    public async Task<PriceAlert?> GetByIdAsync(Guid id, Guid userId)
        => await _context.PriceAlerts
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

    /// <summary>Returns only active alerts for the given symbol.</summary>
    public async Task<IEnumerable<PriceAlert>> GetActiveBySymbolAsync(string symbol)
        => await _context.PriceAlerts
            .Where(a => a.Symbol == symbol.ToUpperInvariant() && a.IsActive)
            .ToListAsync();

    public async Task<PriceAlert> CreateAsync(PriceAlert alert)
    {
        alert.Symbol = alert.Symbol.ToUpperInvariant();
        _context.PriceAlerts.Add(alert);
        await _context.SaveChangesAsync();
        return alert;
    }

    public async Task<PriceAlert> UpdateAsync(PriceAlert alert)
    {
        alert.UpdatedAt = DateTime.UtcNow;
        _context.PriceAlerts.Update(alert);
        await _context.SaveChangesAsync();
        return alert;
    }

    public async Task<bool> DeleteAsync(Guid id, Guid userId)
    {
        var alert = await _context.PriceAlerts
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
        if (alert is null) return false;

        _context.PriceAlerts.Remove(alert);
        await _context.SaveChangesAsync();
        return true;
    }
}
