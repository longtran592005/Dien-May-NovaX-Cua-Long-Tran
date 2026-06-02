const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

const categories = [
    { name: 'Tivi', slug: 'tivi', icon: 'tv' },
    { name: 'Tu lanh', slug: 'tu-lanh', icon: 'fridge' },
    { name: 'May giat', slug: 'may-giat', icon: 'washer' },
    { name: 'Dieu hoa', slug: 'dieu-hoa', icon: 'aircon' },
    { name: 'Gia dung', slug: 'gia-dung', icon: 'home' },
    { name: 'Dien thoai', slug: 'dien-thoai', icon: 'phone' },
    { name: 'Laptop', slug: 'laptop', icon: 'laptop' },
    { name: 'May tinh bang', slug: 'may-tinh-bang', icon: 'tablet' }
];

const categoryImageTerms = {
    tivi: 'television smart tv',
    'tu-lanh': 'refrigerator kitchen appliance',
    'may-giat': 'washing machine laundry appliance',
    'dieu-hoa': 'air conditioner home appliance',
    'gia-dung': 'home appliance kitchen electric',
    'dien-thoai': 'smartphone mobile phone',
    laptop: 'laptop notebook computer',
    'may-tinh-bang': 'tablet device touchscreen'
};

const normalizeKeyword = (value) => value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

function buildLicensedImageUrl({ categorySlug, brand, name }, index) {
    const categoryTerms = categoryImageTerms[categorySlug] || 'electronics product';
    const query = `${categoryTerms}, ${normalizeKeyword(brand)}, ${normalizeKeyword(name)}`;
    return `https://source.unsplash.com/800x800/?${encodeURIComponent(query)}&sig=${index + 1}`;
}

const catalogBlueprint = {
    tivi: {
        models: ['QLED 4K 43 inch', 'QLED 4K 50 inch', 'QLED 4K 55 inch', 'OLED 4K 55 inch', 'OLED 4K 65 inch', 'Mini LED 65 inch', 'Mini LED 75 inch', 'Google TV 55 inch', 'Google TV 65 inch', 'Smart TV 43 inch'],
        brands: ['Samsung', 'LG', 'Sony', 'TCL', 'Hisense'],
        basePrice: 6990000
    },
    'tu-lanh': {
        models: ['Inverter 260L', 'Inverter 300L', 'Inverter 340L', 'Inverter 380L', 'Side by Side 500L', 'Side by Side 550L', 'Multi Door 450L', 'Multi Door 520L', 'Top Freezer 280L', 'Bottom Freezer 320L'],
        brands: ['Samsung', 'Panasonic', 'LG', 'Aqua', 'Sharp'],
        basePrice: 5990000
    },
    'may-giat': {
        models: ['Cua tren 9kg', 'Cua tren 10kg', 'Cua tren 12kg', 'Cua truoc 9kg', 'Cua truoc 10kg', 'Cua truoc 12kg', 'Say ket hop 10kg', 'Say ket hop 12kg', 'Inverter 9kg', 'Inverter 11kg'],
        brands: ['LG', 'Samsung', 'Electrolux', 'Toshiba', 'Panasonic'],
        basePrice: 4890000
    },
    'dieu-hoa': {
        models: ['Inverter 1HP', 'Inverter 1.5HP', 'Inverter 2HP', '2 chieu 1HP', '2 chieu 1.5HP', 'Multi split 1HP', 'Multi split 1.5HP', 'Wifi 1HP', 'Wifi 1.5HP', 'Eco 1HP'],
        brands: ['Daikin', 'Panasonic', 'LG', 'Mitsubishi', 'Samsung'],
        basePrice: 6490000
    },
    'gia-dung': {
        models: ['Noi com 1.8L', 'Noi com cao tan', 'Bep tu doi', 'Bep tu don', 'May xay da nang', 'Noi chien khong dau 5L', 'Noi chien khong dau 7L', 'May loc nuoc 10 cap', 'May hut bui khong day', 'Lo vi song 25L'],
        brands: ['Sharp', 'Panasonic', 'Philips', 'Sunhouse', 'Kangaroo'],
        basePrice: 890000
    },
    'dien-thoai': {
        models: ['8GB/128GB', '8GB/256GB', '12GB/256GB', '12GB/512GB', '5G 8GB/256GB', '5G 12GB/256GB', 'Camera AI 256GB', 'Gaming 512GB', 'Pin 6000mAh', 'Flagship 512GB'],
        brands: ['Samsung', 'Xiaomi', 'OPPO', 'vivo', 'realme'],
        basePrice: 3990000
    },
    laptop: {
        models: ['Core i5/16GB/512GB', 'Core i7/16GB/512GB', 'Core i7/16GB/1TB', 'Ryzen 5/16GB/512GB', 'Ryzen 7/16GB/512GB', 'Gaming i5/RTX3050', 'Gaming i7/RTX4060', 'Ultrabook 14 inch', 'Creator 16 inch', 'Office 15.6 inch'],
        brands: ['Dell', 'HP', 'Lenovo', 'ASUS', 'Acer'],
        basePrice: 10990000
    },
    'may-tinh-bang': {
        models: ['10 inch Wifi', '11 inch Wifi', '11 inch 5G', '12.4 inch Wifi', '12.4 inch 5G', '8GB/128GB', '8GB/256GB', 'Stylus bundle', 'Keyboard bundle', 'Kids edition'],
        brands: ['Samsung', 'Xiaomi', 'Lenovo', 'Honor', 'Huawei'],
        basePrice: 4490000
    }
};

const slugify = (value) => value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

