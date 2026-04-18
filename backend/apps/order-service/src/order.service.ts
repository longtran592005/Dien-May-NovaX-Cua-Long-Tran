import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(input: any) {
    // Generate order number
    const orderNumber = `NVX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create order with items
    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        userId: input.userId || 'demo-user-id',
        status: 'pending',
        subtotal: input.subtotal || input.total,
        shippingFee: input.shippingFee || 0,
        discountAmount: input.discountAmount || 0,
        usedPoints: input.usedPoints || 0,
        total: input.total,
        shippingAddressId: input.shippingAddressId,
        deliveryMethod: input.deliveryMethod || 'standard',
        note: input.note,
        items: {
          create: (input.items || []).map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice || 0
          }))
        }
      },
      include: {
        items: true,
        shippingAddress: true
      }
    });

    // If points were used, deduct them from user
    if (order.usedPoints > 0) {
      await this.prisma.user.update({
        where: { id: order.userId },
        data: { points: { decrement: order.usedPoints } }
      });
    }

    return order;
  }

  async listOrders(userId?: string) {
    return this.prisma.order.findMany({
      where: userId ? { userId } : {},
      include: {
        items: { include: { product: { include: { images: true } } } },
        shippingAddress: true,
        payment: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getOrderById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: { include: { images: true } } } },
        shippingAddress: true,
        payment: true
      }
    });
    
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateOrderStatus(id: string, status: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: { user: true }
    });

    // Loyalty Points Logic: 10.000 VNĐ = 1 Point when delivered
    if (status === 'delivered' && order.status !== 'delivered') {
      const earnedPoints = Math.floor(order.total / 10000);
      if (earnedPoints > 0) {
        await this.prisma.user.update({
          where: { id: order.userId },
          data: { points: { increment: earnedPoints } }
        });
      }

      // Auto-activate warranty for all products in order
      const items = await this.prisma.orderItem.findMany({ where: { orderId: id } });
      const now = new Date();
      const oneYearLater = new Date();
      oneYearLater.setFullYear(now.getFullYear() + 1);

      await Promise.all(items.map(item => 
        this.prisma.warranty.create({
          data: {
            orderId: id,
            productId: item.productId,
            expiryDate: oneYearLater,
            serialNumber: `SN-${id.slice(0, 4)}-${item.productId.slice(0, 4)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
          }
        })
      ));
    }

    return updated;
  }

  async cancelOrder(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new BadRequestException('Not authorized to cancel this order');
    
    // Only allow cancellation if pending
    if (order.status !== 'pending') {
      throw new BadRequestException(`Cannot cancel order in ${order.status} state`);
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: 'cancelled' }
    });

    // Refund points if order is cancelled
    if (order.usedPoints > 0) {
      await this.prisma.user.update({
        where: { id: order.userId },
        data: { points: { increment: order.usedPoints } }
      });
    }

    return updated;
  }
}
