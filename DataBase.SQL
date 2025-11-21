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
    id int primary key identity(1,1),
    customer_id int foreign key (customer_id) references [dbo].[Customer] (id),
    order_date date not null,
    status nvarchar(50),
    total_amount decimal(18,2) check (total_amount >= 0)
)
--Bảng OrderDetail
go
create table [dbo].[OrderDetail]
(
    order_id int foreign key (order_id) references [dbo].[Order] (id),
    product_id int foreign key (product_id) references [dbo].[Product] (id),
    quantity int check (quantity > 0),
    unit_price decimal(18,2) check (unit_price >= 0),
    primary key (order_id, product_id)
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