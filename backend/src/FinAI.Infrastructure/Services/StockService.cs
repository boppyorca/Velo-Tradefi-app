namespace FinAI.Infrastructure.Services;

using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using FinAI.Core.Interfaces;
using FinAI.Core.Models;
using Microsoft.Extensions.Logging;

public class StockService : IStockService
{
    private readonly HttpClient _http;
    private readonly ILogger<StockService> _logger;

    // Symbol → (Yahoo Finance ticker, Company name, Exchange)
    private static readonly Dictionary<string, (string YahooTicker, string Name, string Exchange)> SymbolMap = new(StringComparer.OrdinalIgnoreCase)
    {
        // US Stocks (NASDAQ/NYSE)
        ["AAPL"]  = ("AAPL",   "Apple Inc.",             "NASDAQ"),
        ["NVDA"]  = ("NVDA",   "NVIDIA Corp.",            "NASDAQ"),
        ["TSLA"]  = ("TSLA",   "Tesla Inc.",              "NASDAQ"),
        ["MSFT"]  = ("MSFT",   "Microsoft Corp.",        "NASDAQ"),
        ["AMZN"]  = ("AMZN",   "Amazon.com Inc.",        "NASDAQ"),
        ["META"]  = ("META",   "Meta Platforms",         "NASDAQ"),
        ["GOOGL"] = ("GOOGL",  "Alphabet Inc.",          "NASDAQ"),
        ["GOOG"]  = ("GOOG",   "Alphabet Inc.",          "NASDAQ"),
        ["NFLX"]  = ("NFLX",   "Netflix Inc.",           "NASDAQ"),
        ["AMD"]   = ("AMD",    "Advanced Micro Devices", "NASDAQ"),
        ["INTC"]  = ("INTC",   "Intel Corp.",            "NASDAQ"),
        ["MSFT"]  = ("MSFT",   "Microsoft Corp.",        "NASDAQ"),
        ["IBM"]   = ("IBM",    "IBM Corp.",              "NASDAQ"),
        ["DIS"]   = ("DIS",    "Walt Disney Co.",        "NASDAQ"),
        ["PYPL"]  = ("PYPL",   "PayPal Holdings",       "NASDAQ"),
        ["UBER"]  = ("UBER",   "Uber Technologies",      "NASDAQ"),
        ["COIN"]  = ("COIN",   "Coinbase Global",        "NASDAQ"),
        ["JPM"]   = ("JPM",    "JPMorgan Chase",         "NYSE"),
        ["BAC"]   = ("BAC",    "Bank of America",       "NYSE"),
        ["GS"]    = ("GS",     "Goldman Sachs",          "NYSE"),
        ["V"]     = ("V",      "Visa Inc.",              "NYSE"),
        ["MA"]    = ("MA",     "Mastercard Inc.",        "NYSE"),
        ["WMT"]   = ("WMT",    "Walmart Inc.",           "NYSE"),
        ["JNJ"]   = ("JNJ",    "Johnson & Johnson",      "NYSE"),
        ["UNH"]   = ("UNH",    "UnitedHealth Group",     "NYSE"),
        // VN Stocks (HOSE)
        ["VNM"]   = ("VNM",    "Vietnam Dairy",          "HOSE"),
        ["VIC"]   = ("VIC",    "Vingroup JSC",          "HOSE"),
        ["HPG"]   = ("HPG",    "Hoa Phat Group",        "HOSE"),
        ["VHM"]   = ("VHM",    "Vinhomes JSC",          "HOSE"),
        ["MSN"]   = ("MSN",    "Masan Group",            "HOSE"),
        ["VRE"]   = ("VRE",    "Vincom Retail",          "HOSE"),
        ["FPT"]   = ("FPT",    "FPT Corp.",              "HOSE"),
        ["MWG"]   = ("MWG",    "Mobile World Inv.",      "HOSE"),
        ["PNJ"]   = ("PNJ",    "Phu Nhuan Jewelry",     "HOSE"),
        ["TCB"]   = ("TCB",    "Techcombank",            "HOSE"),
        ["ACB"]   = ("ACB",    "Asia Commercial Bank",   "HOSE"),
        ["VPB"]   = ("VPB",    "VPBank",                "HOSE"),
        ["CTG"]   = ("CTG",    "VietinBank",            "HOSE"),
        ["MBB"]   = ("MBB",    "Military Bank",          "HOSE"),
        ["TPB"]   = ("TPB",    "TPBank",                "HOSE"),
        ["STB"]   = ("STB",    "Sacombank",              "HOSE"),
        ["SSI"]   = ("SSI",    "SSI Securities Corp.",   "HOSE"),
        ["VND"]   = ("VND",    "VNDirect Securities",    "HOSE"),
        ["HCM"]   = ("HCM",    "HCM City Securities",   "HOSE"),
        ["BID"]   = ("BID",    "BIDV",                  "HOSE"),
    };

