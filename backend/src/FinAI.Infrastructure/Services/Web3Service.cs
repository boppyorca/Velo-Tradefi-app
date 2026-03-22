namespace FinAI.Infrastructure.Services;

using System.Net.Http.Json;
using FinAI.Core.Interfaces;
using FinAI.Core.Models;

public class Web3Service : IWeb3Service
{
    private readonly HttpClient _http;
    private const string MainnetRpc = "https://eth.llamarpc.com";
    private const string SepoliaRpc = "https://rpc.sepolia.org";

    public Web3Service(HttpClient http) => _http = http;

    public async Task<WalletBalanceDto> GetWalletBalanceAsync(string address)
    {
        var normalizedAddress = address.ToLowerInvariant();

        if (!normalizedAddress.StartsWith("0x") || normalizedAddress.Length != 42)
        {
            throw new ArgumentException("Invalid Ethereum address format", nameof(address));
        }

        var chainId = "1"; // Default to mainnet
        decimal ethBalance = 0m;

        try
        {
            // eth_getBalance
            var balanceParams = new { to = address, datatype = "quantity" };
            var balanceResponse = await _http.PostAsJsonAsync(
                $"{MainnetRpc}",
                new
                {
                    jsonrpc = "2.0",
                    id = 1,
                    method = "eth_getBalance",
                    @params = new object[] { address, "latest" }
                });

            if (balanceResponse.IsSuccessStatusCode)
            {
                var balanceJson = await balanceResponse.Content.ReadFromJsonAsync<RpcResponse>();
                if (balanceJson?.Result is not null)
                {
                    var hexBalance = balanceJson.Result.TrimStart('0');
                    if (!string.IsNullOrEmpty(hexBalance) && hexBalance.Length <= 64)
                    {
                    var wei = hexBalance.Length > 0
                        ? System.Numerics.BigInteger.Parse($"0x{hexBalance}")
                        : System.Numerics.BigInteger.Zero;
                    // wei / 1e18 = ETH; cast safely via string to avoid overflow
                    ethBalance = decimal.Parse(wei.ToString()) / 1_000_000_000_000_000_000m;
                    }
                }

                // eth_chainId
                var chainResponse = await _http.PostAsJsonAsync(
                    $"{MainnetRpc}",
                    new
                    {
                        jsonrpc = "2.0",
                        id = 1,
                        method = "eth_chainId",
                        @params = Array.Empty<object>()
                    });

                if (chainResponse.IsSuccessStatusCode)
                {
                    var chainJson = await chainResponse.Content.ReadFromJsonAsync<RpcResponse>();
                    if (chainJson?.Result is not null)
                    {
                        var hexChainId = chainJson.Result.TrimStart('0');
                        if (!string.IsNullOrEmpty(hexChainId))
                            chainId = Convert.ToInt64($"0x{hexChainId}").ToString();
                    }
                }
            }
        }
        catch
        {
            // Fallback: return zero balance (public RPC may rate-limit)
        }

        return new WalletBalanceDto(
            Address: address,
            ChainId: chainId,
            EthBalance: Math.Round(ethBalance, 6),
            Tokens: []
        );
    }
}

// ── JSON-RPC types ──────────────────────────────────────────────────────────────

internal class RpcResponse
{
    [System.Text.Json.Serialization.JsonPropertyName("jsonrpc")]
    public string JsonRpc { get; set; } = "";

    [System.Text.Json.Serialization.JsonPropertyName("id")]
    public int Id { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("result")]
    public string? Result { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("error")]
    public RpcError? Error { get; set; }
}

internal class RpcError
{
    [System.Text.Json.Serialization.JsonPropertyName("code")]
    public int Code { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("message")]
    public string? Message { get; set; }
}
