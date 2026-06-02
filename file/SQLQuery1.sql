-- 1. BẢNG NGƯỜI DÙNG (Users)
CREATE TABLE Users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    full_name VARCHAR(255),
    password_hash VARCHAR(255),
    role VARCHAR(50) DEFAULT 'customer',
    points INT DEFAULT 0,
    verified BIT DEFAULT 0,  -- Đổi BOOLEAN thành BIT, FALSE thành 0
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Đổi TIMESTAMP thành DATETIME
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. BẢNG DANH MỤC SẢN PHẨM (Categories)
CREATE TABLE Categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    parent_id VARCHAR(36),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_category_parent FOREIGN KEY (parent_id) REFERENCES Categories(id)
);

-- 3. BẢNG SẢN PHẨM ĐIỆN MÁY (Products)
CREATE TABLE Products (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    price INT NOT NULL,
    stock INT DEFAULT 0,
    brand VARCHAR(100),
    category_id VARCHAR(36) NOT NULL,
    rating FLOAT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES Categories(id)
);

-- 4. BẢNG GIỎ HÀNG (Carts)
CREATE TABLE Carts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- 5. BẢNG CHI TIẾT GIỎ HÀNG (CartItems)
CREATE TABLE CartItems (
    id VARCHAR(36) PRIMARY KEY,
    cart_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_cartitem_cart FOREIGN KEY (cart_id) REFERENCES Carts(id) ON DELETE CASCADE,
    CONSTRAINT fk_cartitem_product FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE
);

-- 6. BẢNG ĐƠN HÀNG (Orders)
CREATE TABLE Orders (
    id VARCHAR(36) PRIMARY KEY,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    subtotal INT NOT NULL,
    total INT NOT NULL,
    delivery_method VARCHAR(50) DEFAULT 'standard',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES Users(id)
);

-- 7. BẢNG CHI TIẾT ĐƠN HÀNG (OrderItems)
CREATE TABLE OrderItems (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    quantity INT NOT NULL,
    unit_price INT NOT NULL,
    CONSTRAINT fk_orderitem_order FOREIGN KEY (order_id) REFERENCES Orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_orderitem_product FOREIGN KEY (product_id) REFERENCES Products(id)
);

-- 8. BẢNG THANH TOÁN (Payments)
CREATE TABLE Payments (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) UNIQUE NOT NULL,
    amount INT NOT NULL,
    method VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES Orders(id) ON DELETE CASCADE
);

-- 9. BẢNG BẢO HÀNH THIẾT BỊ (Warranties)
CREATE TABLE Warranties (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    expiry_date DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_warranty_order FOREIGN KEY (order_id) REFERENCES Orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_warranty_product FOREIGN KEY (product_id) REFERENCES Products(id)
);

-- 10. BẢNG KHUYẾN MÃI (Promotions)
CREATE TABLE Promotions (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) UNIQUE,
    discount_type VARCHAR(50) NOT NULL,
    discount_value INT NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    starts_at DATETIME NOT NULL,
    ends_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);