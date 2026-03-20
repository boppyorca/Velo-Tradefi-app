namespace FinAI.Core.Interfaces;

using FinAI.Core.Models;

public interface IStockService
{
    Task<IEnumerable<StockDto>> GetStocksAsync(string? exchange = null, int page = 1, int pageSize = 20);
    Task<StockDto?> GetStockQuoteAsync(string symbol);
    Task<IEnumerable<StockDto>> SearchStocksAsync(string query);
    Task<IEnumerable<StockHistoryDto>> GetHistoryAsync(string symbol, string period = "1mo");
}

public record StockHistoryDto(
    DateTime Date,
    decimal Open,
    decimal High,
    decimal Low,
    decimal Close,
    decimal Volume
);
