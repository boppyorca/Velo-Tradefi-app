namespace FinAI.Infrastructure.Services;

using System.Net.Http;
using System.Text.Json;
using FinAI.Core.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

/// <summary>
/// Cascading stock data provider that tries multiple free APIs in sequence:
/// 1. Finnhub   — real-time US quotes, 60 req/min (free tier), no API key needed for demo
/// 2. AlphaVantage — free 25 req/day, good quality
/// 3. Yahoo Finance — last resort, often requires cookies now
/// 4. Mock data — always works (for demo/dev)
/// </summary>
public class StockDataProvider
{
    private readonly HttpClient _http;
    private readonly ILogger<StockDataProvider> _logger;

    // API keys — set via environment variables
    private string? FinnhubKey => Environment.GetEnvironmentVariable("FINNHUB_API_KEY");
    private string? AlphaVantageKey => Environment.GetEnvironmentVariable("ALPHAVANTAGE_API_KEY");
    private string? ItickKey => Environment.GetEnvironmentVariable("ITICK_API_KEY");

    // VN stocks tracked by our app (HOSE exchange)
    private static readonly HashSet<string> VnSymbols = new(StringComparer.OrdinalIgnoreCase)
    {
        "VNM", "VIC", "HPG", "VHM", "MSN", "VRE", "FPT", "MWG",
        "PNJ", "TCB", "ACB", "VPB", "CTG", "MBB", "TPB", "STB",
        "SSI", "VND", "HCM", "BID",
    };

    // Symbol → (Finnhub symbol, AlphaVantage symbol) mapping
    // VN stocks: use iTick (primary), Finnhub (secondary for VNM/ACB/VRE), Yahoo (last resort)
    // US stocks: Finnhub (primary), AlphaVantage (backup)
    private static readonly Dictionary<string, (string? Finnhub, string? AlphaVantage)> SymbolAliases = new(StringComparer.OrdinalIgnoreCase)
    {
        // VN Stocks — use iTick primary, Finnhub secondary for VNM/ACB/VRE
        ["VNM"] = ("VNM",    ""),   // iTick: 61,200 VND  ✓ | Finnhub: $16.42 (secondary)
        ["VIC"] = ("",       ""),
        ["HPG"] = ("",       ""),
        ["VHM"] = ("",       ""),
        ["MSN"] = ("",       ""),
        ["VRE"] = ("VRE",   ""),   // iTick ✓ | Finnhub: $18.93
        ["FPT"] = ("",       ""),
        ["MWG"] = ("",       ""),
        ["PNJ"] = ("",       ""),
        ["TCB"] = ("",       ""),
        ["ACB"] = ("ACB",   ""),   // iTick ✓ | Finnhub: $3.31
        ["VPB"] = ("",       ""),
        ["CTG"] = ("",       ""),
        ["MBB"] = ("",       ""),
        ["TPB"] = ("",       ""),
        ["STB"] = ("",       ""),
        ["SSI"] = ("",       ""),
        ["VND"] = ("",       ""),
        ["HCM"] = ("",       ""),
        ["BID"] = ("",       ""),
        // US Stocks — same symbol across all providers
    };

    public StockDataProvider(HttpClient http, ILogger<StockDataProvider> logger)
    {
        _http = http;
        _logger = logger;
    }

    // ── Cache prefix for VN stock prices (populated by background polling) ──
    private const string VnCachePrefix = "stock:vn:";
    private static readonly TimeSpan VnCacheTtl = TimeSpan.FromMinutes(5);

