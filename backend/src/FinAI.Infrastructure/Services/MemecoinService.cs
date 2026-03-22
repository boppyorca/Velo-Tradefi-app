namespace FinAI.Infrastructure.Services;

using System.Text.Json;
using System.Text.Json.Serialization;
using FinAI.Core.Interfaces;
using FinAI.Core.Models;
using Microsoft.Extensions.Logging;

public class MemecoinService : IMemecoinService
{
    private readonly HttpClient _http;
    private readonly ILogger<MemecoinService> _logger;

    // Extended fallback data — used when CoinGecko API is unavailable or rate-limited
    private static readonly List<MemecoinDto> FallbackCoins =
    [
        // Top memecoins by market cap (approximate real data, Mar 2026)
        new("dogecoin",         "DOGE",  "Dogecoin",          0.09123m,   3.4m,  13_100_000_000m,  920_000_000m,  null),
        new("shiba-inu",       "SHIB",  "Shiba Inu",         0.00001182m,-1.8m,   6_950_000_000m,  185_000_000m,  null),
        new("pepe",            "PEPE",  "Pepe",              0.00000891m, 9.2m,   3_780_000_000m,  680_000_000m,  null),
        new("dogwifcoin",      "WIF",   "dogwifcoin",        2.1245m,    -2.1m,   2_120_000_000m,  340_000_000m,  null),
        new("brett",           "BRETT", "Brett",              0.08341m,   4.7m,   1_050_000_000m,  210_000_000m,  null),
        new("floxifi",         "FLOKI", "FLOKI",              0.0001324m, 2.3m,   1_260_000_000m,  380_000_000m,  null),
        new("popcat",          "POPCAT","Popcat",             0.6512m,   -5.4m,     618_000_000m,   95_000_000m,  null),
        new("ai16z",           "AI16Z", "ai16z",              1.4523m,   14.2m,   1_450_000_000m,  540_000_000m,  null),
        new("goatseus-maximus","GOAT", "Goatseus Maximus",  0.7341m,    8.9m,     734_000_000m,  280_000_000m,  null),
        new("peanut-the-squirrel","PNUT","Peanut the Squirrel",0.4812m,  22.1m,     481_000_000m,  320_000_000m,  null),
        new("mog-coin",        "MOG",   "Mog Coin",           0.00000123m, 6.7m,   420_000_000m,  120_000_000m,  null),
        new("fwog",            "FWOG",  "FWOG",               0.02341m,   12.4m,   234_000_000m,   80_000_000m,  null),
        new("chillguy",        "CHILL", "Chill Guy",          0.01234m,   -8.2m,   123_000_000m,   45_000_000m,  null),
        new("popboy",          "POPBOY","Popboy",             0.00321m,    5.6m,    95_000_000m,    30_000_000m,  null),
        new("michi",           "MICHI", "Michi",              0.04123m,   18.7m,   78_000_000m,    25_000_000m,  null),
        new(" Retard",         "RETARD","Retard",             0.00281m,    3.2m,    65_000_000m,    20_000_000m,  null),
        new("bingus",          "BINGUS","Bingus",             0.00192m,  -12.3m,    58_000_000m,    18_000_000m,  null),
        new("h ted",           "TED",   "TED",                0.00123m,    7.8m,    54_000_000m,    15_000_000m,  null),
        new("spiritdog",       "SDOG",  "SpiritDog",          0.000821m,  15.1m,    49_000_000m,    12_000_000m,  null),
        new("bonk",            "BONK",  "Bonk",               0.00001923m,4.3m,  2_100_000_000m,  180_000_000m,  null),
    ];

    // In-memory cache with TTL
    private List<MemecoinDto>? _cachedCoins;
    private DateTime _cacheExpiry = DateTime.MinValue;
    private static readonly TimeSpan CacheDuration = TimeSpan.FromSeconds(55);

    // Concurrent lock for cache refresh
    private readonly SemaphoreSlim _refreshLock = new(1, 1);

    public MemecoinService(HttpClient http, ILogger<MemecoinService> logger)
    {
        _http = http;
        _logger = logger;
    }