function buildCatalogProducts() {
    const generated = [];

    for (const [categorySlug, blueprint] of Object.entries(catalogBlueprint)) {
        for (let i = 0; i < blueprint.models.length; i += 1) {
            const brand = blueprint.brands[i % blueprint.brands.length];
            const model = blueprint.models[i];
            const index = i + 1;
            const name = `${brand} ${model}`;
            const price = blueprint.basePrice + (index * 950000);
            const originalPrice = price + Math.floor(price * 0.12);
            const discount = Math.round(((originalPrice - price) / originalPrice) * 100);
            const rating = Number((4.2 + ((index % 6) * 0.1)).toFixed(1));
            const reviewCount = 80 + (index * 34);

            generated.push({
                slug: `${categorySlug}-${slugify(name)}-${index}`,
                name,
                categorySlug,
                brand,
                price,
                originalPrice,
                discount,
                rating,
                reviewCount,
                image: buildLicensedImageUrl({ categorySlug, brand, name }, index),
                stock: 30 + index
            });
        }
    }

    return generated;
}

const products = buildCatalogProducts();

const stores = [
    { name: 'NovaX Q1 - Hồ Chí Minh', address: '123 Lê Lợi, P. Bến Thành, Quận 1', province: 'hcm', district: 'q1', phone: '028 1234 5678' },
    { name: 'NovaX Thủ Đức', address: '45 Võ Văn Ngân, P. Linh Chiểu, Thủ Đức', province: 'hcm', district: 'td', phone: '028 2234 5678' },
    { name: 'NovaX Cầu Giấy - Hà Nội', address: '89 Xuân Thủy, Dịch Vọng, Cầu Giấy', province: 'hn', district: 'cg', phone: '024 3234 5678' }
];

const demoCustomers = [
    {
        email: 'user@email.com',
        fullName: 'Khách Hàng Demo',
        phone: '0901234567',
        points: 500,
        addresses: [
            {
                fullName: 'Khách Hàng Demo',
                phone: '0901234567',
                province: 'hcm',
                district: 'q1',
                ward: 'p_ben_thanh',
                streetAddress: '123 Lê Lợi',
                label: 'Nhà riêng',
                isDefault: true
            },
            {
                fullName: 'Khách Hàng Demo',
                phone: '0901234567',
                province: 'hn',
                district: 'cg',
                ward: 'p_dich_vong',
                streetAddress: '89 Xuân Thủy',
                label: 'Cơ quan',
                isDefault: false
            }
        ],
        savedCard: { brand: 'Visa', last4: '4242' }
    },
    {
        email: 'anh.nguyen@novax.vn',
        fullName: 'Nguyễn Minh Anh',
        phone: '0902345678',
        points: 120,
        addresses: [
            {
                fullName: 'Nguyễn Minh Anh',
                phone: '0902345678',
                province: 'hcm',
                district: 'td',
                ward: 'p_linh_chieu',
                streetAddress: '45 Võ Văn Ngân',
                label: 'Nhà riêng',
                isDefault: true
            },
            {
                fullName: 'Nguyễn Minh Anh',
                phone: '0902345678',
                province: 'hcm',
                district: 'q7',
                ward: 'p_tan_phu',
                streetAddress: '23 Nguyễn Thị Thập',
                label: 'Văn phòng',
                isDefault: false
            }
        ],
        savedCard: { brand: 'Mastercard', last4: '8888' }
    },
    {
        email: 'linh.tran@novax.vn',
        fullName: 'Trần Thùy Linh',
        phone: '0903456789',
        points: 260,
        addresses: [
            {
                fullName: 'Trần Thùy Linh',
                phone: '0903456789',
                province: 'hn',
                district: 'ba_dinh',
                ward: 'p_ngoc_khanh',
                streetAddress: '12 Kim Mã',
                label: 'Nhà riêng',
                isDefault: true
            },
            {
                fullName: 'Trần Thùy Linh',
                phone: '0903456789',
                province: 'hn',
                district: 'hoan_kiem',
                ward: 'p_trang_tien',
                streetAddress: '48 Tràng Tiền',
                label: 'Showroom',
                isDefault: false
            }
        ],
        savedCard: { brand: 'JCB', last4: '2026' }
    },
    {
        email: 'huy.do@novax.vn',
        fullName: 'Đỗ Quốc Huy',
        phone: '0904567890',
        points: 95,
        addresses: [
            {
                fullName: 'Đỗ Quốc Huy',
                phone: '0904567890',
                province: 'dn',
                district: 'hai_chau',
                ward: 'p_thanh_khe',
                streetAddress: '101 Trần Phú',
                label: 'Nhà riêng',
                isDefault: true
            },
            {
                fullName: 'Đỗ Quốc Huy',
                phone: '0904567890',
                province: 'dn',
                district: 'son_tra',
                ward: 'p_an_hai',
                streetAddress: '22 Võ Nguyên Giáp',
                label: 'Kho nhận hàng',
                isDefault: false
            }
        ],
        savedCard: { brand: 'Visa', last4: '1098' }
    }
];

const shippingZones = [
    { slug: 'hcm-inner', name: 'Zone HCM: Nội thành', provinceCode: 'hcm', priority: 10 },
    { slug: 'hn-inner', name: 'Zone Hà Nội: Nội thành', provinceCode: 'hn', priority: 20 },
    { slug: 'dn-inner', name: 'Zone Đà Nẵng: Trung tâm', provinceCode: 'dn', priority: 30 },
    { slug: 'nationwide', name: 'Zone Toàn quốc', provinceCode: null, priority: 100 }
];

