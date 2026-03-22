using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.RegularExpressions;
using FinAI.Core.Interfaces;
using FinAI.Infrastructure.Data;
using FinAI.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

// Load .env file manually (simple implementation)
// Priority: 1) backend/.env (project root), 2) current directory, 3) AppContext.BaseDirectory
var possiblePaths = new[]
{
    // Project root (backend folder) - most likely to exist
    "/Users/hosynguyen/Velo-Tradefi-app/backend/.env",
    // Current working directory
    Path.Combine(Directory.GetCurrentDirectory(), ".env"),
    // Relative to backend folder
    Path.Combine(Directory.GetCurrentDirectory(), "..", ".env"),
};

string? loadedPath = null;
foreach (var path in possiblePaths)
{
    if (File.Exists(path))
    {
        loadedPath = path;
        break;
    }
}

if (loadedPath != null)
{
    foreach (var line in File.ReadAllLines(loadedPath))
    {
        var trimmed = line.Trim();
        if (string.IsNullOrEmpty(trimmed) || trimmed.StartsWith('#')) continue;
        var parts = trimmed.Split('=', 2);
        if (parts.Length == 2)
        {
            var envKey = parts[0].Trim();
            var envValue = parts[1].Trim();
            if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable(envKey)))
            {
                Environment.SetEnvironmentVariable(envKey, envValue);
            }
        }
    }
    Console.WriteLine($"Loaded .env from: {Path.GetFullPath(loadedPath)}");
}
else
{
    Console.WriteLine("Warning: .env file not found, searched paths: " + string.Join(", ", possiblePaths));
}

// Debug: Print DATABASE_URL (mask password)
var rawConnectionString = Environment.GetEnvironmentVariable("DATABASE_URL");
if (!string.IsNullOrEmpty(rawConnectionString))
{
    var maskedUrl = Regex.Replace(rawConnectionString, @"://([^:]+):([^@]+)@", "://$1:****@");
    Console.WriteLine($"DATABASE_URL: {maskedUrl}");
}

var builder = WebApplication.CreateBuilder(args);

// ── Controllers ────────────────────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new() { Title = "VeloTradeFi API", Version = "v1" });
});

// ── Database Configuration ────────────────────────────────────────────────────────
var dbConnectionString = Environment.GetEnvironmentVariable("DATABASE_URL");
var usePostgres = !string.IsNullOrEmpty(dbConnectionString);

builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (usePostgres)
    {
        // Use PostgreSQL (Supabase or any Postgres provider)
        options.UseNpgsql(dbConnectionString);
        Console.WriteLine($"Using PostgreSQL database: {Regex.Replace(dbConnectionString, @"://([^:]+):([^@]+)@", "://$1:****@")}");
    }
    else
    {
        // Use InMemory database for local development without Supabase
        options.UseInMemoryDatabase("FinAI-Dev-InMemory");
        Console.WriteLine("Using InMemory database for development");
    }
    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
    }
});

// ── JWT Authentication ─────────────────────────────────────────────────────────
// Supports both Supabase Auth JWT and custom JWT
var useSupabaseAuth = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("SUPABASE_URL"));
var jwtSecret = builder.Configuration["JWT_SECRET_KEY"]
    ?? "VeloFinAI-SuperSecretKey-32chars-min!";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
    options.SaveToken = true;

    if (useSupabaseAuth)
    {
        // ── Supabase Auth JWT Validation ──
        var supabaseUrl = Environment.GetEnvironmentVariable("SUPABASE_URL")!;
        var supabaseAnonKey = Environment.GetEnvironmentVariable("SUPABASE_ANON_KEY")!;

        Console.WriteLine($"Using Supabase Auth: {supabaseUrl}");

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = supabaseUrl,
            ValidateAudience = true,
            ValidAudience = supabaseAnonKey,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(5),
            IssuerSigningKeyResolver = (token, securityToken, kid, parameters) =>
            {
                // Supabase uses HS256, key is the anon key
                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(supabaseAnonKey));
                return new[] { key };
            }
        };
    }
    else
    {
        // ── Custom JWT Validation (Development) ──
        Console.WriteLine("Using Custom JWT Auth (Development)");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = key,
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(5)
        };
    }
});

