namespace FinAI.Infrastructure.Services;

using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using FinAI.Core.Interfaces;
using FinAI.Core.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

public class PredictionService : IPredictionService
{
    private readonly HttpClient _mlClient;
    private readonly ILogger<PredictionService> _logger;

    public PredictionService(
        HttpClient mlClient,
        ILogger<PredictionService> logger,
        IConfiguration config)
    {
        _mlClient = mlClient;
        _logger = logger;
        // Lấy URL từ biến môi trường, mặc định trỏ về máy AI của cậu
        _mlClient.BaseAddress = new Uri(config["PYTHON_AI_SERVICE_URL"]?.TrimEnd('/') ?? "http://localhost:8000");
    }

    public async Task<PredictionDto> GetPredictionAsync(string symbol, string model = "both")
    {
        var sym = symbol.ToUpperInvariant();
        
        try
        {
            _logger.LogInformation("[AI Core] Bắt đầu gọi model {Model} cho mã {Symbol} từ Python FastAPI...", model, sym);

            // Gọi GET sang API Python: /predict/{symbol}?model={model}&days=7
            var requestUri = $"/predict/{sym}?model={model}&days=7";
            var response = await _mlClient.GetAsync(requestUri);
            response.EnsureSuccessStatusCode();

            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var mlResult = await response.Content.ReadFromJsonAsync<MlPredictionResponse>(options);
            
            if (mlResult is null) throw new Exception("Python API trả về JSON rỗng.");

            _logger.LogInformation("[AI Core] Nhận kết quả THẬT từ Python: trend={Trend}, confidence={Confidence}", mlResult.Trend, mlResult.Confidence);

            return new PredictionDto(
                Symbol: sym,
                Model: mlResult.Model, // Lấy đúng model trả về từ Python
                CurrentPrice: mlResult.CurrentPrice,
                Trend: mlResult.Trend,
                Confidence: Math.Round(mlResult.Confidence, 2),
                Predictions: mlResult.Predictions.Select(p => new PredictionPointDto(
                    Date: p.Date,
                    PredictedPrice: p.PredictedPrice,
                    Confidence: p.Confidence,
                    UpperBound: p.UpperBound,
                    LowerBound: p.LowerBound
                )).ToList()
            );
        }
        catch (Exception ex)
        {
            // NẾU PYTHON CHẾT -> BÁO LỖI THẲNG MẶT, KHÔNG DÙNG HÀNG GIẢ!
            _logger.LogError(ex, "[AI Core] Lỗi gọi AI Service. Hãy kiểm tra server Python localhost:8000. Chi tiết: {Message}", ex.Message);
            throw new Exception($"Không thể kết nối đến Trí tuệ Nhân tạo thực. Vui lòng bật ML-Service.", ex);
        }
    }

    public Task<IEnumerable<PredictionDto>> GetPredictionHistoryAsync(string symbol, Guid? userId = null)
    {
        // Xóa sổ hàm Random. Trả về list rỗng nếu Python chưa hỗ trợ lưu lịch sử.
        // Tương lai cậu có thể viết thêm 1 API GET history bên Python rồi gọi HTTP vào đây.
        _logger.LogWarning("[AI Core] Tính năng Lịch sử hiện đang bảo trì để đồng bộ với Python AI.");
        return Task.FromResult<IEnumerable<PredictionDto>>([]);
    }
}

// ── ML Service Response DTOs (Hứng data từ Python) ──────────────────────────

internal sealed class MlPredictionResponse
{
    public string Symbol { get; set; } = "";
    public string Model { get; set; } = "";
    public decimal CurrentPrice { get; set; }
    public string Trend { get; set; } = "neutral";
    public double Confidence { get; set; }
    public List<MlPredictionPoint> Predictions { get; set; } = [];
}

internal sealed class MlPredictionPoint
{
    public string Date { get; set; } = "";
    public decimal PredictedPrice { get; set; }
    public double Confidence { get; set; }
    public decimal UpperBound { get; set; }
    public decimal LowerBound { get; set; }
}