const shippingRules = [
    { zoneSlug: 'hcm-inner', minDistance: 0, maxDistance: 10, baseFee: 25000, perKmFee: 1500, description: 'Nội thành HCM' },
    { zoneSlug: 'hn-inner', minDistance: 0, maxDistance: 10, baseFee: 25000, perKmFee: 1500, description: 'Nội thành Hà Nội' },
    { zoneSlug: 'dn-inner', minDistance: 0, maxDistance: 10, baseFee: 22000, perKmFee: 1200, description: 'Nội thành Đà Nẵng' },
    { zoneSlug: 'nationwide', minDistance: null, maxDistance: null, baseFee: 45000, perKmFee: 1800, description: 'Áp dụng toàn quốc' }
];

const warehouses = [
    { code: 'WH-HCM-Q1', name: 'Kho chính HCM Q1', province: 'hcm', district: 'q1', address: '12 Lê Lợi, Quận 1', phone: '028 9999 1001', isPrimary: true, capacity: 18000 },
    { code: 'WH-HCM-TD', name: 'Kho vệ tinh Thủ Đức', province: 'hcm', district: 'td', address: '88 Võ Văn Ngân, Thủ Đức', phone: '028 9999 1002', isPrimary: false, capacity: 12000 },
    { code: 'WH-HN-CG', name: 'Kho miền Bắc Cầu Giấy', province: 'hn', district: 'cg', address: '45 Xuân Thủy, Cầu Giấy', phone: '024 9999 1003', isPrimary: false, capacity: 16000 }
];

const demoOrderBlueprints = [
    { customerEmail: 'user@email.com', addressLabel: 'Nhà riêng', status: 'pending', paymentMethod: 'cod', paymentStatus: 'pending', deliveryMethod: 'standard', shippingZoneSlug: 'hcm-inner', warehouseCode: 'WH-HCM-Q1', daysAgo: 0, shippingFee: 25000, discountAmount: 0, usedPoints: 0, note: 'Gọi trước khi giao', items: [{ categorySlug: 'tivi', offset: 0, quantity: 1 }, { categorySlug: 'gia-dung', offset: 2, quantity: 2 }] },
    { customerEmail: 'anh.nguyen@novax.vn', addressLabel: 'Nhà riêng', status: 'confirmed', paymentMethod: 'vnpay', paymentStatus: 'processing', deliveryMethod: 'express_2h', shippingZoneSlug: 'hcm-inner', warehouseCode: 'WH-HCM-TD', daysAgo: 1, shippingFee: 40000, discountAmount: 150000, usedPoints: 0, note: 'Lắp đặt sau 19h', items: [{ categorySlug: 'tu-lanh', offset: 1, quantity: 1 }] },
    { customerEmail: 'linh.tran@novax.vn', addressLabel: 'Showroom', status: 'processing', paymentMethod: 'momo', paymentStatus: 'completed', deliveryMethod: 'standard', shippingZoneSlug: 'hn-inner', warehouseCode: 'WH-HN-CG', daysAgo: 2, shippingFee: 35000, discountAmount: 100000, usedPoints: 200, note: 'Yêu cầu xuất hóa đơn', items: [{ categorySlug: 'laptop', offset: 3, quantity: 1 }, { categorySlug: 'may-tinh-bang', offset: 2, quantity: 1 }] },
    { customerEmail: 'huy.do@novax.vn', addressLabel: 'Nhà riêng', status: 'shipped', paymentMethod: 'cod', paymentStatus: 'completed', deliveryMethod: 'standard', shippingZoneSlug: 'dn-inner', warehouseCode: 'WH-HN-CG', daysAgo: 3, shippingFee: 30000, discountAmount: 0, usedPoints: 0, note: 'Để hàng tại quầy bảo vệ', items: [{ categorySlug: 'dieu-hoa', offset: 4, quantity: 1 }] },
    { customerEmail: 'user@email.com', addressLabel: 'Cơ quan', status: 'delivered', paymentMethod: 'vnpay', paymentStatus: 'completed', deliveryMethod: 'pickup', shippingZoneSlug: 'hcm-inner', warehouseCode: 'WH-HCM-Q1', daysAgo: 4, shippingFee: 0, discountAmount: 250000, usedPoints: 300, note: 'Khách tự đến lấy', items: [{ categorySlug: 'dien-thoai', offset: 5, quantity: 2 }] },
    { customerEmail: 'anh.nguyen@novax.vn', addressLabel: 'Văn phòng', status: 'delivered', paymentMethod: 'momo', paymentStatus: 'completed', deliveryMethod: 'standard', shippingZoneSlug: 'hcm-inner', warehouseCode: 'WH-HCM-TD', daysAgo: 5, shippingFee: 30000, discountAmount: 0, usedPoints: 0, note: 'Ưu tiên giờ nghỉ trưa', items: [{ categorySlug: 'may-giat', offset: 6, quantity: 1 }, { categorySlug: 'gia-dung', offset: 3, quantity: 1 }] },
    { customerEmail: 'linh.tran@novax.vn', addressLabel: 'Nhà riêng', status: 'cancelled', paymentMethod: 'cod', paymentStatus: 'failed', deliveryMethod: 'standard', shippingZoneSlug: 'hn-inner', warehouseCode: 'WH-HN-CG', daysAgo: 6, shippingFee: 28000, discountAmount: 0, usedPoints: 0, note: 'Khách đổi ý', items: [{ categorySlug: 'tivi', offset: 6, quantity: 1 }] },
    { customerEmail: 'huy.do@novax.vn', addressLabel: 'Kho nhận hàng', status: 'processing', paymentMethod: 'vnpay', paymentStatus: 'processing', deliveryMethod: 'express_2h', shippingZoneSlug: 'dn-inner', warehouseCode: 'WH-HCM-Q1', daysAgo: 7, shippingFee: 45000, discountAmount: 200000, usedPoints: 100, note: 'Cần giao nhanh', items: [{ categorySlug: 'laptop', offset: 7, quantity: 1 }, { categorySlug: 'gia-dung', offset: 8, quantity: 1 }] },
    { customerEmail: 'user@email.com', addressLabel: 'Nhà riêng', status: 'shipped', paymentMethod: 'momo', paymentStatus: 'completed', deliveryMethod: 'standard', shippingZoneSlug: 'nationwide', warehouseCode: 'WH-HCM-Q1', daysAgo: 8, shippingFee: 50000, discountAmount: 0, usedPoints: 0, note: 'Giao liên tỉnh', items: [{ categorySlug: 'may-tinh-bang', offset: 4, quantity: 1 }, { categorySlug: 'dien-thoai', offset: 2, quantity: 1 }] },
    { customerEmail: 'anh.nguyen@novax.vn', addressLabel: 'Nhà riêng', status: 'delivered', paymentMethod: 'cod', paymentStatus: 'completed', deliveryMethod: 'standard', shippingZoneSlug: 'hcm-inner', warehouseCode: 'WH-HCM-TD', daysAgo: 9, shippingFee: 30000, discountAmount: 100000, usedPoints: 0, note: 'Giao ban ngày', items: [{ categorySlug: 'tu-lanh', offset: 5, quantity: 1 }, { categorySlug: 'gia-dung', offset: 1, quantity: 2 }] },
    { customerEmail: 'linh.tran@novax.vn', addressLabel: 'Showroom', status: 'confirmed', paymentMethod: 'vnpay', paymentStatus: 'processing', deliveryMethod: 'pickup', shippingZoneSlug: 'hn-inner', warehouseCode: 'WH-HN-CG', daysAgo: 10, shippingFee: 0, discountAmount: 0, usedPoints: 50, note: 'Đặt giữ hàng 24h', items: [{ categorySlug: 'dien-thoai', offset: 7, quantity: 3 }] },
    { customerEmail: 'huy.do@novax.vn', addressLabel: 'Nhà riêng', status: 'pending', paymentMethod: 'momo', paymentStatus: 'pending', deliveryMethod: 'standard', shippingZoneSlug: 'dn-inner', warehouseCode: 'WH-HCM-Q1', daysAgo: 11, shippingFee: 25000, discountAmount: 0, usedPoints: 0, note: 'Chờ duyệt trả góp', items: [{ categorySlug: 'laptop', offset: 1, quantity: 1 }, { categorySlug: 'may-giat', offset: 2, quantity: 1 }] },
    { customerEmail: 'user@email.com', addressLabel: 'Cơ quan', status: 'delivered', paymentMethod: 'vnpay', paymentStatus: 'completed', deliveryMethod: 'standard', shippingZoneSlug: 'hcm-inner', warehouseCode: 'WH-HCM-Q1', daysAgo: 12, shippingFee: 32000, discountAmount: 50000, usedPoints: 150, note: 'Giao thành công buổi sáng', items: [{ categorySlug: 'tivi', offset: 8, quantity: 1 }] }
];

