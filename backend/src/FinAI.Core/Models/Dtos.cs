namespace FinAI.Core.Models;

// ── Stock ─────────────────────────────────────────────────────────────────────

public record StockDto(
    string Symbol,
    string Name,
    string Exchange,
    decimal Price,
    decimal Change,
    decimal ChangePercent,
    long Volume,
    decimal? MarketCap,
    DateTime UpdatedAt,
    // Fundamental fields (optional — only available from Yahoo Finance v7)
    decimal? Open = null,
    decimal? High = null,
    decimal? Low = null,
    decimal? PreviousClose = null,
    decimal? Week52High = null,
    decimal? Week52Low = null,
    decimal? PeRatio = null,
    decimal? DividendYield = null,
    decimal? AvgVolume = null,
    decimal? Eps = null
);

public record StockListDto(
    IEnumerable<StockDto> Data,
    int Total
);

// ── Prediction ────────────────────────────────────────────────────────────────

public record PredictionDto(
    string Symbol,
    string Model,
    decimal CurrentPrice,
    string Trend,
    double Confidence,
    IEnumerable<PredictionPointDto> Predictions
);

public record PredictionPointDto(
    string Date,
    decimal PredictedPrice,
    double Confidence,
    decimal UpperBound,
    decimal LowerBound
);

// ── Memecoin ──────────────────────────────────────────────────────────────────

public record MemecoinDto(
    string Id,
    string Symbol,
    string Name,
    decimal Price,
    decimal Change24h,
    decimal MarketCap,
    decimal Volume24h,
    string? Image
);

public record MemecoinListDto(
    IEnumerable<MemecoinDto> Data
);

// ── News ──────────────────────────────────────────────────────────────────────

public record NewsItemDto(
    string Id,
    string Title,
    string Summary,
    string Source,
    string Url,
    DateTime PublishedAt,
    string? ImageUrl,
    string Category
);

public record NewsListDto(
    IEnumerable<NewsItemDto> Data
);

// ── Auth ──────────────────────────────────────────────────────────────────────

public record AuthResponseDto(
    string Token,
    UserDto User
);

public record UserDto(
    Guid Id,
    string Email,
    string FullName,
    string Role = "User"
);

public record RegisterRequest(
    string Email,
    string Password,
    string FullName
);

public record LoginRequest(
    string Email,
    string Password
);

// ── Web3 ───────────────────────────────────────────────────────────────────────

public record WalletConnectRequest(
    string Address
);

public record WalletBalanceDto(
    string Address,
    string ChainId,
    decimal EthBalance,
    IEnumerable<TokenBalanceDto> Tokens
);

public record TokenBalanceDto(
    string Symbol,
    string Address,
    decimal Balance
);

// ── API Response ──────────────────────────────────────────────────────────────

public record ApiResponse<T>(
    T? Data,
    bool Success = true,
    string? Message = null,
    PaginationMeta? Meta = null
);

public record PaginationMeta(
    int Total,
    int Page,
    int PageSize,
    bool HasMore
);
