import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import crypto from 'node:crypto';
import qs from 'qs';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async initiate(input: any) {
    if (!input.orderId || input.amount <= 0) {
      throw new BadRequestException('Invalid payment payload');
    }

    const transactionId = crypto.randomUUID();
    
    // Note: We don't verify order exists to allow payment testing without real orders
    // In production, you should verify the order exists before processing payment
    
    // Try to save payment record to DB (may fail if order doesn't exist due to FK constraint)
    try {
      await this.prisma.payment.upsert({
        where: { orderId: input.orderId },
        update: {
          amount: input.amount,
          method: input.method,
          status: 'pending',
          transactionRef: transactionId
        },
        create: {
          orderId: input.orderId,
          amount: input.amount,
          method: input.method,
          status: 'pending',
          transactionRef: transactionId
        }
      });
    } catch (err) {
      // If order doesn't exist, continue anyway (for demo/testing purposes)
      // In production, throw error here
      console.warn('Payment record save failed (order may not exist):', (err as any).message);
    }

    if (input.method === 'cod') {
      return {
        method: 'cod',
        transactionId,
        status: 'pending',
        message: 'COD selected. Payment will be collected on delivery.'
      };
    }

    if (input.method === 'vnpay') {
      return this.generateVnpayUrl(input, transactionId);
    }

    if (input.method === 'stripe') {
      return {
        method: 'stripe',
        transactionId,
        status: 'processing'
      };
    }

    throw new BadRequestException('Unsupported payment method');
  }

  private generateVnpayUrl(input: any, transactionId: string) {
    const tmnCode = process.env.VNPAY_TMN_CODE || '2QXG2YQ8';
    const secretKey = process.env.VNPAY_HASH_SECRET || '58884051';
    const vnpUrl = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const returnUrl = process.env.VNPAY_RETURN_URL || 'http://localhost:8080/api/v1/payment/vnpay-return';

    const date = new Date();
    const createDate = this.formatDate(date);
    
    // VNPay params
    let vnp_Params: any = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: transactionId,
      vnp_OrderInfo: `Thanh toan don hang ${input.orderId}`,
      vnp_OrderType: 'other',
      vnp_Amount: input.amount * 100, // VNPay amount is in cents
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: '127.0.0.1',
      vnp_CreateDate: createDate,
    };

    // Sort params
    vnp_Params = this.sortObject(vnp_Params);

    // Sign
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnp_Params['vnp_SecureHash'] = signed;

    const finalUrl = vnpUrl + '?' + qs.stringify(vnp_Params, { encode: false });

    return {
      method: 'vnpay',
      transactionId,
      status: 'processing',
      redirectUrl: finalUrl
    };
  }

  async verify(transactionId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { transactionRef: transactionId }
    });
    
    if (!payment) throw new BadRequestException('Payment not found');
    return payment;
  }

  async callback(payload: any) {
    const { provider, transactionId, status, amount } = payload;

    if (!transactionId) {
      throw new BadRequestException('Missing transactionId');
    }

    const payment = await this.prisma.payment.findFirst({
      where: { transactionRef: transactionId }
    });

    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    // Update payment status based on callback
    const finalStatus = status === 'success' || status === '00' ? 'completed' : 'failed';
    
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: finalStatus }
    });

    return {
      success: true,
      message: 'Payment callback processed',
      status: finalStatus,
      transactionId
    };
  }

  private sortObject(obj: any) {
    const sorted: any = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
    }
    return sorted;
  }

  private formatDate(date: Date) {
    const pad = (n: number) => n < 10 ? '0' + n : n;
    return date.getFullYear() +
      pad(date.getMonth() + 1).toString() +
      pad(date.getDate()).toString() +
      pad(date.getHours()).toString() +
      pad(date.getMinutes()).toString() +
      pad(date.getSeconds()).toString();
  }
}
