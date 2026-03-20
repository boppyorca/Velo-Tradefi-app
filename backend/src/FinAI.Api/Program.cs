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
// NOTE: .NET 10 + Npgsql 8.x have compatibility issues.
// For local development: Use InMemory database
// For production deployment (.NET 8): Use PostgreSQL with Npgsql
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseInMemoryDatabase("FinAI-Dev-InMemory");
    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
    }
});
Console.WriteLine("Using InMemory database for development");

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

// ── HTTP Client for Stock/Yahoo Finance ────────────────────────────────
builder.Services.AddHttpClient("YahooFinance", client =>
{
    client.Timeout = TimeSpan.FromSeconds(15);
    client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (compatible; FinAI/1.0)");
    client.DefaultRequestHeaders.Add("Accept", "application/json");
});

// ── CORS ─────────────────────────────────────────────────────────────────────
var allowedOrigins = builder.Configuration["FRONTEND_URL"] ?? "http://localhost:3000";
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
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
builder.Services.AddScoped<IStockService>(sp =>
{
    var httpFactory = sp.GetRequiredService<IHttpClientFactory>();
    var http = httpFactory.CreateClient("YahooFinance");
    var logger = sp.GetRequiredService<ILogger<StockService>>();
    return new StockService(http, logger);
});
builder.Services.AddScoped<IPredictionService, PredictionService>();
builder.Services.AddScoped<IMemecoinService, MemecoinService>();
builder.Services.AddScoped<INewsService, NewsService>();
builder.Services.AddScoped<IWeb3Service, Web3Service>();

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
