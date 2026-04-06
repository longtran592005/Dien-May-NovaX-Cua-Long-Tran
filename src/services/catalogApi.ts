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
  const url = new URL('products', `${API_BASE_URL.replace(/\/$/, '')}/`);
  if (params.q) url.searchParams.set('q', params.q);
  if (params.category) url.searchParams.set('category', params.category);
  if (typeof params.minPrice === 'number') url.searchParams.set('minPrice', String(params.minPrice));
  if (typeof params.maxPrice === 'number') url.searchParams.set('maxPrice', String(params.maxPrice));
  if (typeof params.page === 'number') url.searchParams.set('page', String(params.page));
  if (typeof params.pageSize === 'number') url.searchParams.set('pageSize', String(params.pageSize));

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  return response.json() as Promise<ProductListResponse>;
}

export async function fetchProductBySlug(slug: string): Promise<Product> {
  const url = new URL(`products/${slug}`, `${API_BASE_URL.replace(/\/$/, '')}/`);
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error('Failed to fetch product detail');
  }

  return response.json() as Promise<Product>;
}
