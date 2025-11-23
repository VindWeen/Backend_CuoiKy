using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;

namespace Backend_CuoiKy.DTOs.Orders
{
    public class OrderDTO
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        [DataType(DataType.Date)]
        public DateTime OrderDate { get; set; }
        public string? Status { get; set; }
        public decimal TotalAmount { get; set; }
        public List<OrderDetailDTO>? Items { get; set; }
    }
    public class OrderDetailDTO
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal SubTotal => Quantity * UnitPrice;
    }
}