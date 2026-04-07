import { Product } from '@/types/product';
import { products as fallbackProducts } from '@/data/mockData';

export interface ProductListResponse {
  items: Product[];
  page: number;
  pageSize: number;
  total: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const getLocalProducts = (): Product[] => {
  const local = localStorage.getItem('novax_products');
  if (local) return JSON.parse(local);
  localStorage.setItem('novax_products', JSON.stringify(fallbackProducts));
  return fallbackProducts;
}

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

  try {
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error();
    return await response.json();
  } catch {
    // FALLBACK CHẠY LOCALSTORAGE
    let items = getLocalProducts();
    if (params.category) items = items.filter(p => p.category === params.category);
    if (params.q) {
      const query = params.q.toLowerCase();
      items = items.filter(p => p.name.toLowerCase().includes(query) || p.description?.toLowerCase().includes(query));
    }
    return { items, page: 1, pageSize: items.length, total: items.length };
  }
}

export async function fetchProductBySlug(slug: string): Promise<Product> {
  const url = new URL(`products/${slug}`, `${API_BASE_URL.replace(/\/$/, '')}/`);
  try {
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error();
    return await response.json();
  } catch {
    const items = getLocalProducts();
    const product = items.find(p => p.slug === slug);
    if (!product) throw new Error("Not found");
    return product;
  }
}
