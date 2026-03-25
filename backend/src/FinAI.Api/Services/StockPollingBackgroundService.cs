namespace FinAI.Api.Services;

using FinAI.Core.Interfaces;
using FinAI.Core.Models;
using FinAI.Infrastructure.Services;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

/// <summary>
/// Background service that polls live stock prices using a cascading data provider
/// (Finnhub → AlphaVantage → Yahoo Finance) and broadcasts updates to all
/// connected SignalR clients.
/// </summary>
public class StockPollingBackgroundService : BackgroundService
{
    private readonly IStockPriceBroadcaster _broadcaster;
    private readonly IRedisCacheService _cache;
    private readonly ILogger<StockPollingBackgroundService> _logger;
    private readonly HttpClient _http;
    private readonly IAlertService _alertService;

    // Polling interval (configurable via env var)
    private static readonly TimeSpan PollingInterval = TimeSpan.FromSeconds(
        double.TryParse(Environment.GetEnvironmentVariable("STOCK_POLL_INTERVAL_SECONDS"), out var seconds) && seconds > 5
            ? seconds
            : 30
    );

    // Cache TTL for polled stock data
    private static readonly TimeSpan StockCacheTtl = TimeSpan.FromMinutes(1);

    // Key prefix for stock price cache
    private const string StockPriceCachePrefix = "polling:stock:";

    // Tracked symbols — same as the ones defined in StockService
    // (We keep a static list here so the polling service doesn't need a DB dependency)
    private static readonly string[] TrackedSymbols = new[]
    {
        // US NASDAQ
        "AAPL", "NVDA", "TSLA", "MSFT", "AMZN", "META", "GOOGL", "GOOG",
        "NFLX", "AMD", "INTC", "IBM", "DIS", "PYPL", "UBER", "COIN",
        // US NYSE
        "JPM", "BAC", "GS", "V", "MA", "WMT", "JNJ", "UNH",
        // VN HOSE
        "VNM", "VIC", "HPG", "VHM", "MSN", "VRE", "FPT", "MWG",
        "PNJ", "TCB", "ACB", "VPB", "CTG", "MBB", "TPB", "STB", "SSI", "VND", "HCM", "BID",
    };

    public StockPollingBackgroundService(
        IStockPriceBroadcaster broadcaster,
        IRedisCacheService cache,
        ILogger<StockPollingBackgroundService> logger,
        IHttpClientFactory httpFactory,
        IAlertService alertService)
    {
        _broadcaster = broadcaster;
        _cache = cache;
        _logger = logger;
        _http = httpFactory.CreateClient("StockData"); // cascading: Finnhub → AlphaVantage → Yahoo
        _alertService = alertService;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation(
            "StockPollingBackgroundService starting. Polling interval: {Interval}s, Symbols: {Count}",
            PollingInterval.TotalSeconds,
            TrackedSymbols.Length);

        // Initial delay so the app has time to start up
        await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await PollAndBroadcastAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                // Graceful shutdown
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during stock polling cycle");
            }

            try
            {
                await Task.Delay(PollingInterval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }

        _logger.LogInformation("StockPollingBackgroundService stopped.");
    }

    private async Task PollAndBroadcastAsync(CancellationToken ct)
    {
        // Background polling: fetch VN stocks via iTick (rate-limited), US via Finnhub
        var dataProvider = new StockDataProvider(_http, NullLogger<StockDataProvider>.Instance);
        var fetchedStocks = await dataProvider.FetchBatchAsync(TrackedSymbols, skipItick: false, ct);

        if (fetchedStocks.Count == 0)
        {
            _logger.LogWarning("All data providers failed — broadcasting with fallback/mock data");
            // Fallback: broadcast mock data so clients still receive updates
            fetchedStocks = GetFallbackBatch();
        }

        var updatedStocks = new List<StockDto>();

        foreach (KeyValuePair<string, StockDto> kvp in fetchedStocks)
        {
            var shouldBroadcast = await ShouldBroadcastChangeAsync(kvp.Key, kvp.Value);
            if (shouldBroadcast)
            {
                updatedStocks.Add(kvp.Value);
            }

            // Always cache the latest
            await CacheStockPriceAsync(kvp.Key, kvp.Value);

            // Check alerts for this symbol
            try
            {
                await _alertService.CheckAndFireAlertsAsync(kvp.Key, kvp.Value.Price);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking alerts for {Symbol}", kvp.Key);
            }
        }

        if (updatedStocks.Count > 0)
        {
            await _broadcaster.BroadcastBatchUpdateAsync(updatedStocks);
            _logger.LogInformation(
                "Broadcasted {Count} stock price updates via SignalR",
                updatedStocks.Count);
        }
        else
        {
            _logger.LogDebug("No price changes detected in this poll cycle");
        }
    }

