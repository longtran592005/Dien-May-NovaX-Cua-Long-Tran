import { Product, Category, Review } from "@/types/product";

export const categories: Category[] = [
  {
    id: "1", name: "Điện thoại", slug: "dien-thoai", icon: "📱",
    subcategories: [
      { id: "1a", name: "iPhone", slug: "iphone" },
      { id: "1b", name: "Samsung", slug: "samsung" },
      { id: "1c", name: "Xiaomi", slug: "xiaomi" },
      { id: "1d", name: "OPPO", slug: "oppo" },
    ]
  },
  {
    id: "2", name: "Laptop", slug: "laptop", icon: "💻",
    subcategories: [
      { id: "2a", name: "MacBook", slug: "macbook" },
      { id: "2b", name: "Dell", slug: "dell" },
      { id: "2c", name: "HP", slug: "hp" },
      { id: "2d", name: "Lenovo", slug: "lenovo" },
    ]
  },
  {
    id: "3", name: "Máy tính bảng", slug: "may-tinh-bang", icon: "📟",
    subcategories: [
      { id: "3a", name: "iPad", slug: "ipad" },
      { id: "3b", name: "Samsung Tab", slug: "samsung-tab" },
    ]
  },
  {
    id: "4", name: "Tivi", slug: "tivi", icon: "📺",
    subcategories: [
      { id: "4a", name: "Samsung", slug: "samsung-tv" },
      { id: "4b", name: "LG", slug: "lg-tv" },
      { id: "4c", name: "Sony", slug: "sony-tv" },
    ]
  },
  {
    id: "5", name: "Tủ lạnh", slug: "tu-lanh", icon: "🧊",
    subcategories: [
      { id: "5a", name: "Samsung", slug: "samsung-fridge" },
      { id: "5b", name: "Panasonic", slug: "panasonic-fridge" },
    ]
  },
  {
    id: "6", name: "Máy giặt", slug: "may-giat", icon: "🫧",
    subcategories: [
      { id: "6a", name: "LG", slug: "lg-washer" },
      { id: "6b", name: "Electrolux", slug: "electrolux" },
    ]
  },
  {
    id: "7", name: "Điều hòa", slug: "dieu-hoa", icon: "❄️",
    subcategories: [
      { id: "7a", name: "Daikin", slug: "daikin" },
      { id: "7b", name: "Panasonic", slug: "panasonic-ac" },
    ]
  },
  {
    id: "8", name: "Gia dụng", slug: "gia-dung", icon: "🍳",
    subcategories: [
      { id: "8a", name: "Nồi cơm", slug: "noi-com" },
      { id: "8b", name: "Bếp từ", slug: "bep-tu" },
      { id: "8c", name: "Máy xay", slug: "may-xay" },
    ]
  },
  {
    id: "9", name: "Phụ kiện", slug: "phu-kien", icon: "🎧",
    subcategories: [
      { id: "9a", name: "Tai nghe", slug: "tai-nghe" },
      { id: "9b", name: "Sạc & Cáp", slug: "sac-cap" },
      { id: "9c", name: "Chuột & Bàn phím", slug: "chuot-ban-phim" },
    ]
  },
];

