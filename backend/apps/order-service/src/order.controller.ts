import { Body, Controller, Headers, Param, Patch, Get, Post } from '@nestjs/common';
import { OrderService } from './order.service';

interface CreateOrderBody {
  shippingAddressId: string;
  paymentMethod: 'cod' | 'vnpay' | 'stripe' | 'momo';
  deliveryMethod?: 'standard' | '2h';
  note?: string;
  items?: Array<{ productId: string; quantity: number }>;
  couponCode?: string;
  customerTier?: string;
  subtotal?: number;
  shippingFee?: number;
  discountAmount?: number;
  usedPoints?: number;
  total?: number;
}

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async createOrder(@Body() body: CreateOrderBody, @Headers('x-user-id') userId?: string) {
    const created = await this.orderService.createOrder({
      ...body,
      userId
    });

    return {
      ...created,
      paymentMethod: body.paymentMethod
    };
  }

  @Get()
  async listOrders(@Headers('x-user-id') userId?: string) {
    const normalizedUserId = !userId || userId === 'guest' ? undefined : userId;
    return this.orderService.listOrders(normalizedUserId);
  }

  @Get(':id')
  async getOrder(@Param('id') id: string) {
    return this.orderService.getOrderById(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' }
  ) {
    return this.orderService.updateOrderStatus(id, body.status);
  }

  @Post(':id/cancel')
  async cancelOrder(@Param('id') id: string, @Headers('x-user-id') userId?: string) {
    return this.orderService.cancelOrder(id, userId || 'guest');
  }
}
