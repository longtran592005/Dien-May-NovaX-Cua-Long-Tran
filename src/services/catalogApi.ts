import { Product } from '@/types/product';

export interface ProductListResponse {
  items: Product[];
  page: number;
  pageSize: number;
  total: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export async function fetchProducts(params: {
  q?: string | null;
  category?: string | null;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
}): Promise<ProductListResponse> {
  const base = API_BASE_URL.replace(/\/$/, '');
  let url = `${base}/products`;
  const params_arr = [];
  if (params.q) params_arr.push(`q=${encodeURIComponent(params.q)}`);
  if (params.category) params_arr.push(`category=${encodeURIComponent(params.category)}`);
  if (typeof params.minPrice === 'number') params_arr.push(`minPrice=${params.minPrice}`);
  if (typeof params.maxPrice === 'number') params_arr.push(`maxPrice=${params.maxPrice}`);
  if (typeof params.page === 'number') params_arr.push(`page=${params.page}`);
  if (typeof params.pageSize === 'number') params_arr.push(`pageSize=${params.pageSize}`);
  if (params_arr.length > 0) url += '?' + params_arr.join('&');

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  return response.json() as Promise<ProductListResponse>;
}

export async function fetchProductBySlug(slug: string): Promise<Product> {
  const base = API_BASE_URL.replace(/\/$/, '');
  const url = `${base}/products/${slug}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch product detail');
  }

  return response.json() as Promise<Product>;
}

export async function fetchStoreStock(productId: string): Promise<any[]> {
  const base = API_BASE_URL.replace(/\/$/, '');
  const url = `${base}/products/${productId}/stock`;
  const response = await fetch(url);
  return response.json();
}

import { getAuthHeader } from './authApi';

export async function submitProductReview(productId: string, data: { rating: number; comment: string }): Promise<any> {
  const base = API_BASE_URL.replace(/\/$/, '');
  const url = `${base}/products/${productId}/reviews`;
  const authHeader = await getAuthHeader();
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to submit review');
  return response.json();
}
