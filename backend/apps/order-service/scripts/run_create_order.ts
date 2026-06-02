import { PrismaService } from '../src/prisma.service';
import { OrderService } from '../src/order.service';

async function main() {
  const prisma = new PrismaService();
  await prisma.$connect();
  try {
    const svc = new OrderService(prisma as any);

    const user = await prisma.user.findFirst({ include: { addresses: true } });
    const product = await prisma.product.findFirst({ where: { stock: { gt: 0 } } });
    if (!user || !product) {
      console.error('No user or product available for test');
      return;
    }

    const couponCode = process.env.COUPON_CODE || 'WELCOME10';
    const payload: any = {
      userId: user.id,
      items: [{ productId: product.id, quantity: 1 }],
      shippingAddressId: user.addresses && user.addresses.length ? user.addresses[0].id : undefined,
      deliveryMethod: 'standard',
      couponCode
    };

    // Ensure we have a shipping address
    if (!payload.shippingAddressId) {
      const addr = await prisma.address.create({ data: { userId: user.id, fullName: user.fullName || 'Test', phone: user.phone || '000', province: 'HN', district: 'D1', ward: 'W1', streetAddress: 'Test street' } });
      payload.shippingAddressId = addr.id;
    }

    const order = await svc.createOrder(payload);
    console.log('Order created:', JSON.stringify({ id: order.id, orderNumber: order.orderNumber }, null, 2));
  } catch (err) {
    console.error('Create order failed', (err as any)?.message ?? err);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
