--============================================== TẠO DATABASE ============================================
use master
if exists(select * from sys.databases where name = 'BACKEND_CUOIKY')
    drop database BACKEND_CUOIKY
go
create database BACKEND_CUOIKY

--============================================ TẠO BẢNG =================================
go 
use BACKEND_CUOIKY
--Bảng User
go
create table [dbo].[User]
(
    id int primary key identity(1,1),
    username nvarchar(50) not null unique,
    password nvarchar(100) not null,
    role nvarchar(50) check (role in ('admin', 'customer'))
)
--Bảng Product
create table [dbo].[Product]
(
	id int primary key identity(1,1),
	name nvarchar(100) not null,
    price decimal check (price >= 0),
    description nvarchar(max),
    stock int check (stock >= 0)
)
--Bảng Customer
go
create table [dbo].[Customer]
(
    id int primary key identity(1,1),
	userid int references [dbo].[User](id) unique,
    name nvarchar(100) not null,
    email nvarchar(100),
    phonenumber nvarchar(15),
    address nvarchar(200)
)

--Bảng Order
go
create table [dbo].[Order]
(
    Id int primary key identity(1,1),
    CustomerId int foreign key (CustomerId) references [dbo].[Customer] (id),
    OrderDate DateTime not null,
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

--------------------------
-- TRIGGER Product
--------------------------
CREATE TRIGGER TRG_ResetIdentity_Product
ON Product
AFTER DELETE
AS
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Product)
    BEGIN
        DBCC CHECKIDENT ('Product', RESEED, 1);
    END
END
GO

--------------------------
-- TRIGGER Customer
--------------------------
CREATE TRIGGER TRG_ResetIdentity_Customer
ON Customer
AFTER DELETE
AS
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Customer)
    BEGIN
        DBCC CHECKIDENT ('Customer', RESEED, 1);
    END
END
GO

--------------------------
-- TRIGGER Order
--------------------------
CREATE TRIGGER TRG_ResetIdentity_Order
ON [Order]
AFTER DELETE
AS
BEGIN
    IF NOT EXISTS (SELECT 1 FROM [Order])
    BEGIN
        DBCC CHECKIDENT ('Order', RESEED, 1);
    END
END
GO

--------------------------
-- TRIGGER User
--------------------------
CREATE TRIGGER TRG_ResetIdentity_User
ON [User]
AFTER DELETE
AS
BEGIN
    IF NOT EXISTS (SELECT 1 FROM [User])
    BEGIN
        DBCC CHECKIDENT ('User', RESEED, 1);
    END
END
GO
