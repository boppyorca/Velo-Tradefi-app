namespace FinAI.Api.Services;

using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using FinAI.Core.Interfaces;
using FinAI.Core.Models;
using FinAI.Infrastructure.Services;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

/// <summary>
/// Background service that polls Yahoo Finance for live stock prices every 30 seconds
/// and broadcasts updates to all connected SignalR clients.
/// </summary>
public class StockPollingBackgroundService : BackgroundService
{
    private readonly IStockPriceBroadcaster _broadcaster;
    private readonly IRedisCacheService _cache;
    private readonly ILogger<StockPollingBackgroundService> _logger;
    private readonly HttpClient _http;

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
        IHttpClientFactory httpFactory)
    {
        _broadcaster = broadcaster;
        _cache = cache;
        _logger = logger;
        _http = httpFactory.CreateClient("YahooFinance");
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
        var batchSymbols = string.Join(",", TrackedSymbols);
        var url = $"https://query1.finance.yahoo.com/v7/finance/quote?symbols={batchSymbols}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketVolume,marketCap,regularMarketOpen,regularMarketDayHigh,regularMarketDayLow,regularMarketPreviousClose,fiftyTwoWeekHigh,fiftyTwoWeekLow,trailingPE,dividendYield,averageVolume,epsTrailingTwelveMonths,shortName,exchange";

        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("User-Agent", "Mozilla/5.0 (compatible; FinAI-Poll/1.0)");
        request.Headers.Add("Accept", "application/json");

        HttpResponseMessage response;
        try
        {
            response = await _http.SendAsync(request, ct);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "Yahoo Finance network error during polling");
            return;
        }

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Yahoo Finance returned {StatusCode} during polling", response.StatusCode);
            return;
        }

        using var content = await response.Content.ReadAsStreamAsync(ct);
        using var doc = await JsonDocument.ParseAsync(content, cancellationToken: ct);

        var root = doc.RootElement;

        // Handle both single result and array result formats
        JsonElement results;
        if (root.TryGetProperty("quoteResponse", out var qr))
        {
            results = qr.GetProperty("result");
        }
        else if (root.TryGetProperty("chart", out var chart))
        {
            // Fallback: try chart format (used by history endpoint)
            _logger.LogDebug("Unexpected chart format from Yahoo Finance quote endpoint");
            return;
        }
        else
        {
            _logger.LogWarning("Unexpected Yahoo Finance response format");
            return;
        }

        var updatedStocks = new List<StockDto>();

        foreach (var quote in results.EnumerateArray())
        {
            var symbol = quote.TryGetProperty("symbol", out var symProp)
                ? symProp.GetString() ?? ""
                : "";

            if (string.IsNullOrEmpty(symbol)) continue;

            // Parse price (skip if null or zero)
            if (!quote.TryGetProperty("regularMarketPrice", out var priceProp) ||
                priceProp.ValueKind != JsonValueKind.Number)
            {
                continue;
            }

            decimal? TryDecimal(JsonElement el, string prop)
            {
                if (!el.TryGetProperty(prop, out var p) || p.ValueKind != JsonValueKind.Number)
                    return null;
                var val = p.GetDecimal();
                return val == 0 ? null : val;
            }

            var price = priceProp.GetDecimal();
            var change = TryDecimal(quote, "regularMarketChange") ?? 0;
            var changePercent = TryDecimal(quote, "regularMarketChangePercent") ?? 0;
            var volume = quote.TryGetProperty("regularMarketVolume", out var volProp)
                ? volProp.GetInt64() : 0L;
            var marketCap = TryDecimal(quote, "marketCap");
            var name = quote.TryGetProperty("shortName", out var nameProp)
                ? nameProp.GetString() ?? symbol : symbol;
            var exchange = quote.TryGetProperty("exchange", out var exProp)
                ? exProp.GetString() ?? "NASDAQ" : "NASDAQ";

            // Resolve mapped name & exchange from static list
            var (mappedName, mappedExchange) = ResolveMapping(symbol, name, exchange);

            var stock = new StockDto(
                symbol.ToUpperInvariant(),
                mappedName,
                mappedExchange,
                price,
                change,
                changePercent,
                volume,
                marketCap,
                DateTime.UtcNow,
                Open: TryDecimal(quote, "regularMarketOpen"),
                High: TryDecimal(quote, "regularMarketDayHigh"),
                Low: TryDecimal(quote, "regularMarketDayLow"),
                PreviousClose: TryDecimal(quote, "regularMarketPreviousClose"),
                Week52High: TryDecimal(quote, "fiftyTwoWeekHigh"),
                Week52Low: TryDecimal(quote, "fiftyTwoWeekLow"),
                PeRatio: TryDecimal(quote, "trailingPE"),
                DividendYield: TryDecimal(quote, "dividendYield"),
                AvgVolume: TryDecimal(quote, "averageVolume"),
                Eps: TryDecimal(quote, "epsTrailingTwelveMonths")
            );

            // Only include if price changed from last cached value
            var shouldBroadcast = await ShouldBroadcastChangeAsync(symbol, stock);
            if (shouldBroadcast)
            {
                updatedStocks.Add(stock);
            }

            // Always cache the latest
            await CacheStockPriceAsync(symbol, stock);
        }

        if (updatedStocks.Count > 0)
        {
            await _broadcaster.BroadcastBatchUpdateAsync(updatedStocks);
            _logger.LogInformation(
                "Broadcasted {Count} stock price updates (out of {Total} fetched)",
                updatedStocks.Count,
                results.GetArrayLength());
        }
        else
        {
            _logger.LogDebug("No price changes detected in this poll cycle");
        }
    }

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