    /// <summary>
    /// Fetch a batch of stock quotes using cascading providers.
    /// Cascade order:
    ///   1. Finnhub      — US stocks (60 req/min free tier)
    ///   2. iTick        — VN stocks HOSE/HNX (5 req/min free tier, SKIPPED in batch mode)
    ///   3. AlphaVantage — US stocks backup (25 req/day free tier)
    ///   4. Yahoo Finance — last resort (often 401 without cookies)
    ///   5. Mock data    — always works (demo/dev)
    /// Batch mode: VN stocks use Redis cache (populated by background service).
    /// Single mode: VN stocks call iTick directly (with rate limiting).
    /// </summary>
    public async Task<Dictionary<string, StockDto>> FetchBatchAsync(
        IEnumerable<string> symbols,
        bool skipItick = true, // false only for single-stock fast path
        CancellationToken ct = default)
    {
        var symbolList = symbols.ToList();
        var results = new Dictionary<string, StockDto>(StringComparer.OrdinalIgnoreCase);

        // ── 1. Finnhub — US stocks ──
        if (!string.IsNullOrEmpty(FinnhubKey))
        {
            var usSymbols = symbolList.Where(s => !IsVnSymbol(s)).ToList();
            if (usSymbols.Count > 0)
            {
                var finnhubResults = await TryFinnhubBatchAsync(usSymbols, ct);
                foreach (var (sym, dto) in finnhubResults)
                    results[sym] = dto;
                if (finnhubResults.Count > 0)
                    _logger.LogDebug("Finnhub fetched {Count} US stocks", finnhubResults.Count);
            }
        }

        // ── 2. iTick — VN stocks (only in single-stock mode, not batch) ──
        if (!skipItick && !string.IsNullOrEmpty(ItickKey))
        {
            var vnSymbols = symbolList.Where(s => IsVnSymbol(s)).ToList();
            if (vnSymbols.Count > 0)
            {
                var itickResults = await TryItickBatchAsync(vnSymbols, ct);
                foreach (var (sym, dto) in itickResults)
                    results[sym] = dto;
                if (itickResults.Count > 0)
                    _logger.LogDebug("iTick fetched {Count} VN stocks", itickResults.Count);
            }
        }

        // ── 3. AlphaVantage — US stocks backup ──
        if (!string.IsNullOrEmpty(AlphaVantageKey))
        {
            var missing = symbolList.Where(s => !results.ContainsKey(s.ToUpperInvariant()) && !IsVnSymbol(s)).ToList();
            if (missing.Count > 0)
            {
                var avResults = await TryAlphaVantageBatchAsync(missing, ct);
                foreach (var (sym, dto) in avResults)
                    results[sym] = dto;
                if (avResults.Count > 0)
                    _logger.LogDebug("AlphaVantage fetched {Count} stocks", avResults.Count);
            }
        }

        // ── 4. Yahoo Finance — last resort ──
        var stillMissing = symbolList.Where(s => !results.ContainsKey(s.ToUpperInvariant())).ToList();
        if (stillMissing.Count > 0)
        {
            var yfResults = await TryYahooBatchAsync(stillMissing, ct);
            foreach (var (sym, dto) in yfResults)
                results[sym] = dto;

            if (yfResults.Count > 0)
                _logger.LogInformation("Yahoo Finance fetched {Count} stocks as fallback", yfResults.Count);
        }

        // ── 5. Fill remaining with mock data ──
        var finalMissing = symbolList.Where(s => !results.ContainsKey(s.ToUpperInvariant())).ToList();
        if (finalMissing.Count > 0)
        {
            foreach (var sym in finalMissing)
            {
                var key = sym.ToUpperInvariant();
                if (StockService.SymbolMap.TryGetValue(key, out var entry))
                {
                    results[key] = new StockDto(
                        key, entry.Name, entry.Exchange,
                        GetBaseMockPrice(key),
                        0m, 0m, 0L, null, DateTime.UtcNow);
                }
            }
            _logger.LogInformation("Filled {Count} stocks from mock data", finalMissing.Count);
        }

        return results;
    }

    /// <summary>
    /// Fetch a single stock quote using cascading providers (includes iTick for VN stocks).
    /// </summary>
    public async Task<StockDto?> FetchSingleAsync(string symbol, CancellationToken ct = default)
    {
        var batch = await FetchBatchAsync(new[] { symbol }, skipItick: false, ct);
        return batch.GetValueOrDefault(symbol.ToUpperInvariant());
    }

    // ── Finnhub implementation ────────────────────────────────────────────────

    // VN/USD exchange rate — approximate (VND per 1 USD)
    // In production this should come from an exchange rate API
    private const decimal UsdToVndRate = 25000m;

