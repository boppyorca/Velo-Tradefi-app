namespace FinAI.Infrastructure.Tests;

using Xunit;
using FinAI.Infrastructure.Services;
using FluentAssertions;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using Moq;
using System.Text;

public class RedisCacheServiceTests
{
    private readonly Mock<IDistributedCache> _mockCache;
    private readonly Mock<ILogger<RedisCacheService>> _mockLogger;
    private readonly RedisCacheService _cacheService;

    public RedisCacheServiceTests()
    {
        _mockCache = new Mock<IDistributedCache>();
        _mockLogger = new Mock<ILogger<RedisCacheService>>();
        _cacheService = new RedisCacheService(_mockCache.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task GetAsync_KeyExists_ReturnsDeserializedObject()
    {
        // Arrange
        var testData = new TestData { Name = "Test", Value = 42 };
        var json = System.Text.Json.JsonSerializer.Serialize(testData);
        _mockCache.Setup(c => c.GetAsync("test-key"))
            .ReturnsAsync(Encoding.UTF8.GetBytes(json));

        // Act
        var result = await _cacheService.GetAsync<TestData>("test-key");

        // Assert
        result.Should().NotBeNull();
        result!.Name.Should().Be("Test");
        result.Value.Should().Be(42);
    }

    [Fact]
    public async Task GetAsync_KeyNotExists_ReturnsNull()
    {
        // Arrange
        _mockCache.Setup(c => c.GetAsync("missing-key"))
            .ReturnsAsync((byte[]?)null);

        // Act
        var result = await _cacheService.GetAsync<TestData>("missing-key");

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task SetAsync_CallsDistributedCache()
    {
        // Arrange
        var testData = new TestData { Name = "Test", Value = 42 };

        // Act
        await _cacheService.SetAsync("test-key", testData, TimeSpan.FromMinutes(5));

        // Assert
        _mockCache.Verify(c => c.SetAsync(
            "test-key",
            It.IsAny<byte[]>(),
            It.Is<DistributedCacheEntryOptions>(o => o.AbsoluteExpirationRelativeToNow == TimeSpan.FromMinutes(5)),
            default), Times.Once);
    }

    [Fact]
    public async Task RemoveAsync_CallsDistributedCache()
    {
        // Act
        await _cacheService.RemoveAsync("test-key");

        // Assert
        _mockCache.Verify(c => c.RemoveAsync("test-key", default), Times.Once);
    }

    [Fact]
    public async Task ExistsAsync_KeyExists_ReturnsTrue()
    {
        // Arrange
        _mockCache.Setup(c => c.GetAsync("existing-key", default))
            .ReturnsAsync(new byte[] { 1 });

        // Act
        var result = await _cacheService.ExistsAsync("existing-key");

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task ExistsAsync_KeyNotExists_ReturnsFalse()
    {
        // Arrange
        _mockCache.Setup(c => c.GetAsync("missing-key", default))
            .ReturnsAsync((byte[]?)null);

        // Act
        var result = await _cacheService.ExistsAsync("missing-key");

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task GetOrSetAsync_WhenCached_ReturnsCachedValue()
    {
        // Arrange
        var cachedData = new TestData { Name = "Cached", Value = 100 };
        var json = System.Text.Json.JsonSerializer.Serialize(cachedData);
        _mockCache.Setup(c => c.GetAsync("cache-key", default))
            .ReturnsAsync(Encoding.UTF8.GetBytes(json));

        var factoryCalled = false;

        // Act
        var result = await _cacheService.GetOrSetAsync(
            "cache-key",
            () => { factoryCalled = true; return Task.FromResult(new TestData { Name = "New", Value = 200 }); });

        // Assert
        result.Name.Should().Be("Cached");
        factoryCalled.Should().BeFalse();
    }

    [Fact]
    public async Task GetOrSetAsync_WhenNotCached_CallsFactory()
    {
        // Arrange
        _mockCache.Setup(c => c.GetAsync("cache-key", default))
            .ReturnsAsync((byte[]?)null);

        var factoryCalled = false;

        // Act
        var result = await _cacheService.GetOrSetAsync(
            "cache-key",
            () => { factoryCalled = true; return Task.FromResult(new TestData { Name = "New", Value = 200 }); });

        // Assert
        result.Name.Should().Be("New");
        result.Value.Should().Be(200);
        factoryCalled.Should().BeTrue();
    }

    [Fact]
    public async Task SetStockCacheAsync_UsesCorrectKeyPrefix()
    {
        // Arrange
        var stockData = new { Price = 100m };

        // Act
        await _cacheService.SetStockCacheAsync("AAPL", stockData);

        // Assert
        _mockCache.Verify(c => c.SetAsync(
            "stock:AAPL",
            It.IsAny<byte[]>(),
            It.IsAny<DistributedCacheEntryOptions>(),
            default), Times.Once);
    }

    [Fact]
    public async Task SetStockCacheAsync_SymbolIsUppercased()
    {
        // Arrange
        var stockData = new { Price = 100m };

        // Act
        await _cacheService.SetStockCacheAsync("aapl", stockData);

        // Assert
        _mockCache.Verify(c => c.SetAsync(
            "stock:AAPL",
            It.IsAny<byte[]>(),
            It.IsAny<DistributedCacheEntryOptions>(),
            default), Times.Once);
    }

    [Fact]
    public async Task InvalidateStockCacheAsync_UsesCorrectKeyPrefix()
    {
        // Act
        await _cacheService.InvalidateStockCacheAsync("AAPL");

        // Assert
        _mockCache.Verify(c => c.RemoveAsync("stock:AAPL", default), Times.Once);
    }

    [Fact]
    public async Task GetStockCacheAsync_UsesCorrectKeyPrefix()
    {
        // Arrange
        _mockCache.Setup(c => c.GetAsync("stock:AAPL", default))
            .ReturnsAsync((byte[]?)null);

        // Act
        await _cacheService.GetStockCacheAsync<TestData>("AAPL");

        // Assert
        _mockCache.Verify(c => c.GetAsync("stock:AAPL", default), Times.Once);
    }
}

public class TestData
{
    public string Name { get; set; } = "";
    public int Value { get; set; }
}

// Tests for RedisCacheService with null cache (graceful degradation)
public class RedisCacheServiceGracefulDegradationTests
{
    private readonly Mock<ILogger<RedisCacheService>> _mockLogger;
    private readonly RedisCacheService _cacheService;

    public RedisCacheServiceGracefulDegradationTests()
    {
        _mockLogger = new Mock<ILogger<RedisCacheService>>();
        // Pass null to simulate Redis not being configured
        _cacheService = new RedisCacheService(null, _mockLogger.Object);
    }

    [Fact]
    public async Task GetAsync_WhenCacheNull_ReturnsNull()
    {
        // Act
        var result = await _cacheService.GetAsync<object>("test-key");

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task SetAsync_WhenCacheNull_DoesNotThrow()
    {
        // Arrange
        var testData = new { Name = "Test" };

        // Act
        var act = async () => await _cacheService.SetAsync("test-key", testData);

        // Assert
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task GetOrSetAsync_WhenCacheNull_CallsFactory()
    {
        // Arrange
        var factoryCalled = false;

        // Act
        var result = await _cacheService.GetOrSetAsync(
            "test-key",
            () => { factoryCalled = true; return Task.FromResult(new { Name = "Factory" }); });

        // Assert
        result.Name.Should().Be("Factory");
        factoryCalled.Should().BeTrue();
    }

    [Fact]
    public async Task ExistsAsync_WhenCacheNull_ReturnsFalse()
    {
        // Act
        var result = await _cacheService.ExistsAsync("test-key");

        // Assert
        result.Should().BeFalse();
    }
}
