export interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  images: string[];
  category: string;
  subcategory?: string;
  brand: string;
  rating: number;
  reviewCount: number;
  description?: string;
  inStock: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
}

export const products: CatalogProduct[] = [
  {
    id: 'p1',
    name: 'iPhone 15 Pro Max 256GB',
    slug: 'iphone-15-pro-max',
    price: 29990000,
    originalPrice: 34990000,
    discount: 14,
    images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop'],
    category: 'dien-thoai',
    subcategory: 'iphone',
    brand: 'Apple',
    rating: 4.8,
    reviewCount: 1250,
    inStock: true,
    isBestSeller: true,
    description: 'iPhone 15 Pro Max voi chip A17 Pro, camera 48MP, khung Titanium.'
  },
  {
    id: 'p2',
    name: 'Samsung Galaxy S24 Ultra',
    slug: 'samsung-galaxy-s24-ultra',
    price: 27990000,
    originalPrice: 33990000,
    discount: 18,
    images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=400&fit=crop'],
    category: 'dien-thoai',
    subcategory: 'samsung',
    brand: 'Samsung',
    rating: 4.7,
    reviewCount: 890,
    inStock: true,
    isBestSeller: true,
    description: 'Galaxy S24 Ultra voi S-Pen va AI thong minh.'
  },
  {
    id: 'p3',
    name: 'MacBook Air M3 15 inch',
    slug: 'macbook-air-m3',
    price: 32990000,
    originalPrice: 37990000,
    discount: 13,
    images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop'],
    category: 'laptop',
    subcategory: 'macbook',
    brand: 'Apple',
    rating: 4.9,
    reviewCount: 456,
    inStock: true,
    isNew: true,
    description: 'MacBook Air M3 sieu mong nhe, hieu nang cao.'
  },
  {
    id: 'p4',
    name: 'iPad Pro M4 11 inch',
    slug: 'ipad-pro-m4',
    price: 25990000,
    originalPrice: 28990000,
    discount: 10,
    images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop'],
    category: 'may-tinh-bang',
    subcategory: 'ipad',
    brand: 'Apple',
    rating: 4.8,
    reviewCount: 320,
    inStock: true,
    isNew: true,
    description: 'iPad Pro M4 voi man hinh OLED tandem.'
  },
  {
    id: 'p5',
    name: 'TV Samsung OLED 4K 55 inch',
    slug: 'tv-samsung-oled-55',
    price: 18990000,
    originalPrice: 24990000,
    discount: 24,
    images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop'],
    category: 'tivi',
    subcategory: 'samsung-tv',
    brand: 'Samsung',
    rating: 4.6,
    reviewCount: 210,
    inStock: true,
    isBestSeller: true,
    description: 'TV Samsung OLED 4K voi hinh anh sac net.'
  },
  {
    id: 'p6',
    name: 'Xiaomi 14 Ultra',
    slug: 'xiaomi-14-ultra',
    price: 19990000,
    originalPrice: 23990000,
    discount: 17,
    images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=400&fit=crop'],
    category: 'dien-thoai',
    subcategory: 'xiaomi',
    brand: 'Xiaomi',
    rating: 4.5,
    reviewCount: 560,
    inStock: true,
    description: 'Xiaomi 14 Ultra voi camera Leica.'
  }
];
