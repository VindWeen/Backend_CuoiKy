namespace Backend_CuoiKy.DTOs
{
    public class RegisterDTO
    {
        public string Username { get; set; }
        public string Password { get; set; }
        public string Role { get; set; } = "Customer";
    }
}