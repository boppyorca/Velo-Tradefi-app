namespace FinAI.Infrastructure.Services;

using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using FinAI.Core.Interfaces;
using FinAI.Core.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

public class StockService : IStockService
{
    private readonly HttpClient _http;
    private readonly ILogger<StockService> _logger;

    // Symbol → (Yahoo Finance ticker, Company name, Exchange)
    // Made public static so StockDataProvider can use it
    public static readonly Dictionary<string, (string YahooTicker, string Name, string Exchange)> SymbolMap = new(StringComparer.OrdinalIgnoreCase)
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
        ["AAPL"]  = new("AAPL",  "Apple Inc.",           "NASDAQ", 192.10m, 1.52m,  0.80m,  58_230_000, 2_980_000_000_000m, DateTime.UtcNow,
                       Open: 191.20m, High: 193.40m, Low: 190.80m, PreviousClose: 190.58m,
                       Week52High: 199.62m, Week52Low: 164.08m, PeRatio: 28.5m, DividendYield: 0.0044m, AvgVolume: 52_000_000m, Eps: 6.75m),
        ["NVDA"]  = new("NVDA",  "NVIDIA Corp.",          "NASDAQ", 135.21m, 3.17m,  2.40m,  42_100_000, 3_320_000_000_000m, DateTime.UtcNow,
                       Open: 133.00m, High: 136.80m, Low: 132.50m, PreviousClose: 132.04m,
                       Week52High: 152.89m, Week52Low: 47.32m, PeRatio: 65.2m, DividendYield: 0.0003m, AvgVolume: 38_000_000m, Eps: 2.07m),
        ["TSLA"]  = new("TSLA",  "Tesla Inc.",            "NASDAQ", 248.50m,-1.25m, -0.50m,  31_800_000,   792_000_000_000m, DateTime.UtcNow,
                       Open: 250.10m, High: 251.80m, Low: 247.20m, PreviousClose: 249.75m,
                       Week52High: 299.29m, Week52Low: 138.80m, PeRatio: 62.1m, DividendYield: null, AvgVolume: 28_000_000m, Eps: 4.00m),
        ["MSFT"]  = new("MSFT",  "Microsoft Corp.",       "NASDAQ", 415.20m, 2.80m,  0.68m,  22_100_000, 3_090_000_000_000m, DateTime.UtcNow,
                       Open: 413.50m, High: 416.20m, Low: 412.80m, PreviousClose: 412.40m,
                       Week52High: 468.35m, Week52Low: 349.67m, PeRatio: 35.8m, DividendYield: 0.0072m, AvgVolume: 20_000_000m, Eps: 11.60m),
        ["AMZN"]  = new("AMZN",  "Amazon.com Inc.",       "NASDAQ", 196.40m,-0.90m, -0.46m,  18_400_000, 2_050_000_000_000m, DateTime.UtcNow,
                       Open: 197.20m, High: 198.10m, Low: 195.80m, PreviousClose: 197.30m,
                       Week52High: 201.20m, Week52Low: 151.61m, PeRatio: 42.3m, DividendYield: null, AvgVolume: 16_000_000m, Eps: 4.64m),
        ["META"]  = new("META",  "Meta Platforms",        "NASDAQ", 512.30m, 8.40m,  1.67m,  15_600_000, 1_310_000_000_000m, DateTime.UtcNow,
                       Open: 508.00m, High: 514.50m, Low: 507.20m, PreviousClose: 503.90m,
                       Week52High: 531.49m, Week52Low: 353.00m, PeRatio: 24.8m, DividendYield: 0.0034m, AvgVolume: 14_000_000m, Eps: 20.63m),
        ["GOOGL"] = new("GOOGL", "Alphabet Inc.",         "NASDAQ", 171.80m, 1.20m,  0.70m,  19_200_000, 2_140_000_000_000m, DateTime.UtcNow,
                       Open: 170.90m, High: 172.50m, Low: 170.30m, PreviousClose: 170.60m,
                       Week52High: 191.75m, Week52Low: 130.67m, PeRatio: 23.5m, DividendYield: null, AvgVolume: 17_000_000m, Eps: 7.30m),
        ["VNM"]   = new("VNM",   "Vietnam Dairy",         "HOSE",  78500m,  -952m, -1.20m,   3_200_000,   138_000_000_000m, DateTime.UtcNow,
                       Open: 79200m, High: 79800m, Low: 78100m, PreviousClose: 79452m,
                       Week52High: 95000m, Week52Low: 68000m, PeRatio: 18.2m, DividendYield: 0.035m, AvgVolume: 2_800_000m, Eps: 4310m),
        ["VIC"]   = new("VIC",   "Vingroup JSC",         "HOSE",  42100m,   320m,  0.77m,   2_100_000,    92_000_000_000m, DateTime.UtcNow,
                       Open: 41900m, High: 42500m, Low: 41800m, PreviousClose: 41780m,
                       Week52High: 52000m, Week52Low: 35000m, PeRatio: 22.1m, DividendYield: null, AvgVolume: 1_800_000m, Eps: 1905m),
        ["HPG"]   = new("HPG",   "Hoa Phat Group",       "HOSE",  28400m,   480m,  1.72m,   5_800_000,    78_000_000_000m, DateTime.UtcNow,
                       Open: 28200m, High: 28600m, Low: 28100m, PreviousClose: 27920m,
                       Week52High: 35000m, Week52Low: 22000m, PeRatio: 14.8m, DividendYield: 0.016m, AvgVolume: 4_900_000m, Eps: 1920m),
        ["FPT"]   = new("FPT",   "FPT Corp.",            "HOSE", 145600m, 1200m,  0.83m,   4_200_000,    86_000_000_000m, DateTime.UtcNow,
                       Open: 144800m, High: 146200m, Low: 144000m, PreviousClose: 144400m,
                       Week52High: 168000m, Week52Low: 102000m, PeRatio: 27.4m, DividendYield: 0.022m, AvgVolume: 3_500_000m, Eps: 5310m),
        ["TCB"]   = new("TCB",   "Techcombank",          "HOSE",  24800m,   180m,  0.73m,   8_900_000,    92_000_000_000m, DateTime.UtcNow,
                       Open: 24700m, High: 24950m, Low: 24600m, PreviousClose: 24620m,
                       Week52High: 31000m, Week52Low: 19000m, PeRatio: 8.9m, DividendYield: 0.009m, AvgVolume: 7_200_000m, Eps: 2780m),
        ["MWG"]   = new("MWG",   "Mobile World Inv.",    "HOSE",  51200m,  -280m, -0.54m,   1_800_000,    48_000_000_000m, DateTime.UtcNow,
                       Open: 51400m, High: 51600m, Low: 51000m, PreviousClose: 51480m,
                       Week52High: 65000m, Week52Low: 42000m, PeRatio: 12.6m, DividendYield: 0.013m, AvgVolume: 1_500_000m, Eps: 4060m),
    };

    public StockService(HttpClient http, ILogger<StockService> logger)
    {
        _http = http;
        _logger = logger;
    }

    public async Task<IEnumerable<StockDto>> GetStocksAsync(string? exchange = null, int page = 1, int pageSize = 20)
    {
        var symbolsToFetch = FallbackStocks.Keys.ToList();

        // Use cascading data provider (Finnhub → AlphaVantage → Yahoo → mock)
        var dataProvider = new StockDataProvider(_http, NullLogger<StockDataProvider>.Instance);
        var liveResults = await dataProvider.FetchBatchAsync(symbolsToFetch);

        IEnumerable<StockDto> allStocks = liveResults.Count > 0
            ? liveResults.Values
            : FallbackStocks.Values;

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

        return allStocks
            .Skip((page - 1) * pageSize)
            .Take(pageSize);
    }

    public async Task<StockDto?> GetStockQuoteAsync(string symbol)
    {
        // Use cascading data provider
        var dataProvider = new StockDataProvider(_http, NullLogger<StockDataProvider>.Instance);
        var live = await dataProvider.FetchSingleAsync(symbol);

        if (live != null) return live;

        // Fallback to static data
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

            decimal? TryDecimal(JsonElement el, string prop)
                => el.TryGetProperty(prop, out var p) && p.ValueKind == JsonValueKind.Number ? p.GetDecimal() : null;

            var price           = q.GetProperty("regularMarketPrice").GetDecimal();
            var change          = q.TryGetProperty("regularMarketChange", out var chProp) ? chProp.GetDecimal() : 0;
            var changePercent   = q.TryGetProperty("regularMarketChangePercent", out var cpProp) ? cpProp.GetDecimal() : 0;
            var volume          = q.TryGetProperty("regularMarketVolume", out var volProp) ? volProp.GetInt64() : 0L;
            var marketCap       = q.TryGetProperty("marketCap", out var mcProp) && mcProp.ValueKind == JsonValueKind.Number ? mcProp.GetDecimal() : (decimal?)null;
            var exchange        = q.TryGetProperty("exchange", out var exProp) ? exProp.GetString() ?? "NASDAQ" : "NASDAQ";
            var name            = q.TryGetProperty("shortName", out var nProp) ? nProp.GetString() ?? symbol : symbol;
            var currency        = q.TryGetProperty("currency", out var curProp) ? curProp.GetString() ?? "USD" : "USD";

            // Extended fundamentals
            var open           = TryDecimal(q, "regularMarketOpen");
            var dayHigh       = TryDecimal(q, "regularMarketDayHigh");
            var dayLow        = TryDecimal(q, "regularMarketDayLow");
            var prevClose     = TryDecimal(q, "regularMarketPreviousClose");
            var week52High    = TryDecimal(q, "fiftyTwoWeekHigh");
            var week52Low     = TryDecimal(q, "fiftyTwoWeekLow");
            var peRatio        = TryDecimal(q, "trailingPE");
            var divYield       = TryDecimal(q, "dividendYield");
            var avgVolume      = q.TryGetProperty("averageAnalystRating", out _) != false
                                     ? TryDecimal(q, "averageVolume") ?? TryDecimal(q, "averageVolume10Day")
                                     : null;
            var eps           = TryDecimal(q, "epsTrailingTwelveMonths") ?? TryDecimal(q, "epsCurrentForward");

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
                DateTime.UtcNow,
                Open: open,
                High: dayHigh,
                Low: dayLow,
                PreviousClose: prevClose,
                Week52High: week52High,
                Week52Low: week52Low,
                PeRatio: peRatio,
                DividendYield: divYield,
                AvgVolume: avgVolume,
                Eps: eps
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
