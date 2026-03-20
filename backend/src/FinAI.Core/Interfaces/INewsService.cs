namespace FinAI.Core.Interfaces;

using FinAI.Core.Models;

public interface INewsService
{
    Task<IEnumerable<NewsItemDto>> GetNewsAsync(string? category = null, int page = 1, int pageSize = 20);
}
