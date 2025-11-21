using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace Backend_CuoiKy.Models
{
    public class Customer
    {
        [Key]
        public int Id { get; set; }

        [Required, MaxLength(100)]
        public string Name { get; set; }

        [MaxLength(100)]
        public string Email { get; set; }

        [MaxLength(15)]
        public string Phone_Number { get; set; }

        [MaxLength(200)]
        public string Address { get; set; }

        // Nếu chưa tạo Order, comment tạm
        // public ICollection<Order>? Orders { get; set; }
    }
}
