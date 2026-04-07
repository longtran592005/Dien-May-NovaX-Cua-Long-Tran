import { getAuthHeader } from './authApi';
import { fetchProducts } from './catalogApi';
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

export interface AdminOrderItem {
  productId: string;
  quantity: number;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  paymentMethod: 'cod' | 'vnpay' | 'momo' | 'stripe';
  userId: string;
  shippingAddressId: string;
  note?: string | null;
  items: AdminOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  verified: boolean;
  createdAt: string;
}

export interface AdminPaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface AdminAnalyticsStatusBreakdown {
  status: AdminOrder['status'];
  count: number;
}

export interface AdminAnalyticsTopProduct {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface AdminAnalytics {
  rangeDays: number;
  rangeStart: string;
  rangeEnd: string;
  totalOrders: number;
  totalRevenue: number;
  todayOrders: number;
  todayRevenue: number;
  totalUsers: number;
  verifiedUsers: number;
  totalProducts: number;
  activeProducts: number;
  statusBreakdown: AdminAnalyticsStatusBreakdown[];
  topProducts: AdminAnalyticsTopProduct[];
  recentOrders: AdminOrder[];
}

function buildUrl(path: string) {
  const base = API_BASE_URL.replace(/\/+$/, '');
  const normalizedPath = path.replace(/^\/+/, '');
  if (base.startsWith('/')) {
    return `${window.location.origin}${base}/${normalizedPath}`;
  }
  return `${base}/${normalizedPath}`;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await getAuthHeader();
  const targetUrl = path.startsWith('http') ? path : buildUrl(path);
  
  const response = await fetch(targetUrl, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      ...(init?.headers || {})
    }
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message || 'Request failed');
  }

  return response.json() as Promise<T>;
}

export async function listAdminProducts(): Promise<Product[]> {
  const data = await fetchProducts({ page: 1, pageSize: 200 });
  return data.items;
}

export async function createAdminProduct(payload: AdminProductInput) {
  return fetchJson('/admin/products', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateAdminProduct(id: string, payload: Partial<AdminProductInput>) {
  return fetchJson(`/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function deleteAdminProduct(id: string) {
  return fetchJson(`/admin/products/${id}`, {
    method: 'DELETE'
  });
}

export interface ListAdminOrdersParams {
  q?: string;
  status?: 'all' | AdminOrder['status'];
  sortBy?: 'newest' | 'oldest' | 'value-high' | 'value-low';
  page?: number;
  pageSize?: number;
}

export async function listAdminOrders(params: ListAdminOrdersParams = {}): Promise<AdminPaginatedResponse<AdminOrder>> {
  const query = new URLSearchParams();
  if (params.q?.trim()) query.set('q', params.q.trim());
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));

  const suffix = query.toString();
  return fetchJson(`/admin/orders${suffix ? `?${suffix}` : ''}`);
}

export async function getAdminOrder(id: string): Promise<AdminOrder | null> {
  return fetchJson(`/admin/orders/${id}`);
}

export async function updateAdminOrderStatus(
  id: string,
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
) {
  return fetchJson(`/admin/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

export interface ListAdminUsersParams {
  q?: string;
  role?: 'all' | 'admin' | 'customer';
  verified?: 'all' | 'verified' | 'unverified';
  sortBy?: 'newest' | 'oldest' | 'name';
  page?: number;
  pageSize?: number;
}

export async function listAdminUsers(params: ListAdminUsersParams = {}): Promise<AdminPaginatedResponse<AdminUser>> {
  const query = new URLSearchParams();
  if (params.q?.trim()) query.set('q', params.q.trim());
  if (params.role && params.role !== 'all') query.set('role', params.role);
  if (params.verified && params.verified !== 'all') query.set('verified', params.verified === 'verified' ? 'true' : 'false');
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));

  const suffix = query.toString();
  return fetchJson(`/admin/users${suffix ? `?${suffix}` : ''}`);
}

export async function updateAdminUserRole(id: string, role: 'customer' | 'admin'): Promise<AdminUser> {
  return fetchJson(`/admin/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role })
  });
}

export async function updateAdminUserVerified(id: string, verified: boolean): Promise<AdminUser> {
  return fetchJson(`/admin/users/${id}/verified`, {
    method: 'PATCH',
    body: JSON.stringify({ verified })
  });
}

export async function getAdminAnalytics(rangeDays = 30): Promise<AdminAnalytics> {
  const safeRangeDays = Number.isFinite(rangeDays) && rangeDays > 0 ? Math.round(rangeDays) : 30;
  return fetchJson(`/admin/analytics?rangeDays=${safeRangeDays}`);
}
