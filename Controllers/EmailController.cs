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

    [HttpPost("SoanEmail")]
    public async Task<IActionResult> ComposeMail([FromBody] EmailRequest request)
    {
        // Gửi email theo yêu cầu
        await _emailService.SendAsync(
            to: request.To,
            subject: request.Subject,
            body: request.Body
        );

        return Ok("Mail đã được gửi thành công từ API soạn mail!");
    }
    // DTO cho yêu cầu email
    public class EmailRequest
    {
        public string To { get; set; }
        public string Subject { get; set; }
        public string Body { get; set; }
    }
}