    private static readonly Dictionary<string, StockDto> FallbackStocks = new(StringComparer.OrdinalIgnoreCase)
    {
        ["AAPL"]  = new("AAPL",  "Apple Inc.",           "NASDAQ", 192.10m, 1.52m,  0.80m,  58_230_000, 2_980_000_000_000m, DateTime.UtcNow),
        ["NVDA"]  = new("NVDA",  "NVIDIA Corp.",          "NASDAQ", 135.21m, 3.17m,  2.40m,  42_100_000, 3_320_000_000_000m, DateTime.UtcNow),
        ["TSLA"]  = new("TSLA",  "Tesla Inc.",            "NASDAQ", 248.50m,-1.25m, -0.50m,  31_800_000,   792_000_000_000m, DateTime.UtcNow),
        ["MSFT"]  = new("MSFT",  "Microsoft Corp.",       "NASDAQ", 415.20m, 2.80m,  0.68m,  22_100_000, 3_090_000_000_000m, DateTime.UtcNow),
        ["AMZN"]  = new("AMZN",  "Amazon.com Inc.",       "NASDAQ", 196.40m,-0.90m, -0.46m,  18_400_000, 2_050_000_000_000m, DateTime.UtcNow),
        ["META"]  = new("META",  "Meta Platforms",        "NASDAQ", 512.30m, 8.40m,  1.67m,  15_600_000, 1_310_000_000_000m, DateTime.UtcNow),
        ["GOOGL"] = new("GOOGL", "Alphabet Inc.",         "NASDAQ", 171.80m, 1.20m,  0.70m,  19_200_000, 2_140_000_000_000m, DateTime.UtcNow),
        ["VNM"]   = new("VNM",   "Vietnam Dairy",         "HOSE",  78500m,  -952m, -1.20m,   3_200_000,   138_000_000_000m, DateTime.UtcNow),
        ["VIC"]   = new("VIC",   "Vingroup JSC",         "HOSE",  42100m,   320m,  0.77m,   2_100_000,    92_000_000_000m, DateTime.UtcNow),
        ["HPG"]   = new("HPG",   "Hoa Phat Group",       "HOSE",  28400m,   480m,  1.72m,   5_800_000,    78_000_000_000m, DateTime.UtcNow),
        ["VHM"]   = new("VHM",   "Vinhomes JSC",         "HOSE",  37200m,  -210m, -0.56m,   1_900_000,    68_000_000_000m, DateTime.UtcNow),
        ["MSN"]   = new("MSN",   "Masan Group",           "HOSE",  72100m,   540m,  0.75m,   1_100_000,    52_000_000_000m, DateTime.UtcNow),
        ["FPT"]   = new("FPT",   "FPT Corp.",            "HOSE", 145600m, 1200m,  0.83m,   4_200_000,    86_000_000_000m, DateTime.UtcNow),
        ["TCB"]   = new("TCB",   "Techcombank",          "HOSE",  24800m,   180m,  0.73m,   8_900_000,    92_000_000_000m, DateTime.UtcNow),
        ["MWG"]   = new("MWG",   "Mobile World Inv.",    "HOSE",  51200m,  -280m, -0.54m,   1_800_000,    48_000_000_000m, DateTime.UtcNow),
    };

    public StockService(HttpClient http, ILogger<StockService> logger)
    {
        _http = http;
        _logger = logger;
    }