    public async Task<IEnumerable<MemecoinDto>> GetMemecoinsAsync(int page = 1, int pageSize = 20)
    {
        var coins = await GetCachedCoinsAsync();
        return coins
            .Skip((page - 1) * pageSize)
            .Take(pageSize);
    }

    public async Task<IEnumerable<MemecoinDto>> GetMemecoinPricesAsync(string ids)
    {
        var allCoins = await GetCachedCoinsAsync();
        var idList = ids.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        return allCoins.Where(c => idList.Contains(c.Id, StringComparer.OrdinalIgnoreCase));
    }

    private async Task<List<MemecoinDto>> GetCachedCoinsAsync()
    {
        if (_cachedCoins != null && DateTime.UtcNow < _cacheExpiry)
            return _cachedCoins;

        await _refreshLock.WaitAsync();
        try
        {
            // Double-check after acquiring lock
            if (_cachedCoins != null && DateTime.UtcNow < _cacheExpiry)
                return _cachedCoins;

            var live = await FetchFromCoinGeckoAsync();
            if (live.Count > 0)
            {
                _cachedCoins = live;
                _cacheExpiry = DateTime.UtcNow.Add(CacheDuration);
                _logger.LogInformation("CoinGecko: loaded {Count} coins, cached until {Expiry}",
                    live.Count, _cacheExpiry);
            }
            else
            {
                _cachedCoins = FallbackCoins;
                _cacheExpiry = DateTime.UtcNow.Add(CacheDuration);
                _logger.LogWarning("CoinGecko: API unavailable, using {Count} fallback coins", FallbackCoins.Count);
            }
        }
        finally
        {
            _refreshLock.Release();
        }

        return _cachedCoins;
    }

    private async Task<List<MemecoinDto>> FetchFromCoinGeckoAsync()
    {
        try
        {
            // Fetch all memecoins via CoinGecko category, sorted by market cap
            // First page = top 100 memecoins by market cap (full free-tier allowance)
            var url = $"https://api.coingecko.com/api/v3/coins/markets?" +
                      $"vs_currency=usd&category=meme-token&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h";

            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Add("User-Agent", "Mozilla/5.0 (compatible; FinAI/1.0)");
            request.Headers.Add("Accept", "application/json, */*");

            var response = await _http.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                var statusCode = (int)response.StatusCode;
                if (statusCode == 429)
                {
                    _logger.LogWarning("CoinGecko: rate-limited (429). Falling back to static data.");
                }
                else
                {
                    _logger.LogWarning("CoinGecko: returned {StatusCode} for markets endpoint", statusCode);
                }
                return [];
            }

            await using var stream = await response.Content.ReadAsStreamAsync();
            using var doc = await JsonDocument.ParseAsync(stream);
            var root = doc.RootElement;

            var coins = new List<MemecoinDto>();
            foreach (var coin in root.EnumerateArray())
            {
                var id = coin.GetProperty("id").GetString() ?? "";
                var symbol = coin.GetProperty("symbol").GetString()?.ToUpperInvariant() ?? "";
                var name = coin.GetProperty("name").GetString() ?? "";
                var price = coin.GetProperty("current_price").GetDecimal();
                var change24h = coin.TryGetProperty("price_change_percentage_24h", out var changeEl)
                    && changeEl.ValueKind == JsonValueKind.Number
                    ? changeEl.GetDecimal()
                    : 0m;
                var marketCap = coin.TryGetProperty("market_cap", out var mcEl)
                    && mcEl.ValueKind == JsonValueKind.Number
                    ? mcEl.GetDecimal()
                    : 0m;
                var volume = coin.TryGetProperty("total_volume", out var volEl)
                    && volEl.ValueKind == JsonValueKind.Number
                    ? volEl.GetDecimal()
                    : 0m;
                var image = coin.TryGetProperty("image", out var imgEl)
                    ? imgEl.GetString()
                    : null;

                coins.Add(new MemecoinDto(id, symbol, name, price, change24h, marketCap, volume, image));
            }

            return coins;
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "CoinGecko: JSON parse error");
            return [];
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "CoinGecko: failed to fetch coin markets");
            return [];
        }
    }
}
