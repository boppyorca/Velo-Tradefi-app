namespace FinAI.Infrastructure.Services;

using FinAI.Core.Interfaces;
using FinAI.Core.Models;

public class NewsService : INewsService
{
    private static readonly List<NewsItemDto> _mockNews =
    [
        new NewsItemDto("1", "NVIDIA announces next-gen AI chips at GTC 2026, targets $500B market",
            "Jensen Huang reveals Blackwell Ultra architecture at annual developer conference, promising 3x performance improvement for LLM training workloads.",
            "TechCrunch", "https://techcrunch.com", DateTime.UtcNow.AddHours(-1), null, "ai"),
        new NewsItemDto("2", "Bitcoin breaks $67K amid record ETF inflow surge of $1.2B in single day",
            "Spot Bitcoin ETFs recorded unprecedented daily inflows as institutional adoption accelerates following favorable regulatory signals.",
            "CoinDesk", "https://coindesk.com", DateTime.UtcNow.AddHours(-2), null, "crypto"),
        new NewsItemDto("3", "Fed holds rates at 4.25-4.50%, signals two cuts in 2026 as inflation cools",
            "Federal Reserve maintains current range while updating dot plot projections. Markets rally on dovish tone.",
            "Reuters", "https://reuters.com", DateTime.UtcNow.AddHours(-3), null, "stock"),
        new NewsItemDto("4", "OpenAI releases GPT-5 with native multimodal reasoning at human expert level",
            "The latest model achieves PhD-level performance across science, math, and coding benchmarks while reducing hallucinations by 80%.",
            "The Verge", "https://theverge.com", DateTime.UtcNow.AddHours(-4), null, "ai"),
        new NewsItemDto("5", "Apple Vision Pro 2 specs leaked: M5 chip, improved display, $2,499 starting price",
            "Apple's next spatial computing headset features significantly improved resolution and weight reduction, analyst Ming-Chi Kuo reports.",
            "MacRumors", "https://macrumors.com", DateTime.UtcNow.AddHours(-5), null, "tech"),
        new NewsItemDto("6", "Ethereum ETF staking approval expected Q2 2026, could unlock $10B in yield",
            "SEC reportedly reconsidering stance on staking rewards for Ethereum ETF products following BlackRock and Fidelity applications.",
            "Decrypt", "https://decrypt.co", DateTime.UtcNow.AddHours(-6), null, "crypto"),
        new NewsItemDto("7", "TSLA stock drops 8% after Q1 deliveries miss estimates by 12%",
            "Tesla delivered 355,000 vehicles in Q1, falling short of analyst consensus of 403,000 amid increasing EV competition.",
            "Bloomberg", "https://bloomberg.com", DateTime.UtcNow.AddHours(-7), null, "stock"),
        new NewsItemDto("8", "Anthropic raises $3.5B at $61B valuation, largest AI funding round ever",
            "The Claude maker secures mega-round led by Google and Amazon, bringing total raised to $7.5B with plans to scale safety research.",
            "FT", "https://ft.com", DateTime.UtcNow.AddHours(-8), null, "ai"),
        new NewsItemDto("9", "Google DeepMind AlphaFold 3 predicts full cellular interactome for first time",
            "The breakthrough AI system models all protein interactions in a human cell, potentially accelerating drug discovery by 10x.",
            "Nature", "https://nature.com", DateTime.UtcNow.AddHours(-9), null, "ai"),
        new NewsItemDto("10", "Solana memecoin season 2.0: $4B in new token launches in single week",
            "Solana network sees unprecedented memecoin activity with AI-themed tokens dominating. DOGE and SHIB alternatives surge.",
            "CoinGecko", "https://coingecko.com", DateTime.UtcNow.AddHours(-10), null, "crypto"),
        new NewsItemDto("11", "Microsoft Copilot+ PC sales exceed expectations, Windows market share rises",
            "Qualcomm Snapdragon X-powered devices sell out in major markets. Microsoft reports 40% increase in Copilot usage.",
            "The Verge", "https://theverge.com", DateTime.UtcNow.AddHours(-11), null, "tech"),
        new NewsItemDto("12", "NVIDIA stock surges to all-time high, briefly becomes world's most valuable company",
            "AI chip demand pushes NVIDIA market cap to $3.1T, surpassing Microsoft and Apple in early trading.",
            "Bloomberg", "https://bloomberg.com", DateTime.UtcNow.AddHours(-12), null, "stock"),
    ];

    public Task<IEnumerable<NewsItemDto>> GetNewsAsync(string? category = null, int page = 1, int pageSize = 20)
    {
        var query = _mockNews.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(category) && category != "all")
        {
            query = query.Where(n => n.Category.Equals(category, StringComparison.OrdinalIgnoreCase));
        }

        var data = query
            .Skip((page - 1) * pageSize)
            .Take(pageSize);

        return Task.FromResult<IEnumerable<NewsItemDto>>(data);
    }
}
