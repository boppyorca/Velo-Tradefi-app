namespace FinAI.Core.Interfaces;

using FinAI.Core.Models;

public interface IMemecoinService
{
    Task<IEnumerable<MemecoinDto>> GetMemecoinsAsync(int page = 1, int pageSize = 20);
    Task<IEnumerable<MemecoinDto>> GetMemecoinPricesAsync(string ids);
}
