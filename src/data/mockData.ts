import { Product, Category, Review } from "@/types/product";

export const categories: Category[] = [
  {
    id: "1", name: "Tivi", slug: "tivi", icon: "📺",
    subcategories: [
      { id: "1a", name: "QLED 4K", slug: "qled-4k" },
      { id: "1b", name: "OLED 4K", slug: "oled-4k" },
      { id: "1c", name: "Mini LED", slug: "mini-led" },
      { id: "1d", name: "Smart TV", slug: "smart-tv" },
    ]
  },
  {
    id: "2", name: "Tủ lạnh", slug: "tu-lanh", icon: "🧊",
    subcategories: [
      { id: "2a", name: "Inverter", slug: "inverter" },
      { id: "2b", name: "Side by Side", slug: "side-by-side" },
      { id: "2c", name: "Multi Door", slug: "multi-door" },
      { id: "2d", name: "Top Freezer", slug: "top-freezer" },
    ]
  },
  {
    id: "3", name: "Máy giặt", slug: "may-giat", icon: "🫧",
    subcategories: [
      { id: "3a", name: "Cửa trên", slug: "cua-tren" },
      { id: "3b", name: "Cửa trước", slug: "cua-truoc" },
      { id: "3c", name: "Sấy", slug: "say" },
      { id: "3d", name: "Inverter", slug: "inverter-washer" },
    ]
  },
  {
    id: "4", name: "Điều hòa", slug: "dieu-hoa", icon: "❄️",
    subcategories: [
      { id: "4a", name: "1 chiều", slug: "1-chieu" },
      { id: "4b", name: "2 chiều", slug: "2-chieu" },
      { id: "4c", name: "Multi split", slug: "multi-split" },
      { id: "4d", name: "Wifi", slug: "wifi" },
    ]
  },
  {
    id: "5", name: "Gia dụng", slug: "gia-dung", icon: "🍳",
    subcategories: [
      { id: "5a", name: "Nồi cơm", slug: "noi-com" },
      { id: "5b", name: "Bếp từ", slug: "bep-tu" },
      { id: "5c", name: "Nồi chiên", slug: "noi-chien" },
      { id: "5d", name: "Máy xay", slug: "may-xay" },
    ]
  },
  {
    id: "6", name: "Điện thoại", slug: "dien-thoai", icon: "📱",
    subcategories: [
      { id: "6a", name: "Samsung", slug: "samsung" },
      { id: "6b", name: "Xiaomi", slug: "xiaomi" },
      { id: "6c", name: "OPPO", slug: "oppo" },
      { id: "6d", name: "vivo", slug: "vivo" },
    ]
  },
  {
    id: "7", name: "Laptop", slug: "laptop", icon: "💻",
    subcategories: [
      { id: "7a", name: "Dell", slug: "dell" },
      { id: "7b", name: "HP", slug: "hp" },
      { id: "7c", name: "Lenovo", slug: "lenovo" },
      { id: "7d", name: "ASUS", slug: "asus" },
    ]
  },
  {
    id: "8", name: "Máy tính bảng", slug: "may-tinh-bang", icon: "📟",
    subcategories: [
      { id: "8a", name: "Samsung", slug: "samsung-tab" },
      { id: "8b", name: "Xiaomi", slug: "xiaomi-pad" },
      { id: "8c", name: "Lenovo", slug: "lenovo-tab" },
      { id: "8d", name: "Honor", slug: "honor-tab" },
    ]
  },
];

const categoryImageTerms: Record<string, string> = {
  tivi: "television,smart-tv",
  "tu-lanh": "refrigerator,kitchen-appliance",
  "may-giat": "washing-machine,laundry-appliance",
  "dieu-hoa": "air-conditioner,home-appliance",
  "gia-dung": "home-appliance,kitchen-electric",
  "dien-thoai": "smartphone,mobile-phone",
  laptop: "laptop,notebook-computer",
  "may-tinh-bang": "tablet,touchscreen-device",
};

const normalizeKeyword = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-");

const buildLicensedImageUrl = (product: Product, index: number): string => {
  const categoryTerms = categoryImageTerms[product.category] ?? "electronics,product";
  const brand = normalizeKeyword(product.brand);
  const model = normalizeKeyword(product.slug).replace(/-/g, ",");
  return `https://source.unsplash.com/800x800/?${categoryTerms},${brand},${model}&sig=${index + 1}`;
};

