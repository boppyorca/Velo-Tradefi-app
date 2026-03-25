using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.RegularExpressions;
using FinAI.Api.Hubs;
using FinAI.Api.Services;
using FinAI.Core.Interfaces;
using FinAI.Infrastructure.Data;
using FinAI.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

// Load .env from common locations (Windows / macOS / run from Api project or backend root)
var possiblePaths = new[]
{
    Path.Combine(Directory.GetCurrentDirectory(), ".env"),
    Path.Combine(Directory.GetCurrentDirectory(), "..", ".env"),
    Path.Combine(Directory.GetCurrentDirectory(), "..", "..", ".env"),
    Path.Combine(AppContext.BaseDirectory, ".env"),
    Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".env"),
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
// Supabase is configured: validate EITHER Supabase access tokens OR backend-issued API JWTs
// (AuthController signs with JWT_SECRET_KEY — previously only Supabase parameters were registered → 401 on watchlist).
var supabaseUrlEnv = Environment.GetEnvironmentVariable("SUPABASE_URL");
var supabaseAnonEnv = Environment.GetEnvironmentVariable("SUPABASE_ANON_KEY");
var useSupabaseAuth = !string.IsNullOrEmpty(supabaseUrlEnv) && !string.IsNullOrEmpty(supabaseAnonEnv);
var jwtSecret = builder.Configuration["JWT_SECRET_KEY"]
    ?? Environment.GetEnvironmentVariable("JWT_SECRET_KEY")
    ?? "VeloFinAI-SuperSecretKey-32chars-min!";

const string JwtSchemeSupabase = "JwtSupabase";
const string JwtSchemeBackend = "JwtSchemeBackend";
const string JwtSchemeSmart = "JwtSmart";

if (useSupabaseAuth)
{
    var supabaseUrl = supabaseUrlEnv!.TrimEnd('/');
    var supabaseAnonKey = supabaseAnonEnv!;

    Console.WriteLine($"JWT: dual schemes — Supabase issuer + backend API JWT ({jwtSecret.Length} char secret)");

    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtSchemeSmart;
        options.DefaultChallengeScheme = JwtSchemeSmart;
    })
    .AddPolicyScheme(JwtSchemeSmart, JwtSchemeSmart, options =>
    {
        options.ForwardDefaultSelector = ctx =>
        {
            var authHeader = ctx.Request.Headers.Authorization.ToString();
            if (string.IsNullOrEmpty(authHeader) ||
                !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                return JwtSchemeBackend;

            var token = authHeader["Bearer ".Length..].Trim();
            try
            {
                var handler = new JwtSecurityTokenHandler();
                if (handler.CanReadToken(token))
                {
                    var jwt = handler.ReadJwtToken(token);
                    var iss = jwt.Issuer ?? "";
                    if (iss.Contains("supabase", StringComparison.OrdinalIgnoreCase))
                        return JwtSchemeSupabase;
                }
            }
            catch
            {
                // malformed → let backend scheme fail with 401
            }

            return JwtSchemeBackend;
        };
    })
    .AddJwtBearer(JwtSchemeSupabase, options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;

        // Supabase uses ES256 (ECDSA) — can't validate locally.
        // Validate by calling Supabase /auth/v1/user in OnMessageReceived.
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = async ctx =>
            {
                var authHeader = ctx.Request.Headers.Authorization.ToString();
                if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                    return;

                var token = authHeader["Bearer ".Length..].Trim();
                try
                {
                    var handler = new JwtSecurityTokenHandler();
                    if (!handler.CanReadToken(token)) return;
                    var jwt = handler.ReadJwtToken(token);
                    if (string.IsNullOrEmpty(jwt.Issuer) ||
                        !jwt.Issuer.Contains("supabase", StringComparison.OrdinalIgnoreCase)) return;

                    // Validate token with Supabase API
                    using var httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
                    httpClient.DefaultRequestHeaders.Add("apikey", supabaseAnonKey);
                    httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

                    var response = await httpClient.GetAsync($"{supabaseUrl}/auth/v1/user");
                    if (!response.IsSuccessStatusCode) return;

                    var supabaseUser = await response.Content.ReadFromJsonAsync<SupabaseAuthApiUser>();
                    if (supabaseUser == null) return;

                    var claims = new List<System.Security.Claims.Claim>
                    {
                        new(System.Security.Claims.ClaimTypes.NameIdentifier, supabaseUser.Id ?? ""),
                        new(System.Security.Claims.ClaimTypes.Email, supabaseUser.Email ?? ""),
                        new(System.Security.Claims.ClaimTypes.Role, supabaseUser.Role ?? "User"),
                        new("provider", "supabase"),
                    };

                    var identity = new System.Security.Claims.ClaimsIdentity(claims, "SupabaseBearer");
                    ctx.Principal = new System.Security.Claims.ClaimsPrincipal(identity);
                    ctx.Success();
                }
                catch
                {
                    // Let default auth fail
                }
            }
        };

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateIssuerSigningKey = false,
            ValidateLifetime = false,
            RequireSignedTokens = false,
        };
    })
    .AddJwtBearer(JwtSchemeBackend, options =>
    {
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        options.SaveToken = true;
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
    });
}
else
{
    Console.WriteLine("JWT: backend-only (HS256 + JWT_SECRET_KEY)");
    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        options.SaveToken = true;
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
    });
}

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

