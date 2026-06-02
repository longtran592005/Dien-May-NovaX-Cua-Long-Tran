import { PrismaService } from '../src/prisma.service';

async function main() {
  const prisma = new PrismaService();
  await prisma.$connect();
  try {
    const promo = await prisma.promotion.findUnique({ where: { code: 'WELCOME10' } });
    console.log('Promotion:', promo ? { id: promo.id, code: promo.code, usedCount: promo.usedCount } : null);
    try {
      const audits = await (prisma as any).promotionAudit.findMany({ where: { promotionId: promo?.id } });
      console.log('Audits:', audits || []);
    } catch (err) {
      console.warn('PromotionAudit table not available or query failed', (err as any)?.message ?? err);
    }
  } finally {
    await prisma.$disconnect();
  }
}

void main();
