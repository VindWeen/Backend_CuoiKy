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

        public AuthController(AppDBcontext db)
        {
            _db = db;
        }
         // Hàm hash mật khẩu
        private string HashPassword(string password)
        {
            using var sha = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(password);
            var hash = sha.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }

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

            return Ok(new { Message = "Đăng nhập thành công", Role = user.Role });
        }
    }
}