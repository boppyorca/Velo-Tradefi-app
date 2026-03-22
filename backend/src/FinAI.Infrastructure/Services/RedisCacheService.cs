namespace FinAI.Infrastructure.Services;

using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

public interface IRedisCacheService
{
    Task<T?> GetAsync<T>(string key) where T : class;
    Task SetAsync<T>(string key, T value, TimeSpan? expiry = null) where T : class;
    Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiry = null) where T : class;
    Task RemoveAsync(string key);
    Task<bool> ExistsAsync(string key);
    Task SetStockCacheAsync(string symbol, object stockData, TimeSpan? expiry = null);
    Task<T?> GetStockCacheAsync<T>(string symbol) where T : class;
    Task InvalidateStockCacheAsync(string symbol);
    Task InvalidateMarketCacheAsync(string exchange);
}

public class RedisCacheService : IRedisCacheService
{
    private readonly IDistributedCache? _cache;
    private readonly ILogger<RedisCacheService> _logger;
    private readonly bool _isEnabled;

    // Cache TTLs
    private static readonly TimeSpan DefaultStockCacheTtl = TimeSpan.FromMinutes(15); // VN stocks
    private static readonly TimeSpan DefaultMemecoinCacheTtl = TimeSpan.FromSeconds(30);
    private static readonly TimeSpan DefaultPredictionCacheTtl = TimeSpan.FromHours(1);
    private static readonly TimeSpan DefaultMarketCacheTtl = TimeSpan.FromMinutes(5);

    // Key prefixes
    private const string StockPrefix = "stock:";
    private const string MarketPrefix = "market:";
    private const string PredictionPrefix = "prediction:";
    private const string MemecoinPrefix = "memecoin:";

    public RedisCacheService(IDistributedCache? cache, ILogger<RedisCacheService> logger)
    {
        _cache = cache;
        _logger = logger;
        _isEnabled = cache != null;
        
        if (!_isEnabled)
        {
            _logger.LogWarning("Redis cache is not enabled. Caching will be disabled.");
        }
    }

    public async Task<T?> GetAsync<T>(string key) where T : class
    {
        if (!_isEnabled || _cache == null) return null;

        try
        {
            var data = await _cache.GetStringAsync(key);
            if (string.IsNullOrEmpty(data)) return null;
            return JsonSerializer.Deserialize<T>(data);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get cache key: {Key}", key);
            return null;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiry = null) where T : class
    {
        if (!_isEnabled || _cache == null) return;

        try
        {
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = expiry
            };
            var json = JsonSerializer.Serialize(value);
            await _cache.SetStringAsync(key, json, options);
            _logger.LogDebug("Cached key: {Key} (expiry: {Expiry})", key, expiry);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to set cache key: {Key}", key);
        }
    }

    public async Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiry = null) where T : class
    {
        var cached = await GetAsync<T>(key);
        if (cached != null) return cached;

        var value = await factory();
        if (value != null)
        {
            await SetAsync(key, value, expiry);
        }
        return value;
    }

    public async Task RemoveAsync(string key)
    {
        if (!_isEnabled || _cache == null) return;

        try
        {
            await _cache.RemoveAsync(key);
            _logger.LogDebug("Removed cache key: {Key}", key);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to remove cache key: {Key}", key);
        }
    }

    public async Task<bool> ExistsAsync(string key)
    {
        if (!_isEnabled || _cache == null) return false;

        try
        {
            var data = await _cache.GetAsync(key);
            return data != null && data.Length > 0;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to check cache key existence: {Key}", key);
            return false;
        }
    }

    // ── Stock-specific cache methods ──────────────────────────────────────────

    public async Task SetStockCacheAsync(string symbol, object stockData, TimeSpan? expiry = null)
    {
        var key = $"{StockPrefix}{symbol.ToUpperInvariant()}";
        await SetAsync(key, stockData, expiry ?? DefaultStockCacheTtl);
    }

    public async Task<T?> GetStockCacheAsync<T>(string symbol) where T : class
    {
        var key = $"{StockPrefix}{symbol.ToUpperInvariant()}";
        return await GetAsync<T>(key);
    }

    public async Task InvalidateStockCacheAsync(string symbol)
    {
        var key = $"{StockPrefix}{symbol.ToUpperInvariant()}";
        await RemoveAsync(key);
        _logger.LogDebug("Invalidated stock cache for: {Symbol}", symbol);
    }

    public async Task InvalidateMarketCacheAsync(string exchange)
    {
        var key = $"{MarketPrefix}{exchange.ToUpperInvariant()}";
        await RemoveAsync(key);
        _logger.LogDebug("Invalidated market cache for: {Exchange}", exchange);
    }

    /// <summary>
    /// Get market data with automatic caching
    /// </summary>
    public async Task<T> GetMarketDataAsync<T>(string exchange, Func<Task<T>> factory) where T : class
    {
        var key = $"{MarketPrefix}{exchange.ToUpperInvariant()}";
        return await GetOrSetAsync(key, factory, DefaultMarketCacheTtl);
    }

    /// <summary>
    /// Get prediction data with automatic caching (1 hour TTL)
    /// </summary>
    public async Task<T> GetPredictionDataAsync<T>(string symbol, Func<Task<T>> factory) where T : class
    {
        var key = $"{PredictionPrefix}{symbol.ToUpperInvariant()}";
        return await GetOrSetAsync(key, factory, DefaultPredictionCacheTtl);
    }

    /// <summary>
    /// Get memecoin data with automatic caching (30 second TTL)
    /// </summary>
    public async Task<T> GetMemecoinDataAsync<T>(string coinId, Func<Task<T>> factory) where T : class
    {
        var key = $"{MemecoinPrefix}{coinId.ToLowerInvariant()}";
        return await GetOrSetAsync(key, factory, DefaultMemecoinCacheTtl);
    }

    /// <summary>
    /// Invalidate memecoin cache
    /// </summary>
    public async Task InvalidateMemecoinCacheAsync(string coinId)
    {
        var key = $"{MemecoinPrefix}{coinId.ToLowerInvariant()}";
        await RemoveAsync(key);
        _logger.LogDebug("Invalidated memecoin cache for: {CoinId}", coinId);
    }
}
