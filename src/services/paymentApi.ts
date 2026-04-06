const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export type PaymentMethod = 'cod' | 'vnpay' | 'momo' | 'stripe';

export interface InitiatePaymentRequest {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  returnUrl?: string;
}

export interface InitiatePaymentResponse {
  method: PaymentMethod;
  transactionId: string;
  status: string;
  redirectUrl?: string;
  qrCodeUrl?: string;
  clientSecret?: string;
  message?: string;
}

export async function initiatePayment(payload: InitiatePaymentRequest): Promise<InitiatePaymentResponse> {
  const url = new URL('payments/initiate', `${API_BASE_URL.replace(/\/$/, '')}/`);

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error('Failed to initiate payment');
  }

  return response.json() as Promise<InitiatePaymentResponse>;
}
