import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

type PromotionType = 'voucher' | 'flash_sale' | 'bundle' | 'tier';
type DiscountType = 'percentage' | 'fixed';
type PromotionStatus = 'draft' | 'active' | 'paused' | 'expired';

type QuoteItemInput = {
  productId: string;
  quantity: number;
};

type QuoteInput = {
  items: QuoteItemInput[];
  couponCode?: string;
  customerTier?: string;
};

type CreatePromotionInput = {
  name: string;
  code?: string;
  type: PromotionType;
  status?: PromotionStatus;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  priority?: number;
  isExclusive?: boolean;
  startsAt: string;
  endsAt: string;
  usageLimit?: number;
  targetTier?: string;
  productIds?: string[];
  categorySlugs?: string[];
  metadata?: Record<string, unknown>;
  minQuantity?: number;
};

type PromotionWithScopes = {
  id: string;
  name: string;
  code: string | null;
  type: string;
  status: string;
  discountType: string;
  discountValue: number;
  maxDiscount: number | null;
  minOrderAmount: number | null;
  priority: number;
  isExclusive: boolean;
  startsAt: Date;
  endsAt: Date;
  usageLimit: number | null;
  usedCount: number;
  targetTier: string | null;
  productScopes: Array<{ productId: string; minQuantity: number }>;
  categoryScopes: Array<{ categorySlug: string }>;
};

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async createPromotion(input: CreatePromotionInput) {
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);

    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      throw new BadRequestException('Invalid startsAt or endsAt');
    }

    if (startsAt >= endsAt) {
      throw new BadRequestException('startsAt must be earlier than endsAt');
    }

    if (input.discountValue <= 0) {
      throw new BadRequestException('discountValue must be positive');
    }

    const created = await this.prisma.promotion.create({
      data: {
        name: input.name,
        code: input.code?.trim() || null,
        type: input.type,
        status: input.status || 'draft',
        discountType: input.discountType,
        discountValue: Math.floor(input.discountValue),
        maxDiscount: input.maxDiscount ? Math.floor(input.maxDiscount) : null,
        minOrderAmount: input.minOrderAmount ? Math.floor(input.minOrderAmount) : null,
        priority: input.priority ?? 100,
        isExclusive: Boolean(input.isExclusive),
        startsAt,
        endsAt,
        usageLimit: input.usageLimit ?? null,
        targetTier: input.targetTier || null,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
        productScopes: {
          create: (input.productIds || []).map((productId) => ({
            productId,
            minQuantity: Math.max(1, input.minQuantity || 1)
          }))
        },
        categoryScopes: {
          create: (input.categorySlugs || []).map((categorySlug) => ({
            categorySlug
          }))
        }
      },
      include: {
        productScopes: true,
        categoryScopes: true
      }
    });

    return created;
  }

  async updatePromotionStatus(id: string, status: PromotionStatus) {
    return this.prisma.promotion.update({
      where: { id },
      data: { status }
    });
  }

  async listActivePromotions() {
    const now = new Date();
    return this.prisma.promotion.findMany({
      where: {
        status: 'active',
        startsAt: { lte: now },
        endsAt: { gte: now }
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
      include: {
        productScopes: true,
        categoryScopes: true
      }
    });
  }

  async validateVoucher(code: string, subtotal: number, customerTier?: string) {
    const voucher = await this.findActiveVoucher(code);
    if (!voucher) {
      return {
        valid: false,
        reason: 'Voucher not found or not active'
      };
    }

    if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
      return {
        valid: false,
        reason: 'Voucher usage limit reached'
      };
    }

    if (voucher.minOrderAmount && subtotal < voucher.minOrderAmount) {
      return {
        valid: false,
        reason: `Minimum order amount is ${voucher.minOrderAmount}`
      };
    }

    if (voucher.targetTier && customerTier && voucher.targetTier !== customerTier) {
      return {
        valid: false,
        reason: 'Voucher is not applicable for this customer tier'
      };
    }

    const discountAmount = this.computeDiscount(subtotal, voucher.discountType as DiscountType, voucher.discountValue, voucher.maxDiscount || undefined);

    return {
      valid: true,
      voucherId: voucher.id,
      code: voucher.code,
      discountAmount,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue
    };
  }

  async quotePricing(input: QuoteInput) {
    if (!input.items || input.items.length === 0) {
      throw new BadRequestException('items is required');
    }

    const normalizedItems = input.items.map((item) => ({
      productId: item.productId,
      quantity: Math.max(1, Math.floor(item.quantity || 1))
    }));

    const productIds = normalizedItems.map((item) => item.productId);
    const uniqueProductIds = [...new Set(productIds)];
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: uniqueProductIds },
        isActive: true
      },
      include: {
        category: true
      }
    });

    if (products.length !== uniqueProductIds.length) {
      throw new BadRequestException('Some products do not exist or are inactive');
    }

    const productMap = new Map(products.map((product) => [product.id, product]));

    const activePromotions = (await this.listActivePromotions()) as unknown as PromotionWithScopes[];
    const linePromotions = activePromotions.filter((promotion) => promotion.type === 'flash_sale' || promotion.type === 'bundle' || promotion.type === 'tier');

    const lineBreakdown = normalizedItems.map((item) => {
      const product = productMap.get(item.productId)!;
      const unitPrice = product.price;
      const lineBaseTotal = unitPrice * item.quantity;
      let lineDiscount = 0;
      let hasExclusiveApplied = false;
      const applied: Array<{ promotionId: string; type: string; amount: number; name: string }> = [];

      for (const promotion of linePromotions) {
        if (hasExclusiveApplied) {
          break;
        }

        if (promotion.type === 'tier' && promotion.targetTier && promotion.targetTier !== (input.customerTier || '')) {
          continue;
        }

        if (!this.isPromotionInScope(promotion, product.id, product.category.slug)) {
          continue;
        }

        if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
          continue;
        }

        const candidateAmount = this.getLineCandidateAmount(promotion, lineBaseTotal, item.quantity, product.id);
        if (candidateAmount <= 0) {
          continue;
        }

        const rawDiscount = this.computeDiscount(
          candidateAmount,
          promotion.discountType as DiscountType,
          promotion.discountValue,
          promotion.maxDiscount || undefined
        );

        const remaining = Math.max(0, lineBaseTotal - lineDiscount);
        const appliedAmount = Math.min(rawDiscount, remaining);

        if (appliedAmount <= 0) {
          continue;
        }

        lineDiscount += appliedAmount;
        applied.push({
          promotionId: promotion.id,
          type: promotion.type,
          amount: appliedAmount,
          name: promotion.name
        });

        if (promotion.isExclusive) {
          hasExclusiveApplied = true;
        }
      }

      return {
        productId: product.id,
        name: product.name,
        category: product.category.slug,
        quantity: item.quantity,
        unitPrice,
        lineBaseTotal,
        lineDiscount,
        lineFinalTotal: lineBaseTotal - lineDiscount,
        appliedPromotions: applied
      };
    });

    const subtotal = lineBreakdown.reduce((sum, line) => sum + line.lineBaseTotal, 0);
    const lineDiscountTotal = lineBreakdown.reduce((sum, line) => sum + line.lineDiscount, 0);
    const subtotalAfterLineDiscount = subtotal - lineDiscountTotal;

    let voucherDiscount = 0;
    let voucherApplied: { promotionId: string; code: string; amount: number } | null = null;
    let voucherRejectedReason: string | null = null;

    if (input.couponCode) {
      const validation = await this.validateVoucher(input.couponCode, subtotalAfterLineDiscount, input.customerTier);
      if (!validation.valid) {
        voucherRejectedReason = validation.reason || 'Voucher is invalid';
      } else {
        const voucherId = 'voucherId' in validation ? validation.voucherId : undefined;
        const voucherCode = 'code' in validation ? validation.code : undefined;
        voucherDiscount = validation.discountAmount || 0;

        if (!voucherId || !voucherCode) {
          voucherRejectedReason = 'Voucher response is missing required fields';
          voucherDiscount = 0;
        } else {
        voucherApplied = {
          promotionId: voucherId,
          code: voucherCode,
          amount: voucherDiscount
        };
        }
      }
    }

    const discountTotal = lineDiscountTotal + voucherDiscount;
    const payableTotal = Math.max(0, subtotal - discountTotal);

    return {
      flowVersion: 'pricing-engine-v1',
      subtotal,
      lineDiscountTotal,
      voucherDiscount,
      discountTotal,
      payableTotal,
      voucherApplied,
      voucherRejectedReason,
      lines: lineBreakdown
    };
  }

  private isPromotionInScope(promotion: PromotionWithScopes, productId: string, categorySlug: string) {
    const productScopeCount = promotion.productScopes.length;
    const categoryScopeCount = promotion.categoryScopes.length;

    if (productScopeCount === 0 && categoryScopeCount === 0) {
      return true;
    }

    if (productScopeCount > 0 && promotion.productScopes.some((scope) => scope.productId === productId)) {
      return true;
    }

    if (categoryScopeCount > 0 && promotion.categoryScopes.some((scope) => scope.categorySlug === categorySlug)) {
      return true;
    }

    return false;
  }

  private getLineCandidateAmount(
    promotion: PromotionWithScopes,
    lineBaseTotal: number,
    quantity: number,
    productId: string
  ) {
    if (promotion.type !== 'bundle') {
      return lineBaseTotal;
    }

    const scope = promotion.productScopes.find((item) => item.productId === productId);
    const minQuantity = scope?.minQuantity || 1;
    if (quantity < minQuantity) {
      return 0;
    }

    const qualifyingGroups = Math.floor(quantity / minQuantity);
    if (qualifyingGroups <= 0) {
      return 0;
    }

    return Math.floor((lineBaseTotal / quantity) * minQuantity * qualifyingGroups);
  }

  private computeDiscount(baseAmount: number, discountType: DiscountType, discountValue: number, maxDiscount?: number) {
    const raw =
      discountType === 'percentage'
        ? Math.floor((baseAmount * discountValue) / 100)
        : Math.floor(discountValue);

    if (maxDiscount && maxDiscount > 0) {
      return Math.min(raw, maxDiscount);
    }

    return raw;
  }

  private async findActiveVoucher(code: string) {
    const now = new Date();

    return this.prisma.promotion.findFirst({
      where: {
        code,
        type: 'voucher',
        status: 'active',
        startsAt: { lte: now },
        endsAt: { gte: now }
      }
    });
  }

  async listFlashSales(status?: string, page: number = 1, pageSize: number = 20) {
    const now = new Date();
    const skip = (page - 1) * pageSize;

    const where: Prisma.PromotionWhereInput = {
      type: 'flash_sale'
    };

    if (status === 'active') {
      where.status = 'active';
      where.startsAt = { lte: now };
      where.endsAt = { gte: now };
    } else if (status === 'upcoming') {
      where.status = 'active';
      where.startsAt = { gt: now };
    } else if (status === 'expired') {
      where.endsAt = { lt: now };
    } else if (status === 'draft') {
      where.status = 'draft';
    }

    const [flashSales, total] = await Promise.all([
      this.prisma.promotion.findMany({
        where,
        include: { productScopes: true, categoryScopes: true },
        orderBy: [{ startsAt: 'asc' }, { priority: 'asc' }],
        skip,
        take: pageSize
      }),
      this.prisma.promotion.count({ where })
    ]);

    return {
      flashSales,
      pagination: {
        page,
        pageSize,
        total,
        pages: Math.ceil(total / pageSize)
      }
    };
  }

  async detectPromotionConflicts(promotionId?: string) {
    const now = new Date();
    const promotions = await this.prisma.promotion.findMany({
      where: {
        status: { in: ['active', 'draft'] },
        type: { in: ['flash_sale', 'bundle'] }
      },
      include: { productScopes: true, categoryScopes: true }
    });

    const conflicts: Array<{
      promotion1Id: string;
      promotion1Name: string;
      promotion2Id: string;
      promotion2Name: string;
      conflictType: 'time' | 'scope';
      details: string;
    }> = [];

    for (let i = 0; i < promotions.length; i++) {
      for (let j = i + 1; j < promotions.length; j++) {
        const p1 = promotions[i];
        const p2 = promotions[j];

        // Check time overlap for same scope
        const timeOverlap = p1.startsAt <= p2.endsAt && p1.endsAt >= p2.startsAt;
        if (!timeOverlap) continue;

        // Check scope overlap
        const p1ProductIds = new Set(p1.productScopes.map((s) => s.productId));
        const p2ProductIds = new Set(p2.productScopes.map((s) => s.productId));
        const p1CategorySlugs = new Set(p1.categoryScopes.map((s) => s.categorySlug));
        const p2CategorySlugs = new Set(p2.categoryScopes.map((s) => s.categorySlug));

        // If no specific scope, applies to all
        const p1AppliesToAll = p1ProductIds.size === 0 && p1CategorySlugs.size === 0;
        const p2AppliesToAll = p2ProductIds.size === 0 && p2CategorySlugs.size === 0;

        let hasScopeOverlap = false;
        let overlapDetails = '';

        if (p1AppliesToAll && p2AppliesToAll) {
          hasScopeOverlap = true;
          overlapDetails = 'Both promotions apply to all products';
        } else if (p1AppliesToAll) {
          hasScopeOverlap = true;
          overlapDetails = `${p1.name} applies to all, ${p2.name} applies to specific scope`;
        } else if (p2AppliesToAll) {
          hasScopeOverlap = true;
          overlapDetails = `${p2.name} applies to all, ${p1.name} applies to specific scope`;
        } else {
          // Check product overlap
          for (const productId of p1ProductIds) {
            if (p2ProductIds.has(productId)) {
              hasScopeOverlap = true;
              overlapDetails = `Overlapping product: ${productId}`;
              break;
            }
          }

          // Check category overlap
          if (!hasScopeOverlap) {
            for (const categorySlug of p1CategorySlugs) {
              if (p2CategorySlugs.has(categorySlug)) {
                hasScopeOverlap = true;
                overlapDetails = `Overlapping category: ${categorySlug}`;
                break;
              }
            }
          }
        }

        if (hasScopeOverlap) {
          conflicts.push({
            promotion1Id: p1.id,
            promotion1Name: p1.name,
            promotion2Id: p2.id,
            promotion2Name: p2.name,
            conflictType: 'scope',
            details: overlapDetails
          });
        }
      }
    }

    if (promotionId) {
      return conflicts.filter((c) => c.promotion1Id === promotionId || c.promotion2Id === promotionId);
    }

    return conflicts;
  }

  async simulatePricing(input: QuoteInput & { excludePromotions?: string[] }) {
    const excludeIds = new Set(input.excludePromotions || []);

    // Call quotePricing normally
    const baseQuote = await this.quotePricing(input);

    // Get active promotions again, excluding specified ones
    const activePromotions = (await this.listActivePromotions()) as unknown as PromotionWithScopes[];
    const filteredPromotions = activePromotions.filter((p) => !excludeIds.has(p.id));

    // Calculate what the price would be without excluded promotions
    const simulationItems = input.items;
    const productIds = simulationItems.map((item) => item.productId);
    const uniqueProductIds = [...new Set(productIds)];
    const products = await this.prisma.product.findMany({
      where: { id: { in: uniqueProductIds }, isActive: true },
      include: { category: true }
    });

    const productMap = new Map(products.map((product) => [product.id, product]));

    const simulatedLineBreakdown = simulationItems.map((item) => {
      const product = productMap.get(item.productId)!;
      const unitPrice = product.price;
      const lineBaseTotal = unitPrice * item.quantity;
      let lineDiscount = 0;
      let hasExclusiveApplied = false;
      const applied: Array<{ promotionId: string; type: string; amount: number; name: string }> = [];

      for (const promotion of filteredPromotions) {
        if (hasExclusiveApplied) break;
        if (promotion.type === 'tier' && promotion.targetTier && promotion.targetTier !== (input.customerTier || '')) {
          continue;
        }
        if (!this.isPromotionInScope(promotion, product.id, product.category.slug)) {
          continue;
        }
        if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
          continue;
        }

        const candidateAmount = this.getLineCandidateAmount(promotion, lineBaseTotal, item.quantity, product.id);
        if (candidateAmount <= 0) continue;

        const rawDiscount = this.computeDiscount(
          candidateAmount,
          promotion.discountType as DiscountType,
          promotion.discountValue,
          promotion.maxDiscount || undefined
        );

        const remaining = Math.max(0, lineBaseTotal - lineDiscount);
        const appliedAmount = Math.min(rawDiscount, remaining);

        if (appliedAmount <= 0) continue;

        lineDiscount += appliedAmount;
        applied.push({
          promotionId: promotion.id,
          type: promotion.type,
          amount: appliedAmount,
          name: promotion.name
        });

        if (promotion.isExclusive) {
          hasExclusiveApplied = true;
        }
      }

      return {
        productId: product.id,
        name: product.name,
        category: product.category.slug,
        quantity: item.quantity,
        unitPrice,
        lineBaseTotal,
        lineDiscount,
        lineFinalTotal: lineBaseTotal - lineDiscount,
        appliedPromotions: applied
      };
    });

    const simulatedSubtotal = simulatedLineBreakdown.reduce((sum, line) => sum + line.lineBaseTotal, 0);
    const simulatedLineDiscountTotal = simulatedLineBreakdown.reduce((sum, line) => sum + line.lineDiscount, 0);

    return {
      original: baseQuote,
      simulated: {
        flowVersion: 'pricing-engine-v1',
        subtotal: simulatedSubtotal,
        lineDiscountTotal: simulatedLineDiscountTotal,
        discountTotal: simulatedLineDiscountTotal,
        payableTotal: Math.max(0, simulatedSubtotal - simulatedLineDiscountTotal),
        lines: simulatedLineBreakdown
      },
      comparison: {
        discountSavings: baseQuote.discountTotal - simulatedLineDiscountTotal,
        priceDifference: baseQuote.payableTotal - Math.max(0, simulatedSubtotal - simulatedLineDiscountTotal),
        excludedPromotions: input.excludePromotions || []
      }
    };
  }
}
