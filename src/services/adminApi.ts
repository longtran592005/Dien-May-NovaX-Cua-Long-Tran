import { getAuthHeader } from './authApi';
import { fetchProducts } from './catalogApi';
import { products as fallbackProducts } from '@/data/mockData';
import type { Product } from '@/types/product';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export interface AdminProductInput {
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  brand: string;
  sku?: string;
  stock: number;
  categorySlug: string;
  images?: string[];
}

// Giữ nguyên các Interface khác
export interface AdminOrderItem { productId: string; quantity: number; }
export interface AdminOrder { id: string; orderNumber: string; status: string; total: number; paymentMethod: string; userId: string; shippingAddressId: string; note?: string | null; items: AdminOrderItem[]; createdAt: string; updatedAt: string; }
export interface AdminUser { id: string; email: string; name: string; role: string; verified: boolean; createdAt: string; }
export interface AdminPaginatedResponse<T> { items: T[]; page: number; pageSize: number; total: number; }

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await getAuthHeader();
  const response = await fetch(new URL(path, `${API_BASE_URL.replace(/\/$/, '')}/`).toString(), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...headers, ...(init?.headers || {}) }
  });
  if (!response.ok) throw new Error('Request failed');
  return response.json() as Promise<T>;
}

// Helpers LocalStorage 
const getLocalProducts = (): Product[] => {
  const local = localStorage.getItem('novax_products');
  if (local) return JSON.parse(local);
  localStorage.setItem('novax_products', JSON.stringify(fallbackProducts));
  return fallbackProducts;
}
const saveLocalProducts = (products: Product[]) => localStorage.setItem('novax_products', JSON.stringify(products));

// API Products
export async function listAdminProducts(): Promise<Product[]> {
  try {
    const data = await fetchProducts({ page: 1, pageSize: 200 });
    return data.items;
  } catch {
    return getLocalProducts();
  }
}

export async function createAdminProduct(payload: AdminProductInput) {
  try {
    return await fetchJson('/admin/products', { method: 'POST', body: JSON.stringify(payload) });
  } catch {
    const prods = getLocalProducts();
    const newProd: Product = {
      id: `p${Date.now()}`,
      name: payload.name,
      slug: payload.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '') + '-' + Date.now().toString().slice(-4),
      price: payload.price,
      originalPrice: payload.originalPrice,
      discount: payload.discount,
      category: payload.categorySlug,
      brand: payload.brand,
      inStock: payload.stock > 0,
      rating: 5,
      reviewCount: 0,
      images: payload.images && payload.images.length > 0 ? payload.images : ["https://placehold.co/400x400?text=NovaX"],
      description: payload.description
    };
    prods.unshift(newProd);
    saveLocalProducts(prods);
    return newProd;
  }
}

export async function updateAdminProduct(id: string, payload: Partial<AdminProductInput>) {
  try {
    return await fetchJson(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  } catch {
    const prods = getLocalProducts();
    const idx = prods.findIndex(p => p.id === id);
    if (idx !== -1) {
      prods[idx] = {
        ...prods[idx],
        ...payload,
        inStock: payload.stock !== undefined ? payload.stock > 0 : prods[idx].inStock,
        category: payload.categorySlug || prods[idx].category
      } as any;
      saveLocalProducts(prods);
    }
    return prods[idx];
  }
}

export async function deleteAdminProduct(id: string) {
  try {
    return await fetchJson(`/admin/products/${id}`, { method: 'DELETE' });
  } catch {
    const prods = getLocalProducts();
    const filtered = prods.filter(p => p.id !== id);
    saveLocalProducts(filtered);
    return { success: true };
  }
}

// Các lệnh mock đơn hàng và user (rút gọn để file sạch)
export async function listAdminOrders(): Promise<AdminPaginatedResponse<AdminOrder>> { return { items: [], page: 1, pageSize: 20, total: 0 }; }
export async function getAdminOrder(): Promise<AdminOrder | null> { return null; }
export async function updateAdminOrderStatus() { return null; }
export async function listAdminUsers(): Promise<AdminPaginatedResponse<AdminUser>> { return { items: [], page: 1, pageSize: 20, total: 0 }; }
export async function updateAdminUserRole(): Promise<any> { return null; }
export async function updateAdminUserVerified(): Promise<any> { return null; }

export interface AdminAnalyticsStatusBreakdown { status: string; count: number; }
export interface AdminAnalyticsTopProduct { productId: string; name: string; quantity: number; revenue: number; }
export interface AdminAnalytics {
  rangeDays: number; rangeStart: string; rangeEnd: string; totalOrders: number; totalRevenue: number;
  todayOrders: number; todayRevenue: number; totalUsers: number; verifiedUsers: number;
  totalProducts: number; activeProducts: number; statusBreakdown: AdminAnalyticsStatusBreakdown[];
  topProducts: AdminAnalyticsTopProduct[]; recentOrders: AdminOrder[];
}

export async function getAdminAnalytics(rangeDays = 30): Promise<AdminAnalytics> { 
  return { 
    rangeDays, rangeStart: "", rangeEnd: "",
    todayOrders: 0, todayRevenue: 0, verifiedUsers: 0, activeProducts: getLocalProducts().length,
    totalOrders: 0, totalRevenue: 0, totalUsers: 0, totalProducts: getLocalProducts().length,
    statusBreakdown: [], topProducts: [], recentOrders: []
  }; 
}
