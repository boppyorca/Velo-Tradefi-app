namespace FinAI.Infrastructure.Services;

using System.Collections.Concurrent;
using System.Net.Http.Json;
using System.Text.Json;
using FinAI.Core.Interfaces;
using FinAI.Core.Models;
using Microsoft.Extensions.Logging;

public class NewsService : INewsService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<NewsService> _logger;

    // In-memory cache: (category, page) → (items, expiry)
    private static readonly ConcurrentDictionary<string, (IEnumerable<NewsItemDto> Items, DateTime ExpiresAt)> _cache = new();
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(5);

    // Keyword-based category classification (order matters: specific → generic)
    // Using word boundaries to avoid false positives
    private static readonly Dictionary<string, string[]> _categoryKeywords = new()
    {
        // AI/ML — must be specific AI terms
        ["ai"]     = [
            " ai ", "artificial intelligence", "machine learning", "deep learning",
            "neural network", "openai", "anthropic", "deepmind", "chatgpt",
            "gpt-", "gemini ", "claude ", "mistral ", "llama ", "groq ",
            "langchain", "lang smith", "copilot ", "hugging face", "transformer",
            "sora ", "stable diffusion", "midjourney", "dall-e",
            "embeddin", "vector db", "vq-", "vqgan", "diffusion model",
            "llm ", "large language", "multimodal ai", "reasoning model",
            "open router", "together ai", "anyscale", "replicate",
            "benchmark", "agentic", "reasoning chain",
        ],
        // Crypto — specific crypto/blockchain terms
        ["crypto"] = [
            "bitcoin", "ethereum", "solana blockchain", "defi ", "nft ",
            "blockchain ", "binance", "coinbase", "cryptocurrency",
            "memecoin", "dogecoin", "shiba inu", "ordinal ", "rollup ",
            "stablecoin", "web3 ", "crypto token", "crypto exchange",
            "proof-of-", "tokenomics", "airdrops", "ico ",
            "exchange hack", "crypto regulation", "crypto etf",
            "staking ", "layer 2", "l2 ", "smart contract platform",
        ],
        // Stock/Finance — specific financial news
        ["stock"]  = [
            "federal reserve", "fed rate", "interest rate hike",
            "inflation report", "cpi ", "ppi ", "gdp growth",
            "earnings season", "sec investigation", "antitrust ",
            "buyback ", "dividend ", "merger deal", "acquisition offer",
            "wall street", "sp 500", "nasdaq composite", "treasury yield",
        ],
        // Tech — company/product/product news (generic fallback)
        ["tech"]   = [
            "apple ", "google deepmind", "meta ai", "meta quest",
            "amazon aws", "amazon prime", "microsoft azure", "github copilot",
            "tesla deliveries", "spacex launch", "startup raises",
            "series a", "series b", "funding round", "product launch",
            "ios ", "android ", "windows ", "macos ", "linux ",
            "chip shortage", "asml ", "tsmc ", "qualcomm ",
            "cybersecurity", "data breach", "zero-day",
        ],
    };

    public NewsService(HttpClient httpClient, ILogger<NewsService> logger)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri("https://hacker-news.firebaseio.com/v0/");
        _httpClient.Timeout = TimeSpan.FromSeconds(15);
        _logger = logger;
    }

    public async Task<IEnumerable<NewsItemDto>> GetNewsAsync(string? category = null, int page = 1, int pageSize = 20)
    {
        var cacheKey = $"news:{category ?? "all"}:{page}";

        if (_cache.TryGetValue(cacheKey, out var cached) && cached.ExpiresAt > DateTime.UtcNow)
        {
            _logger.LogDebug("Cache hit for {CacheKey}", cacheKey);
            return cached.Items;
        }

        try
        {
            var stories = await FetchHackerNewsStoriesAsync();

            // Filter by category if specified
            if (!string.IsNullOrWhiteSpace(category) && category != "all")
            {
                stories = stories.Where(s =>
                    s.Category.Equals(category, StringComparison.OrdinalIgnoreCase)).ToList();
            }

            var paged = stories
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            _cache[cacheKey] = (paged.AsEnumerable(), DateTime.UtcNow.Add(CacheTtl));

            return paged;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch news from HackerNews, returning cached if available");

            // Return cached items even if expired as fallback
            if (_cache.TryGetValue(cacheKey, out var fallback))
                return fallback.Items;

            return Enumerable.Empty<NewsItemDto>();
        }
    }

    private async Task<List<NewsItemDto>> FetchHackerNewsStoriesAsync()
    {
        // Fetch from top stories (most active/popular)
        var idsResponse = await _httpClient.GetAsync("topstories.json");
        idsResponse.EnsureSuccessStatusCode();
        var ids = await idsResponse.Content.ReadFromJsonAsync<List<int>>();

        if (ids is null || ids.Count == 0)
            return new List<NewsItemDto>();

        // Take top 60 for better category coverage
        var topIds = ids.Take(60).ToList();
        var stories = new List<NewsItemDto>();

        // Fetch in parallel batches
        var tasks = topIds.Select(FetchStoryAsync);
        var results = await Task.WhenAll(tasks);

        foreach (var story in results.Where(s => s is not null))
        {
            stories.Add(story!);
        }

        // Sort by score descending (most popular first)
        return stories
            .OrderByDescending(s => s.PublishedAt)
            .ToList();
    }

    private async Task<NewsItemDto?> FetchStoryAsync(int id)
    {
        try
        {
            var response = await _httpClient.GetAsync($"item/{id}.json");
            if (!response.IsSuccessStatusCode) return null;

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            if (root.TryGetProperty("deleted", out var del) && del.GetBoolean())
                return null;
            if (root.TryGetProperty("dead", out var dead) && dead.GetBoolean())
                return null;
            if (!root.TryGetProperty("title", out var titleProp))
                return null;

            var title = titleProp.GetString() ?? "";
            var url = root.TryGetProperty("url", out var urlProp)
                ? urlProp.GetString() ?? ""
                : $"https://news.ycombinator.com/item?id={id}";
            var by = root.TryGetProperty("by", out var byProp) ? byProp.GetString() ?? "unknown" : "unknown";
            var score = root.TryGetProperty("score", out var scoreProp) ? scoreProp.GetInt32() : 0;
            var time = root.TryGetProperty("time", out var timeProp) ? timeProp.GetInt32() : 0;
            var descendants = root.TryGetProperty("descendants", out var descProp) ? descProp.GetInt32() : 0;
            var idStr = id.ToString();

            var category = ClassifyCategory(title);
            var publishedAt = time > 0
                ? DateTimeOffset.FromUnixTimeSeconds(time).UtcDateTime
                : DateTime.UtcNow;

            var summary = BuildSummary(title, score, descendants, by);

            return new NewsItemDto(
                Id: idStr,
                Title: title,
                Summary: summary,
                Source: "HackerNews",
                Url: url,
                PublishedAt: publishedAt,
                ImageUrl: null,
                Category: category
            );
        }
        catch
        {
            return null;
        }
    }

    private string ClassifyCategory(string title)
    {
        var lower = title.ToLowerInvariant();

        foreach (var (cat, keywords) in _categoryKeywords)
        {
            if (keywords.Any(kw => lower.Contains(kw)))
                return cat;
        }

        return "tech";
    }

    private string BuildSummary(string title, int score, int comments, string author)
    {
        if (comments > 0)
            return $"{score} points · {comments} comments · by {author} · {title}";
        return $"{score} points · by {author}";
    }
}
