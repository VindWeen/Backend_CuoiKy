using Microsoft.EntityFrameworkCore;
using Backend_CuoiKy.Models;

namespace Backend_CuoiKy.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Product> Products { get; set; }
        public DbSet<Users> Users { get; set; }
        public DbSet<Customer> Customer { get; set; }
        // public DbSet<Order> Orders { get; set; } // tạo sau
    }
}
