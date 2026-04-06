import { Body, Controller, Headers, Param, Patch, Get, Post } from '@nestjs/common';

interface CreateOrderBody {
  shippingAddressId: string;
  paymentMethod: 'cod' | 'vnpay' | 'momo';
  note?: string;
  items?: Array<{ productId: string; quantity: number }>;
  total?: number;
}

interface OrderRecord {
  id: string;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  items: Array<{ productId: string; quantity: number }>;
  userId: string;
  paymentMethod: 'cod' | 'vnpay' | 'momo';
  shippingAddressId: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

@Controller('orders')
export class OrderController {
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

  @Post()
  createOrder(@Body() body: CreateOrderBody, @Headers('x-user-id') userId?: string) {
    const now = new Date().toISOString();
    const order: OrderRecord = {
      id: `ord_${Date.now()}`,
      orderNumber: `NVX-${Date.now()}`,
      status: 'pending',
      total: body.total || 0,
      items: body.items || [],
      userId: userId || 'guest',
      paymentMethod: body.paymentMethod,
      shippingAddressId: body.shippingAddressId,
      note: body.note || null,
      createdAt: now,
      updatedAt: now
    };

    this.orders.unshift(order);
    return order;
  }

  @Get()
  listOrders() {
    return this.orders;
  }

  @Get(':id')
  getOrder(@Param('id') id: string) {
    return this.orders.find((order) => order.id === id) || null;
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' }) {
    const order = this.orders.find((item) => item.id === id);
    if (!order) {
      return null;
    }

    order.status = body.status;
    order.updatedAt = new Date().toISOString();
    return order;
  }
}
