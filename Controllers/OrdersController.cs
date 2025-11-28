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
        private readonly EmailService _emailService;

        public OrdersController(AppDbContext context, EmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        
        // Endpoint test SQL
        [HttpGet("test-sql")]
        public async Task<IActionResult> TestSql()
        {
            try
            {
                var count = await _context.Order.CountAsync();
                return Ok($"SQL OK: {count} orders");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.ToString());
            }
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
        [Authorize]
        public async Task<IActionResult> GetOrder(int id)
        {
            var userIdClaim = User.FindFirst("userId")?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
                return Unauthorized("Token không hợp lệ");

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            var order = await _context.Order.FirstOrDefaultAsync(x => x.Id == id);
            if (order == null) return NotFound("Không tìm thấy đơn hàng");

            // Tìm customer từ userId
            var customer = await _context.Customer.FirstOrDefaultAsync(c => c.UserId == userId);

            // Kiểm tra quyền
            if (userRole != "Admin")
            {
                if (customer == null || order.CustomerId != customer.Id)
                    return Forbid("Bạn không có quyền xem đơn hàng này");
            }

            var details = await _context.OrderDetail
                .Where(d => d.OrderId == id)
                .ToListAsync();

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
            if (dto.Items == null || dto.Items.Count == 0)
                return BadRequest("Giỏ hàng trống.");

            if (dto.CustomerId <= 0)
                return BadRequest("Thiếu CustomerId.");

            var customer = await _context.Customer.FindAsync(dto.CustomerId);
            if (customer == null)
                return BadRequest("Customer không tồn tại.");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                int total = 0;

                // 1) Tạo đơn hàng trước
                var order = new Order
                {
                    CustomerId = dto.CustomerId,
                    OrderDate = DateTime.Now,
                    Status = "Đang xử lí",
                    TotalAmount = 0
                };

                _context.Order.Add(order);
                await _context.SaveChangesAsync();

                var detailList = new List<OrderDetail>();
                // 2) Tạo danh sách chi tiết
                foreach (var item in dto.Items)
                {
                    var product = await _context.Product
                        .FirstOrDefaultAsync(p => p.Id == item.ProductId);

                    if (product == null)
                        return BadRequest($"Không tìm thấy sản phẩm ID = {item.ProductId}");

                    if (product.Stock < item.Quantity)
                        return BadRequest($"Sản phẩm {product.Name} không đủ tồn kho.");

                    // Trừ tồn kho
                    product.Stock -= item.Quantity;

                    var detail = new OrderDetail
                    {
                        OrderId = order.Id,
                        ProductId = product.Id,
                        Quantity = item.Quantity,
                        UnitPrice = product.Price,
                        Product = product
                    };

                    detailList.Add(detail);
                    _context.OrderDetail.Add(detail);

                    total += (int)(product.Price * item.Quantity);
                }

                // Cập nhật tổng giá
                order.TotalAmount = total + 30000;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Gửi email thông báo đơn hàng mới
                string subject = $"Xác nhận đơn hàng #{order.Id}";

                string itemsHtml = string.Join("", detailList.Select(d =>
                    $@"
            <tr>
                <td>{d.Product.Name}</td>
                <td>{d.Quantity}</td>
                <td>{d.UnitPrice:N0} VND</td>
                <td>{(d.Quantity * d.UnitPrice):N0} VND</td>
            </tr>
            "
                ));

                string body = $@"
            <h2>Đơn hàng của bạn đã được xác nhận!</h2>
            <p><strong>Mã đơn:</strong> {order.Id}</p>
            <p><strong>Ngày đặt:</strong> {order.OrderDate}</p>

            <table border='1' cellpadding='8' cellspacing='0'>
                <tr>
                    <th>Sản phẩm</th>
                    <th>Số lượng</th>
                    <th>Giá</th>
                    <th>Tổng</th>
                </tr>
                {itemsHtml}
            </table>

            <p><strong>Tổng tiền:</strong> {order.TotalAmount:N0} VND</p>
            <br>
            <p>Cảm ơn bạn đã đặt hàng!</p>
        ";

                await _emailService.SendAsync(customer.Email, subject, body);

                return Ok(new { message = "Tạo đơn hàng thành công", orderId = order.Id });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, ex.InnerException?.Message ?? ex.Message);
            }
        }

        // Lấy đơn hàng của chính mình (customer)
        [HttpGet("my-orders")]
        [Authorize]
        public async Task<IActionResult> GetMyOrders()
        {
            var userIdClaim = User.FindFirst("userId")?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
                return Unauthorized("Token không hợp lệ");

            var customer = await _context.Customer.FirstOrDefaultAsync(c => c.UserId == userId);
            if (customer == null)
                return NotFound("Không tìm thấy thông tin khách hàng. Vui lòng cập nhật hồ sơ.");

            var orders = await _context.Order
                .Where(o => o.CustomerId == customer.Id)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            var result = new List<OrderDTO>();

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

            return Ok(result);
        }

        // Lấy userId từ token
        private int? GetUserIdFromToken()
        {
            var idClaim = User.FindFirst("userId")?.Value;
            if (int.TryParse(idClaim, out int userId))
                return userId;

            return null;
        }

        // Cập nhật trạng thái đơn hàng (chỉ Admin)
        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateStatusDTO dto)
        {
            var order = await _context.Order.FindAsync(id);
            if (order == null) return NotFound("Không tìm thấy đơn hàng");

            // Chỉ cho phép 2 trạng thái này
            if (dto.Status != "Đang xử lý" && dto.Status != "Đã xử lý")
                return BadRequest("Trạng thái không hợp lệ");

            order.Status = dto.Status;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật trạng thái thành công", status = order.Status });
        }
    }
}