const demoReviewBlueprints = [
    { customerEmail: 'user@email.com', categorySlug: 'tivi', offset: 2, rating: 5, comment: 'Màn hình đẹp, giao nhanh.' },
    { customerEmail: 'anh.nguyen@novax.vn', categorySlug: 'tu-lanh', offset: 3, rating: 5, comment: 'Rất êm, tiết kiệm điện.' },
    { customerEmail: 'linh.tran@novax.vn', categorySlug: 'laptop', offset: 5, rating: 4, comment: 'Hiệu năng tốt cho công việc.' },
    { customerEmail: 'huy.do@novax.vn', categorySlug: 'dien-thoai', offset: 4, rating: 5, comment: 'Máy mượt, pin tốt.' },
    { customerEmail: 'user@email.com', categorySlug: 'gia-dung', offset: 6, rating: 4, comment: 'Nhiều tiện ích, đáng tiền.' },
    { customerEmail: 'anh.nguyen@novax.vn', categorySlug: 'may-giat', offset: 1, rating: 5, comment: 'Giặt sạch, chạy êm.' },
    { customerEmail: 'linh.tran@novax.vn', categorySlug: 'may-tinh-bang', offset: 3, rating: 5, comment: 'Màn hình đẹp, phù hợp học tập.' },
    { customerEmail: 'huy.do@novax.vn', categorySlug: 'dieu-hoa', offset: 2, rating: 4, comment: 'Làm lạnh nhanh, ổn định.' }
];

const getDaysAgo = (daysAgo) => new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000));

function getProductVariantSlugs(categorySlug) {
    return products.filter((product) => product.categorySlug === categorySlug).map((product) => product.slug);
}

function getProductRecord(productBySlug, categorySlug, offset) {
    const variants = getProductVariantSlugs(categorySlug);
    const slug = variants[offset % variants.length];
    return productBySlug.get(slug);
}

function buildShippingFee(order) {
    return order.shippingFee;
}

async function seedCategories() {
    for (const category of categories) {
        await prisma.category.upsert({
            where: { slug: category.slug },
            create: category,
            update: { name: category.name, icon: category.icon }
        });
    }
}

async function seedStores() {
    for (const store of stores) {
        await prisma.store.upsert({
            where: { id: `store_${store.district}` }, // Using district as a pseudo-id for seed stability
            create: {
                id: `store_${store.district}`,
                ...store
            },
            update: store
        });
    }
}