    private async Task<Dictionary<string, StockDto>> TryFinnhubBatchAsync(
        List<string> symbols, CancellationToken ct)
    {
        var results = new Dictionary<string, StockDto>(StringComparer.OrdinalIgnoreCase);

        // Finnhub supports: all US stocks directly, plus VNM/ACB/VRE for VN
        // VN stocks need USD→VND conversion
        var toFetch = symbols
            .Where(s => IsFinnhubSupported(s))
            .ToList();

        if (toFetch.Count == 0) return results;

        // Finnhub: one symbol per request. Run up to 30 in parallel (limit: 60/min)
        var tasks = toFetch.Take(30).Select(async sym =>
        {
            try
            {
                var finnhubSym = GetFinnhubSymbol(sym);
                var url = $"https://finnhub.io/api/v1/quote?symbol={finnhubSym}&token={FinnhubKey}";
                var response = await _http.GetAsync(url, ct);
                if (!response.IsSuccessStatusCode) return;

                using var doc = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
                var root = doc.RootElement;

                // Finnhub returns c=0 when no data available
                if (!root.TryGetProperty("c", out var cProp) || cProp.GetDouble() == 0) return;

                var priceUsd = (decimal)cProp.GetDouble();
                var changeUsd = root.TryGetProperty("d", out var dProp) ? (decimal)dProp.GetDouble() : 0m;
                var changePercent = root.TryGetProperty("dp", out var dpProp) ? (decimal)dpProp.GetDouble() : 0m;
                var highUsd = root.TryGetProperty("h", out var hProp) ? (decimal)hProp.GetDouble() : 0m;
                var lowUsd = root.TryGetProperty("l", out var lProp) ? (decimal)lProp.GetDouble() : 0m;
                var openUsd = root.TryGetProperty("o", out var oProp) ? (decimal)oProp.GetDouble() : 0m;
                var prevCloseUsd = root.TryGetProperty("pc", out var pcProp) ? (decimal)pcProp.GetDouble() : priceUsd - changeUsd;
                // volume not available in Finnhub quote endpoint

                var isVn = IsVnSymbol(sym);
                var (price, change, high, low, open, prevClose) = isVn
                    ? (priceUsd * UsdToVndRate,
                       changeUsd * UsdToVndRate,
                       highUsd * UsdToVndRate,
                       lowUsd * UsdToVndRate,
                       openUsd * UsdToVndRate,
                       prevCloseUsd * UsdToVndRate)
                    : (priceUsd, changeUsd, highUsd, lowUsd, openUsd, prevCloseUsd);

                var dto = new StockDto(
                    sym.ToUpperInvariant(),
                    GetSymbolName(sym),
                    GetSymbolExchange(sym),
                    Math.Round(price, 2),
                    Math.Round(change, 2),
                    Math.Round(changePercent, 2),
                    0L, // Finnhub quote doesn't include volume
                    null, DateTime.UtcNow,
                    Open: open > 0 ? Math.Round(open, 2) : null,
                    High: high > 0 ? Math.Round(high, 2) : null,
                    Low: low > 0 ? Math.Round(low, 2) : null,
                    PreviousClose: prevClose > 0 ? Math.Round(prevClose, 2) : null
                );

                lock (results)
                {
                    results[sym.ToUpperInvariant()] = dto;
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Finnhub failed for {Symbol}", sym);
            }
        });

        await Task.WhenAll(tasks);
        return results;
    }

    private bool IsFinnhubSupported(string symbol)
    {
        // US stocks always supported, VN stocks only if mapped in SymbolAliases
        if (!IsVnSymbol(symbol)) return true;
        return SymbolAliases.TryGetValue(symbol.ToUpperInvariant(), out var aliases) &&
               !string.IsNullOrEmpty(aliases.Finnhub);
    }

    private string GetFinnhubSymbol(string symbol)
    {
        if (SymbolAliases.TryGetValue(symbol.ToUpperInvariant(), out var aliases) &&
            !string.IsNullOrEmpty(aliases.Finnhub))
            return aliases.Finnhub;
        return symbol.ToUpperInvariant();
    }

    // ── iTick implementation — Vietnam stocks HOSE/HNX ─────────────────────────

    /// <summary>
    /// Fetches VN stocks via iTick API (https://api.itick.org/stock/quote).
    /// Free tier: 5 req/min. Response fields: s=symbol, ld=last price, o=open,
    /// h=high, l=low, ch=change, chp=change%, v=volume, tu=turnover.
    /// </summary>
    private async Task<Dictionary<string, StockDto>> TryItickBatchAsync(
        List<string> symbols, CancellationToken ct)
    {
        var results = new Dictionary<string, StockDto>(StringComparer.OrdinalIgnoreCase);

        // iTick free tier: 5 req/min — fetch sequentially to stay within limit
        foreach (var sym in symbols.Take(20))
        {
            try
            {
                var url = $"https://api.itick.org/stock/quote?region=VN&code={sym}";
                using var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.Add("Accept", "application/json");
                request.Headers.Add("Token", ItickKey!);

                var response = await _http.SendAsync(request, ct);
                if (!response.IsSuccessStatusCode) continue;

                using var doc = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
                var root = doc.RootElement;

                // iTick returns { code: 0, data: {...} }
                if (!root.TryGetProperty("code", out var codeProp) || codeProp.GetInt32() != 0) continue;
                if (!root.TryGetProperty("data", out var data) || data.ValueKind != JsonValueKind.Object) continue;

                // ld = last price, ch = change, chp = change%
                var price = data.TryGetProperty("ld", out var ldProp) && ldProp.ValueKind == JsonValueKind.Number
                    ? ldProp.GetDecimal() : 0m;
                if (price == 0) continue;

                var change = data.TryGetProperty("ch", out var chProp) && chProp.ValueKind == JsonValueKind.Number
                    ? chProp.GetDecimal() : 0m;
                var changePercent = data.TryGetProperty("chp", out var cpProp) && cpProp.ValueKind == JsonValueKind.Number
                    ? cpProp.GetDecimal() : 0m;
                var volume = data.TryGetProperty("v", out var volProp) && volProp.ValueKind == JsonValueKind.Number
                    ? volProp.GetDouble() : 0d;
                var turnover = data.TryGetProperty("tu", out var tuProp) && tuProp.ValueKind == JsonValueKind.Number
                    ? tuProp.GetDouble() : 0d;
                var marketCap = turnover > 0 && price > 0
                    ? (decimal?)(decimal)Math.Round(turnover * 1e6 / (double)price)
                    : null;

                results[sym.ToUpperInvariant()] = new StockDto(
                    sym.ToUpperInvariant(),
                    GetSymbolName(sym),
                    "HOSE",
                    Math.Round(price, 2),
                    Math.Round(change, 2),
                    Math.Round(changePercent, 2),
                    (long)volume,
                    marketCap,
                    DateTime.UtcNow,
                    Open: data.TryGetProperty("o", out var oProp) && oProp.ValueKind == JsonValueKind.Number
                        ? Math.Round(oProp.GetDecimal(), 2) : null,
                    High: data.TryGetProperty("h", out var hProp) && hProp.ValueKind == JsonValueKind.Number
                        ? Math.Round(hProp.GetDecimal(), 2) : null,
                    Low: data.TryGetProperty("l", out var lProp) && lProp.ValueKind == JsonValueKind.Number
                        ? Math.Round(lProp.GetDecimal(), 2) : null,
                    PreviousClose: price - change > 0
                        ? Math.Round(price - change, 2) : null
                );
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "iTick failed for {Symbol}", sym);
            }

            // iTick free tier: 5 req/min — 1 request every 13s
            // VN stocks: 20 symbols ÷ 5 per poll ≈ 4 poll cycles (≈2 min) to cover all
            await Task.Delay(13_000, ct);
        }

        return results;
    }

