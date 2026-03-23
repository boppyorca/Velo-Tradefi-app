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
    }
}
