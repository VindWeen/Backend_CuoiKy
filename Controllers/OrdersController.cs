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

        // Lấy tất cả đơn hàng (Admin)
        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetOrders()
        {
            // Lấy tất cả đơn hàng
            var orders = await _context.Order
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();
            // Tạo danh sách DTO để trả về
            var result = new List<OrderDTO>();

            // Xử lý từng đơn hàng để lấy chi tiết
            foreach (var o in orders)
            {
                // Lấy chi tiết đơn hàng cho từng đơn hàng
                var details = await _context.OrderDetail
                    .Where(d => d.OrderId == o.Id)
                    .ToListAsync();
                // Thêm vào danh sách kết quả
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
            // Lấy userId từ token
            var userIdClaim = User.FindFirst("userId")?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
                return Unauthorized("Token không hợp lệ");
            // Lấy vai trò người dùng
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            // Tìm đơn hàng
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
            // Kiểm tra giỏ hàng trống
            if (dto.Items == null || dto.Items.Count == 0)
                return BadRequest("Giỏ hàng trống.");
            // Kiểm tra CustomerId hợp lệ
            if (dto.CustomerId <= 0)
                return BadRequest("Thiếu CustomerId.");
            // Kiểm tra customer tồn tại
            var customer = await _context.Customer.FindAsync(dto.CustomerId);
            if (customer == null)
                return BadRequest("Customer không tồn tại.");
            // Sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                int total = 0;
                // 1) Tạo đơn hàng
                var order = new Order
                {
                    CustomerId = dto.CustomerId,
                    OrderDate = DateTime.Now,
                    Status = "Đang xử lí",
                    TotalAmount = 0
                };

                _context.Order.Add(order);
                await _context.SaveChangesAsync();
                // Tạo danh sách chi tiết đơn hàng
                var detailList = new List<OrderDetail>();
                // 2) Tạo chi tiết đơn hàng và cập nhật tồn kho
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
                    // Tính tổng giá
                    total += (int)(product.Price * item.Quantity);
                }

                // Cập nhật tổng giá
                order.TotalAmount = total + 30000;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

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
            // Lấy userId từ token
            var userIdClaim = User.FindFirst("userId")?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
                return Unauthorized("Token không hợp lệ");
            // Tìm customer từ userId
            var customer = await _context.Customer.FirstOrDefaultAsync(c => c.UserId == userId);
            if (customer == null)
                return NotFound("Không tìm thấy thông tin khách hàng. Vui lòng cập nhật hồ sơ.");
            // Lấy đơn hàng của customer
            var orders = await _context.Order
                .Where(o => o.CustomerId == customer.Id)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            var result = new List<OrderDTO>();
            foreach (var o in orders)
            {
                // Lấy chi tiết đơn hàng cho từng đơn hàng
                var details = await _context.OrderDetail
                    .Where(d => d.OrderId == o.Id)
                    .ToListAsync();
                // Thêm vào danh sách kết quả
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
            // Tìm đơn hàng
            var order = await _context.Order.FindAsync(id);
            if (order == null) return NotFound("Không tìm thấy đơn hàng");

            // Chỉ cho phép 2 trạng thái này
            if (dto.Status != "Đang xử lý" && dto.Status != "Đã xử lý")
                return BadRequest("Trạng thái không hợp lệ");
            // Cập nhật trạng thái
            order.Status = dto.Status;
            await _context.SaveChangesAsync();

            // --- Lấy thông tin customer từ CustomerId ---
            var customer = await _context.Customer
                .FirstOrDefaultAsync(c => c.Id == order.CustomerId);
            // Kiểm tra customer tồn tại
            if (customer == null)
                return BadRequest("Không tìm thấy thông tin khách hàng để gửi email");

            // --- Lấy chi tiết đơn hàng ---
            var details = await _context.OrderDetail
                .Include(d => d.Product)
                .Where(d => d.OrderId == order.Id)
                .ToListAsync();

            // --- Chỉ gửi email khi trạng thái = "Đã xử lý" ---
            if (dto.Status == "Đã xử lý")
            {
                // Gửi email thông báo cho khách hàng
                string subject = $"Đơn hàng #{order.Id} đã được xử lý";
                // Tạo nội dung chi tiết đơn hàng
                string itemsHtml = string.Join("", details.Select(d =>
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
            <h2>Đơn hàng của bạn đã được xử lý!</h2>
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
            <p>Cảm ơn bạn đã mua hàng!</p>
        ";

                await _emailService.SendAsync(customer.Email, subject, body);
            }
            return Ok(new { message = "Cập nhật trạng thái thành công", status = order.Status });
        }
    }
}
