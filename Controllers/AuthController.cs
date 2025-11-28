using Microsoft.AspNetCore.Mvc;
using Backend_CuoiKy.DTOs;
using Backend_CuoiKy.Models;
using Backend_CuoiKy.Data;
using System.Security.Cryptography;
using System.Text;
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
            // Sử dụng SHA256 để hash mật khẩu
            using var sha = SHA256.Create();
            // Chuyển đổi mật khẩu thành mảng byte và hash
            var bytes = Encoding.UTF8.GetBytes(password);
            // Tạo hash
            var hash = sha.ComputeHash(bytes);
            // Chuyển đổi hash thành chuỗi Base64 để lưu trữ
            return Convert.ToBase64String(hash);
        }
        // Đăng ký người dùng
        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterDTO dto)
        {
            // Kiểm tra nếu tên đăng nhập đã tồn tại
            if (_db.User.Any(u => u.Username == dto.Username))
                return BadRequest("Tài khoản đã tồn tại.");
            // Hash mật khẩu
            string hash = HashPassword(dto.Password);
            // Tạo người dùng mới
            var user = new User
            {
                Username = dto.Username,
                Password = hash,
                Role = dto.Role
            };

            _db.User.Add(user);
            _db.SaveChanges();

            return Ok(new { message = "Tạo tài khoản thành công", userId = user.Id });
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDTO dto)
        {
            // Hash mật khẩu
            string hash = HashPassword(dto.Password);
            // Tìm người dùng với tên đăng nhập và mật khẩu đã hash
            var user = _db.User.FirstOrDefault(u => 
                u.Username == dto.Username 
                && u.Password == hash);
            // Nếu không tìm thấy người dùng, trả về lỗi
            if (user == null)
                return Unauthorized("Tên đăng nhập hoặc mật khẩu không đúng.");
            // Tạo JWT
            string token = GenerateJwtToken(user);

            // Lấy customerId từ bảng Customer
            var customer = _db.Customer.FirstOrDefault(c => c.UserId == user.Id);
            int? customerId = customer?.Id;

            // Trả về token cùng thông tin người dùng
            return Ok(new { 
                Message = "Đăng nhập thành công", 
                userID = user.Id, 
                Role = user.Role, 
                customerID = customerId,
                Token = token 
            });
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
