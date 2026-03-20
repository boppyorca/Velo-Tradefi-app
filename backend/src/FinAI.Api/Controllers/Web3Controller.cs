using FinAI.Core.Interfaces;
using FinAI.Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinAI.Api.Controllers;

[ApiController]
[Route("api/web3")]
public class Web3Controller : ControllerBase
{
    private readonly IWeb3Service _web3Service;
    private readonly IUserRepository _userRepository;

    public Web3Controller(IWeb3Service web3Service, IUserRepository userRepository)
    {
        _web3Service = web3Service;
        _userRepository = userRepository;
    }

    [HttpGet("balance/{address}")]
    public async Task<IActionResult> GetBalance(string address)
    {
        try
        {
            var balance = await _web3Service.GetWalletBalanceAsync(address);
            return Ok(new { data = balance, success = true });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [Authorize]
    [HttpPost("connect")]
    public async Task<IActionResult> ConnectWallet([FromBody] WalletConnectRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Address))
            return BadRequest(new { success = false, message = "Wallet address is required" });

        var normalizedAddress = request.Address.ToLowerInvariant();
        if (!normalizedAddress.StartsWith("0x") || normalizedAddress.Length != 42)
            return BadRequest(new { success = false, message = "Invalid Ethereum address format" });

        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { success = false, message = "Invalid token" });

        var user = await _userRepository.GetByIdAsync(userId);
        if (user is null)
            return NotFound(new { success = false, message = "User not found" });

        user.WalletAddress = normalizedAddress;
        await _userRepository.UpdateAsync(user);

        return Ok(new { success = true, message = "Wallet connected successfully", address = normalizedAddress });
    }
}
