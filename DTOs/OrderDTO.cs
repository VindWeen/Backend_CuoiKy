namespace Backend_CuoiKy.DTOs.Orders
{
    public class OrderDTO
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public DateTime OrderDate { get; set; }
        public string? Status { get; set; }
        public int TotalAmount { get; set; }
        public List<OrderDetailDTO>? Items { get; set; }
    }
    public class OrderDetailDTO
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public int UnitPrice { get; set; }
        public int SubTotal => Quantity * UnitPrice;
    }
}