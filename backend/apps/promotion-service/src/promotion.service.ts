import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class PromotionService {
  constructor(private readonly prisma: PrismaService) {}

  async listActive() {
    return this.prisma.promotion.findMany({ where: { status: 'active' }, orderBy: { priority: 'asc' } });
  }

  async listAll() {
    return this.prisma.promotion.findMany({ orderBy: { priority: 'asc' } });
  }

  async listFlashSales() {
    return this.prisma.promotion.findMany({ 
      where: { type: { in: ['product', 'bogo'] } }, 
      orderBy: { priority: 'asc' } 
    });
  }

  async getActiveForCustomer() {
    const now = new Date();
    return this.prisma.promotion.findMany({
      where: { 
        status: 'active',
        startsAt: { lte: now },
        endsAt: { gte: now }
      },
      orderBy: { priority: 'asc' }
    });
  }

  async upsertPromotion(payload: any) {
    const now = new Date();
    const code = payload.code || `PROMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const data: any = {
      name: payload.name || code,
      code,
      type: payload.type || 'coupon',
      status: payload.status || 'draft',
      discountType: payload.discountType || 'percent',
      discountValue: payload.discountValue || 0,
      maxDiscount: payload.maxDiscount || null,
      minOrderAmount: payload.minOrderAmount || null,
      priority: payload.priority || 100,
      isExclusive: payload.isExclusive || false,
      startsAt: payload.startsAt ? new Date(payload.startsAt) : now,
      endsAt: payload.endsAt ? new Date(payload.endsAt) : new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)),
      metadata: payload.metadata || null
    };

    return this.prisma.promotion.upsert({ where: { code }, create: data, update: data });
  }

  private async loadProductsMap(productIds: string[]) {
    const products = await this.prisma.product.findMany({ where: { id: { in: productIds } }, include: { category: true } });
    const map = new Map(products.map((p) => [p.id, p]));
    return map;
  }

  async previewCart(payload: { items: Array<{ productId: string; quantity: number }>; couponCode?: string; userId?: string }) {
    const items = payload.items || [];
    const productIds = items.map((i) => i.productId);
    const productMap = await this.loadProductsMap(productIds);

    const lineItems = items.map((it) => {
      const p = productMap.get(it.productId);
      return { product: p, quantity: it.quantity, unitPrice: p ? p.price : 0, subtotal: p ? p.price * it.quantity : 0 };
    });

    const cartSubtotal = lineItems.reduce((s, l) => s + l.subtotal, 0);

    // Load active promotions
    const now = new Date();
    const activePromos = await this.prisma.promotion.findMany({ where: { status: 'active', startsAt: { lte: now }, endsAt: { gte: now } }, orderBy: { priority: 'asc' } });
    // ensure product.category is populated in line items where available
    for (const li of lineItems) {
      if (li.product && !li.product.category) {
        // try to load category for this product
        try {
          const p = await this.prisma.product.findUnique({ where: { id: li.product.id }, include: { category: true } });
          if (p) li.product.category = p.category;
        } catch {}
      }
    }

    const applied: any[] = [];
    let totalDiscount = 0;

    // If couponCode provided, pick that promotion first
    if (payload.couponCode) {
      const promo = await this.prisma.promotion.findUnique({ where: { code: payload.couponCode } });
      if (promo) {
        const res = await this.applyPromotionToCart(promo, lineItems, cartSubtotal);
        if (res.discount > 0) {
          applied.push({ promo: promo.code, discount: res.discount, breakdown: res.breakdown });
          totalDiscount += res.discount;
          if (promo.isExclusive) {
            // exclusive coupon prevents further promos
            return this.buildPreview(lineItems, cartSubtotal, totalDiscount, applied);
          }
        }
      }
    }

    // Apply other promos by priority
    for (const promo of activePromos) {
      if (payload.couponCode && promo.code === payload.couponCode) continue;
      const res = await this.applyPromotionToCart(promo, lineItems, cartSubtotal - totalDiscount);
      if (res.discount > 0) {
        applied.push({ promo: promo.code, discount: res.discount, breakdown: res.breakdown });
        totalDiscount += res.discount;
        if (promo.isExclusive) break;
      }
    }

    return this.buildPreview(lineItems, cartSubtotal, totalDiscount, applied);
  }

  async deletePromotion(id: string) {
    // Soft-delete by marking status as deleted
    return this.prisma.promotion.update({ where: { id }, data: { status: 'deleted' } });
  }

  private buildPreview(lineItems: any[], subtotal: number, totalDiscount: number, applied: any[]) {
    const shippingFee = 0;
    const total = Math.max(0, subtotal - totalDiscount + shippingFee);
    return {
      items: lineItems,
      subtotal,
      totalDiscount,
      applied,
      shippingFee,
      total
    };
  }

  private async applyPromotionToCart(promo: any, lineItems: any[], currentSubtotal: number) {
    const discountType = promo.discountType || 'percent';
    const discountValue = Number(promo.discountValue || 0);
    const maxDiscount = promo.maxDiscount || null;
    const metadata = promo.metadata || {};
    const breakdown: any[] = [];
    let discount = 0;

    if (promo.type === 'coupon' || promo.type === 'cart') {
      if (promo.minOrderAmount && currentSubtotal < promo.minOrderAmount) return { discount: 0, breakdown };
      if (discountType === 'percent') {
        discount = Math.floor((currentSubtotal * discountValue) / 100);
      } else {
        discount = discountValue;
      }
      if (maxDiscount) discount = Math.min(discount, maxDiscount);
      breakdown.push({ scope: 'cart', amount: discount });
    } else if (promo.type === 'product') {
      // apply to products in target category or metadata.productIds
      const targetCategory = metadata.category || null;
      const productIds = metadata.productIds || null;
      for (const li of lineItems) {
        const pid = li.product?.id;
        const pcat = li.product?.category?.slug;
        const matches = (productIds && pid && productIds.includes(pid)) || (targetCategory && pcat && pcat === targetCategory);
        if (matches) {
          const itemDisc = discountType === 'percent' ? Math.floor((li.subtotal * discountValue) / 100) : Math.min(discountValue * li.quantity, li.subtotal);
          discount += itemDisc;
          breakdown.push({ scope: pid || 'unknown', amount: itemDisc });
        }
      }
      if (maxDiscount) discount = Math.min(discount, maxDiscount);
    } else if (promo.type === 'bogo') {
      // buy X get Y within targetCategory
      const buyQ = Number(metadata.buyQuantity || 1);
      const getQ = Number(metadata.getQuantity || 1);
      const targetCategory = metadata.targetCategory || null;
      if (!targetCategory) return { discount: 0, breakdown };
      for (const li of lineItems) {
        const pcat = li.product?.category?.slug;
        const pid = li.product?.id;
        if (pcat === targetCategory) {
          const group = Math.floor(li.quantity / (buyQ + getQ));
          const freeCount = group * getQ;
          const itemDisc = freeCount * li.unitPrice;
          discount += itemDisc;
          if (itemDisc > 0) breakdown.push({ scope: pid || 'unknown', amount: itemDisc });
        }
      }
    }

    return { discount, breakdown };
  }
}