    /// <summary>
    /// Returns fallback/mock batch when all data providers fail.
    /// Uses cached mock prices with small random drift for demo.
    /// </summary>
    private Dictionary<string, StockDto> GetFallbackBatch()
    {
        var rnd = new Random();
        var result = new Dictionary<string, StockDto>(StringComparer.OrdinalIgnoreCase);

        foreach (var (sym, meta) in SymbolMetadata)
        {
            // Apply small random drift to make mock data feel "live"
            var drift = (decimal)((rnd.NextDouble() - 0.5) * 0.02); // ±1%
            var basePrice = GetBaseMockPrice(sym);
            var price = basePrice * (1 + drift);
            var change = basePrice * (decimal)(rnd.NextDouble() * 0.04 - 0.02);
            var changePercent = drift * 100;

            result[sym] = new StockDto(
                sym.ToUpperInvariant(),
                meta.Name,
                meta.Exchange,
                Math.Round(price, 2),
                Math.Round(change, 2),
                Math.Round(changePercent, 2),
                rnd.Next(1_000_000, 50_000_000),
                null,
                DateTime.UtcNow
            );
        }

        return result;
    }

    private static readonly Dictionary<string, decimal> BaseMockPrices = new(StringComparer.OrdinalIgnoreCase)
    {
        ["AAPL"] = 192.10m, ["NVDA"] = 135.21m, ["TSLA"] = 248.50m, ["MSFT"] = 415.20m,
        ["AMZN"] = 196.40m, ["META"] = 512.30m, ["GOOGL"] = 171.80m, ["GOOG"] = 171.80m,
        ["NFLX"] = 485.00m, ["AMD"] = 120.50m, ["INTC"] = 28.30m, ["IBM"] = 185.00m,
        ["DIS"] = 112.00m, ["PYPL"] = 62.00m, ["UBER"] = 78.00m, ["COIN"] = 145.00m,
        ["JPM"] = 198.00m, ["BAC"] = 38.50m, ["GS"] = 495.00m, ["V"] = 280.00m,
        ["MA"] = 480.00m, ["WMT"] = 165.00m, ["JNJ"] = 155.00m, ["UNH"] = 520.00m,
        ["VNM"] = 78500m, ["VIC"] = 42100m, ["HPG"] = 28400m, ["VHM"] = 38000m,
        ["MSN"] = 72000m, ["VRE"] = 22000m, ["FPT"] = 145600m, ["MWG"] = 51200m,
        ["PNJ"] = 98000m, ["TCB"] = 24800m, ["ACB"] = 22000m, ["VPB"] = 18500m,
        ["CTG"] = 32000m, ["MBB"] = 15500m, ["TPB"] = 17500m, ["STB"] = 28000m,
        ["SSI"] = 35000m, ["VND"] = 12500m, ["HCM"] = 28000m, ["BID"] = 48500m,
    };

    private decimal GetBaseMockPrice(string symbol)
        => BaseMockPrices.TryGetValue(symbol.ToUpperInvariant(), out var p) ? p : 100m;

    private async Task<bool> ShouldBroadcastChangeAsync(string symbol, StockDto newStock)
    {
        var cacheKey = $"{StockPriceCachePrefix}{symbol.ToUpperInvariant()}";

        try
        {
            var cached = await _cache.GetAsync<CachedStockPrice>(cacheKey);
            if (cached == null) return true;

            // Broadcast if price changed by at least 0.01%
            var priceDiff = Math.Abs(newStock.Price - cached.Price);
            var threshold = cached.Price * 0.0001m; // 0.01%
            return priceDiff >= threshold;
        }
        catch
        {
            // If cache read fails, always broadcast
            return true;
        }
    }