export const products: Product[] = [
  {
    id: "p1", name: "iPhone 15 Pro Max 256GB", slug: "iphone-15-pro-max",
    price: 29990000, originalPrice: 34990000, discount: 14,
    images: ["https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop"],
    category: "dien-thoai", subcategory: "iphone", brand: "Apple",
    rating: 4.8, reviewCount: 1250, inStock: true, isBestSeller: true,
    specs: { "Màn hình": "6.7 inch", "Chip": "A17 Pro", "RAM": "8GB", "Pin": "4422 mAh" },
    description: "iPhone 15 Pro Max với chip A17 Pro mạnh mẽ, camera 48MP, khung Titanium."
  },
  {
    id: "p2", name: "Samsung Galaxy S24 Ultra", slug: "samsung-galaxy-s24-ultra",
    price: 27990000, originalPrice: 33990000, discount: 18,
    images: ["https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=400&fit=crop"],
    category: "dien-thoai", subcategory: "samsung", brand: "Samsung",
    rating: 4.7, reviewCount: 890, inStock: true, isBestSeller: true,
    specs: { "Màn hình": "6.8 inch", "Chip": "Snapdragon 8 Gen 3", "RAM": "12GB", "Pin": "5000 mAh" },
    description: "Galaxy S24 Ultra với S-Pen, AI Galaxy thông minh."
  },
  {
    id: "p3", name: "MacBook Air M3 15 inch", slug: "macbook-air-m3",
    price: 32990000, originalPrice: 37990000, discount: 13,
    images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop"],
    category: "laptop", subcategory: "macbook", brand: "Apple",
    rating: 4.9, reviewCount: 456, inStock: true, isNew: true,
    specs: { "Màn hình": "15.3 inch", "Chip": "M3", "RAM": "8GB", "SSD": "256GB" },
    description: "MacBook Air M3 siêu mỏng nhẹ, hiệu năng vượt trội."
  },
  {
    id: "p4", name: "iPad Pro M4 11 inch", slug: "ipad-pro-m4",
    price: 25990000, originalPrice: 28990000, discount: 10,
    images: ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop"],
    category: "may-tinh-bang", subcategory: "ipad", brand: "Apple",
    rating: 4.8, reviewCount: 320, inStock: true, isNew: true,
    specs: { "Màn hình": "11 inch", "Chip": "M4", "RAM": "8GB" },
    description: "iPad Pro M4 với màn hình OLED tandem, mỏng nhất từ trước đến nay."
  },
  {
    id: "p5", name: "TV Samsung OLED 4K 55 inch", slug: "tv-samsung-oled-55",
    price: 18990000, originalPrice: 24990000, discount: 24,
    images: ["https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop"],
    category: "tivi", subcategory: "samsung-tv", brand: "Samsung",
    rating: 4.6, reviewCount: 210, inStock: true, isBestSeller: true,
    specs: { "Kích thước": "55 inch", "Độ phân giải": "4K OLED", "Smart TV": "Tizen" },
    description: "TV Samsung OLED 4K với hình ảnh sắc nét tuyệt đối."
  },
  {
    id: "p6", name: "Xiaomi 14 Ultra", slug: "xiaomi-14-ultra",
    price: 19990000, originalPrice: 23990000, discount: 17,
    images: ["https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=400&fit=crop"],
    category: "dien-thoai", subcategory: "xiaomi", brand: "Xiaomi",
    rating: 4.5, reviewCount: 560, inStock: true,
    specs: { "Màn hình": "6.73 inch", "Chip": "Snapdragon 8 Gen 3", "RAM": "16GB" },
    description: "Xiaomi 14 Ultra với camera Leica chuyên nghiệp."
  },
  {
    id: "p7", name: "Dell XPS 15 2024", slug: "dell-xps-15",
    price: 35990000, originalPrice: 39990000, discount: 10,
    images: ["https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=400&fit=crop"],
    category: "laptop", subcategory: "dell", brand: "Dell",
    rating: 4.7, reviewCount: 180, inStock: true,
    specs: { "Màn hình": "15.6 inch OLED", "CPU": "Intel i7-14700H", "RAM": "16GB" },
    description: "Dell XPS 15 với thiết kế premium, màn hình OLED."
  },
  {
    id: "p8", name: "Tủ lạnh Samsung Inverter 380L", slug: "tu-lanh-samsung-380l",
    price: 10990000, originalPrice: 14990000, discount: 27,
    images: ["https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400&h=400&fit=crop"],
    category: "tu-lanh", subcategory: "samsung-fridge", brand: "Samsung",
    rating: 4.4, reviewCount: 340, inStock: true, isBestSeller: true,
    specs: { "Dung tích": "380L", "Công nghệ": "Digital Inverter" },
    description: "Tủ lạnh Samsung Inverter tiết kiệm điện, dung tích lớn."
  },
  {
    id: "p9", name: "Máy giặt LG Inverter 9kg", slug: "may-giat-lg-9kg",
    price: 7490000, originalPrice: 9990000, discount: 25,
    images: ["https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&h=400&fit=crop"],
    category: "may-giat", subcategory: "lg-washer", brand: "LG",
    rating: 4.5, reviewCount: 520, inStock: true,
    specs: { "Khối lượng giặt": "9kg", "Công nghệ": "AI DD™" },
    description: "Máy giặt LG AI DD™ nhận diện vải thông minh."
  },
  {
    id: "p10", name: "AirPods Pro 2 USB-C", slug: "airpods-pro-2",
    price: 5490000, originalPrice: 6790000, discount: 19,
    images: ["https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400&h=400&fit=crop"],
    category: "phu-kien", subcategory: "tai-nghe", brand: "Apple",
    rating: 4.8, reviewCount: 2100, inStock: true, isBestSeller: true,
    specs: { "Chống ồn": "ANC chủ động", "Chip": "H2", "Pin": "6h" },
    description: "AirPods Pro 2 với chống ồn chủ động, âm thanh không gian."
  },
  {
    id: "p11", name: "Điều hòa Daikin Inverter 1HP", slug: "dieu-hoa-daikin-1hp",
    price: 8990000, originalPrice: 11990000, discount: 25,
    images: ["https://images.unsplash.com/photo-1585338107529-13afc25806f9?w=400&h=400&fit=crop"],
    category: "dieu-hoa", subcategory: "daikin", brand: "Daikin",
    rating: 4.6, reviewCount: 410, inStock: true,
    specs: { "Công suất": "1HP", "Công nghệ": "Inverter" },
    description: "Điều hòa Daikin Inverter tiết kiệm điện, làm lạnh nhanh."
  },
  {
    id: "p12", name: "Nồi cơm điện Cuckoo 1.8L", slug: "noi-com-cuckoo",
    price: 2990000, originalPrice: 3990000, discount: 25,
    images: ["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop"],
    category: "gia-dung", subcategory: "noi-com", brand: "Cuckoo",
    rating: 4.3, reviewCount: 670, inStock: true,
    specs: { "Dung tích": "1.8L", "Lòng nồi": "Chống dính" },
    description: "Nồi cơm điện Cuckoo cao cấp Hàn Quốc."
  },
];

export const reviews: Review[] = [
  { id: "r1", userName: "Nguyễn Văn A", rating: 5, comment: "Sản phẩm rất tốt, giao hàng nhanh!", date: "2024-03-15", sentiment: "positive", helpful: 24 },
  { id: "r2", userName: "Trần Thị B", rating: 4, comment: "Chất lượng ổn, pin trâu. Chỉ hơi nóng khi chơi game.", date: "2024-03-10", sentiment: "positive", helpful: 18 },
  { id: "r3", userName: "Lê Văn C", rating: 3, comment: "Tạm ổn với giá tiền, camera chưa được như quảng cáo.", date: "2024-03-08", sentiment: "neutral", helpful: 7 },
  { id: "r4", userName: "Phạm Thị D", rating: 5, comment: "Xuất sắc! Màn hình đẹp, hiệu năng mượt mà.", date: "2024-03-01", sentiment: "positive", helpful: 35 },
  { id: "r5", userName: "Hoàng Văn E", rating: 2, comment: "Hàng bị lỗi, phải đổi trả. Dịch vụ hỗ trợ chậm.", date: "2024-02-28", sentiment: "negative", helpful: 12 },
];

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};
