using Backend_CuoiKy.Data;
using Backend_CuoiKy.DTOs.Orders;
using Backend_CuoiKy.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Backend_CuoiKy.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OrdersController(AppDbContext context)
        {
            _context = context;
        }

        // Lấy tất cả đơn hàng (Admin)
        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetOrders()
        {
            // Lấy tất cả đơn hàng
            var orders = await _context.Order
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            var result = new List<OrderDTO>();

            // Xử lý từng đơn hàng để lấy chi tiết
            foreach (var o in orders)
            {
                var details = await _context.OrderDetail
                    .Where(d => d.OrderId == o.Id)
                    .ToListAsync();

                result.Add(new OrderDTO
                {
                    Id = o.Id,
                    CustomerId = o.CustomerId,
                    Status = o.Status,
                    OrderDate = o.OrderDate,
                    TotalAmount = o.TotalAmount,
                    Items = details.Select(d => new OrderDetailDTO
                    {
                        ProductId = d.ProductId,
                        Quantity = d.Quantity,
                        UnitPrice = d.UnitPrice
                    }).ToList()
                });
            }
            // Trả về danh sách đơn hàng với chi tiết
            return Ok(result);
        }

        // Lấy chi tiết đơn hàng theo ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetOrder(int id)
        {
            // Lấy userId và role từ token
            var userId = GetUserIdFromToken();
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            // Tìm đơn hàng
            var order = await _context.Order.FirstOrDefaultAsync(x => x.Id == id);

            if (order == null) return NotFound();

            // Kiểm tra quyền truy cập
            if (userRole != "Admin" && order.CustomerId!= userId)
                return Forbid("Bạn không có quyền xem đơn hàng này.");

            // Lấy chi tiết đơn hàng
            var details = await _context.OrderDetail
                .Where(d => d.OrderId == id)
                .ToListAsync();

            // Tạo DTO để trả về
            var dto = new OrderDTO
            {
                Id = order.Id,
                CustomerId = order.CustomerId,
                Status = order.Status,
                OrderDate = order.OrderDate,
                TotalAmount = order.TotalAmount,
                Items = details.Select(d => new OrderDetailDTO
                {
                    ProductId = d.ProductId,
                    Quantity = d.Quantity,
                    UnitPrice = d.UnitPrice
                }).ToList()
            };

            return Ok(dto);
        }

        // Tạo đơn hàng mới
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateOrder([FromBody] OrderCreateDTO dto)
        {
            // Kiểm tra giỏ hàng không rỗng
            if (dto.Items == null || dto.Items.Count == 0)
                return BadRequest("Giỏ hàng trống.");

            // Lấy userId từ token
            var customerId = GetUserIdFromToken();
            if (customerId == null) return Unauthorized();

            // Sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                int total = 0;

                var order = new Order
                {
                    CustomerId = customerId.Value,
                    OrderDate = DateTime.Now,
                    Status = "Pending",
                    TotalAmount = 0
                };

                _context.Order.Add(order);
                await _context.SaveChangesAsync();

                foreach (var item in dto.Items)
                {
                    // Kiểm tra sản phẩm và tồn kho
                    var product = await _context.Product
                        .FirstOrDefaultAsync(p => p.Id == item.ProductId);

                    // Nếu không tìm thấy sản phẩm
                    if (product == null)
                        return BadRequest($"Không tìm thấy sản phẩm ID = {item.ProductId}");

                    // Nếu không đủ tồn kho
                    if (product.Stock < item.Quantity)
                        return BadRequest($"Sản phẩm {product.Name} không đủ tồn kho.");

                    // Cập nhật tồn kho
                    product.Stock -= item.Quantity;

                    // Tạo chi tiết đơn hàng
                    var detail = new OrderDetail
                    {
                        OrderId = order.Id,
                        ProductId = product.Id,
                        Quantity = item.Quantity,
                        UnitPrice = product.Price
                    };
                    // Thêm chi tiết đơn hàng
                    _context.OrderDetail.Add(detail);

                    // Cập nhật tổng tiền
                    total += (int)(product.Price * item.Quantity);
                }
                // Cập nhật tổng tiền đơn hàng
                order.TotalAmount = total;

                // Lưu thay đổi
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { message = "Tạo đơn hàng thành công", orderId = order.Id });
            }
            catch (Exception ex)
            {
                // Nếu có lỗi, rollback transaction
                await transaction.RollbackAsync();
                return StatusCode(500, ex.Message);
            }
        }

        // Lấy đơn hàng của người dùng hiện tại
        [HttpGet("my-orders")]
        [Authorize]
        public async Task<IActionResult> GetMyOrders()
        {
            // Lấy userId từ token
            var customerId = GetUserIdFromToken();
            if (customerId == null) return Unauthorized();

            // Lấy đơn hàng của người dùng
            var orders = await _context.Order
                .Where(o => o.CustomerId == customerId.Value)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();
            var result = new List<OrderDTO>();

            // Xử lý từng đơn hàng để lấy chi tiết
            foreach (var o in orders)
            {
                // Lấy chi tiết đơn hàng
                var details = await _context.OrderDetail
                    .Where(d => d.OrderId == o.Id)
                    .ToListAsync();

                result.Add(new OrderDTO
                {
                    Id = o.Id,
                    CustomerId = o.CustomerId,
                    Status = o.Status,
                    OrderDate = o.OrderDate,
                    TotalAmount = o.TotalAmount,
                    Items = details.Select(d => new OrderDetailDTO
                    {
                        ProductId = d.ProductId,
                        Quantity = d.Quantity,
                        UnitPrice = d.UnitPrice
                    }).ToList()
                });
            }

            return Ok(result);
        }

        // Lấy userId từ token
        private int? GetUserIdFromToken()
        {
            // Lấy userId từ token
            var id = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(id, out int userId))
                return userId;

            return null;
        }
    }
}