// ── SignalR ─────────────────────────────────────────────────────────────────
// Configure SignalR with Redis backplane for horizontal scaling (optional)
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    options.MaximumReceiveMessageSize = 32 * 1024; // 32KB max message size
    options.StreamBufferCapacity = 20;
})
.AddJsonProtocol(options =>
{
    options.PayloadSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

// ── Redis Cache ───────────────────────────────────────────────────────────────
var redisUrl = builder.Configuration["REDIS_URL"];
if (!string.IsNullOrEmpty(redisUrl))
{
    builder.Services.AddStackExchangeRedisCache(options =>
    {
        options.Configuration = redisUrl;
        options.InstanceName = "VeloTradeFi:";
    });
    Console.WriteLine($"Redis cache enabled: {redisUrl}");
}

// ── Dependency Injection ────────────────────────────────────────────────────────
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IWatchlistRepository, WatchlistRepository>();
builder.Services.AddScoped<IAlertRepository, AlertRepository>();
builder.Services.AddScoped<IAlertService, AlertService>();
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

// ── Redis Cache Service ────────────────────────────────────────────────────────
builder.Services.AddSingleton<IRedisCacheService>(sp =>
{
    var cache = sp.GetService<Microsoft.Extensions.Caching.Distributed.IDistributedCache>();
    var logger = sp.GetRequiredService<ILogger<RedisCacheService>>();
    return new RedisCacheService(cache, logger);
});

// ── SignalR Stock Broadcaster ─────────────────────────────────────────────────
builder.Services.AddSingleton<IStockPriceBroadcaster, SignalRStockBroadcaster>();

// ── Web3 Signature Service ─────────────────────────────────────────────────────
builder.Services.AddSingleton<IWeb3SignatureService, Web3SignatureService>();

// ── SignalR Stock Broadcaster ─────────────────────────────────────────────────
builder.Services.AddSingleton<IStockPriceBroadcaster, SignalRStockBroadcaster>();

// ── Program ────────────────────────────────────────────────────────────────────
var app = builder.Build();

// Apply schema: PostgreSQL uses EF migrations; in-memory uses EnsureCreated
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        if (usePostgres)
            db.Database.Migrate();
        else
            db.Database.EnsureCreated();
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogWarning(ex, "Could not connect or migrate database. Using in-memory fallback.");
    }
}

// ── Middleware pipeline ────────────────────────────────────────────────────────
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// ── SignalR Hubs ───────────────────────────────────────────────────────────────
app.MapHub<StockPriceHub>("/hubs/stock-price");

// Health check
app.MapGet("/health", () => Results.Ok(new { status = "ok", timestamp = DateTime.UtcNow }));

app.Run();

// ── Supabase Auth API User model (for token validation) ──────────────────────
internal class SupabaseAuthApiUser
{
    public string? Id { get; set; }
    public string? Email { get; set; }
    public string? Role { get; set; }
}
