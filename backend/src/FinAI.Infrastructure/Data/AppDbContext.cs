namespace FinAI.Infrastructure.Data;

using FinAI.Core.Entities;
using Microsoft.EntityFrameworkCore;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<StockWatchlist> StockWatchlists => Set<StockWatchlist>();
    public DbSet<MemecoinWatchlist> MemecoinWatchlists => Set<MemecoinWatchlist>();
    public DbSet<PredictionHistory> PredictionHistories => Set<PredictionHistory>();
    public DbSet<SecurityAuditEvent> SecurityAuditEvents => Set<SecurityAuditEvent>();
    public DbSet<PriceAlert> PriceAlerts => Set<PriceAlert>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Email).HasColumnName("email").IsRequired().HasMaxLength(255);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.PasswordHash).HasColumnName("password_hash").IsRequired();
            entity.Property(e => e.FullName).HasColumnName("full_name").IsRequired().HasMaxLength(255);
            entity.Property(e => e.WalletAddress).HasColumnName("wallet_address").HasMaxLength(42);
            entity.Property(e => e.Role).HasColumnName("role").IsRequired().HasMaxLength(50).HasDefaultValue("User");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        });

        // StockWatchlist
        modelBuilder.Entity<StockWatchlist>(entity =>
        {
            entity.ToTable("stock_watchlists");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Symbol).HasColumnName("symbol").IsRequired().HasMaxLength(20);
            entity.Property(e => e.Market).HasColumnName("market").IsRequired().HasMaxLength(4);
            entity.Property(e => e.AddedAt).HasColumnName("added_at").HasDefaultValueSql("now()");
            entity.HasOne(e => e.User)
                  .WithMany(u => u.StockWatchlist)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // MemecoinWatchlist
        modelBuilder.Entity<MemecoinWatchlist>(entity =>
        {
            entity.ToTable("memecoin_watchlists");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.CoinId).HasColumnName("coin_id").IsRequired().HasMaxLength(100);
            entity.Property(e => e.AddedAt).HasColumnName("added_at").HasDefaultValueSql("now()");
            entity.HasOne(e => e.User)
                  .WithMany(u => u.MemecoinWatchlist)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // PredictionHistory
        modelBuilder.Entity<PredictionHistory>(entity =>
        {
            entity.ToTable("prediction_histories");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Symbol).HasColumnName("symbol").IsRequired().HasMaxLength(20);
            entity.Property(e => e.ModelUsed).HasColumnName("model_used").HasMaxLength(20);
            entity.Property(e => e.Confidence).HasColumnName("confidence");
            entity.Property(e => e.CurrentPrice).HasColumnName("current_price");
            entity.Property(e => e.PredictedPrice).HasColumnName("predicted_price");
            entity.Property(e => e.PredictedDate).HasColumnName("predicted_date");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            entity.HasOne(e => e.User)
                  .WithMany(u => u.PredictionHistories)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SecurityAuditEvent>(entity =>
        {
            entity.ToTable("security_audit_events");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.OccurredAtUtc).HasColumnName("occurred_at_utc").IsRequired();
            entity.Property(e => e.Kind).HasColumnName("kind").IsRequired().HasMaxLength(40);
            entity.Property(e => e.NormalizedEmail).HasColumnName("normalized_email").HasMaxLength(255);
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.HasIndex(e => e.OccurredAtUtc);
        });

        // PriceAlert
        modelBuilder.Entity<PriceAlert>(entity =>
        {
            entity.ToTable("price_alerts");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
            entity.Property(e => e.Name).HasColumnName("name").IsRequired().HasMaxLength(200);
            entity.Property(e => e.Symbol).HasColumnName("symbol").IsRequired().HasMaxLength(20);
            entity.Property(e => e.TargetType).HasColumnName("target_type").IsRequired().HasMaxLength(10);
            entity.Property(e => e.BasePrice).HasColumnName("base_price").HasPrecision(18, 8);
            entity.Property(e => e.ConditionsJson).HasColumnName("conditions_json").IsRequired();
            entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Symbol);
        });
    }
}