const baseProducts: Product[] = [
  {
    id: "p1", name: "Samsung QLED 4K 43 inch", slug: "tivi-samsung-qled-43",
    price: 6990000, originalPrice: 7900000, discount: 12,
    images: ["https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop"],
    category: "tivi", subcategory: "qled-4k", brand: "Samsung",
    rating: 4.6, reviewCount: 210, inStock: true, isBestSeller: true,
    specs: { "Kích thước": "43 inch", "Độ phân giải": "4K QLED" },
    description: "TV Samsung QLED 4K 43 inch với hình ảnh sắc nét."
  },
  {
    id: "p2", name: "Samsung Inverter 260L", slug: "tu-lanh-samsung-inverter-260l",
    price: 5990000, originalPrice: 6800000, discount: 12,
    images: ["https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400&h=400&fit=crop"],
    category: "tu-lanh", subcategory: "inverter", brand: "Samsung",
    rating: 4.4, reviewCount: 340, inStock: true, isBestSeller: true,
    specs: { "Dung tích": "260L", "Công nghệ": "Digital Inverter" },
    description: "Tủ lạnh Samsung Inverter tiết kiệm điện, dung tích phù hợp gia đình."
  },
  {
    id: "p3", name: "LG máy giặt cửa trước 9kg", slug: "may-giat-lg-cua-truoc-9kg",
    price: 4890000, originalPrice: 6500000, discount: 25,
    images: ["https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&h=400&fit=crop"],
    category: "may-giat", subcategory: "cua-truoc", brand: "LG",
    rating: 4.5, reviewCount: 520, inStock: true, isBestSeller: true,
    specs: { "Khối lượng giặt": "9kg", "Công nghệ": "AI DD™" },
    description: "Máy giặt LG AI DD™ nhận diện vải thông minh, giặt sạch nhẹ nhàng."
  },
  {
    id: "p4", name: "Daikin điều hòa Inverter 1HP", slug: "dieu-hoa-daikin-inverter-1hp",
    price: 6490000, originalPrice: 8650000, discount: 25,
    images: ["https://images.unsplash.com/photo-1585338107529-13afc25806f9?w=400&h=400&fit=crop"],
    category: "dieu-hoa", subcategory: "1-chieu", brand: "Daikin",
    rating: 4.6, reviewCount: 410, inStock: true, isNew: true,
    specs: { "Công suất": "1HP", "Công nghệ": "Inverter" },
    description: "Điều hòa Daikin Inverter 1HP tiết kiệm điện, làm lạnh nhanh."
  },
  {
    id: "p5", name: "Sharp nồi cơm 1.8L", slug: "noi-com-sharp-1-8l",
    price: 890000, originalPrice: 1190000, discount: 25,
    images: ["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop"],
    category: "gia-dung", subcategory: "noi-com", brand: "Sharp",
    rating: 4.3, reviewCount: 670, inStock: true,
    specs: { "Dung tích": "1.8L", "Lòng nồi": "Chống dính" },
    description: "Nồi cơm điện Sharp cao cấp với công nghệ lòng nồi chống dính."
  },
  {
    id: "p6", name: "Samsung Galaxy 8GB/256GB", slug: "dien-thoai-samsung-8gb-256gb",
    price: 3990000, originalPrice: 4540000, discount: 12,
    images: ["https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=400&fit=crop"],
    category: "dien-thoai", subcategory: "samsung", brand: "Samsung",
    rating: 4.5, reviewCount: 560, inStock: true, isBestSeller: true,
    specs: { "Màn hình": "6.5 inch", "RAM": "8GB", "Storage": "256GB" },
    description: "Samsung Galaxy với cấu hình mạnh mẽ, camera chất lượng cao."
  },
  {
    id: "p7", name: "Dell Core i5 16GB 512GB", slug: "laptop-dell-i5-16gb-512gb",
    price: 10990000, originalPrice: 12200000, discount: 10,
    images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop"],
    category: "laptop", subcategory: "dell", brand: "Dell",
    rating: 4.7, reviewCount: 180, inStock: true, isBestSeller: true,
    specs: { "Màn hình": "15.6 inch", "CPU": "Intel i5", "RAM": "16GB", "SSD": "512GB" },
    description: "Dell XPS với hiệu năng tốt, thiết kế đẹp, giá hợp lý."
  },
  {
    id: "p8", name: "Samsung Pad 8GB 128GB", slug: "may-tinh-bang-samsung-8gb-128gb",
    price: 4490000, originalPrice: 5100000, discount: 12,
    images: ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop"],
    category: "may-tinh-bang", subcategory: "samsung-tab", brand: "Samsung",
    rating: 4.5, reviewCount: 280, inStock: true, isNew: true,
    specs: { "Màn hình": "11 inch", "RAM": "8GB", "Storage": "128GB" },
    description: "Máy tính bảng Samsung với màn hình sắc nét, hiệu năng mạnh."
  },
];

export const products: Product[] = baseProducts.map((product, index) => ({
  ...product,
  images: [buildLicensedImageUrl(product, index)],
}));

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
