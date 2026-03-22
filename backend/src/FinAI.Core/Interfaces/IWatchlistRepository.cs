namespace FinAI.Core.Interfaces;

using FinAI.Core.Entities;

public interface IWatchlistRepository
{
    Task<IEnumerable<StockWatchlist>> GetByUserIdAsync(Guid userId);
    Task<StockWatchlist?> GetByUserAndSymbolAsync(Guid userId, string symbol, string market);
    Task<StockWatchlist> AddAsync(StockWatchlist item);
    Task<bool> RemoveAsync(Guid userId, string symbol, string market);
    Task<bool> ExistsAsync(Guid userId, string symbol, string market);
}
