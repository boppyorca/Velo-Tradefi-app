namespace FinAI.Core.Interfaces;

using FinAI.Core.Models;

public interface IWeb3Service
{
    Task<WalletBalanceDto> GetWalletBalanceAsync(string address);
}
