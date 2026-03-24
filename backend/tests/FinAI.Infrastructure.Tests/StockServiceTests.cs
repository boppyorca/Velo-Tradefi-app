namespace FinAI.Infrastructure.Tests;

using Xunit;
using FinAI.Core.Interfaces;
using FinAI.Core.Models;
using FinAI.Infrastructure.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

public class StockServiceTests
{
    private readonly Mock<HttpClient> _mockHttpClient;
    private readonly Mock<ILogger<StockService>> _mockLogger;
    private readonly StockService _stockService;

    public StockServiceTests()
    {
        var handler = new MockHttpMessageHandler();
        _mockHttpClient = new Mock<HttpClient>(handler);
        _mockLogger = new Mock<ILogger<StockService>>();
        _stockService = new StockService(_mockHttpClient.Object, _mockLogger.Object);
    }

    [Fact]
    public void SymbolMap_ContainsUSStocks()
    {
        // SymbolMap is public static
        StockService.SymbolMap.Should().ContainKey("AAPL");
        StockService.SymbolMap.Should().ContainKey("TSLA");
        StockService.SymbolMap.Should().ContainKey("NVDA");
    }

    [Fact]
    public void SymbolMap_ContainsVNStocks()
    {
        StockService.SymbolMap.Should().ContainKey("VNM");
        StockService.SymbolMap.Should().ContainKey("FPT");
        StockService.SymbolMap.Should().ContainKey("TCB");
        StockService.SymbolMap.Should().ContainKey("HPG");
    }

    [Fact]
    public void SymbolMap_VNStocks_HaveCorrectExchange()
    {
        StockService.SymbolMap["VNM"].Exchange.Should().Be("HOSE");
        StockService.SymbolMap["FPT"].Exchange.Should().Be("HOSE");
        StockService.SymbolMap["TCB"].Exchange.Should().Be("HOSE");
    }

    [Fact]
    public void SymbolMap_USStocks_HaveCorrectExchange()
    {
        StockService.SymbolMap["AAPL"].Exchange.Should().Be("NASDAQ");
        StockService.SymbolMap["JPM"].Exchange.Should().Be("NYSE");
        StockService.SymbolMap["TSLA"].Exchange.Should().Be("NASDAQ");
    }

    [Fact]
    public async Task GetStocksAsync_ReturnsStocks()
    {
        // Act
        var stocks = await _stockService.GetStocksAsync();

        // Assert
        stocks.Should().NotBeNull();
        stocks.Should().NotBeEmpty();
    }

    [Fact]
    public async Task GetStocksAsync_WithVNFilter_ReturnsOnlyVNStocks()
    {
        // Act
        var stocks = (await _stockService.GetStocksAsync("VN")).ToList();

        // Assert
        stocks.Should().NotBeEmpty();
        stocks.All(s => s.Exchange == "HOSE" || s.Exchange == "HNX").Should().BeTrue();
    }

    [Fact]
    public async Task GetStocksAsync_WithUSFilter_ReturnsOnlyUSStocks()
    {
        // Act
        var stocks = (await _stockService.GetStocksAsync("US")).ToList();

        // Assert
        stocks.Should().NotBeEmpty();
        stocks.All(s => s.Exchange == "NASDAQ" || s.Exchange == "NYSE").Should().BeTrue();
    }

    [Fact]
    public async Task GetStockQuoteAsync_AAPL_ReturnsValidQuote()
    {
        // Act
        var stock = await _stockService.GetStockQuoteAsync("AAPL");

        // Assert
        stock.Should().NotBeNull();
        stock!.Symbol.Should().Be("AAPL");
        stock.Name.Should().Be("Apple Inc.");
        stock.Exchange.Should().Be("NASDAQ");
        stock.Price.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task GetStockQuoteAsync_VNM_ReturnsValidVNQuote()
    {
        // Act
        var stock = await _stockService.GetStockQuoteAsync("VNM");

        // Assert
        stock.Should().NotBeNull();
        stock!.Symbol.Should().Be("VNM");
        stock.Exchange.Should().Be("HOSE");
        stock.Price.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task GetStockQuoteAsync_CaseInsensitive()
    {
        // Act
        var stockLower = await _stockService.GetStockQuoteAsync("aapl");
        var stockUpper = await _stockService.GetStockQuoteAsync("AAPL");

        // Assert
        stockLower.Should().NotBeNull();
        stockUpper.Should().NotBeNull();
        stockLower!.Symbol.Should().Be("AAPL");
        stockUpper!.Symbol.Should().Be("AAPL");
    }

    [Fact]
    public async Task SearchStocksAsync_BySymbol_ReturnsMatches()
    {
        // Act
        var results = (await _stockService.SearchStocksAsync("AAPL")).ToList();

        // Assert
        results.Should().NotBeEmpty();
        results.Should().Contain(s => s.Symbol == "AAPL");
    }

    [Fact]
    public async Task SearchStocksAsync_ByName_ReturnsMatches()
    {
        // Act
        var results = (await _stockService.SearchStocksAsync("Apple")).ToList();

        // Assert
        results.Should().NotBeEmpty();
        results.Should().Contain(s => s.Name.Contains("Apple", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task SearchStocksAsync_CaseInsensitive()
    {
        // Act
        var resultsLower = (await _stockService.SearchStocksAsync("apple")).ToList();
        var resultsUpper = (await _stockService.SearchStocksAsync("APPLE")).ToList();

        // Assert
        resultsLower.Should().BeEquivalentTo(resultsUpper);
    }

    [Fact]
    public async Task SearchStocksAsync_ReturnsMax10Results()
    {
        // Act
        var results = (await _stockService.SearchStocksAsync("")).ToList();

        // Assert
        results.Count.Should().BeLessOrEqualTo(10);
    }

    [Fact]
    public async Task GetHistoryAsync_ValidSymbol_ReturnsHistory()
    {
        // Act
        var history = (await _stockService.GetHistoryAsync("AAPL", "1mo")).ToList();

        // Assert
        history.Should().NotBeEmpty();
        history.All(h => h.Close > 0).Should().BeTrue();
        history.All(h => h.Volume >= 0).Should().BeTrue();
    }

    [Theory]
    [InlineData("1D")]
    [InlineData("1W")]
    [InlineData("1M")]
    [InlineData("3M")]
    [InlineData("1Y")]
    [InlineData("ALL")]
    public async Task GetHistoryAsync_AllPeriods_ReturnData(string period)
    {
        // Act
        var history = (await _stockService.GetHistoryAsync("AAPL", period)).ToList();

        // Assert
        history.Should().NotBeEmpty();
    }
}

// Mock HttpMessageHandler for testing without actual HTTP calls
public class MockHttpMessageHandler : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var response = new HttpResponseMessage(System.Net.HttpStatusCode.OK)
        {
            Content = new StringContent("{}")
        };
        return Task.FromResult(response);
    }
}
