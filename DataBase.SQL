--============================================== TẠO DATABASE ============================================
use master
if exists(select * from sys.databases where name = 'BACKEND_CUOIKY')
    drop database BACKEND_CUOIKY
go
create database BACKEND_CUOIKY

--============================================ TẠO BẢNG =================================
go 
use BACKEND_CUOIKY
--Bảng Product
create table [dbo].[Product]
(
	id int primary key identity(1,1),
	name nvarchar(100) not null,
    price int check (price >= 0),
    description nvarchar(500),
    stock int check (stock >= 0)
)
--Bảng Customer
go
create table [dbo].[Customer]
(
    id int primary key identity(1,1),
    name nvarchar(100) not null,
    email nvarchar(100),
    phone_number nvarchar(15),
    address nvarchar(200)
)
--Bảng Order
go
create table [dbo].[Order]
(
    Id int primary key identity(1,1),
    CustomerId int foreign key (CustomerId) references [dbo].[Customer] (id),
    OrderDate date not null,
    Status nvarchar(50),
    TotalAmount decimal(18,2) check (TotalAmount >= 0)
)
--Bảng OrderDetail
go
create table [dbo].[OrderDetail]
(
    OrderId int foreign key (OrderId) references [dbo].[Order] (Id),
    ProductId int foreign key (ProductId) references [dbo].[Product] (Id),
    Quantity int check (Quantity > 0),
    UnitPrice decimal(18,2) check (UnitPrice >= 0),
    primary key (OrderId, ProductId)
)

--Bảng User
go
create table [dbo].[User]
(
    id int primary key identity(1,1),
    username nvarchar(50) not null unique,
    password nvarchar(100) not null,
    role nvarchar(50) check (role in ('admin', 'customer'))
)
-- Reset identity cho bảng Product
DBCC CHECKIDENT ('Product', RESEED, 1);

-- Reset identity cho bảng Customer
DBCC CHECKIDENT ('Customer', RESEED, 1);

-- Reset identity cho bảng Order
DBCC CHECKIDENT ('Order', RESEED, 1);

-- Reset identity cho bảng User
DBCC CHECKIDENT ('User', RESEED, 1);