    private async Task CacheStockPriceAsync(string symbol, StockDto stock)
    {
        var cacheKey = $"{StockPriceCachePrefix}{symbol.ToUpperInvariant()}";
        try
        {
            var cached = new CachedStockPrice(stock.Price, stock.Change, stock.ChangePercent, DateTime.UtcNow);
            await _cache.SetAsync(cacheKey, cached, StockCacheTtl);
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Failed to cache stock price for {Symbol}", symbol);
        }
    }

    // Static mapping for symbol metadata — mirrors StockService but inlined
    // to avoid a direct dependency on StockService internals
    private static readonly Dictionary<string, (string Name, string Exchange)> SymbolMetadata = new(StringComparer.OrdinalIgnoreCase)
    {
        ["AAPL"]  = ("Apple Inc.",            "NASDAQ"),
        ["NVDA"]  = ("NVIDIA Corp.",          "NASDAQ"),
        ["TSLA"]  = ("Tesla Inc.",            "NASDAQ"),
        ["MSFT"]  = ("Microsoft Corp.",       "NASDAQ"),
        ["AMZN"]  = ("Amazon.com Inc.",       "NASDAQ"),
        ["META"]  = ("Meta Platforms",        "NASDAQ"),
        ["GOOGL"] = ("Alphabet Inc.",         "NASDAQ"),
        ["GOOG"]  = ("Alphabet Inc.",         "NASDAQ"),
        ["NFLX"]  = ("Netflix Inc.",          "NASDAQ"),
        ["AMD"]   = ("Advanced Micro Devices","NASDAQ"),
        ["INTC"]  = ("Intel Corp.",           "NASDAQ"),
        ["IBM"]   = ("IBM Corp.",             "NASDAQ"),
        ["DIS"]   = ("Walt Disney Co.",       "NASDAQ"),
        ["PYPL"]  = ("PayPal Holdings",       "NASDAQ"),
        ["UBER"]  = ("Uber Technologies",     "NASDAQ"),
        ["COIN"]  = ("Coinbase Global",       "NASDAQ"),
        ["JPM"]   = ("JPMorgan Chase",        "NYSE"),
        ["BAC"]   = ("Bank of America",       "NYSE"),
        ["GS"]    = ("Goldman Sachs",          "NYSE"),
        ["V"]     = ("Visa Inc.",              "NYSE"),
        ["MA"]    = ("Mastercard Inc.",        "NYSE"),
        ["WMT"]   = ("Walmart Inc.",          "NYSE"),
        ["JNJ"]   = ("Johnson & Johnson",     "NYSE"),
        ["UNH"]   = ("UnitedHealth Group",    "NYSE"),
        ["VNM"]   = ("Vietnam Dairy",         "HOSE"),
        ["VIC"]   = ("Vingroup JSC",         "HOSE"),
        ["HPG"]   = ("Hoa Phat Group",        "HOSE"),
        ["VHM"]   = ("Vinhomes JSC",         "HOSE"),
        ["MSN"]   = ("Masan Group",           "HOSE"),
        ["VRE"]   = ("Vincom Retail",         "HOSE"),
        ["FPT"]   = ("FPT Corp.",            "HOSE"),
        ["MWG"]   = ("Mobile World Inv.",     "HOSE"),
        ["PNJ"]   = ("Phu Nhuan Jewelry",    "HOSE"),
        ["TCB"]   = ("Techcombank",           "HOSE"),
        ["ACB"]   = ("Asia Commercial Bank",  "HOSE"),
        ["VPB"]   = ("VPBank",               "HOSE"),
        ["CTG"]   = ("VietinBank",           "HOSE"),
        ["MBB"]   = ("Military Bank",         "HOSE"),
        ["TPB"]   = ("TPBank",               "HOSE"),
        ["STB"]   = ("Sacombank",             "HOSE"),
        ["SSI"]   = ("SSI Securities Corp.",  "HOSE"),
        ["VND"]   = ("VNDirect Securities",  "HOSE"),
        ["HCM"]   = ("HCM City Securities",  "HOSE"),
        ["BID"]   = ("BIDV",                 "HOSE"),
    };

    private static (string Name, string Exchange) ResolveMapping(string symbol, string yahooName, string yahooExchange)
    {
        if (SymbolMetadata.TryGetValue(symbol.ToUpperInvariant(), out var meta))
            return meta;
        return (yahooName, yahooExchange);
    }

    // Internal record for tracking last cached price
    private record CachedStockPrice(
        decimal Price,
        decimal Change,
        decimal ChangePercent,
        DateTime CachedAt
    );
}
