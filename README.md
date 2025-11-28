1. Giới thiệu dự án
Tên hệ thống: Hệ thống Quản lý Đơn Hàng đơn giản.
Công nghệ sử dụng:
- Backend: ASP.NET Core .NET 8.0, Entity Framework Core, SQL Server.
- Frontend: HTML/CSS/JS.
- Deployment: IIS Local.

Hướng dẫn cài đặt:
- Tạo database: dùng DataBase.SQL 
- Xóa folder bin/obj nếu có.
- Cấu hình connection string trong file appsetings.json: 
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=BACKEND_CUOIKY;User Id=sa;Password=YOUR_PASSWORD;TrustServerCertificate=True;"
  }
}
- Cách chạy backend: dotnet run hoặc qua IIS .
- Cách chạy frontend — nếu là static HTML, cách mở; nếu deploy cũng trên IIS, cách cấu hình.
URL API (base URL), cách FE + BE kết nối với nhau.


| Trang | URL | Mô Tả |
|-------|-----|-------|
| Trang Chủ | `index.html` | Trang chủ, sản phẩm nổi bật |
| Đăng Nhập | `LogReg.html` | Đăng ký / Đăng nhập |
| Đăng Ký | `Information.html` | Chỉnh sửa thông tin người dùng (Customer) |
| Danh Sách Sản Phẩm | `Product.html` | Xem và mua sản phẩm |
| Giỏ Hàng | `Cart.html` | Xem & thanh toán |
| Đơn Hàng Của Tôi | `Orders.html` | Lịch sử đơn hàng (User) |
| Quản Lý Sản Phẩm | `ProductManager.html` | Quản lý sản phẩm (Admin) |
| Quản Lý Đơn Hàng | `OrderManager.html` | Quản lý đơn hàng (Admin) |
