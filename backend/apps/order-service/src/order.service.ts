import { Injectable, NotFoundException } from '@nestjs/common';

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

type PaymentMethod = 'cod' | 'vnpay' | 'momo';

interface OrderItemInput {
  productId: string;
  quantity: number;
}

interface CreateOrderInput {
  shippingAddressId: string;
  paymentMethod: PaymentMethod;
  note?: string;
  items?: OrderItemInput[];
  total?: number;
  userId?: string;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  items: OrderItemInput[];
  userId: string;
  paymentMethod: PaymentMethod;
  shippingAddressId: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class OrderService {
  private readonly orders: OrderRecord[] = [
    {
      id: 'ord_seed_1',
      orderNumber: 'NVX-20260406-1001',
      status: 'processing',
      total: 29990000,
      items: [{ productId: 'iphone-15-pro-max', quantity: 1 }],
      userId: 'u_demo_1',
      paymentMethod: 'cod',
      shippingAddressId: 'addr_seed_1',
      note: 'Seed order',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  createOrder(input: CreateOrderInput): OrderRecord {
    const now = new Date().toISOString();
    const orderNumber = `NVX-${Date.now()}`;
    const order: OrderRecord = {
      id: `ord_${Date.now()}`,
      orderNumber,
      status: 'pending',
      total: input.total || 0,
      items: input.items || [],
      userId: input.userId || 'guest',
      paymentMethod: input.paymentMethod,
      shippingAddressId: input.shippingAddressId,
      note: input.note || null,
      createdAt: now,
      updatedAt: now
    };

    this.orders.unshift(order);
    return order;
  }

  listOrders() {
    return this.orders;
  }

  getOrderById(id: string) {
    const order = this.orders.find((item) => item.id === id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  updateOrderStatus(id: string, status: OrderStatus) {
    const order = this.orders.find((item) => item.id === id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    order.status = status;
    order.updatedAt = new Date().toISOString();
    return order;
  }
}
