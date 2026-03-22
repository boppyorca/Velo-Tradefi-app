namespace FinAI.Infrastructure.Data;

using FinAI.Core.Entities;
using FinAI.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

public class WatchlistRepository : IWatchlistRepository
{
    private readonly AppDbContext _context;

    public WatchlistRepository(AppDbContext context) => _context = context;

    public async Task<IEnumerable<StockWatchlist>> GetByUserIdAsync(Guid userId)
        => await _context.StockWatchlists
            .Where(w => w.UserId == userId)
            .OrderByDescending(w => w.AddedAt)
            .ToListAsync();

    public async Task<StockWatchlist?> GetByUserAndSymbolAsync(Guid userId, string symbol, string market)
        => await _context.StockWatchlists
            .FirstOrDefaultAsync(w =>
                w.UserId == userId &&
                w.Symbol == symbol.ToUpperInvariant() &&
                w.Market == market.ToUpperInvariant());

    public async Task<StockWatchlist> AddAsync(StockWatchlist item)
    {
        item.Symbol = item.Symbol.ToUpperInvariant();
        item.Market = item.Market.ToUpperInvariant();
        _context.StockWatchlists.Add(item);
        await _context.SaveChangesAsync();
        return item;
    }

    public async Task<bool> RemoveAsync(Guid userId, string symbol, string market)
    {
        var item = await _context.StockWatchlists
            .FirstOrDefaultAsync(w =>
                w.UserId == userId &&
                w.Symbol == symbol.ToUpperInvariant() &&
                w.Market == market.ToUpperInvariant());

        if (item is null) return false;

        _context.StockWatchlists.Remove(item);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsAsync(Guid userId, string symbol, string market)
        => await _context.StockWatchlists.AnyAsync(w =>
            w.UserId == userId &&
            w.Symbol == symbol.ToUpperInvariant() &&
            w.Market == market.ToUpperInvariant());
}
