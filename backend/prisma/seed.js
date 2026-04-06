const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

const categoryMap = {
    'dien-thoai': { name: 'Dien thoai', slug: 'dien-thoai', icon: 'phone' },
    laptop: { name: 'Laptop', slug: 'laptop', icon: 'laptop' },
    'may-tinh-bang': { name: 'May tinh bang', slug: 'may-tinh-bang', icon: 'tablet' },
    tivi: { name: 'Tivi', slug: 'tivi', icon: 'tv' }
};

const products = [
    {
        slug: 'iphone-15-pro-max',
        name: 'iPhone 15 Pro Max 256GB',
        categorySlug: 'dien-thoai',
        brand: 'Apple',
        price: 29990000,
        originalPrice: 34990000,
        discount: 14,
        rating: 4.8,
        reviewCount: 1250,
        image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop'
    },
    {
        slug: 'samsung-galaxy-s24-ultra',
        name: 'Samsung Galaxy S24 Ultra',
        categorySlug: 'dien-thoai',
        brand: 'Samsung',
        price: 27990000,
        originalPrice: 33990000,
        discount: 18,
        rating: 4.7,
        reviewCount: 890,
        image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=400&fit=crop'
    },
    {
        slug: 'macbook-air-m3',
        name: 'MacBook Air M3 15 inch',
        categorySlug: 'laptop',
        brand: 'Apple',
        price: 32990000,
        originalPrice: 37990000,
        discount: 13,
        rating: 4.9,
        reviewCount: 456,
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop'
    },
    {
        slug: 'ipad-pro-m4',
        name: 'iPad Pro M4 11 inch',
        categorySlug: 'may-tinh-bang',
        brand: 'Apple',
        price: 25990000,
        originalPrice: 28990000,
        discount: 10,
        rating: 4.8,
        reviewCount: 320,
        image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop'
    }
];

async function seedCategories() {
    for (const key of Object.keys(categoryMap)) {
        const category = categoryMap[key];
        await prisma.category.upsert({
            where: { slug: category.slug },
            create: category,
            update: { name: category.name, icon: category.icon }
        });
    }
}

async function seedProducts() {
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
                stock: 20
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
                inStock: true
            }
        });

        await prisma.productImage.upsert({
            where: {
                id: `${product.id}-img-1`
            },
            create: {
                id: `${product.id}-img-1`,
                productId: product.id,
                url: item.image,
                sortOrder: 0
            },
            update: {
                url: item.image,
                sortOrder: 0
            }
        });
    }
}

async function seedUsers() {
    const adminPasswordHash = await bcrypt.hash('123456', 10);
    const customerPasswordHash = await bcrypt.hash('123456', 10);

    await prisma.user.upsert({
        where: { email: 'admin@novax.vn' },
        create: {
            email: 'admin@novax.vn',
            fullName: 'NovaX Admin',
            passwordHash: adminPasswordHash,
            role: 'admin',
            verified: true,
            carts: {
                create: {}
            }
        },
        update: {
            fullName: 'NovaX Admin',
            passwordHash: adminPasswordHash,
            role: 'admin',
            verified: true
        }
    });

    await prisma.user.upsert({
        where: { email: 'user@email.com' },
        create: {
            email: 'user@email.com',
            fullName: 'Khach hang',
            passwordHash: customerPasswordHash,
            role: 'customer',
            verified: true,
            carts: {
                create: {}
            }
        },
        update: {
            fullName: 'Khach hang',
            passwordHash: customerPasswordHash,
            role: 'customer',
            verified: true
        }
    });
}

async function main() {
    await seedCategories();
    await seedUsers();
    await seedProducts();
    console.log('Seed completed');
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
