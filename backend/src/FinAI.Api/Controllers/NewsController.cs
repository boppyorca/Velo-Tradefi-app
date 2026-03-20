using FinAI.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FinAI.Api.Controllers;

[ApiController]
[Route("api/news")]
public class NewsController : ControllerBase
{
    private readonly INewsService _newsService;

    public NewsController(INewsService newsService) => _newsService = newsService;

    [HttpGet]
    public async Task<IActionResult> GetNews(
        [FromQuery] string? category = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var news = await _newsService.GetNewsAsync(category, page, pageSize);
        return Ok(new { data = news, success = true });
    }
}
