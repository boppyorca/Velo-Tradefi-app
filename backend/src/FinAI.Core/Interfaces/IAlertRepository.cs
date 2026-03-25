namespace FinAI.Core.Interfaces;

using FinAI.Core.Entities;

public interface IAlertRepository
{
    Task<IEnumerable<PriceAlert>> GetByUserIdAsync(Guid userId);
    Task<PriceAlert?> GetByIdAsync(Guid id, Guid userId);
    Task<IEnumerable<PriceAlert>> GetActiveBySymbolAsync(string symbol);
    Task<PriceAlert> CreateAsync(PriceAlert alert);
    Task<PriceAlert> UpdateAsync(PriceAlert alert);
    Task<bool> DeleteAsync(Guid id, Guid userId);
}
