namespace FinAI.Core.Interfaces;

using FinAI.Core.Models;

public interface IPredictionService
{
    Task<PredictionDto> GetPredictionAsync(string symbol, string model = "lstm");
    Task<IEnumerable<PredictionDto>> GetPredictionHistoryAsync(string symbol, Guid? userId = null);
}
