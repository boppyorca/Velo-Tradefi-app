namespace FinAI.Infrastructure.Services;

using FinAI.Core.Interfaces;
using FinAI.Core.Models;

public class Web3Service : IWeb3Service
{
    public Task<WalletBalanceDto> GetWalletBalanceAsync(string address)
    {
        // Mock wallet balance — in production, use ethers.js or Nethereum
        // to call eth_getBalance on the Ethereum JSON-RPC endpoint
        var normalizedAddress = address.ToLowerInvariant();

        if (!normalizedAddress.StartsWith("0x") || normalizedAddress.Length != 42)
        {
            throw new ArgumentException("Invalid Ethereum address format", nameof(address));
        }

        return Task.FromResult(new WalletBalanceDto(
            Address: address,
            ChainId: "1", // Ethereum Mainnet
            EthBalance: 0.0m,
            Tokens: []
        ));
    }
}