    public async Task<IEnumerable<StockDto>> GetStocksAsync(string? exchange = null, int page = 1, int pageSize = 20)
    {
        IEnumerable<StockDto> allStocks;

        // Try to fetch live data for known symbols
        var liveStocks = new List<StockDto>();
        var symbolsToFetch = FallbackStocks.Values.ToList();

        var tasks = symbolsToFetch.Select(s => FetchLiveQuoteAsync(s.Symbol)).ToList();
        await Task.WhenAll(tasks);

        foreach (var task in tasks)
        {
            if (task.Result is StockDto dto && dto != null)
                liveStocks.Add(dto);
        }

        allStocks = liveStocks.Count > 0 ? liveStocks : FallbackStocks.Values;

        // Filter by exchange
        if (!string.IsNullOrWhiteSpace(exchange))
        {
            var exchangeUpper = exchange.ToUpperInvariant();
            allStocks = exchangeUpper switch
            {
                "VN" => allStocks.Where(s => s.Exchange is "HOSE" or "HNX"),
                "US" => allStocks.Where(s => s.Exchange is "NASDAQ" or "NYSE"),
                _    => allStocks.Where(s => s.Exchange.Equals(exchangeUpper, StringComparison.OrdinalIgnoreCase))
            };
        }

        var total = allStocks.Count();
        var paged = allStocks
            .Skip((page - 1) * pageSize)
            .Take(pageSize);

        return paged;
    }

    public async Task<StockDto?> GetStockQuoteAsync(string symbol)
    {
        // Try live first
        var live = await FetchLiveQuoteAsync(symbol);
        if (live != null) return live;

        // Fallback
        if (FallbackStocks.TryGetValue(symbol.ToUpperInvariant(), out var fallback))
            return fallback;

        return null;
    }

    public Task<IEnumerable<StockDto>> SearchStocksAsync(string query)
    {
        var q = query.Trim().ToLowerInvariant();
        var results = FallbackStocks.Values
            .Where(s => s.Symbol.ToLowerInvariant().Contains(q) ||
                        s.Name.ToLowerInvariant().Contains(q))
            .Take(10);
        return Task.FromResult<IEnumerable<StockDto>>(results);
    }

