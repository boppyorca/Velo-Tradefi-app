using System.Net.Http.Json;
using System.Text.Json;
using FinAI.Core.Interfaces;
using FinAI.Core.Models;
using Microsoft.AspNetCore.Mvc;

namespace FinAI.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _httpClientFactory;

    public AuthController(
        IUserRepository userRepository,
        IConfiguration config,
        IHttpClientFactory httpClientFactory)
    {
        _userRepository = userRepository;
        _config = config;
        _httpClientFactory = httpClientFactory;
    }

    /// <summary>
    /// Register with email/password via Supabase Auth
    /// </summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        // Validate input
        if (string.IsNullOrWhiteSpace(request.Email) || !request.Email.Contains('@'))
            return BadRequest(new { success = false, message = "Invalid email address" });

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
            return BadRequest(new { success = false, message = "Password must be at least 6 characters" });

        if (string.IsNullOrWhiteSpace(request.FullName))
            return BadRequest(new { success = false, message = "Full name is required" });

        var supabaseUrl = _config["SUPABASE_URL"];
        var supabaseKey = _config["SUPABASE_SERVICE_ROLE_KEY"];

        // Check if Supabase Auth is configured
        if (!string.IsNullOrEmpty(supabaseUrl) && !string.IsNullOrEmpty(supabaseKey))
        {
            // ── Use Supabase Auth API ──
            try
            {
                var client = _httpClientFactory.CreateClient("SupabaseAuth");
                client.DefaultRequestHeaders.Add("apikey", supabaseKey);

                var signupResponse = await client.PostAsJsonAsync(
                    $"{supabaseUrl}/auth/v1/signup",
                    new
                    {
                        email = request.Email,
                        password = request.Password,
                        options = new
                        {
                            data = new { full_name = request.FullName }
                        }
                    },
                    new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

                if (signupResponse.IsSuccessStatusCode)
                {
                    var result = await signupResponse.Content.ReadFromJsonAsync<SupabaseAuthResponse>();
                    var fullName = result?.User?.UserMetadata != null &&
                                   result.User.UserMetadata.TryGetValue("full_name", out var fn)
                        ? fn.GetString()
                        : "";
                    return Ok(new AuthResponseDto(
                        Token: result!.Session!.AccessToken,
                        User: new UserDto(
                            Guid.Parse(result.User!.Id!),
                            result.User.Email!,
                            fullName ?? ""
                        )
                    ));
                }

                var errorContent = await signupResponse.Content.ReadAsStringAsync();
                if (errorContent.Contains("already registered"))
                {
                    return Conflict(new { success = false, message = "Email already registered" });
                }

                return BadRequest(new { success = false, message = "Registration failed", error = errorContent });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Supabase error", error = ex.Message });
            }
        }

        // ── Fallback: Custom JWT (Development) ──
        if (await _userRepository.ExistsAsync(request.Email))
            return Conflict(new { success = false, message = "Email already registered" });

        var user = new FinAI.Core.Entities.User
        {
            Id = Guid.NewGuid(),
            Email = request.Email.ToLowerInvariant().Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = request.FullName.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        await _userRepository.CreateAsync(user);

        // Generate custom JWT (development only)
        var token = GenerateJwt(user);
        return Ok(new AuthResponseDto(
            Token: token,
            User: new UserDto(user.Id, user.Email, user.FullName)
        ));
    }

    /// <summary>
    /// Login with email/password via Supabase Auth
    /// </summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { success = false, message = "Email and password are required" });

        var supabaseUrl = _config["SUPABASE_URL"];
        var supabaseKey = _config["SUPABASE_SERVICE_ROLE_KEY"];

        // Check if Supabase Auth is configured
        if (!string.IsNullOrEmpty(supabaseUrl) && !string.IsNullOrEmpty(supabaseKey))
        {
            // ── Use Supabase Auth API ──
            try
            {
                var client = _httpClientFactory.CreateClient("SupabaseAuth");
                client.DefaultRequestHeaders.Add("apikey", supabaseKey);

                var loginResponse = await client.PostAsJsonAsync(
                    $"{supabaseUrl}/auth/v1/token?grant_type=password",
                    new
                    {
                        email = request.Email,
                        password = request.Password
                    },
                    new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

                if (loginResponse.IsSuccessStatusCode)
                {
                    var result = await loginResponse.Content.ReadFromJsonAsync<SupabaseAuthResponse>();
                    var fullName = result?.User?.UserMetadata != null &&
                                   result.User.UserMetadata.TryGetValue("full_name", out var fn)
                        ? fn.GetString()
                        : "";
                    return Ok(new AuthResponseDto(
                        Token: result!.Session!.AccessToken,
                        User: new UserDto(
                            Guid.Parse(result.User!.Id!),
                            result.User.Email!,
                            fullName ?? ""
                        )
                    ));
                }

                return Unauthorized(new { success = false, message = "Invalid email or password" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Supabase error", error = ex.Message });
            }
        }

        // ── Fallback: Custom JWT (Development) ──
        var user = await _userRepository.GetByEmailAsync(request.Email.ToLowerInvariant().Trim());
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { success = false, message = "Invalid email or password" });

        var token = GenerateJwt(user);
        return Ok(new AuthResponseDto(
            Token: token,
            User: new UserDto(user.Id, user.Email, user.FullName)
        ));
    }

    /// <summary>
    /// Get current user info
    /// </summary>
    [HttpGet("me")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> GetMe()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { success = false, message = "Invalid token" });

        var user = await _userRepository.GetByIdAsync(userId);
        if (user is null)
            return NotFound(new { success = false, message = "User not found" });

        return Ok(new UserDto(user.Id, user.Email, user.FullName));
    }

    /// <summary>
    /// Refresh token
    /// </summary>
    [HttpPost("refresh")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        var supabaseUrl = _config["SUPABASE_URL"];
        var supabaseKey = _config["SUPABASE_SERVICE_ROLE_KEY"];

        if (string.IsNullOrEmpty(supabaseUrl) || string.IsNullOrEmpty(supabaseKey))
            return BadRequest(new { success = false, message = "Supabase not configured" });

        try
        {
            var client = _httpClientFactory.CreateClient("SupabaseAuth");
            client.DefaultRequestHeaders.Add("apikey", supabaseKey);

            var refreshResponse = await client.PostAsJsonAsync(
                $"{supabaseUrl}/auth/v1/token?grant_type=refresh_token",
                new { refresh_token = request.RefreshToken },
                new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

            if (refreshResponse.IsSuccessStatusCode)
            {
                var result = await refreshResponse.Content.ReadFromJsonAsync<SupabaseAuthResponse>();
                return Ok(new
                {
                    token = result!.Session!.AccessToken,
                    refreshToken = result.Session.RefreshToken,
                    expiresIn = result.Session.ExpiresIn
                });
            }

            return Unauthorized(new { success = false, message = "Invalid refresh token" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Refresh failed", error = ex.Message });
        }
    }

    /// <summary>
    /// Logout / Revoke session
    /// </summary>
    [HttpPost("logout")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> Logout()
    {
        var supabaseUrl = _config["SUPABASE_URL"];
        var supabaseKey = _config["SUPABASE_SERVICE_ROLE_KEY"];

        if (!string.IsNullOrEmpty(supabaseUrl) && !string.IsNullOrEmpty(supabaseKey))
        {
            try
            {
                var client = _httpClientFactory.CreateClient("SupabaseAuth");
                client.DefaultRequestHeaders.Add("apikey", supabaseKey);

                var logoutRequest = new HttpRequestMessage(HttpMethod.Post, $"{supabaseUrl}/auth/v1/logout");
                logoutRequest.Headers.Add("Authorization", Request.Headers.Authorization.ToString());

                await client.SendAsync(logoutRequest);
            }
            catch
            {
                // Ignore logout errors
            }
        }

        return Ok(new { success = true, message = "Logged out successfully" });
    }

    // ── Helpers ──────────────────────────────────────────────────

    private string GenerateJwt(FinAI.Core.Entities.User user)
    {
        var jwtSecret = _config["JWT_SECRET_KEY"] ?? "VeloFinAI-SuperSecretKey-32chars-min!";
        var expiryDays = int.Parse(_config["JWT_EXPIRY_DAYS"] ?? "7");

        var key = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
            System.Text.Encoding.UTF8.GetBytes(jwtSecret));
        var credentials = new Microsoft.IdentityModel.Tokens.SigningCredentials(
            key, Microsoft.IdentityModel.Tokens.SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new System.Security.Claims.Claim(
                System.Security.Claims.ClaimTypes.NameIdentifier, user.Id.ToString()),
            new System.Security.Claims.Claim(
                System.Security.Claims.ClaimTypes.Email, user.Email),
            new System.Security.Claims.Claim(
                System.Security.Claims.ClaimTypes.Name, user.FullName),
        };

        var token = new System.IdentityModel.Tokens.Jwt.JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddDays(expiryDays),
            signingCredentials: credentials
        );

        return new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler().WriteToken(token);
    }
}

// ── Supabase Auth Response Models ─────────────────────────────────

internal class SupabaseAuthResponse
{
    public SupabaseUser? User { get; set; }
    public SupabaseSession? Session { get; set; }
}

internal class SupabaseUser
{
    public string? Id { get; set; }
    public string? Email { get; set; }
    public Dictionary<string, JsonElement>? UserMetadata { get; set; }
}

internal class SupabaseSession
{
    public string? AccessToken { get; set; }
    public string? RefreshToken { get; set; }
    public int ExpiresIn { get; set; }
}

public class RefreshTokenRequest
{
    public string RefreshToken { get; set; } = "";
}
