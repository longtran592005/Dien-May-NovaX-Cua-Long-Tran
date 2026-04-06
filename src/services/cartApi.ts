import { Product } from '@/types/product';
import { getAuthHeader } from './authApi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export interface RemoteCartItem {
  productId: string;
  quantity: number;
}

export interface RemoteCartResponse {
  items: RemoteCartItem[];
  subtotal: number;
  total: number;
}

export async function fetchRemoteCart(): Promise<RemoteCartResponse> {
  const url = new URL('cart', `${API_BASE_URL.replace(/\/$/, '')}/`);
  const authHeader = await getAuthHeader();
  const response = await fetch(url.toString(), {
    headers: authHeader
  });
  if (!response.ok) {
    throw new Error('Failed to fetch cart');
  }
  return response.json() as Promise<RemoteCartResponse>;
}

export async function upsertRemoteCart(items: RemoteCartItem[]): Promise<RemoteCartResponse> {
  const url = new URL('cart', `${API_BASE_URL.replace(/\/$/, '')}/`);
  const authHeader = await getAuthHeader();
  const response = await fetch(url.toString(), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader
    },
    body: JSON.stringify({ items })
  });

  if (!response.ok) {
    throw new Error('Failed to update cart');
  }

  return response.json() as Promise<RemoteCartResponse>;
}

export function toRemoteCartItems(items: Array<{ product: Product; quantity: number }>): RemoteCartItem[] {
  return items.map((item) => ({
    productId: item.product.id,
    quantity: item.quantity
  }));
}