async function seedProducts() {
    const seededSlugs = [];
    const dbStores = await prisma.store.findMany();

    for (const item of products) {
        const category = await prisma.category.findUnique({
            where: { slug: item.categorySlug }
        });

        if (!category) continue;

        const product = await prisma.product.upsert({
            where: { slug: item.slug },
            create: {
                name: item.name,
                slug: item.slug,
                categoryId: category.id,
                brand: item.brand,
                price: item.price,
                originalPrice: item.originalPrice,
                discount: item.discount,
                rating: item.rating,
                reviewCount: item.reviewCount,
                inStock: true,
                stock: item.stock,
                isActive: true
            },
            update: {
                name: item.name,
                categoryId: category.id,
                brand: item.brand,
                price: item.price,
                originalPrice: item.originalPrice,
                discount: item.discount,
                rating: item.rating,
                reviewCount: item.reviewCount,
                inStock: true,
                stock: item.stock,
                isActive: true
            }
        });

        // Clear and add images
        await prisma.productImage.deleteMany({ where: { productId: product.id } });
        await prisma.productImage.create({
            data: { productId: product.id, url: item.image, sortOrder: 0 }
        });

        // Seed stock for stores
        for (const store of dbStores) {
            await prisma.storeStock.upsert({
                where: { productId_storeId: { productId: product.id, storeId: store.id } },
                create: { productId: product.id, storeId: store.id, quantity: Math.floor(Math.random() * 10) + 1 },
                update: {}
            });
        }

        seededSlugs.push(item.slug);
    }
}

