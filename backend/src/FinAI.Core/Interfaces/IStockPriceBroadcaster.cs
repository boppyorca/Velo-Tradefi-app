namespace FinAI.Core.Interfaces;

using FinAI.Core.Models;

public interface IStockPriceBroadcaster
{
    Task BroadcastStockUpdateAsync(StockDto stock);
    Task BroadcastBatchUpdateAsync(IEnumerable<StockDto> stocks);
    Task<StockDto?> GetLastPriceAsync(string symbol);
    Task<IEnumerable<string>> GetSubscribedSymbolsAsync();
    Task RegisterSymbolAsync(string symbol);
}
