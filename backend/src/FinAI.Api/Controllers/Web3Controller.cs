using FinAI.Core.Interfaces;
using FinAI.Core.Models;
using FinAI.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinAI.Api.Controllers;

[ApiController]
[Route("api/web3")]
public class Web3Controller : ControllerBase
{
    private readonly IWeb3Service _web3Service;
    private readonly IUserRepository _userRepository;
    private readonly IWeb3SignatureService _signatureService;
    private readonly ILogger<Web3Controller> _logger;

    public Web3Controller(
        IWeb3Service web3Service,
        IUserRepository userRepository,
        IWeb3SignatureService signatureService,
        ILogger<Web3Controller> logger)
    {
        _web3Service = web3Service;
        _userRepository = userRepository;
        _signatureService = signatureService;
        _logger = logger;
    }

    [HttpGet("balance/{address}")]
    public async Task<IActionResult> GetBalance(string address)
    {
        try
        {
            // Validate address format
            if (!_signatureService.IsValidEthereumAddress(address))
                return BadRequest(new { success = false, message = "Invalid Ethereum address format" });

            var balance = await _web3Service.GetWalletBalanceAsync(address);
            return Ok(new { data = balance, success = true });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting balance for {Address}", address);
            return StatusCode(500, new { success = false, message = "Failed to fetch wallet balance" });
        }
    }

    /// <summary>
    /// Get a challenge message for wallet signature verification
    /// </summary>
    [HttpGet("challenge")]
    public IActionResult GetChallenge([FromQuery] string? address = null)
    {
        var message = _signatureService.GenerateChallengeMessage(address);
        return Ok(new { data = new { message }, success = true });
    }

    /// <summary>
    /// Connect wallet with MetaMask signature verification
    /// Requires: address, message (challenge), signature
    /// </summary>
    [Authorize]
    [HttpPost("connect")]
    public async Task<IActionResult> ConnectWallet([FromBody] WalletConnectWithSignatureRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Address))
            return BadRequest(new { success = false, message = "Wallet address is required" });

        // Validate Ethereum address format
        if (!_signatureService.IsValidEthereumAddress(request.Address))
            return BadRequest(new { success = false, message = "Invalid Ethereum address format" });

        var normalizedAddress = request.Address.ToLowerInvariant();

        // Verify signature (prevents wallet spoofing)
        if (!string.IsNullOrWhiteSpace(request.Signature) && !string.IsNullOrWhiteSpace(request.Message))
        {
            var isValid = _signatureService.VerifySignature(
                normalizedAddress,
                request.Message,
                request.Signature);

            if (!isValid)
            {
                _logger.LogWarning("Signature verification failed for address: {Address}", normalizedAddress);
                return BadRequest(new { success = false, message = "Invalid signature. Wallet ownership could not be verified." });
            }
            _logger.LogInformation("Signature verified successfully for address: {Address}", normalizedAddress);
        }
        else
        {
            // Fallback: just verify address format (less secure, but still validates format)
            _logger.LogWarning("Connect wallet without signature verification for: {Address}", normalizedAddress);
        }

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

    /// <summary>
    /// Legacy connect wallet (without signature verification)
    /// </summary>
    [Authorize]
    [HttpPost("connect-simple")]
    public async Task<IActionResult> ConnectWalletSimple([FromBody] WalletConnectRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Address))
            return BadRequest(new { success = false, message = "Wallet address is required" });

        var normalizedAddress = request.Address.ToLowerInvariant();
        if (!_signatureService.IsValidEthereumAddress(normalizedAddress))
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

// Extended request with signature
public record WalletConnectWithSignatureRequest(
    string Address,
    string? Message = null,
    string? Signature = null
);
