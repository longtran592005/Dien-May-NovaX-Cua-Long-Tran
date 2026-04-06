export interface Product {
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
  specs?: Record<string, string>;
  description?: string;
  inStock: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  tags?: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  subcategories?: { id: string; name: string; slug: string }[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  helpful: number;
}