    // ── AlphaVantage implementation ──────────────────────────────────────────

    private async Task<Dictionary<string, StockDto>> TryAlphaVantageBatchAsync(
        List<string> symbols, CancellationToken ct)
    {
        var results = new Dictionary<string, StockDto>(StringComparer.OrdinalIgnoreCase);

        var avSymbols = symbols
            .Where(s => !IsVnSymbol(s))
            .ToList();

        if (avSymbols.Count == 0) return results;

        // AlphaVantage free tier: 25 requests/day, 5 req/min
        // We batch requests but still hit the limit quickly
        // Only fetch first 5 symbols to conserve API calls
        var toFetch = avSymbols.Take(5).ToList();

        var tasks = toFetch.Select(async sym =>
        {
            try
            {
                var url = $"https://www.alphavantage.co/query" +
                          $"?function=GLOBAL_QUOTE&symbol={sym}&apikey={AlphaVantageKey}";

                var response = await _http.GetAsync(url, ct);
                if (!response.IsSuccessStatusCode) return;

                using var doc = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
                var root = doc.RootElement;

                if (!root.TryGetProperty("Global Quote", out var gq) ||
                    gq.ValueKind != JsonValueKind.Object)
                {
                    // AlphaVantage returns {"Information": "..."} when rate limited
                    if (root.TryGetProperty("Information", out _))
                        _logger.LogWarning("AlphaVantage rate limited");
                    return;
                }

                static decimal? StrToDecimal(JsonElement el, string prop)
                {
                    if (!el.TryGetProperty(prop, out var p)) return null;
                    var s = p.GetString()?.Trim();
                    if (string.IsNullOrEmpty(s)) return null;
                    // Remove % sign from change percent
                    s = s.Replace("%", "");
                    return decimal.TryParse(s, out var v) ? v : null;
                }

                static long? StrToLong(JsonElement el, string prop)
                {
                    if (!el.TryGetProperty(prop, out var p)) return null;
                    var s = p.GetString()?.Trim();
                    return long.TryParse(s, out var v) ? v : null;
                }

                var price = StrToDecimal(gq, "05. price");
                if (price == null) return;

                var dto = new StockDto(
                    sym.ToUpperInvariant(),
                    GetSymbolName(sym),
                    GetSymbolExchange(sym),
                    price.Value,
                    StrToDecimal(gq, "09. change") ?? 0,
                    StrToDecimal(gq, "10. change percent") ?? 0,
                    StrToLong(gq, "06. volume") ?? 0,
                    null, // marketCap not in AlphaVantage quote
                    DateTime.UtcNow,
                    Open: StrToDecimal(gq, "02. open"),
                    High: StrToDecimal(gq, "03. high"),
                    Low: StrToDecimal(gq, "04. low"),
                    PreviousClose: StrToDecimal(gq, "08. previous close")
                );

                lock (results)
                {
                    results[sym.ToUpperInvariant()] = dto;
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "AlphaVantage failed for {Symbol}", sym);
            }
        });

        await Task.WhenAll(tasks);
        return results;
    }

