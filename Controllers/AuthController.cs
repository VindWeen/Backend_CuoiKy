using Microsoft.AspNetCore.Mvc;
using Backend_CuoiKy.DTOs;
using Backend_CuoiKy.Models;
using Backend_CuoiKy.Data;
using System.Security.Cryptography;
using System.Text;
using Backend_Cuoiky.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Backend_CuoiKy.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IConfiguration _config;

        public AuthController(AppDbContext db, IConfiguration config)
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
            if (_db.User.Any(u => u.Username == dto.Username))
                return BadRequest("Tài khoản đã tồn tại.");

            string hash = HashPassword(dto.Password);

            var user = new User
            {
                Username = dto.Username,
                Password = hash,
                Role = dto.Role
            };

            _db.User.Add(user);
            _db.SaveChanges();

            return Ok("Đăng ký thành công.");
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDTO dto)
        {
            string hash = HashPassword(dto.Password);

            var user = _db.User.FirstOrDefault(u => 
                u.Username == dto.Username 
                && u.Password == hash);

            if (user == null)
                return Unauthorized("Tên đăng nhập hoặc mật khẩu không đúng.");

            string token = GenerateJwtToken(user);

            // Trả về token cùng thông tin người dùng
            return Ok(new { Message = "Đăng nhập thành công", userID = user.Id, Role = user.Role, Token = token });
        }
        // Hàm tạo JWT
        private string GenerateJwtToken(User user)
        {
            // Tạo các claim cho token
            var claims = new[]
            {
                new Claim("userId", user.Id.ToString()),
                new Claim(ClaimTypes.Role, user.Role)
            };
            // Tạo khóa bảo mật và chữ ký
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