builder.Services.AddAuthorization();

// ── HTTP Client for Supabase Auth ───────────────────────────────────────
builder.Services.AddHttpClient("SupabaseAuth", client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
});

// ── HTTP Client for Stock/Yahoo Finance ─────────────────────────────────────────
builder.Services.AddHttpClient("YahooFinance", client =>
{
    client.Timeout = TimeSpan.FromSeconds(15);
    client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (compatible; FinAI/1.0)");
    client.DefaultRequestHeaders.Add("Accept", "application/json");
});

// ── HTTP Client for CoinGecko ────────────────────────────────────────────────────
builder.Services.AddHttpClient("CoinGecko", client =>
{
    client.Timeout = TimeSpan.FromSeconds(20);
    client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (compatible; FinAI/1.0)");
    client.DefaultRequestHeaders.Add("Accept", "application/json, */*");
    client.DefaultRequestHeaders.Add("Accept-Encoding", "gzip, deflate, br");
})
.ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
{
    AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate | DecompressionMethods.Brotli,
    AllowAutoRedirect = true,
    MaxAutomaticRedirections = 5,
});

// ── HTTP Client for Python ML Service (LSTM + Prophet) ───────────────────────────
builder.Services.AddHttpClient("MLService", client =>
{
    client.Timeout = TimeSpan.FromSeconds(45);
    client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (compatible; FinAI/1.0)");
    client.DefaultRequestHeaders.Add("Accept", "application/json");
});

// ── CORS ─────────────────────────────────────────────────────────────────────
var configuredOrigins = (builder.Configuration["FRONTEND_URL"] ?? "http://localhost:3000")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
var corsOrigins = new HashSet<string>(configuredOrigins, StringComparer.OrdinalIgnoreCase);
if (builder.Environment.IsDevelopment())
{
    corsOrigins.Add("http://localhost:3000");
    corsOrigins.Add("http://127.0.0.1:3000");
}

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(corsOrigins.ToArray())
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ── Redis Cache ───────────────────────────────────────────────────────────────
var redisUrl = builder.Configuration["REDIS_URL"];
if (!string.IsNullOrEmpty(redisUrl))
{
    builder.Services.AddStackExchangeRedisCache(options =>
    {
        options.Configuration = redisUrl;
    });
}

// ── Dependency Injection ────────────────────────────────────────────────────────
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IWatchlistRepository, WatchlistRepository>();
builder.Services.AddScoped<IStockService>(sp =>
{
    var httpFactory = sp.GetRequiredService<IHttpClientFactory>();
    var http = httpFactory.CreateClient("YahooFinance");
    var logger = sp.GetRequiredService<ILogger<StockService>>();
    return new StockService(http, logger);
});
builder.Services.AddScoped<IPredictionService>(sp =>
{
    var httpFactory = sp.GetRequiredService<IHttpClientFactory>();
    var http = httpFactory.CreateClient("MLService");
    var logger = sp.GetRequiredService<ILogger<PredictionService>>();
    var config = sp.GetRequiredService<IConfiguration>();
    return new PredictionService(http, logger, config);
});
builder.Services.AddScoped<IMemecoinService>(sp =>
{
    var httpFactory = sp.GetRequiredService<IHttpClientFactory>();
    var http = httpFactory.CreateClient("CoinGecko");
    var logger = sp.GetRequiredService<ILogger<MemecoinService>>();
    return new MemecoinService(http, logger);
});
builder.Services.AddHttpClient<INewsService, NewsService>(client =>
{
    client.BaseAddress = new Uri("https://hacker-news.firebaseio.com/v0/");
    client.Timeout = TimeSpan.FromSeconds(15);
});
builder.Services.AddHttpClient<IWeb3Service, Web3Service>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(10);
});

// ── Program ────────────────────────────────────────────────────────────────────
var app = builder.Build();

// Auto-apply migrations in development
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        db.Database.EnsureCreated(); // Creates tables if they don't exist
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogWarning(ex, "Could not connect to database. Using in-memory fallback.");
    }
}

// ── Middleware pipeline ────────────────────────────────────────────────────────
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Health check
app.MapGet("/health", () => Results.Ok(new { status = "ok", timestamp = DateTime.UtcNow }));

app.Run();
