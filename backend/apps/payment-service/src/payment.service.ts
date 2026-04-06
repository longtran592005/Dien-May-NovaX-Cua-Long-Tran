import { Injectable, BadRequestException } from '@nestjs/common';
import crypto from 'node:crypto';

type PaymentMethod = 'cod' | 'vnpay' | 'momo' | 'stripe';

interface InitiatePaymentInput {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  returnUrl?: string;
}

@Injectable()
export class PaymentService {
  initiate(input: InitiatePaymentInput) {
    if (!input.orderId || input.amount <= 0) {
      throw new BadRequestException('Invalid payment payload');
    }

    const transactionId = crypto.randomUUID();
    const baseReturnUrl = input.returnUrl || 'http://localhost:3000/checkout';

    if (input.method === 'cod') {
      return {
        method: 'cod',
        transactionId,
        status: 'pending',
        message: 'COD selected. Payment will be collected on delivery.'
      };
    }

    if (input.method === 'vnpay') {
      return {
        method: 'vnpay',
        transactionId,
        status: 'processing',
        redirectUrl: `${baseReturnUrl}?provider=vnpay&transactionId=${transactionId}`
      };
    }

    if (input.method === 'momo') {
      return {
        method: 'momo',
        transactionId,
        status: 'processing',
        redirectUrl: `${baseReturnUrl}?provider=momo&transactionId=${transactionId}`,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=momo:${transactionId}`
      };
    }

    return {
      method: 'stripe',
      transactionId,
      status: 'processing',
      clientSecret: `pi_${transactionId.replace(/-/g, '')}_secret_demo`
    };
  }

  verify(transactionId: string) {
    if (!transactionId) {
      throw new BadRequestException('Missing transaction id');
    }

    return {
      transactionId,
      status: 'processing'
    };
  }

  callback(payload: Record<string, unknown>) {
    return {
      received: true,
      payload
    };
  }
}
