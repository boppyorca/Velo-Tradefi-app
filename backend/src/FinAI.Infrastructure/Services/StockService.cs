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

    // ── All tracked symbols (same as SymbolMap) used for data fetching ──
    // This list drives which symbols are requested from live/cascading providers.
    private static readonly string[] AllTrackedSymbols = SymbolMap.Keys.ToArray();

    private static readonly Dictionary<string, StockDto> FallbackStocks = new(StringComparer.OrdinalIgnoreCase)
    {
        // US NASDAQ Stocks
        ["AAPL"]  = new("AAPL",  "Apple Inc.",           "NASDAQ", 192.10m,  1.52m,  0.80m,  58_230_000, 2_980_000_000_000m, DateTime.UtcNow,
                       Open: 191.20m, High: 193.40m, Low: 190.80m, PreviousClose: 190.58m,
                       Week52High: 199.62m, Week52Low: 164.08m, PeRatio: 28.5m, DividendYield: 0.0044m, AvgVolume: 52_000_000m, Eps: 6.75m),
        ["NVDA"]  = new("NVDA",  "NVIDIA Corp.",          "NASDAQ", 135.21m,  3.17m,  2.40m,  42_100_000, 3_320_000_000_000m, DateTime.UtcNow,
                       Open: 133.00m, High: 136.80m, Low: 132.50m, PreviousClose: 132.04m,
                       Week52High: 152.89m, Week52Low: 47.32m, PeRatio: 65.2m, DividendYield: 0.0003m, AvgVolume: 38_000_000m, Eps: 2.07m),
        ["TSLA"]  = new("TSLA",  "Tesla Inc.",            "NASDAQ", 248.50m, -1.25m, -0.50m,  31_800_000,   792_000_000_000m, DateTime.UtcNow,
                       Open: 250.10m, High: 251.80m, Low: 247.20m, PreviousClose: 249.75m,
                       Week52High: 299.29m, Week52Low: 138.80m, PeRatio: 62.1m, DividendYield: null, AvgVolume: 28_000_000m, Eps: 4.00m),
        ["MSFT"]  = new("MSFT",  "Microsoft Corp.",       "NASDAQ", 415.20m,  2.80m,  0.68m,  22_100_000, 3_090_000_000_000m, DateTime.UtcNow,
                       Open: 413.50m, High: 416.20m, Low: 412.80m, PreviousClose: 412.40m,
                       Week52High: 468.35m, Week52Low: 349.67m, PeRatio: 35.8m, DividendYield: 0.0072m, AvgVolume: 20_000_000m, Eps: 11.60m),
        ["AMZN"]  = new("AMZN",  "Amazon.com Inc.",       "NASDAQ", 196.40m, -0.90m, -0.46m,  18_400_000, 2_050_000_000_000m, DateTime.UtcNow,
                       Open: 197.20m, High: 198.10m, Low: 195.80m, PreviousClose: 197.30m,
                       Week52High: 201.20m, Week52Low: 151.61m, PeRatio: 42.3m, DividendYield: null, AvgVolume: 16_000_000m, Eps: 4.64m),
        ["META"]  = new("META",  "Meta Platforms",        "NASDAQ", 512.30m,  8.40m,  1.67m,  15_600_000, 1_310_000_000_000m, DateTime.UtcNow,
                       Open: 508.00m, High: 514.50m, Low: 507.20m, PreviousClose: 503.90m,
                       Week52High: 531.49m, Week52Low: 353.00m, PeRatio: 24.8m, DividendYield: 0.0034m, AvgVolume: 14_000_000m, Eps: 20.63m),
        ["GOOGL"] = new("GOOGL", "Alphabet Inc.",         "NASDAQ", 171.80m,  1.20m,  0.70m,  19_200_000, 2_140_000_000_000m, DateTime.UtcNow,
                       Open: 170.90m, High: 172.50m, Low: 170.30m, PreviousClose: 170.60m,
                       Week52High: 191.75m, Week52Low: 130.67m, PeRatio: 23.5m, DividendYield: null, AvgVolume: 17_000_000m, Eps: 7.30m),
        ["GOOG"]  = new("GOOG",  "Alphabet Inc.",         "NASDAQ", 172.50m,  1.40m,  0.82m,  17_800_000, 2_140_000_000_000m, DateTime.UtcNow,
                       Open: 171.50m, High: 173.20m, Low: 170.90m, PreviousClose: 171.10m,
                       Week52High: 191.41m, Week52Low: 130.21m, PeRatio: 23.6m, DividendYield: null, AvgVolume: 16_500_000m, Eps: 7.28m),
        ["NFLX"]  = new("NFLX",  "Netflix Inc.",          "NASDAQ", 628.40m, 12.30m,  2.00m,   5_200_000,   274_000_000_000m, DateTime.UtcNow,
                       Open: 620.00m, High: 631.50m, Low: 618.80m, PreviousClose: 616.10m,
                       Week52High: 700.99m, Week52Low: 344.73m, PeRatio: 44.2m, DividendYield: null, AvgVolume: 4_500_000m, Eps: 14.22m),
        ["AMD"]   = new("AMD",   "Advanced Micro Devices", "NASDAQ", 162.80m,  3.50m,  2.20m,  38_500_000,   263_000_000_000m, DateTime.UtcNow,
                       Open: 160.20m, High: 164.30m, Low: 159.80m, PreviousClose: 159.30m,
                       Week52High: 227.30m, Week52Low: 93.12m, PeRatio: 119.8m, DividendYield: null, AvgVolume: 35_000_000m, Eps: 1.36m),
        ["INTC"]  = new("INTC",  "Intel Corp.",           "NASDAQ",  22.40m, -0.30m, -1.32m,  42_000_000,    95_000_000_000m, DateTime.UtcNow,
                       Open:  22.80m, High:  23.10m, Low:  22.15m, PreviousClose:  22.70m,
                       Week52High:  46.52m, Week52Low:  18.51m, PeRatio: null, DividendYield: null, AvgVolume: 38_000_000m, Eps: -0.40m),
        ["IBM"]   = new("IBM",   "IBM Corp.",             "NASDAQ", 188.60m,  1.20m,  0.64m,   5_800_000,   174_000_000_000m, DateTime.UtcNow,
                       Open: 187.20m, High: 189.50m, Low: 186.80m, PreviousClose: 187.40m,
                       Week52High: 207.87m, Week52Low: 137.14m, PeRatio: 22.1m, DividendYield: 0.036m, AvgVolume: 5_000_000m, Eps: 8.54m),
        ["DIS"]   = new("DIS",   "Walt Disney Co.",        "NASDAQ", 112.40m, -1.80m, -1.58m,  11_200_000,   205_000_000_000m, DateTime.UtcNow,
                       Open: 114.00m, High: 114.80m, Low: 111.50m, PreviousClose: 114.20m,
                       Week52High: 123.74m, Week52Low: 78.73m, PeRatio: 38.5m, DividendYield: null, AvgVolume: 10_000_000m, Eps: 2.92m),
        ["PYPL"]  = new("PYPL",  "PayPal Holdings",       "NASDAQ",  62.80m,  0.40m,  0.64m,  10_500_000,    67_000_000_000m, DateTime.UtcNow,
                       Open:  62.20m, High:  63.50m, Low:  61.80m, PreviousClose:  62.40m,
                       Week52High:  76.54m, Week52Low:  50.25m, PeRatio: 17.2m, DividendYield: null, AvgVolume: 9_000_000m, Eps: 3.65m),
        ["UBER"]  = new("UBER",  "Uber Technologies",    "NASDAQ",  68.40m,  1.20m,  1.79m,  15_200_000,   142_000_000_000m, DateTime.UtcNow,
                       Open:  67.00m, High:  69.20m, Low:  66.80m, PreviousClose:  67.20m,
                       Week52High:  78.00m, Week52Low:  41.90m, PeRatio: 76.0m, DividendYield: null, AvgVolume: 14_000_000m, Eps: 0.90m),
        ["COIN"]  = new("COIN",  "Coinbase Global",       "NASDAQ", 168.40m, -4.20m, -2.43m,   8_400_000,    43_000_000_000m, DateTime.UtcNow,
                       Open: 172.00m, High: 173.80m, Low: 166.20m, PreviousClose: 172.60m,
                       Week52High: 283.48m, Week52Low: 115.30m, PeRatio: 28.4m, DividendYield: null, AvgVolume: 7_500_000m, Eps: 5.93m),
        // US NYSE Stocks
        ["JPM"]   = new("JPM",   "JPMorgan Chase",       "NYSE",   202.30m,  2.10m,  1.05m,   8_800_000,   582_000_000_000m, DateTime.UtcNow,
                       Open: 200.50m, High: 203.80m, Low: 200.10m, PreviousClose: 200.20m,
                       Week52High: 228.30m, Week52Low: 149.19m, PeRatio: 12.8m, DividendYield: 0.022m, AvgVolume: 8_000_000m, Eps: 15.80m),
        ["BAC"]   = new("BAC",   "Bank of America",       "NYSE",    36.80m,  0.40m,  1.10m,  35_200_000,   292_000_000_000m, DateTime.UtcNow,
                       Open:  36.30m, High:  37.10m, Low:  36.20m, PreviousClose:  36.40m,
                       Week52High:  44.44m, Week52Low:  24.96m, PeRatio: 14.2m, DividendYield: 0.024m, AvgVolume: 32_000_000m, Eps: 2.59m),
        ["GS"]    = new("GS",    "Goldman Sachs",         "NYSE",   498.20m,  4.80m,  0.97m,   2_400_000,   167_000_000_000m, DateTime.UtcNow,
                       Open: 494.00m, High: 500.50m, Low: 493.20m, PreviousClose: 493.40m,
                       Week52High: 542.09m, Week52Low: 305.87m, PeRatio: 14.6m, DividendYield: 0.025m, AvgVolume: 2_200_000m, Eps: 34.14m),
        ["V"]     = new("V",     "Visa Inc.",              "NYSE",   278.40m,  2.20m,  0.80m,   5_800_000,   572_000_000_000m, DateTime.UtcNow,
                       Open: 276.50m, High: 279.80m, Low: 276.00m, PreviousClose: 276.20m,
                       Week52High: 290.96m, Week52Low: 227.78m, PeRatio: 30.4m, DividendYield: 0.0077m, AvgVolume: 5_200_000m, Eps: 9.16m),
        ["MA"]    = new("MA",    "Mastercard Inc.",         "NYSE",   482.60m,  3.40m,  0.71m,   3_200_000,   451_000_000_000m, DateTime.UtcNow,
                       Open: 479.80m, High: 484.50m, Low: 479.20m, PreviousClose: 479.20m,
                       Week52High: 498.11m, Week52Low: 392.45m, PeRatio: 37.2m, DividendYield: 0.0052m, AvgVolume: 2_800_000m, Eps: 12.97m),
        ["WMT"]   = new("WMT",   "Walmart Inc.",          "NYSE",    65.20m,  0.30m,  0.46m,  12_800_000,   524_000_000_000m, DateTime.UtcNow,
                       Open:  64.90m, High:  65.80m, Low:  64.70m, PreviousClose:  64.90m,
                       Week52High:  71.93m, Week52Low:  45.56m, PeRatio: 28.9m, DividendYield: 0.0119m, AvgVolume: 11_500_000m, Eps: 2.26m),
        ["JNJ"]   = new("JNJ",   "Johnson & Johnson",     "NYSE",   158.40m, -1.20m, -0.75m,   7_200_000,   383_000_000_000m, DateTime.UtcNow,
                       Open: 159.80m, High: 160.20m, Low: 157.80m, PreviousClose: 159.60m,
                       Week52High: 168.14m, Week52Low: 143.13m, PeRatio: 22.8m, DividendYield: 0.030m, AvgVolume: 6_500_000m, Eps: 6.95m),
        ["UNH"]   = new("UNH",   "UnitedHealth Group",   "NYSE",   518.40m, -3.80m, -0.73m,   3_400_000,   478_000_000_000m, DateTime.UtcNow,
                       Open: 521.80m, High: 523.00m, Low: 516.20m, PreviousClose: 522.20m,
                       Week52High: 630.73m, Week52Low: 436.38m, PeRatio: 32.1m, DividendYield: 0.0142m, AvgVolume: 3_000_000m, Eps: 16.15m),
        // VN HOSE Stocks
        ["VNM"]   = new("VNM",   "Vietnam Dairy",         "HOSE",   78500m,  -952m, -1.20m,   3_200_000,   138_000_000_000m, DateTime.UtcNow,
                       Open: 79200m, High: 79800m, Low: 78100m, PreviousClose: 79452m,
                       Week52High: 95000m, Week52Low: 68000m, PeRatio: 18.2m, DividendYield: 0.035m, AvgVolume: 2_800_000m, Eps: 4310m),
        ["VIC"]   = new("VIC",   "Vingroup JSC",          "HOSE",   42100m,   320m,  0.77m,   2_100_000,    92_000_000_000m, DateTime.UtcNow,
                       Open: 41900m, High: 42500m, Low: 41800m, PreviousClose: 41780m,
                       Week52High: 52000m, Week52Low: 35000m, PeRatio: 22.1m, DividendYield: null, AvgVolume: 1_800_000m, Eps: 1905m),
        ["HPG"]   = new("HPG",   "Hoa Phat Group",        "HOSE",   28400m,   480m,  1.72m,   5_800_000,    78_000_000_000m, DateTime.UtcNow,
                       Open: 28200m, High: 28600m, Low: 28100m, PreviousClose: 27920m,
                       Week52High: 35000m, Week52Low: 22000m, PeRatio: 14.8m, DividendYield: 0.016m, AvgVolume: 4_900_000m, Eps: 1920m),
        ["VHM"]   = new("VHM",   "Vinhomes JSC",          "HOSE",   41200m,   240m,  0.59m,   4_200_000,    85_000_000_000m, DateTime.UtcNow,
                       Open: 41000m, High: 41500m, Low: 40900m, PreviousClose: 40960m,
                       Week52High: 53000m, Week52Low: 32000m, PeRatio: 8.4m, DividendYield: null, AvgVolume: 3_500_000m, Eps: 4900m),
        ["MSN"]   = new("MSN",   "Masan Group",           "HOSE",   72000m,   480m,  0.67m,   2_800_000,    65_000_000_000m, DateTime.UtcNow,
                       Open: 71600m, High: 72500m, Low: 71400m, PreviousClose: 71520m,
                       Week52High: 90000m, Week52Low: 58000m, PeRatio: 12.6m, DividendYield: null, AvgVolume: 2_400_000m, Eps: 5714m),
        ["VRE"]   = new("VRE",   "Vincom Retail",          "HOSE",   22000m,   180m,  0.82m,   1_600_000,    38_000_000_000m, DateTime.UtcNow,
                       Open: 21850m, High: 22200m, Low: 21800m, PreviousClose: 21820m,
                       Week52High: 30000m, Week52Low: 18000m, PeRatio: 14.2m, DividendYield: 0.020m, AvgVolume: 1_400_000m, Eps: 1550m),
        ["FPT"]   = new("FPT",   "FPT Corp.",             "HOSE",  145600m,  1200m,  0.83m,   4_200_000,    86_000_000_000m, DateTime.UtcNow,
                       Open: 144800m, High: 146200m, Low: 144000m, PreviousClose: 144400m,
                       Week52High: 168000m, Week52Low: 102000m, PeRatio: 27.4m, DividendYield: 0.022m, AvgVolume: 3_500_000m, Eps: 5310m),
        ["MWG"]   = new("MWG",   "Mobile World Inv.",      "HOSE",   51200m,  -280m, -0.54m,   1_800_000,    48_000_000_000m, DateTime.UtcNow,
                       Open: 51400m, High: 51600m, Low: 51000m, PreviousClose: 51480m,
                       Week52High: 65000m, Week52Low: 42000m, PeRatio: 12.6m, DividendYield: 0.013m, AvgVolume: 1_500_000m, Eps: 4060m),
        ["PNJ"]   = new("PNJ",   "Phu Nhuan Jewelry",    "HOSE",   82400m,   640m,  0.78m,   1_400_000,    38_000_000_000m, DateTime.UtcNow,
                       Open: 81900m, High: 82800m, Low: 81700m, PreviousClose: 81760m,
                       Week52High: 98000m, Week52Low: 72000m, PeRatio: 15.2m, DividendYield: 0.018m, AvgVolume: 1_200_000m, Eps: 5420m),
        ["TCB"]   = new("TCB",   "Techcombank",           "HOSE",   24800m,   180m,  0.73m,   8_900_000,    92_000_000_000m, DateTime.UtcNow,
                       Open: 24700m, High: 24950m, Low: 24600m, PreviousClose: 24620m,
                       Week52High: 31000m, Week52Low: 19000m, PeRatio: 8.9m, DividendYield: 0.009m, AvgVolume: 7_200_000m, Eps: 2780m),
        ["ACB"]   = new("ACB",   "Asia Commercial Bank",   "HOSE",   22400m,  -160m, -0.71m,   7_200_000,    58_000_000_000m, DateTime.UtcNow,
                       Open: 22550m, High: 22600m, Low: 22300m, PreviousClose: 22560m,
                       Week52High: 28000m, Week52Low: 19200m, PeRatio: 7.8m, DividendYield: null, AvgVolume: 6_500_000m, Eps: 2870m),
        ["VPB"]   = new("VPB",   "VPBank",               "HOSE",   19800m,   120m,  0.61m,   5_800_000,    62_000_000_000m, DateTime.UtcNow,
                       Open: 19700m, High: 19950m, Low: 19650m, PreviousClose: 19680m,
                       Week52High: 25000m, Week52Low: 15800m, PeRatio: 9.2m, DividendYield: null, AvgVolume: 5_200_000m, Eps: 2150m),
        ["CTG"]   = new("CTG",   "VietinBank",             "HOSE",   34200m,   220m,  0.65m,   6_400_000,    92_000_000_000m, DateTime.UtcNow,
                       Open: 34000m, High: 34400m, Low: 33900m, PreviousClose: 33980m,
                       Week52High: 42000m, Week52Low: 28000m, PeRatio: 11.4m, DividendYield: 0.018m, AvgVolume: 5_800_000m, Eps: 3000m),
        ["MBB"]   = new("MBB",   "Military Bank",          "HOSE",   18200m,    80m,  0.44m,   4_800_000,    52_000_000_000m, DateTime.UtcNow,
                       Open: 18150m, High: 18300m, Low: 18100m, PreviousClose: 18120m,
                       Week52High: 23000m, Week52Low: 15200m, PeRatio: 8.6m, DividendYield: 0.020m, AvgVolume: 4_200_000m, Eps: 2116m),
        ["TPB"]   = new("TPB",   "TPBank",                 "HOSE",   15800m,   100m,  0.64m,   2_400_000,    28_000_000_000m, DateTime.UtcNow,
                       Open: 15720m, High: 15900m, Low: 15700m, PreviousClose: 15700m,
                       Week52High: 19500m, Week52Low: 12800m, PeRatio: 12.8m, DividendYield: null, AvgVolume: 2_000_000m, Eps: 1234m),
        ["STB"]   = new("STB",   "Sacombank",              "HOSE",   28000m,   320m,  1.16m,   5_600_000,    48_000_000_000m, DateTime.UtcNow,
                       Open: 27750m, High: 28200m, Low: 27700m, PreviousClose: 27680m,
                       Week52High: 34000m, Week52Low: 22000m, PeRatio: 10.2m, DividendYield: null, AvgVolume: 5_000_000m, Eps: 2745m),
        ["SSI"]   = new("SSI",   "SSI Securities Corp.",   "HOSE",   35000m,   480m,  1.39m,   6_200_000,    58_000_000_000m, DateTime.UtcNow,
                       Open: 34600m, High: 35200m, Low: 34550m, PreviousClose: 34520m,
                       Week52High: 44000m, Week52Low: 27000m, PeRatio: 18.4m, DividendYield: 0.010m, AvgVolume: 5_500_000m, Eps: 1902m),
        ["VND"]   = new("VND",   "VNDirect Securities",   "HOSE",   12500m,    90m,  0.72m,   3_800_000,    32_000_000_000m, DateTime.UtcNow,
                       Open: 12430m, High: 12600m, Low: 12400m, PreviousClose: 12410m,
                       Week52High: 16000m, Week52Low: 9800m, PeRatio: 16.8m, DividendYield: 0.014m, AvgVolume: 3_400_000m, Eps: 744m),
        ["HCM"]   = new("HCM",   "HCM City Securities",  "HOSE",   28000m,   340m,  1.23m,   2_800_000,    28_000_000_000m, DateTime.UtcNow,
                       Open: 27750m, High: 28200m, Low: 27700m, PreviousClose: 27660m,
                       Week52High: 36000m, Week52Low: 21000m, PeRatio: 15.6m, DividendYield: 0.012m, AvgVolume: 2_500_000m, Eps: 1795m),
        ["BID"]   = new("BID",   "BIDV",                  "HOSE",   48500m,   320m,  0.66m,   4_200_000,   125_000_000_000m, DateTime.UtcNow,
                       Open: 48200m, High: 48800m, Low: 48150m, PreviousClose: 48180m,
                       Week52High: 58000m, Week52Low: 38000m, PeRatio: 13.2m, DividendYield: 0.016m, AvgVolume: 3_800_000m, Eps: 3674m),
    };

    public StockService(HttpClient http, ILogger<StockService> logger)
    {
        _http = http;
        _logger = logger;
    }

    public async Task<IEnumerable<StockDto>> GetStocksAsync(string? exchange = null, int page = 1, int pageSize = 20)
    {
        // Fetch ALL tracked symbols from cascading providers
        // (Finnhub → AlphaVantage → Yahoo → mock fallback)
        var dataProvider = new StockDataProvider(_http, NullLogger<StockDataProvider>.Instance);
        var liveResults = await dataProvider.FetchBatchAsync(AllTrackedSymbols);

        // Merge: use live data where available, fill missing with fallback data
        var allStocks = new Dictionary<string, StockDto>(StringComparer.OrdinalIgnoreCase);
        foreach (var kvp in FallbackStocks)
            allStocks[kvp.Key] = kvp.Value;
        foreach (var kvp in liveResults)
            allStocks[kvp.Key] = kvp.Value;

        // Filter by exchange
        if (!string.IsNullOrWhiteSpace(exchange))
        {
            var exchangeUpper = exchange.ToUpperInvariant();
            allStocks = allStocks
                .Where(kvp => exchangeUpper switch
                {
                    "VN" => kvp.Value.Exchange is "HOSE" or "HNX",
                    "US" => kvp.Value.Exchange is "NASDAQ" or "NYSE",
                    _    => kvp.Value.Exchange.Equals(exchangeUpper, StringComparison.OrdinalIgnoreCase)
                })
                .ToDictionary(kvp => kvp.Key, kvp => kvp.Value, StringComparer.OrdinalIgnoreCase);
        }

        return allStocks.Values
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
        // Search across ALL tracked symbols (not just FallbackStocks)
        var results = SymbolMap
            .Where(kvp => kvp.Key.ToLowerInvariant().Contains(q) ||
                          kvp.Value.Name.ToLowerInvariant().Contains(q))
            .Select(kvp =>
            {
                var fallback = FallbackStocks.GetValueOrDefault(kvp.Key);
                // Return fallback data if available, otherwise a minimal dto
                if (fallback != null) return fallback;
                return new StockDto(kvp.Key, kvp.Value.Name, kvp.Value.Exchange,
                    0m, 0m, 0m, 0L, null, DateTime.UtcNow);
            })
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
