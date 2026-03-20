using FinAI.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FinAI.Api.Controllers;

[ApiController]
[Route("api/memecoins")]
public class MemecoinsController : ControllerBase
{
    private readonly IMemecoinService _memecoinService;

    public MemecoinsController(IMemecoinService memecoinService) => _memecoinService = memecoinService;

    [HttpGet]
    public async Task<IActionResult> GetMemecoins(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var coins = await _memecoinService.GetMemecoinsAsync(page, pageSize);
        return Ok(new { data = coins, success = true });
    }

    [HttpGet("prices")]
    public async Task<IActionResult> GetPrices([FromQuery] string ids)
    {
        if (string.IsNullOrWhiteSpace(ids))
            return BadRequest(new { success = false, message = "Parameter 'ids' is required" });

        var coins = await _memecoinService.GetMemecoinPricesAsync(ids);
        return Ok(new { data = coins, success = true });
    }
}
