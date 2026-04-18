import { getAuthHeader } from './authApi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export interface CreateOrderItem {
  productId: string;
  quantity: number;
}

export interface CreateOrderRequest {
  shippingAddressId: string;
  paymentMethod: 'cod' | 'vnpay';
  deliveryMethod?: 'standard' | '2h';
  note?: string;
  items?: CreateOrderItem[];
  total?: number;
  subtotal?: number;
  shippingFee?: number;
  discountAmount?: number;
  usedPoints?: number;
}

export interface CreateOrderResponse {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  paymentMethod: 'cod' | 'vnpay' | 'stripe';
  shippingAddressId: string;
  note?: string | null;
}

export async function createOrder(payload: CreateOrderRequest): Promise<CreateOrderResponse> {
  const baseUrl = API_BASE_URL.replace(/\/$/, '');
  const url = `${baseUrl}/orders`;
  const authHeader = await getAuthHeader();
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Failed to create order');
  }

  return response.json() as Promise<CreateOrderResponse>;
}

export async function listOrders(): Promise<any[]> {
  const baseUrl = API_BASE_URL.replace(/\/$/, '');
  const url = `${baseUrl}/orders`;
  const authHeader = await getAuthHeader();
  const response = await fetch(url, {
    headers: authHeader
  });
  return response.json();
}

export async function cancelOrder(orderId: string): Promise<any> {
  const baseUrl = API_BASE_URL.replace(/\/$/, '');
  const url = `${baseUrl}/orders/${orderId}/cancel`;
  const authHeader = await getAuthHeader();
  const response = await fetch(url, {
    method: 'POST',
    headers: authHeader
  });
  if (!response.ok) throw new Error('Cannot cancel order');
  return response.json();
}
