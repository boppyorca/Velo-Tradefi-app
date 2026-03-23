using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace FinAI.Infrastructure.Data;

/// <summary>
/// Provides a DbContext instance for EF Core design-time tools (migrations).
/// This class is ONLY used by `dotnet ef` commands and is NOT used at runtime.
/// </summary>
public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();

        // Design-time connection string — used only for `dotnet ef migrations` commands.
        // Matches docker-compose.yml: postgres:postgres@localhost:5432/velotradefi
        const string connectionString =
            "Host=localhost;Port=5432;Database=velotradefi;Username=postgres;Password=postgres";

        optionsBuilder.UseNpgsql(connectionString);

        return new AppDbContext(optionsBuilder.Options);
    }
}