    public async Task<IEnumerable<StockHistoryDto>> GetHistoryAsync(string symbol, string period = "1mo")
    {
        try
        {
            // Yahoo Finance query params
            var symbolKey = SymbolMap.TryGetValue(symbol.ToUpperInvariant(), out var m)
                ? m.YahooTicker
                : symbol.ToUpperInvariant();

            var interval = period switch
            {
                "1D"  => "5m",
                "1W"  => "15m",
                "1M"  => "30m",
                "3M"  => "1h",
                "1Y"  => "1d",
                "ALL" => "1wk",
                _     => "1d"
            };

            // Unix timestamps for period bounds
            var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var start = period switch
            {
                "1D"  => now - 86400,
                "1W"  => now - 7 * 86400,
                "1M"  => now - 30 * 86400,
                "3M"  => now - 90 * 86400,
                "1Y"  => now - 365 * 86400,
                "ALL" => now - 5 * 365 * 86400,
                _     => now - 30 * 86400
            };

            var url = $"https://query1.finance.yahoo.com/v8/finance/chart/{symbolKey}" +
                      $"?interval={interval}&period1={start}&period2={now}";

            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Add("User-Agent", "Mozilla/5.0 (compatible; FinAI/1.0)");
            request.Headers.Add("Accept", "application/json");

            var response = await _http.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Yahoo Finance returned {StatusCode} for {Symbol}", response.StatusCode, symbol);
                return GetMockHistory(symbol);
            }

            using var content = await response.Content.ReadAsStreamAsync();
            using var doc = await JsonDocument.ParseAsync(content);

            var root = doc.RootElement;
            var chart = root.GetProperty("chart");
            var result = chart.GetProperty("result")[0];
            var quotes = result.GetProperty("indicators")
                              .GetProperty("quote")[0];

            var timestamps = result.GetProperty("timestamp")
                                   .EnumerateArray()
                                   .Select(t => DateTimeOffset.FromUnixTimeSeconds(t.GetInt64()).DateTime)
                                   .ToArray();

            var opens  = quotes.GetProperty("open").EnumerateArray().Select(v => v.ValueKind == JsonValueKind.Number ? v.GetDecimal() : 0).ToArray();
            var highs  = quotes.GetProperty("high").EnumerateArray().Select(v => v.ValueKind == JsonValueKind.Number ? v.GetDecimal() : 0).ToArray();
            var lows   = quotes.GetProperty("low").EnumerateArray().Select(v => v.ValueKind == JsonValueKind.Number ? v.GetDecimal() : 0).ToArray();
            var closes = quotes.GetProperty("close").EnumerateArray().Select(v => v.ValueKind == JsonValueKind.Number ? v.GetDecimal() : 0).ToArray();
            var vols   = quotes.GetProperty("volume").EnumerateArray().Select(v => v.ValueKind == JsonValueKind.Number ? v.GetDecimal() : 0).ToArray();

            var history = new List<StockHistoryDto>();
            for (int i = 0; i < timestamps.Length; i++)
            {
                if (closes[i] == 0) continue; // skip null bars
                history.Add(new StockHistoryDto(timestamps[i], opens[i], highs[i], lows[i], closes[i], vols[i]));
            }

            return history;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch history for {Symbol}", symbol);
            return GetMockHistory(symbol);
        }
    }

    private async Task<StockDto?> FetchLiveQuoteAsync(string symbol)
    {
        try
        {
            var symbolKey = SymbolMap.TryGetValue(symbol.ToUpperInvariant(), out var m)
                ? m.YahooTicker
                : symbol.ToUpperInvariant();

            // Yahoo Finance v7 quote endpoint
            var url = $"https://query1.finance.yahoo.com/v7/finance/quote?symbols={symbolKey}";

            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Add("User-Agent", "Mozilla/5.0 (compatible; FinAI/1.0)");
            request.Headers.Add("Accept", "application/json");

            var response = await _http.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Yahoo Finance returned {StatusCode} for {Symbol}", response.StatusCode, symbol);
                return null;
            }

            using var content = await response.Content.ReadAsStreamAsync();
            using var doc = await JsonDocument.ParseAsync(content);

            var result = doc.RootElement
                .GetProperty("quoteResponse")
                .GetProperty("result");

            if (result.GetArrayLength() == 0)
                return null;

            var q = result[0];
            var price          = q.GetProperty("regularMarketPrice").GetDecimal();
            var change         = q.TryGetProperty("regularMarketChange", out var chProp) ? chProp.GetDecimal() : 0;
            var changePercent   = q.TryGetProperty("regularMarketChangePercent", out var cpProp) ? cpProp.GetDecimal() : 0;
            var volume         = q.TryGetProperty("regularMarketVolume", out var volProp) ? volProp.GetInt64() : 0L;
            var marketCap      = q.TryGetProperty("marketCap", out var mcProp) && mcProp.ValueKind == JsonValueKind.Number ? mcProp.GetDecimal() : (decimal?)null;
            var exchange       = q.TryGetProperty("exchange", out var exProp) ? exProp.GetString() ?? "NASDAQ" : "NASDAQ";
            var name           = q.TryGetProperty("shortName", out var nProp) ? nProp.GetString() ?? symbol : symbol;
            var currency        = q.TryGetProperty("currency", out var curProp) ? curProp.GetString() ?? "USD" : "USD";

            // VN stocks use VND currency, Yahoo reports in VND
            var priceDisplay = price;
            if (currency == "VND")
            {
                // Already in VND — no conversion needed
            }

            var (mappedName, mappedExchange) = SymbolMap.TryGetValue(symbol.ToUpperInvariant(), out var meta)
                ? (meta.Name, meta.Exchange)
                : (name, exchange);

            return new StockDto(
                symbol.ToUpperInvariant(),
                mappedName,
                mappedExchange,
                price,
                change,
                changePercent,
                volume,
                marketCap,
                DateTime.UtcNow
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch live quote for {Symbol}", symbol);
            return null;
        }
    }

    private static IEnumerable<StockHistoryDto> GetMockHistory(string symbol)
    {
        var rnd = new Random(symbol.GetHashCode());
        var now = DateTime.UtcNow;
        var basePrice = FallbackStocks.TryGetValue(symbol.ToUpperInvariant(), out var s) ? s.Price : 100m;
        var history = new List<StockHistoryDto>();

        for (int i = 60; i >= 0; i--)
        {
            var date = now.AddDays(-i).Date;
            var open = basePrice * (decimal)(1 + (rnd.NextDouble() - 0.5) * 0.04);
            var close = basePrice * (decimal)(1 + (rnd.NextDouble() - 0.5) * 0.04);
            var high = Math.Max(open, close) * (decimal)(1 + rnd.NextDouble() * 0.02);
            var low = Math.Min(open, close) * (decimal)(1 - rnd.NextDouble() * 0.02);
            var vol = rnd.Next(1_000_000, 50_000_000);

            history.Add(new StockHistoryDto(date, open, high, low, close, vol));
            basePrice = close;
        }
        return history;
    }
}
