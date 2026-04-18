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

async function seedUsers() {
    const adminPasswordHash = await bcrypt.hash('123456', 10);
    const customerPasswordHash = await bcrypt.hash('123456', 10);

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

    const user = await prisma.user.upsert({
        where: { email: 'user@email.com' },
        create: {
            email: 'user@email.com',
            fullName: 'Khach Hang Demo',
            passwordHash: customerPasswordHash,
            role: 'customer',
            verified: true,
            points: 500, // Pre-seed some points for testing
            carts: { create: {} }
        },
        update: { fullName: 'Khach Hang Demo', role: 'customer', verified: true }
    });

    // Seed addresses for the user
    await prisma.address.deleteMany({ where: { userId: user.id } });
    await prisma.address.createMany({
        data: [
            {
                userId: user.id,
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
                userId: user.id,
                fullName: 'Khách Hàng Demo',
                phone: '0901234567',
                province: 'hn',
                district: 'cg',
                ward: 'p_dich_vong',
                streetAddress: '89 Xuân Thủy',
                label: 'Cơ quan',
                isDefault: false
            }
        ]
    });
}

async function main() {
    await seedCategories();
    await seedStores();
    await seedUsers();
    await seedProducts();
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
