namespace FinAI.Api.Tests;

using Xunit;
using FinAI.Api.Controllers;
using FinAI.Core.Interfaces;
using FinAI.Core.Models;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;

public class StocksControllerTests
{
    private readonly Mock<IStockService> _mockStockService;
    private readonly StocksController _controller;

    public StocksControllerTests()
    {
        _mockStockService = new Mock<IStockService>();
        _controller = new StocksController(_mockStockService.Object);
    }

    [Fact]
    public async Task GetStocks_ReturnsOkResult_WithStocksList()
    {
        // Arrange
        var stocks = new List<StockDto>
        {
            new StockDto("AAPL", "Apple Inc.", "NASDAQ", 192.10m, 1.52m, 0.80m, 58230000, 2980000000000m, DateTime.UtcNow),
            new StockDto("TSLA", "Tesla Inc.", "NASDAQ", 248.50m, -1.25m, -0.50m, 31800000, 792000000000m, DateTime.UtcNow)
        };
        _mockStockService.Setup(s => s.GetStocksAsync(null, 1, 20))
            .ReturnsAsync(stocks);

        // Act
        var result = await _controller.GetStocks();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();
    }

    [Fact]
    public async Task GetStocks_WithExchangeFilter_CallsServiceWithCorrectParameter()
    {
        // Arrange
        var stocks = new List<StockDto>
        {
            new StockDto("VNM", "Vietnam Dairy", "HOSE", 78500m, -952m, -1.20m, 3200000, 138000000000m, DateTime.UtcNow)
        };
        _mockStockService.Setup(s => s.GetStocksAsync("VN", 1, 20))
            .ReturnsAsync(stocks);

        // Act
        var result = await _controller.GetStocks(exchange: "VN");

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        _mockStockService.Verify(s => s.GetStocksAsync("VN", 1, 20), Times.Once);
    }

    [Fact]
    public async Task GetStockQuote_ExistingSymbol_ReturnsOkResult()
    {
        // Arrange
        var stock = new StockDto("AAPL", "Apple Inc.", "NASDAQ", 192.10m, 1.52m, 0.80m, 58230000, 2980000000000m, DateTime.UtcNow);
        _mockStockService.Setup(s => s.GetStockQuoteAsync("AAPL"))
            .ReturnsAsync(stock);

        // Act
        var result = await _controller.GetStockQuote("AAPL");

        // Assert
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetStockQuote_NonExistingSymbol_ReturnsNotFound()
    {
        // Arrange
        _mockStockService.Setup(s => s.GetStockQuoteAsync("INVALID"))
            .ReturnsAsync((StockDto?)null);

        // Act
        var result = await _controller.GetStockQuote("INVALID");

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task SearchStocks_ValidQuery_ReturnsOkResult()
    {
        // Arrange
        var stocks = new List<StockDto>
        {
            new StockDto("AAPL", "Apple Inc.", "NASDAQ", 192.10m, 1.52m, 0.80m, 58230000, 2980000000000m, DateTime.UtcNow)
        };
        _mockStockService.Setup(s => s.SearchStocksAsync("apple"))
            .ReturnsAsync(stocks);

        // Act
        var result = await _controller.SearchStocks("apple");

        // Assert
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task SearchStocks_EmptyQuery_ReturnsBadRequest()
    {
        // Act
        var result = await _controller.SearchStocks("");

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task SearchStocks_NullQuery_ReturnsBadRequest()
    {
        // Act
        var result = await _controller.SearchStocks(null!);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task GetStockHistory_ValidSymbol_ReturnsOkResult()
    {
        // Arrange
        var history = new List<StockHistoryDto>
        {
            new StockHistoryDto(DateTime.UtcNow.AddDays(-1), 190m, 193m, 189m, 192m, 58000000),
            new StockHistoryDto(DateTime.UtcNow, 192m, 195m, 191m, 194m, 62000000)
        };
        _mockStockService.Setup(s => s.GetHistoryAsync("AAPL", "1mo"))
            .ReturnsAsync(history);

        // Act
        var result = await _controller.GetStockHistory("AAPL", "1mo");

        // Assert
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetStockHistory_EmptyHistory_ReturnsNotFound()
    {
        // Arrange
        _mockStockService.Setup(s => s.GetHistoryAsync("INVALID", "1mo"))
            .ReturnsAsync(new List<StockHistoryDto>());

        // Act
        var result = await _controller.GetStockHistory("INVALID", "1mo");

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetStocks_WithPagination_ReturnsCorrectPage()
    {
        // Arrange
        var stocks = new List<StockDto>
        {
            new StockDto("AAPL", "Apple Inc.", "NASDAQ", 192.10m, 1.52m, 0.80m, 58230000, 2980000000000m, DateTime.UtcNow)
        };
        _mockStockService.Setup(s => s.GetStocksAsync(null, 2, 10))
            .ReturnsAsync(stocks);

        // Act
        var result = await _controller.GetStocks(page: 2, pageSize: 10);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        _mockStockService.Verify(s => s.GetStocksAsync(null, 2, 10), Times.Once);
    }
}
