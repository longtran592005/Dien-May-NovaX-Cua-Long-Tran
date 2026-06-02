const { PrismaClient } = require('@prisma/client');
const fetch = global.fetch || require('node-fetch');
const { spawnSync } = require('child_process');

const PROMO_URL = process.env.PROMO_URL || 'http://localhost:4100';
const ORDER_SCRIPT_CWD = 'apps/order-service';

(async () => {
  const prisma = new PrismaClient();
  await prisma.$connect();
  try {
    const code = `ITEST-${Date.now().toString().slice(-6)}`;
    console.log('Creating promo', code);

    const payload = {
      code,
      name: `Integration Test ${code}`,
      type: 'coupon',
      discountType: 'fixed',
      discountValue: 20000,
      status: 'active',
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      metadata: {}
    };

    const upsertRes = await fetch(`${PROMO_URL}/promotions/upsert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!upsertRes.ok) {
      console.error('Upsert failed', await upsertRes.text());
      process.exit(1);
    }

    console.log('Promo created/upserted');

    // Run create order script with COUPON_CODE env
    console.log('Creating order using coupon...');
    const env = { ...process.env, COUPON_CODE: code };
    const res = spawnSync('npx', ['ts-node', '--transpile-only', 'scripts/run_create_order.ts'], { cwd: ORDER_SCRIPT_CWD, env, stdio: 'inherit', shell: true });
    if (res.status !== 0) {
      console.error('Order script failed');
      process.exit(1);
    }

    // Verify promotion audit
    const promo = await prisma.promotion.findUnique({ where: { code } });
    console.log('Promo from DB:', promo ? { id: promo.id, code: promo.code, usedCount: promo.usedCount } : null);

    const audits = await prisma.promotionAudit.findMany({ where: { promotionId: promo.id } });
    console.log('PromotionAudits:', audits.map(a => ({ id: a.id, orderId: a.orderId, amount: a.amount, createdAt: a.createdAt })));

    if (!audits || audits.length === 0) {
      console.error('No promotion audit created — test failed');
      process.exit(2);
    }

    console.log('Integration test passed');
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