async function seedOperationalData() {
    // Create shipping zones, rules, warehouses, warehouse inventory, orders, payments, shipments, warranties, reviews and snapshots
    // This function is idempotent-ish: it clears demo operational records before creating new ones
    await prisma.orderShipment.deleteMany();
    await prisma.warranty.deleteMany();
    await prisma.inventoryMovement.deleteMany();
    await prisma.salesSnapshotDaily.deleteMany();
    await prisma.inventorySnapshotDaily.deleteMany();
    await prisma.warehouseProduct.deleteMany();
    await prisma.warehouse.deleteMany();
    await prisma.shippingRule.deleteMany();
    await prisma.shippingZone.deleteMany();

    const productRecords = await prisma.product.findMany({ where: { slug: { in: products.map((p) => p.slug) } } });
    const productBySlug = new Map(productRecords.map((p) => [p.slug, p]));
    const customerUsers = await prisma.user.findMany({ where: { email: { in: demoCustomers.map((c) => c.email) } } });
    const userByEmail = new Map(customerUsers.map((u) => [u.email, u]));
    const addressRecords = await prisma.address.findMany({ where: { userId: { in: customerUsers.map((u) => u.id) } } });
    const zoneBySlug = new Map();

    for (const zone of shippingZones) {
        const createdZone = await prisma.shippingZone.create({ data: zone });
        zoneBySlug.set(zone.slug, createdZone);
    }

    for (const rule of shippingRules) {
        const zoneRecord = zoneBySlug.get(rule.zoneSlug);
        if (!zoneRecord) continue;
        await prisma.shippingRule.create({ data: { zoneId: zoneRecord.id, minDistance: rule.minDistance, maxDistance: rule.maxDistance, baseFee: rule.baseFee, perKmFee: rule.perKmFee, description: rule.description, isActive: true } });
    }

    const warehouseRecords = [];
    for (const wh of warehouses) {
        warehouseRecords.push(await prisma.warehouse.create({ data: wh }));
    }

    const stockByProductId = new Map(productRecords.map((product) => [product.id, Number(product.stock || 0)]));
    const historicalStart = new Date('2026-04-01T00:00:00.000Z');
    const historicalCutoff = new Date();
    historicalCutoff.setDate(historicalCutoff.getDate() - 13);
    historicalCutoff.setHours(0, 0, 0, 0);
    const historicalCategories = ['dien-thoai', 'laptop', 'tivi', 'tu-lanh', 'dieu-hoa', 'may-giat', 'gia-dung', 'may-tinh-bang'];
    const snapshotProducts = productRecords.slice(0, 18);
    const snapshotRecordedDates = new Set();

    const pickSeedProduct = (categorySlug, offset) => {
        const variants = getProductVariantSlugs(categorySlug).map((slug) => productBySlug.get(slug)).filter(Boolean);
        const preferred = variants.find((candidate) => Number(stockByProductId.get(candidate.id) || 0) > 0);
        if (preferred) return preferred;

        const fallback = productRecords.find((candidate) => Number(stockByProductId.get(candidate.id) || 0) > 0);
        if (fallback) return fallback;

        return getProductRecord(productBySlug, categorySlug, offset);
    };

    const recordSeedStock = async (orderId, selectedItems, warehouseId, createdAt) => {
        for (const item of selectedItems) {
            const product = item.product;
            if (!product) continue;

            const quantity = Math.max(1, Number(item.quantity || 1));
            const currentStock = Number(stockByProductId.get(product.id) || 0);
            if (currentStock < quantity) continue;

            const nextStock = currentStock - quantity;
            stockByProductId.set(product.id, nextStock);

            await prisma.product.update({
                where: { id: product.id },
                data: { stock: nextStock, inStock: nextStock > 0 }
            });

            await prisma.inventoryMovement.create({
                data: {
                    productId: product.id,
                    warehouseId: warehouseId || null,
                    orderId,
                    movementType: 'sale-reserved',
                    quantity,
                    reason: `Seeded order ${orderId}`,
                    source: 'seed.js',
                    createdAt
                }
            });
        }
    };

    const recordInventorySnapshots = async (snapshotDate) => {
        const dayStart = new Date(snapshotDate);
        dayStart.setHours(0, 0, 0, 0);

        await Promise.all(snapshotProducts.map((product) => prisma.inventorySnapshotDaily.create({
            data: {
                snapshotDate: dayStart,
                productId: product.id,
                warehouseId: null,
                stockOnHand: Number(stockByProductId.get(product.id) || product.stock || 0),
                reserved: 0,
                minStockThreshold: product.minStockThreshold || 5
            }
        })));
    };

    // Seed warehouse inventory
    for (const wh of warehouseRecords) {
        const seedProductsList = productRecords.slice(0, 24);
        for (let i = 0; i < seedProductsList.length; i += 1) {
            const product = seedProductsList[i];
            await prisma.warehouseProduct.create({ data: { warehouseId: wh.id, productId: product.id, quantity: 40 + (i * 3), reserved: i % 5 } });
        }
    }

    // Build orders based on blueprints
    const dailyTotals = new Map();

    for (let i = 0; i < demoOrderBlueprints.length; i += 1) {
        const blueprint = demoOrderBlueprints[i];
        const userRecord = userByEmail.get(blueprint.customerEmail);
        if (!userRecord) continue;
        const addressRecord = addressRecords.find((a) => a.userId === userRecord.id && a.label === blueprint.addressLabel) || addressRecords.find((a) => a.userId === userRecord.id);
        if (!addressRecord) continue;

        const selectedItems = blueprint.items.map((it) => {
            const p = getProductRecord(productBySlug, it.categorySlug, it.offset);
            return { product: p, quantity: it.quantity, unitPrice: p.price };
        }).filter(Boolean);

        const subtotal = selectedItems.reduce((s, x) => s + (x.unitPrice * x.quantity), 0);
        const shippingFee = blueprint.shippingFee || 0;
        const total = subtotal + shippingFee - (blueprint.discountAmount || 0) - (blueprint.usedPoints || 0);
        const createdAt = getDaysAgo(blueprint.daysAgo || 0);
        const orderNumber = `NVX-${String(i + 1).padStart(4, '0')}`;

        const order = await prisma.order.create({ data: { orderNumber, userId: userRecord.id, status: blueprint.status, subtotal, shippingFee, discountAmount: blueprint.discountAmount || 0, usedPoints: blueprint.usedPoints || 0, total, pricingSnapshot: { subtotal, shippingFee, discountAmount: blueprint.discountAmount || 0, usedPoints: blueprint.usedPoints || 0, total }, shippingAddressId: addressRecord.id, deliveryMethod: blueprint.deliveryMethod, note: blueprint.note, createdAt } });

        await prisma.orderItem.createMany({ data: selectedItems.map((si) => ({ orderId: order.id, productId: si.product.id, quantity: si.quantity, unitPrice: si.unitPrice })) });

        await prisma.payment.create({ data: { orderId: order.id, amount: total, method: blueprint.paymentMethod, status: blueprint.paymentStatus, transactionRef: blueprint.paymentStatus === 'completed' ? `TRX-${order.orderNumber}` : null } });

        const zone = zoneBySlug.get(blueprint.shippingZoneSlug);
        const wh = warehouseRecords.find((w) => w.code === blueprint.warehouseCode) || warehouseRecords[0];
        if (zone && wh && blueprint.status !== 'cancelled') {
            await prisma.orderShipment.create({ data: { orderId: order.id, warehouseId: wh.id, shippingZoneId: zone.id, estimatedDays: blueprint.deliveryMethod === 'express_2h' ? 1 : (blueprint.shippingZoneSlug === 'nationwide' ? 4 : 2), shippingFee, trackingNumber: `TRK-${order.orderNumber}`, status: blueprint.status === 'delivered' ? 'delivered' : blueprint.status === 'shipped' ? 'shipped' : blueprint.status === 'processing' ? 'processing' : 'pending' } });
        }

        if (blueprint.status === 'delivered') {
            const wp = selectedItems[0];
            if (wp) {
                await prisma.warranty.create({ data: { orderId: order.id, productId: wp.product.id, expiryDate: new Date(createdAt.getTime() + (365 * 24 * 60 * 60 * 1000)), serialNumber: `WRT-${order.orderNumber}-${wp.product.slug.slice(0, 6).toUpperCase()}` } });
            }
        }

        await recordSeedStock(order.id, selectedItems, wh?.id, createdAt);

        const snapshotKey = createdAt.toISOString().slice(0, 10);
        if (!snapshotRecordedDates.has(snapshotKey)) {
            await recordInventorySnapshots(createdAt);
            snapshotRecordedDates.add(snapshotKey);
        }

        const key = createdAt.toISOString().slice(0, 10);
        const cur = dailyTotals.get(key) || { revenue: 0, orderCount: 0, deliveredRevenue: 0, deliveredCount: 0 };
        cur.revenue += total; cur.orderCount += 1; if (blueprint.status === 'delivered') { cur.deliveredRevenue += total; cur.deliveredCount += 1; }
        dailyTotals.set(key, cur);
    }

    for (let cursor = new Date(historicalStart); cursor <= historicalCutoff; cursor.setDate(cursor.getDate() + 1)) {
        const createdAt = new Date(cursor);
        const dayIndex = Math.floor((createdAt.getTime() - historicalStart.getTime()) / (24 * 60 * 60 * 1000));
        const customer = demoCustomers[dayIndex % demoCustomers.length];
        const userRecord = userByEmail.get(customer.email);
        if (!userRecord) continue;

        const addressRecord = addressRecords.find((a) => a.userId === userRecord.id && a.label === customer.addresses[dayIndex % customer.addresses.length].label)
            || addressRecords.find((a) => a.userId === userRecord.id);
        if (!addressRecord) continue;

        const statusCycle = ['delivered', 'shipped', 'processing', 'confirmed', 'pending', 'cancelled'];
        const paymentMethodCycle = ['cod', 'vnpay', 'momo'];
        const paymentStatusCycle = {
            delivered: 'completed',
            shipped: 'completed',
            processing: 'processing',
            confirmed: 'pending',
            pending: 'pending',
            cancelled: 'failed'
        };

        const status = statusCycle[dayIndex % statusCycle.length];
        const paymentMethod = paymentMethodCycle[dayIndex % paymentMethodCycle.length];
        const paymentStatus = paymentStatusCycle[status];
        const shippingZoneSlug = shippingZones[dayIndex % shippingZones.length].slug;
        const warehouseCode = warehouses[dayIndex % warehouses.length].code;
        const deliveryMethod = dayIndex % 4 === 0 ? 'pickup' : dayIndex % 3 === 0 ? 'express_2h' : 'standard';
        const shippingFee = deliveryMethod === 'pickup' ? 0 : deliveryMethod === 'express_2h' ? 45000 : 30000 + ((dayIndex % 4) * 5000);
        const discountAmount = status === 'delivered' ? 50000 + ((dayIndex % 4) * 25000) : status === 'shipped' ? 25000 : 0;
        const usedPoints = status === 'delivered' && dayIndex % 2 === 0 ? 100 : 0;
        const note = dayIndex % 3 === 0 ? 'Đơn backfill lịch sử' : 'Dữ liệu vận hành mô phỏng';

        const itemDefinitions = [
            { categorySlug: historicalCategories[dayIndex % historicalCategories.length], offset: dayIndex % 10, quantity: 1 },
            { categorySlug: historicalCategories[(dayIndex + 3) % historicalCategories.length], offset: (dayIndex + 2) % 10, quantity: 1 }
        ];

        const selectedItems = itemDefinitions.map((item) => {
            const product = pickSeedProduct(item.categorySlug, item.offset);
            return product ? { product, quantity: item.quantity, unitPrice: product.price } : null;
        }).filter(Boolean);

        if (selectedItems.length === 0) continue;

        const subtotal = selectedItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
        const total = Math.max(0, subtotal + shippingFee - discountAmount - usedPoints);
        const orderNumber = `NVX-HIST-${String(createdAt.getFullYear())}${String(createdAt.getMonth() + 1).padStart(2, '0')}${String(createdAt.getDate()).padStart(2, '0')}-${String(dayIndex + 1).padStart(4, '0')}`;
        const zone = zoneBySlug.get(shippingZoneSlug);
        const wh = warehouseRecords.find((w) => w.code === warehouseCode) || warehouseRecords[0];

        const order = await prisma.order.create({
            data: {
                orderNumber,
                userId: userRecord.id,
                status,
                subtotal,
                shippingFee,
                discountAmount,
                usedPoints,
                total,
                pricingSnapshot: {
                    source: 'seed-historical',
                    subtotal,
                    shippingFee,
                    discountAmount,
                    usedPoints,
                    total
                },
                shippingAddressId: addressRecord.id,
                deliveryMethod,
                note,
                createdAt
            }
        });

        await prisma.orderItem.createMany({
            data: selectedItems.map((item) => ({
                orderId: order.id,
                productId: item.product.id,
                quantity: item.quantity,
                unitPrice: item.unitPrice
            }))
        });

        await prisma.payment.create({
            data: {
                orderId: order.id,
                amount: total,
                method: paymentMethod,
                status: paymentStatus,
                transactionRef: paymentStatus === 'completed' ? `TRX-${order.orderNumber}` : null,
                createdAt
            }
        });

        if (zone && wh && status !== 'cancelled') {
            await prisma.orderShipment.create({
                data: {
                    orderId: order.id,
                    warehouseId: wh.id,
                    shippingZoneId: zone.id,
                    estimatedDays: deliveryMethod === 'express_2h' ? 1 : shippingZoneSlug === 'nationwide' ? 4 : 2,
                    shippingFee,
                    trackingNumber: `TRK-${order.orderNumber}`,
                    status: status === 'delivered' ? 'delivered' : status === 'shipped' ? 'shipped' : status === 'processing' ? 'processing' : 'pending',
                    createdAt
                }
            });
        }

        if (status === 'delivered') {
            const wp = selectedItems[0];
            if (wp) {
                await prisma.warranty.create({
                    data: {
                        orderId: order.id,
                        productId: wp.product.id,
                        expiryDate: new Date(createdAt.getTime() + (365 * 24 * 60 * 60 * 1000)),
                        serialNumber: `WRT-${order.orderNumber}-${wp.product.slug.slice(0, 6).toUpperCase()}`,
                        createdAt
                    }
                });
            }
        }

        await recordSeedStock(order.id, selectedItems, wh?.id, createdAt);

        const snapshotKey = createdAt.toISOString().slice(0, 10);
        if (!snapshotRecordedDates.has(snapshotKey)) {
            await recordInventorySnapshots(createdAt);
            snapshotRecordedDates.add(snapshotKey);
        }

        const key = createdAt.toISOString().slice(0, 10);
        const cur = dailyTotals.get(key) || { revenue: 0, orderCount: 0, deliveredRevenue: 0, deliveredCount: 0 };
        cur.revenue += total;
        cur.orderCount += 1;
        if (status === 'delivered') {
            cur.deliveredRevenue += total;
            cur.deliveredCount += 1;
        }
        dailyTotals.set(key, cur);
    }

    for (const [dateKey, bucket] of dailyTotals.entries()) {
        const snapshotDate = new Date(`${dateKey}T00:00:00.000Z`);
        await prisma.salesSnapshotDaily.create({ data: { snapshotDate, metricMode: 'paid', orderCount: bucket.orderCount, revenue: bucket.revenue } });
        try {
            await prisma.salesSnapshotDaily.create({ data: { snapshotDate, metricMode: 'delivered', orderCount: bucket.deliveredCount, revenue: bucket.deliveredRevenue } });
        } catch (err) {
            if (!err || err.code !== 'P2002') throw err;
        }
    }

    // seed reviews
    const reviewBulk = [];
    for (const r of demoReviewBlueprints) {
        const u = userByEmail.get(r.customerEmail);
        const p = getProductRecord(productBySlug, r.categorySlug, r.offset);
        if (!u || !p) continue;
        reviewBulk.push({ userId: u.id, productId: p.id, rating: r.rating, comment: r.comment, isVerified: true });
    }
    if (reviewBulk.length) await prisma.productReview.createMany({ data: reviewBulk });

    // Seed sample promotions (idempotent via code)
    const now = new Date();
    const later = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days

    await prisma.promotion.upsert({
        where: { code: 'WELCOME10' },
        create: {
            name: 'Welcome 10% off',
            code: 'WELCOME10',
            type: 'coupon',
            status: 'active',
            discountType: 'percent',
            discountValue: 10,
            maxDiscount: 200000,
            minOrderAmount: 100000,
            priority: 10,
            isExclusive: false,
            startsAt: now,
            endsAt: later
        },
        update: { name: 'Welcome 10% off', status: 'active', discountValue: 10, endsAt: later }
    });

    await prisma.promotion.upsert({
        where: { code: 'TV20' },
        create: {
            name: '20% off selected TVs',
            code: 'TV20',
            type: 'product',
            status: 'active',
            discountType: 'percent',
            discountValue: 20,
            maxDiscount: 1000000,
            priority: 5,
            isExclusive: true,
            startsAt: now,
            endsAt: later,
            metadata: { category: 'tivi' }
        },
        update: { name: '20% off selected TVs', status: 'active', discountValue: 20, endsAt: later }
    });

    await prisma.promotion.upsert({
        where: { code: 'BOGO-GIFT' },
        create: {
            name: 'Mua 1 tặng 1 (select small items)',
            code: 'BOGO-GIFT',
            type: 'bogo',
            status: 'active',
            discountType: 'fixed',
            discountValue: 0,
            priority: 20,
            isExclusive: false,
            startsAt: now,
            endsAt: later,
            metadata: { buyQuantity: 1, getQuantity: 1, targetCategory: 'gia-dung' }
        },
        update: { name: 'Mua 1 tặng 1 (select small items)', status: 'active', endsAt: later }
    });
}

