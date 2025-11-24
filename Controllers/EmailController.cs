using Microsoft.AspNetCore.Mvc;

[Route("api/gmail")]
[ApiController]
public class EmailController : ControllerBase
{
    private readonly EmailService _emailService;

    public EmailController(EmailService emailService)
    {
        _emailService = emailService;
    }

    // GET: api/gmail/send
    [HttpGet("send")]
    public async Task<IActionResult> SendMail()
    {
        await _emailService.SendAsync(
            to: "vonhacphuoc@gmail.com",
            subject: "Test gửi mail",
            body: "<h3>Xin chào, đây là email test!</h3>"
        );

        return Ok("Mail đã được gửi thành công!");
    }

    [HttpPost("SoanEmail")]
    public async Task<IActionResult> ComposeMail([FromBody] EmailRequest request)
    {
        await _emailService.SendAsync(
            to: request.To,
            subject: request.Subject,
            body: request.Body
        );

        return Ok("Mail đã được gửi thành công từ API soạn mail!");
    }
    public class EmailRequest
    {
        public string To { get; set; }
        public string Subject { get; set; }
        public string Body { get; set; }
    }
}
