const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, 'public', 'images', 'products');
if (!fs.existsSync(imgDir)) {
    fs.mkdirSync(imgDir, { recursive: true });
}

const products = [
    { name: 'iPhone 15 Pro Max 256GB', slug: 'iphone-15-pro-max-256gb', price: 34990000, category: 'dien-thoai', brand: 'Apple', img: 'iphone-15-pro-max-256gb.png', specs: { Screen: '6.7 inch', OS: 'iOS 17' } },
    { name: 'Samsung Galaxy S24 Ultra 5G 256GB', slug: 'samsung-galaxy-s24-ultra', price: 33990000, category: 'dien-thoai', brand: 'Samsung', img: 'samsung-galaxy-s24-ultra.png', specs: { Screen: '6.8 inch', OS: 'Android 14' } },
    { name: 'MacBook Air 15 inch M2 2023 8GB/256GB', slug: 'macbook-air-15-m2', price: 29990000, category: 'laptop', brand: 'Apple', img: 'macbook-air-15-m2.png', specs: { CPU: 'Apple M2', RAM: '8GB' } },
    { name: 'Smart Tivi QLED 4K 65 inch Samsung QA65Q60C', slug: 'tivi-samsung-qled-4k-65-inch-qa65q60c', price: 16900000, category: 'tivi', brand: 'Samsung', img: 'tivi-samsung-qled-4k-65-inch-qa65q60c.png', specs: { Size: '65 inch', Resolution: '4K' } },
    { name: 'Smart Tivi LG 4K 55 inch 55UR8050PSB', slug: 'tivi-lg-4k-55-inch-55ur8050psb', price: 10490000, category: 'tivi', brand: 'LG', img: 'tivi-lg-4k-55-inch-55ur8050psb.png', specs: { Size: '55 inch', Resolution: '4K' } },
    { name: 'Tủ lạnh Samsung Inverter 382 lít RT38CG6584B1SV', slug: 'tu-lanh-samsung-inverter-382-lit-rt38cg6584b1sv', price: 11990000, category: 'tu-lanh', brand: 'Samsung', img: 'tu-lanh-samsung-inverter-382-lit-rt38cg6584b1sv.png', specs: { Capacity: '382 lít', Inverter: 'Có' } },
    { name: 'Tủ lạnh Aqua Inverter 189 lít AQR-T219FA(PB)', slug: 'tu-lanh-aqua-inverter-189-lit-aqr-t219fa-pb', price: 4990000, category: 'tu-lanh', brand: 'Aqua', img: 'tu-lanh-aqua-inverter-189-lit-aqr-t219fa-pb.png', specs: { Capacity: '189 lít', Inverter: 'Có' } },
    { name: 'Máy lạnh Daikin Inverter 1 HP ATKF25XVMV', slug: 'may-lanh-daikin-inverter-1-hp-atkf25xvmv', price: 9990000, category: 'dieu-hoa', brand: 'Daikin', img: 'may-lanh-daikin-inverter-1-hp-atkf25xvmv.png', specs: { Power: '1 HP', Inverter: 'Có' } },
    { name: 'Máy lạnh Panasonic Inverter 1 HP CU/CS-PU9XKH-8M', slug: 'may-lanh-panasonic-inverter-1-hp-cu-cs-pu9xkh-8m', price: 10690000, category: 'dieu-hoa', brand: 'Panasonic', img: 'may-lanh-panasonic-inverter-1-hp-cu-cs-pu9xkh-8m.png', specs: { Power: '1 HP', Inverter: 'Có' } },
    { name: 'Máy giặt LG AI DD Inverter 10 kg FV1410S4P', slug: 'may-giat-lg-ai-dd-inverter-10-kg-fv1410s4p', price: 10490000, category: 'may-giat', brand: 'LG', img: 'may-giat-lg-ai-dd-inverter-10-kg-fv1410s4p.png', specs: { Load: '10 kg', Inverter: 'Có' } },
    { name: 'Máy giặt Electrolux Inverter 9 kg EWF9024P5WB', slug: 'may-giat-electrolux-inverter-9-kg-ewf9024p5wb', price: 9290000, category: 'may-giat', brand: 'Electrolux', img: 'may-giat-electrolux-inverter-9-kg-ewf9024p5wb.png', specs: { Load: '9 kg', Inverter: 'Có' } },
    { name: 'Nồi cơm điện tử Sharp 1.8 lít KS-COM18V', slug: 'noi-com-dien-tu-sharp-18-lit-ks-com18v', price: 1290000, category: 'gia-dung', brand: 'Sharp', img: 'noi-com-dien-tu-sharp-18-lit-ks-com18v.png', specs: { Capacity: '1.8 lít', Type: 'Điện tử' } },
    { name: 'Lò vi sóng có nướng Sharp 20 lít VN-202ZV', slug: 'lo-vi-song-sharp-20-lit', price: 1490000, category: 'gia-dung', brand: 'Sharp', img: 'lo-vi-song-sharp-20-lit.png', specs: { Capacity: '20 lít' } },
    { name: 'OPPO Reno11 F 5G 256GB', slug: 'oppo-reno11-f-5g', price: 8990000, category: 'dien-thoai', brand: 'OPPO', img: 'oppo-reno11-f-5g.png', specs: { RAM: '8GB', ROM: '256GB' } },
    { name: 'Xiaomi 14 5G 256GB', slug: 'xiaomi-14-5g', price: 21990000, category: 'dien-thoai', brand: 'Xiaomi', img: 'xiaomi-14-5g.png', specs: { RAM: '12GB', ROM: '256GB' } }
];

let sql = `-- Script tạo cơ sở dữ liệu sản phẩm cho NovaX\n\n`;
sql += `CREATE TABLE IF NOT EXISTS Categories (\n  id INT AUTO_INCREMENT PRIMARY KEY,\n  name VARCHAR(255) NOT NULL,\n  slug VARCHAR(255) UNIQUE NOT NULL\n);\n\n`;

sql += `CREATE TABLE IF NOT EXISTS Products (\n  id INT AUTO_INCREMENT PRIMARY KEY,\n  name VARCHAR(255) NOT NULL,\n  slug VARCHAR(255) UNIQUE NOT NULL,\n  price DECIMAL(15, 2) NOT NULL,\n  category_slug VARCHAR(255) NOT NULL,\n  brand VARCHAR(100),\n  image_url VARCHAR(500),\n  specs JSON,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\n`;

sql += `-- Data for Categories\n`;
const categories = ['dien-thoai', 'laptop', 'tivi', 'tu-lanh', 'dieu-hoa', 'may-giat', 'gia-dung'];
categories.forEach(c => {
  sql += `INSERT IGNORE INTO Categories (name, slug) VALUES ('${c.replace(/-/g, ' ')}', '${c}');\n`;
});
sql += `\n-- Data for Products\n`;

products.forEach(p => {
    // Create empty file in the public folder
    const filePath = path.join(imgDir, p.img);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, ''); // create empty file
    }

    const specs = JSON.stringify(p.specs);
    sql += `INSERT IGNORE INTO Products (name, slug, price, category_slug, brand, image_url, specs) VALUES ('${p.name}', '${p.slug}', ${p.price}, '${p.category}', '${p.brand}', '/images/products/${p.img}', '${specs}');\n`;
});

fs.writeFileSync('novax_database.sql', sql, 'utf8');
console.log('Successfully generated novax_database.sql and placeholder images!');
