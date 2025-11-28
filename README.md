# Giới thiệu dự án
Tên hệ thống: Hệ thống quản lý đơn Hàng đơn giản.
## Công nghệ sử dụng:
- Backend: ASP.NET Core .NET 8.0, Entity Framework Core, SQL Server.
- Frontend: HTML/CSS/JS.
- Authentication: JWT Token
- Deployment: IIS Local.

## Cấu trúc dự án:
```
Backend_CuoiKy/
├── Controllers/              # API Controllers
├── Data/                     # AppDbContext
├── DTOs/                     # Data Transfer Object
├── Helper/                   # Helper for sending email
├── Images/                   # Product's Images
├── Models/                   # Database Models
├── Properties/               # Properties
├── publish/                  # publish for IIS
├── Services/                 # Services
├── wwwroot/                  # Static Files (HTML, CSS, JS)
├── appsettings.json          # Configuration
├── Backend_CuoiKy.csproj     
├── Backend_CuoiKy.http     
├── Backend_CuoiKy.sln     
├── DataBase.SQL              # SQL DataBase
├── log4net.config            # Configuration log4net
└── Program.cs                # Startup Configuration
```



## Hướng dẫn cài đặt:
- Tạo database: dùng DataBase.SQL 
- Xóa folder bin/obj nếu có.
- Cấu hình connection string trong file appsetings.json: 
```
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=BACKEND_CUOIKY;User Id=sa;Password=YOUR_PASSWORD;TrustServerCertificate=True;"
  }
}
```
## Cách chạy Backend:
### Yêu cầu:
- Trên Visual Studio Code / Visual Studio 2022
- SQL Server
- dotnet run hoặc qua IIS.
## Cách chạy Frontend 
- Truy cập http://localhost:5114/swagger/index.html tiến hành đăng ký tài khoản admin với role là Admin để có thể truy cập các trang của role Admin như, quản lý sản phẩm (Thêm/sửa/xóa sản phẩm), quản lý đơn hàng.
- Truy cập http://localhost:5114/LogReg.html để tới trang đăng ký / đăng nhặp và đăng ký 1-2 tài khoản Customer. Sau đó quay lại form đăng nhập tiến hành đăng nhập tài khoản Admin / Customer để test các chức năng có trong bảng các trang Frontend sau:
## Các trang Frontend
| Trang | URL | Mô Tả |
|-------|-----|-------|
| Đăng Nhập Đăng Ký | `LogReg.html` | Đăng ký / Đăng nhập |
| Trang Chủ | `index.html` | Trang chủ, sản phẩm nổi bật |
| Thông Tin | `Information.html` | Chỉnh sửa thông tin người dùng (Customer) |
| Danh Sách Sản Phẩm | `Product.html` | Xem và mua sản phẩm |
| Giỏ Hàng | `Cart.html` | Xem & thanh toán |
| Chi Tiết Đơn Hàng | `OrderDetail.html` | Xem chi tiết đơn hàng vừa thanh toán (Customer) |
| Đơn Hàng Của Tôi | `Orders.html` | Lịch sử đơn hàng (User) |
| Quản Lý Sản Phẩm | `ProductManager.html` | Quản lý sản phẩm (Admin) |
| Quản Lý Đơn Hàng | `OrderManager.html` | Quản lý đơn hàng (Admin) |

## API Endpoints

### Auth
```
POST   /api/Auth/register       # Đăng ký
POST   /api/Auth/login          # Đăng nhập
```

### Customers
```
GET    /api/Customers           # Lấy tất cả khách hàng
POST   /api/Customers           # Tạo khách hàng
GET    /api/Customers/{id}      # Lấy khách hàng theo ID
PUT    /api/Customers/{id}      # Cập nhật khách hàng
DELETE /api/Customers/{id}      # Xóa khách hàng
```

### Email
```
GET    /api/gmail/send          # Đăng ký
POST   /api/gmail/SoanEmail     # Đăng nhập
```

### Orders
```
GET    /api/Orders/test-sql            # Test kết nối với sql
GET    /api/Orders/                    # Lấy tất cả đơn hàng (Admin)
POST   /api/Orders                     # Tạo đơn hàng mới
GET    /api/Orders/{id}                # Lấy chi tiết đơn hàng theo ID
GET    /api/Orders/my-orders           # Lấy đơn hàng của user hiện tại (Customer)
PUT    /api/Orders/{id}/status         # Cập nhật trạng thái đơn hàng (Admin)
```

### Products
```
GET    /api/Product                    # Lấy tất cả sản phẩm
POST   /api/Product                    # Thêm sản phẩm (Admin)
GET    /api/Product/{id}               # Lấy sản phẩm theo ID
PUT    /api/Product/{id}               # Cập nhật sản phẩm theo ID (Admin)
DELETE /api/Product/{id}               # Xóa sản phẩm (Admin)
POST   /api/Product/upload/{id}        # Upload ảnh sản phẩm theo ID (Admin)
```
## Các Chức Năng Chính

### Cho Customer
- Đăng ký & Đăng nhập.
- Sửa thông tin cá nhân.
- Xem danh sách sản phẩm.
- Thêm sản phẩm vào giỏ hàng.
- Thanh toán, tạo đơn hàng và xem chi tiết đơn hàng.
- Xem lịch sử đơn hàng.

### Cho Admin
- Quản lý sản phẩm (CRUD)
- Quản lý đơn hàng (xem, cập nhật trạng thái)