    // ── Yahoo Finance (last resort) ──────────────────────────────────────────

    private async Task<Dictionary<string, StockDto>> TryYahooBatchAsync(
        List<string> symbols, CancellationToken ct)
    {
        var results = new Dictionary<string, StockDto>(StringComparer.OrdinalIgnoreCase);

        var batchStr = string.Join(",", symbols.Select(s => GetYahooTicker(s)));

        try
        {
            var url = $"https://query1.finance.yahoo.com/v7/finance/quote?symbols={batchStr}";

            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Add("User-Agent", "Mozilla/5.0 (compatible; FinAI-Poll/1.0)");
            request.Headers.Add("Accept", "application/json");

            var response = await _http.SendAsync(request, ct);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogDebug("Yahoo Finance returned {Status} for batch", response.StatusCode);
                return results;
            }

            using var doc = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
            var root = doc.RootElement;

            if (!root.TryGetProperty("quoteResponse", out var qr) ||
                !qr.TryGetProperty("result", out var quoteResults))
            {
                return results;
            }

            foreach (var quote in quoteResults.EnumerateArray())
            {
                try
                {
                    var sym = quote.TryGetProperty("symbol", out var s) ? s.GetString() ?? "" : "";
                    if (string.IsNullOrEmpty(sym)) continue;

                    var price = quote.TryGetProperty("regularMarketPrice", out var pp) && pp.ValueKind == JsonValueKind.Number
                        ? pp.GetDecimal() : 0m;
                    if (price == 0) continue;

                    decimal? TryDecimal(JsonElement el, string prop)
                    {
                        if (!el.TryGetProperty(prop, out var p) || p.ValueKind != JsonValueKind.Number)
                            return null;
                        var v = p.GetDecimal();
                        return v == 0 ? null : v;
                    }

                    long? TryLong(JsonElement el, string prop)
                    {
                        if (!el.TryGetProperty(prop, out var p) || p.ValueKind != JsonValueKind.Number)
                            return null;
                        return p.GetInt64();
                    }

                    var dto = new StockDto(
                        sym.ToUpperInvariant(),
                        GetSymbolName(sym),
                        GetSymbolExchange(sym),
                        price,
                        TryDecimal(quote, "regularMarketChange") ?? 0,
                        TryDecimal(quote, "regularMarketChangePercent") ?? 0,
                        TryLong(quote, "regularMarketVolume") ?? 0,
                        TryDecimal(quote, "marketCap"),
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
                        Eps: TryDecimal(quote, "epsTrailingTwwelveMonths") ??
                             TryDecimal(quote, "epsTrailingTwelveMonths")
                    );

                    results[sym.ToUpperInvariant()] = dto;
                }
                catch { /* skip malformed quotes */ }
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Yahoo Finance batch fetch failed");
        }

        return results;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private bool IsVnSymbol(string symbol)
        => VnSymbols.Contains(symbol.ToUpperInvariant());

    private string GetYahooTicker(string symbol)
    {
        // VN stocks need .VN suffix for Yahoo Finance
        if (IsVnSymbol(symbol)) return $"{symbol}.VN";
        return symbol.ToUpperInvariant();
    }

    private string GetSymbolName(string symbol)
    {
        // Match against the StockService static map
        return StockService.SymbolMap.TryGetValue(symbol.ToUpperInvariant(), out var entry)
            ? entry.Name
            : symbol;
    }

    private string GetSymbolExchange(string symbol)
    {
        // VN stocks are HOSE, US stocks are NASDAQ/NYSE
        return IsVnSymbol(symbol) ? "HOSE" : "NASDAQ";
    }

    // ── Mock data base prices ───────────────────────────────────────────────────

    private static readonly Dictionary<string, decimal> BaseMockPrices = new(StringComparer.OrdinalIgnoreCase)
    {
        // US (USD)
        ["AAPL"] = 192.10m, ["NVDA"] = 135.21m, ["TSLA"] = 248.50m,
        ["MSFT"] = 415.20m, ["AMZN"] = 196.40m, ["META"] = 512.30m,
        ["GOOGL"] = 171.80m, ["NFLX"] = 485.00m, ["AMD"] = 120.50m,
        ["INTC"] = 28.30m,   ["IBM"] = 185.00m,  ["DIS"] = 112.00m,
        ["PYPL"] = 62.00m,    ["UBER"] = 78.00m,   ["COIN"] = 145.00m,
        ["JPM"] = 198.00m,   ["BAC"] = 38.50m,    ["GS"] = 495.00m,
        ["V"] = 280.00m,     ["MA"] = 480.00m,    ["WMT"] = 165.00m,
        ["JNJ"] = 155.00m,   ["UNH"] = 520.00m,
        // VN (VND)
        ["VNM"] = 78500m, ["VIC"] = 42100m, ["HPG"] = 28400m,
        ["VHM"] = 38000m, ["MSN"] = 72000m, ["VRE"] = 22000m,
        ["FPT"] = 145600m, ["MWG"] = 51200m, ["PNJ"] = 98000m,
        ["TCB"] = 24800m, ["ACB"] = 22000m, ["VPB"] = 18500m,
        ["CTG"] = 32000m, ["MBB"] = 15500m, ["TPB"] = 17500m,
        ["STB"] = 28000m, ["SSI"] = 35000m, ["VND"] = 12500m,
        ["HCM"] = 28000m, ["BID"] = 48500m,
    };

    private static decimal GetBaseMockPrice(string symbol)
        => BaseMockPrices.TryGetValue(symbol.ToUpperInvariant(), out var p) ? p : 100m;
}
