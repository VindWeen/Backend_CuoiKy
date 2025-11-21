using Microsoft.AspNetCore.Mvc;
using Backend_Cuoiky.DTOs;
using Backend_Cuoiky.Models;
using System.Security.Cryptography;
using System.Text;

namespace Backend_Cuoiky.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDBcontext _db;
        private readonly IConfiguration _config;

        public AuthController(AppDBcontext db, IConfiguration config)
        {
            _db = db;
            _config = config;
        }
         // Hàm hash mật khẩu
        private string HashPassword(string password)
        {
            using var sha = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(password);
            var hash = sha.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }
        // Đăng ký người dùng
        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterDTO dto)
        {
            // Check username tồn tại
            if (_db.Users.Any(u => u.Username == dto.Username))
                return BadRequest("Username already exists");

            // Mã hóa mật khẩu
            string hash = HashPassword(dto.Password);
            var user = new Users
            {
                Username = dto.Username,
                Password = hash,
                Role = dto.Role
            };

            _db.Users.Add(user);
            _db.SaveChanges();

            return Ok("Đăng ký thành công.");
        }
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDTO dto)
        {
            string hash = HashPassword(dto.Password);
            var user = _db.Users.FirstOrDefault(u => u.Username == dto.Username && u.Password == hash);
            if (user == null)
                return Unauthorized("Tên đăng nhập hoặc mật khẩu không đúng.");

            string token = GenerateJwtToken(user);

            return Ok(new { Message = "Đăng nhập thành công", userID = user.Id, Role = user.Role, Token = token });
        }
        // Hàm tạo JWT
        private string GenerateJwtToken(Users user)
        {
            var claims = new[]
            {
                new Claim("userId", user.Id.ToString()),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
            var cred = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(3),
                signingCredentials: cred
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}