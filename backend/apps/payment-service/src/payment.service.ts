import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import crypto from 'node:crypto';
import qs from 'qs';

const orderServiceUrl = process.env.ORDER_SERVICE_URL || 'http://localhost:4040';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async getByOrderIds(orderIds: string[]) {
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return [];
    }

    const uniqueOrderIds = [...new Set(orderIds)];
    return this.prisma.payment.findMany({
      where: {
        orderId: {
          in: uniqueOrderIds
        }
      },
      select: {
        orderId: true,
        status: true,
        method: true,
        amount: true,
        updatedAt: true
      }
    });
  }

  async initiate(input: any) {
    if (!input.orderId || input.amount <= 0) {
      throw new BadRequestException('Invalid payment payload');
    }

    const order = await this.fetchOrder(input.orderId);
    if (!order) {
      throw new BadRequestException('Order not found');
    }

    if (order.status !== 'pending') {
      throw new BadRequestException(`Payment can only be initiated for pending orders (current: ${order.status})`);
    }

    if (Number(order.total) !== Number(input.amount)) {
      throw new BadRequestException('Payment amount does not match order total');
    }

    const transactionId = crypto.randomUUID();

    // Save payment record only after order validation succeeds.
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

    if (input.method === 'momo') {
      return this.generateMomoPayload(input, transactionId);
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

  private async fetchOrder(orderId: string): Promise<{ id: string; total: number; status: string } | null> {
    try {
      const response = await fetch(`${orderServiceUrl}/orders/${encodeURIComponent(orderId)}`);
      if (!response.ok) {
        return null;
      }

      return (await response.json()) as { id: string; total: number; status: string };
    } catch {
      return null;
    }
  }

  private async syncOrderAfterPayment(orderId: string) {
    const response = await fetch(`${orderServiceUrl}/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'confirmed' })
    });

    if (!response.ok) {
      throw new Error(`Order status sync failed with ${response.status}`);
    }
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

  private generateMomoPayload(input: any, transactionId: string) {
    const momoPayUrl = process.env.MOMO_PAY_URL || 'https://test-payment.momo.vn/v2/gateway/api/create';
    const requestId = crypto.randomUUID();

    return {
      method: 'momo',
      transactionId,
      requestId,
      status: 'processing',
      redirectUrl: `${momoPayUrl}?orderId=${encodeURIComponent(input.orderId)}&requestId=${requestId}`
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
    // Normalize possible transaction identifiers from different providers
    const transactionId = payload.transactionId || payload.transactionRef || payload.vnp_TxnRef || payload.requestId || payload.reqId;
    const provider = payload.provider || payload.gateway || payload.method;
    const status = payload.status || payload.resultCode || payload.errorCode || payload.responseCode;
    const amount = payload.amount || payload.vnp_Amount || payload.orderAmount;

    if (!transactionId) {
      throw new BadRequestException('Missing transaction identifier in callback payload');
    }

    let payment = await this.prisma.payment.findFirst({ where: { transactionRef: transactionId } });
    if (!payment) {
      // Try fallback: if orderId provided, find by orderId
      if (payload.orderId) {
        const byOrder = await this.prisma.payment.findFirst({ where: { orderId: payload.orderId } });
        if (byOrder) {
          // link transactionRef if empty
          if (!byOrder.transactionRef) {
            await this.prisma.payment.update({ where: { id: byOrder.id }, data: { transactionRef: transactionId } });
          }
          // proceed with byOrder
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          (payment as any) = byOrder;
        }
      }
    }

    if (!payment) {
      throw new BadRequestException('Payment not found for provided transaction/order identifier');
    }

    if (payment.status === 'completed' || payment.status === 'refunded') {
      return { success: true, message: 'Payment callback already processed', status: payment.status, transactionId };
    }

    if (amount != null && Number(amount) !== Number(payment.amount)) {
      // Log mismatch but allow provider to update if amounts differ slightly depending on format
      console.warn(`Payment callback amount mismatch for txn ${transactionId}: callback=${amount} vs record=${payment.amount}`);
    }

    // Determine final status
    const finalStatus = (String(status) === 'success' || String(status) === '00' || String(status).toLowerCase() === 'completed') ? 'completed' : (String(status).toLowerCase() === 'failed' || String(status) === 'error' ? 'failed' : payment.status || 'pending');

    // Update payment record idempotently
    await this.prisma.payment.update({ where: { id: payment.id }, data: { status: finalStatus, method: provider || payment.method } });

    // Attempt to sync order status but do not throw on failure; return partial success and record log
    if (finalStatus === 'completed') {
      try {
        await this.syncOrderAfterPayment(payment.orderId);
      } catch (error) {
        console.error(`Order sync failed for order ${payment.orderId} after payment ${transactionId}:`, (error as Error).message);
        return { success: true, message: 'Payment recorded but order sync failed (see logs)', status: finalStatus, transactionId };
      }
    }

    return { success: true, message: 'Payment callback processed', status: finalStatus, transactionId };
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
