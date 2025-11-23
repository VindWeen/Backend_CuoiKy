namespace Backend_CuoiKy.DTOs.Orders
{
    public class OrderCreateDTO
    {
        public List<OrderItemDTO>? Items { get; set; }
        public int CustomerId { get; set; }
    }
    public class OrderItemDTO
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }
}