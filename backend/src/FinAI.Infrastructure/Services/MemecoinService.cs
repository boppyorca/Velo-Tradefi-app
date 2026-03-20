namespace FinAI.Infrastructure.Services;

using FinAI.Core.Interfaces;
using FinAI.Core.Models;

public class MemecoinService : IMemecoinService
{
    private static readonly List<MemecoinDto> _mockCoins =
    [
        new MemecoinDto("dogecoin", "DOGE", "Dogecoin", 0.08214m, 5.2m, 12_100_000_000m, 890_000_000m, null),
        new MemecoinDto("shiba-inu", "SHIB", "Shiba Inu", 0.00001234m, -2.1m, 7_300_000_000m, 210_000_000m, null),
        new MemecoinDto("pepe", "PEPE", "Pepe", 0.00000421m, 12.4m, 1_800_000_000m, 520_000_000m, null),
        new MemecoinDto("dogwifcoin", "WIF", "dogwifcoin", 2.3412m, 8.7m, 820_000_000m, 340_000_000m, null),
        new MemecoinDto("brett", "BRETT", "Brett", 0.09231m, 3.1m, 920_000_000m, 180_000_000m, null),
        new MemecoinDto("popcat", "POPCAT", "Popcat", 0.7234m, -4.2m, 680_000_000m, 95_000_000m, null),
        new MemecoinDto("floki", "FLOKI", "FLOKI", 0.0001421m, 6.8m, 1_340_000_000m, 410_000_000m, null),
        new MemecoinDto("ai16z", "AI16Z", "ai16z", 1.2345m, 21.3m, 1_230_000_000m, 620_000_000m, null),
        new MemecoinDto("goat", "GOAT", "Goatseus Maximus", 0.8234m, 15.2m, 823_000_000m, 290_000_000m, null),
        new MemecoinDto("pnut", "PNUT", "Peanut the Squirrel", 0.5234m, 18.7m, 523_000_000m, 310_000_000m, null),
    ];

    public Task<IEnumerable<MemecoinDto>> GetMemecoinsAsync(int page = 1, int pageSize = 20)
    {
        var data = _mockCoins
            .Skip((page - 1) * pageSize)
            .Take(pageSize);
        return Task.FromResult<IEnumerable<MemecoinDto>>(data);
    }

    public Task<IEnumerable<MemecoinDto>> GetMemecoinPricesAsync(string ids)
    {
        var idList = ids.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var results = _mockCoins.Where(c => idList.Contains(c.Id, StringComparer.OrdinalIgnoreCase));
        return Task.FromResult<IEnumerable<MemecoinDto>>(results);
    }
}