async function seedUsers() {
    const adminPasswordHash = await bcrypt.hash('123456', 10);
    const customerPasswordHash = await bcrypt.hash('123456', 10);
    const staffPasswordHash = adminPasswordHash;

    const internalUsers = [
        {
            email: 'manager@novax.vn',
            fullName: 'NovaX Manager',
            role: 'manager',
            passwordHash: staffPasswordHash
        },
        {
            email: 'sales@novax.vn',
            fullName: 'NovaX Sales',
            role: 'sales',
            passwordHash: staffPasswordHash
        },
        {
            email: 'warehouse@novax.vn',
            fullName: 'NovaX Warehouse',
            role: 'warehouse',
            passwordHash: staffPasswordHash
        }
    ];

    const admin = await prisma.user.upsert({
        where: { email: 'admin@novax.vn' },
        create: {
            email: 'admin@novax.vn',
            fullName: 'NovaX Admin',
            passwordHash: adminPasswordHash,
            role: 'admin',
            verified: true,
            carts: { create: {} }
        },
        update: { fullName: 'NovaX Admin', role: 'admin', verified: true }
    });

    for (const user of internalUsers) {
        await prisma.user.upsert({
            where: { email: user.email },
            create: {
                email: user.email,
                fullName: user.fullName,
                passwordHash: user.passwordHash,
                role: user.role,
                verified: true,
                carts: { create: {} }
            },
            update: { fullName: user.fullName, role: user.role, verified: true }
        });
    }
    const seededCustomers = await (async () => {
        // Create demo customers and their addresses/cards
        for (const customer of demoCustomers) {
            await prisma.user.upsert({
                where: { email: customer.email },
                create: {
                    email: customer.email,
                    fullName: customer.fullName,
                    phone: customer.phone,
                    passwordHash: customerPasswordHash,
                    role: 'customer',
                    verified: true,
                    points: customer.points,
                    carts: { create: {} }
                },
                update: {
                    fullName: customer.fullName,
                    phone: customer.phone,
                    role: 'customer',
                    verified: true,
                    points: customer.points
                }
            });
        }

        const customerUsers = await prisma.user.findMany({
            where: { email: { in: demoCustomers.map((c) => c.email) } }
        });

        // Clean up and seed addresses/cards/payments/orders later in operational seeding
        return customerUsers;
    })();

    // Remove existing demo-related records to ensure idempotency
    await prisma.payment.deleteMany();
    await prisma.order.deleteMany();
    await prisma.productReview.deleteMany();
    await prisma.savedCard.deleteMany();

    // Remove previous addresses for demo users
    for (const cu of seededCustomers) {
        await prisma.address.deleteMany({ where: { userId: cu.id } });
    }

    // Create addresses and saved cards for demo users
    for (const customer of demoCustomers) {
        const userRec = await prisma.user.findUnique({ where: { email: customer.email } });
        if (!userRec) continue;

        await prisma.address.createMany({
            data: customer.addresses.map((address) => ({ userId: userRec.id, ...address }))
        });

        await prisma.savedCard.create({ data: { userId: userRec.id, brand: customer.savedCard.brand, last4: customer.savedCard.last4, token: `token-${userRec.id.slice(0, 8)}-${customer.savedCard.last4}` } });
    }

    return;
}

async function main() {
    await seedCategories();
    await seedStores();
    await seedUsers();
    await seedProducts();
    await seedOperationalData();
    console.log(`Seed completed successfully`);
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
