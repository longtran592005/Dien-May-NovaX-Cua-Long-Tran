import { getAuthHeader } from './authApi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export interface CreateOrderItem {
  productId: string;
  quantity: number;
}

export interface CreateOrderRequest {
  shippingAddressId: string;
  paymentMethod: 'cod' | 'vnpay' | 'momo';
  note?: string;
  items?: CreateOrderItem[];
  total?: number;
}

export interface CreateOrderResponse {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  paymentMethod: 'cod' | 'vnpay' | 'momo';
  shippingAddressId: string;
  note?: string | null;
}

export async function createOrder(payload: CreateOrderRequest): Promise<CreateOrderResponse> {
  const url = new URL('orders', `${API_BASE_URL.replace(/\/$/, '')}/`);
  const authHeader = await getAuthHeader();
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error('Failed to create order');
  }

  return response.json() as Promise<CreateOrderResponse>;
}
