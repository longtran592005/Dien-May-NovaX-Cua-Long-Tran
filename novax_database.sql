-- Script tạo cơ sở dữ liệu sản phẩm cho NovaX

CREATE TABLE IF NOT EXISTS Categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS Products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  price DECIMAL(15, 2) NOT NULL,
  category_slug VARCHAR(255) NOT NULL,
  brand VARCHAR(100),
  image_url VARCHAR(500),
  specs JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data for Categories
INSERT IGNORE INTO Categories (name, slug) VALUES ('dien thoai', 'dien-thoai');
INSERT IGNORE INTO Categories (name, slug) VALUES ('laptop', 'laptop');
INSERT IGNORE INTO Categories (name, slug) VALUES ('tivi', 'tivi');
INSERT IGNORE INTO Categories (name, slug) VALUES ('tu lanh', 'tu-lanh');
INSERT IGNORE INTO Categories (name, slug) VALUES ('dieu hoa', 'dieu-hoa');
INSERT IGNORE INTO Categories (name, slug) VALUES ('may giat', 'may-giat');
INSERT IGNORE INTO Categories (name, slug) VALUES ('gia dung', 'gia-dung');

-- Data for Products
INSERT IGNORE INTO Products (name, slug, price, category_slug, brand, image_url, specs) VALUES ('iPhone 15 Pro Max 256GB', 'iphone-15-pro-max-256gb', 34990000, 'dien-thoai', 'Apple', '/images/products/iphone-15-pro-max-256gb.png', '{"Screen":"6.7 inch","OS":"iOS 17"}');
INSERT IGNORE INTO Products (name, slug, price, category_slug, brand, image_url, specs) VALUES ('Samsung Galaxy S24 Ultra 5G 256GB', 'samsung-galaxy-s24-ultra', 33990000, 'dien-thoai', 'Samsung', '/images/products/samsung-galaxy-s24-ultra.png', '{"Screen":"6.8 inch","OS":"Android 14"}');
INSERT IGNORE INTO Products (name, slug, price, category_slug, brand, image_url, specs) VALUES ('MacBook Air 15 inch M2 2023 8GB/256GB', 'macbook-air-15-m2', 29990000, 'laptop', 'Apple', '/images/products/macbook-air-15-m2.png', '{"CPU":"Apple M2","RAM":"8GB"}');
INSERT IGNORE INTO Products (name, slug, price, category_slug, brand, image_url, specs) VALUES ('Smart Tivi QLED 4K 65 inch Samsung QA65Q60C', 'tivi-samsung-qled-4k-65-inch-qa65q60c', 16900000, 'tivi', 'Samsung', '/images/products/tivi-samsung-qled-4k-65-inch-qa65q60c.png', '{"Size":"65 inch","Resolution":"4K"}');
INSERT IGNORE INTO Products (name, slug, price, category_slug, brand, image_url, specs) VALUES ('Smart Tivi LG 4K 55 inch 55UR8050PSB', 'tivi-lg-4k-55-inch-55ur8050psb', 10490000, 'tivi', 'LG', '/images/products/tivi-lg-4k-55-inch-55ur8050psb.png', '{"Size":"55 inch","Resolution":"4K"}');
INSERT IGNORE INTO Products (name, slug, price, category_slug, brand, image_url, specs) VALUES ('Tủ lạnh Samsung Inverter 382 lít RT38CG6584B1SV', 'tu-lanh-samsung-inverter-382-lit-rt38cg6584b1sv', 11990000, 'tu-lanh', 'Samsung', '/images/products/tu-lanh-samsung-inverter-382-lit-rt38cg6584b1sv.png', '{"Capacity":"382 lít","Inverter":"Có"}');
INSERT IGNORE INTO Products (name, slug, price, category_slug, brand, image_url, specs) VALUES ('Tủ lạnh Aqua Inverter 189 lít AQR-T219FA(PB)', 'tu-lanh-aqua-inverter-189-lit-aqr-t219fa-pb', 4990000, 'tu-lanh', 'Aqua', '/images/products/tu-lanh-aqua-inverter-189-lit-aqr-t219fa-pb.png', '{"Capacity":"189 lít","Inverter":"Có"}');
INSERT IGNORE INTO Products (name, slug, price, category_slug, brand, image_url, specs) VALUES ('Máy lạnh Daikin Inverter 1 HP ATKF25XVMV', 'may-lanh-daikin-inverter-1-hp-atkf25xvmv', 9990000, 'dieu-hoa', 'Daikin', '/images/products/may-lanh-daikin-inverter-1-hp-atkf25xvmv.png', '{"Power":"1 HP","Inverter":"Có"}');
INSERT IGNORE INTO Products (name, slug, price, category_slug, brand, image_url, specs) VALUES ('Máy lạnh Panasonic Inverter 1 HP CU/CS-PU9XKH-8M', 'may-lanh-panasonic-inverter-1-hp-cu-cs-pu9xkh-8m', 10690000, 'dieu-hoa', 'Panasonic', '/images/products/may-lanh-panasonic-inverter-1-hp-cu-cs-pu9xkh-8m.png', '{"Power":"1 HP","Inverter":"Có"}');
INSERT IGNORE INTO Products (name, slug, price, category_slug, brand, image_url, specs) VALUES ('Máy giặt LG AI DD Inverter 10 kg FV1410S4P', 'may-giat-lg-ai-dd-inverter-10-kg-fv1410s4p', 10490000, 'may-giat', 'LG', '/images/products/may-giat-lg-ai-dd-inverter-10-kg-fv1410s4p.png', '{"Load":"10 kg","Inverter":"Có"}');
INSERT IGNORE INTO Products (name, slug, price, category_slug, brand, image_url, specs) VALUES ('Máy giặt Electrolux Inverter 9 kg EWF9024P5WB', 'may-giat-electrolux-inverter-9-kg-ewf9024p5wb', 9290000, 'may-giat', 'Electrolux', '/images/products/may-giat-electrolux-inverter-9-kg-ewf9024p5wb.png', '{"Load":"9 kg","Inverter":"Có"}');
INSERT IGNORE INTO Products (name, slug, price, category_slug, brand, image_url, specs) VALUES ('Nồi cơm điện tử Sharp 1.8 lít KS-COM18V', 'noi-com-dien-tu-sharp-18-lit-ks-com18v', 1290000, 'gia-dung', 'Sharp', '/images/products/noi-com-dien-tu-sharp-18-lit-ks-com18v.png', '{"Capacity":"1.8 lít","Type":"Điện tử"}');
INSERT IGNORE INTO Products (name, slug, price, category_slug, brand, image_url, specs) VALUES ('Lò vi sóng có nướng Sharp 20 lít VN-202ZV', 'lo-vi-song-sharp-20-lit', 1490000, 'gia-dung', 'Sharp', '/images/products/lo-vi-song-sharp-20-lit.png', '{"Capacity":"20 lít"}');
INSERT IGNORE INTO Products (name, slug, price, category_slug, brand, image_url, specs) VALUES ('OPPO Reno11 F 5G 256GB', 'oppo-reno11-f-5g', 8990000, 'dien-thoai', 'OPPO', '/images/products/oppo-reno11-f-5g.png', '{"RAM":"8GB","ROM":"256GB"}');
INSERT IGNORE INTO Products (name, slug, price, category_slug, brand, image_url, specs) VALUES ('Xiaomi 14 5G 256GB', 'xiaomi-14-5g', 21990000, 'dien-thoai', 'Xiaomi', '/images/products/xiaomi-14-5g.png', '{"RAM":"12GB","ROM":"256GB"}');
