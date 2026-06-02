import { PrismaService } from '../src/prisma.service';
import { PromotionService } from '../src/promotion.service';

async function main() {
  const prisma = new PrismaService();
  await prisma.$connect();
  try {
    const svc = new PromotionService(prisma as any);
    const product = await prisma.product.findFirst({ where: { stock: { gt: 0 } }, select: { id: true } });
    const pid = product?.id ?? 'dummy';
    const preview = await svc.previewCart({ items: [{ productId: pid, quantity: 1 }], couponCode: 'WELCOME10' });
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(preview, null, 2));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Preview failed', (err as any)?.message ?? err);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
