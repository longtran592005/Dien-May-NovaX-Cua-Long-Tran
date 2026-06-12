import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { products as fallbackProducts } from '../../catalog-service/src/products.data';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(input: any) {
    const userId = await this.resolveOrderUserId(input.userId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { points: true }
    });

    // Generate order number
    const orderNumber = `NVX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const rawItems = Array.isArray(input.items) ? input.items : [];
    const normalizedItems = await Promise.all(
      rawItems.map(async (item: any) => {
        const resolvedProductId = await this.resolvePersistedProductId(item.productId);
        return {
          ...item,
          originalProductRef: String(item?.productId || '').trim(),
          productId: resolvedProductId
        };
      })
    );

    const invalidProductRefs = normalizedItems
      .filter((item) => !item.productId)
      .map((item) => item.originalProductRef)
      .filter(Boolean);

    if (invalidProductRefs.length > 0) {
      throw new BadRequestException(`Invalid product references: ${invalidProductRefs.join(', ')}`);
    }

    const validItems = normalizedItems as Array<{ productId: string; quantity: number; unitPrice?: number }>;

    const productIds = validItems.map((item) => item.productId);
    const products = productIds.length
      ? await this.prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, price: true }
        })
      : [];
    const productPriceMap = new Map(products.map((product) => [product.id, product.price]));

    const subtotalFromItems = validItems.reduce((sum: number, item: any) => {
      const unitPrice = Number(item.unitPrice ?? productPriceMap.get(item.productId) ?? 0);
      return sum + unitPrice * Math.max(1, Number(item.quantity || 1));
    }, 0);

    const pricingQuote = await this.quoteOrderPricing(validItems, input.couponCode, input.customerTier);
    const quoteLineUnitPriceMap = new Map(
      (pricingQuote?.lines || []).map((line: any) => [line.productId, line.unitPrice])
    );

    const subtotal = Number(pricingQuote?.subtotal ?? input.subtotal ?? subtotalFromItems);
    const discountAmount = Number(pricingQuote?.discountTotal ?? input.discountAmount ?? 0);
    const shippingFee = Number(
      input.shippingFee ?? (input.deliveryMethod === '2h' ? 50000 : 0)
    );

    const requestedPoints = Math.max(0, Math.floor(Number(input.usedPoints ?? 0)));
    const availablePoints = Math.max(0, Number(user?.points ?? 0));
    const payableBeforePoints = Math.max(0, subtotal - discountAmount + shippingFee);
    const maxPointSpendValue = Math.floor(payableBeforePoints * 0.5);
    const maxPointsByPolicy = Math.floor(maxPointSpendValue / 1000);
    const usedPoints = Math.min(requestedPoints, availablePoints, maxPointsByPolicy);
    const total = Math.max(0, payableBeforePoints - usedPoints * 1000);

    const quantityByProductId = new Map<string, number>();
    for (const item of validItems) {
      quantityByProductId.set(
        item.productId,
        (quantityByProductId.get(item.productId) || 0) + Math.max(1, Number(item.quantity || 1))
      );
    }

    const pricingSnapshot = {
      source: pricingQuote ? 'catalog-pricing-engine' : 'local-fallback',
      flowVersion: pricingQuote?.flowVersion || 'local-fallback-v1',
      request: {
        couponCode: input.couponCode || null,
        customerTier: input.customerTier || null,
        deliveryMethod: input.deliveryMethod || 'standard',
        requestedUsedPoints: requestedPoints
      },
      quote: pricingQuote
        ? {
            subtotal: pricingQuote.subtotal,
            lineDiscountTotal: pricingQuote.lineDiscountTotal,
            voucherDiscount: pricingQuote.voucherDiscount,
            discountTotal: pricingQuote.discountTotal,
            payableTotal: pricingQuote.payableTotal,
            voucherApplied: pricingQuote.voucherApplied,
            voucherRejectedReason: pricingQuote.voucherRejectedReason,
            lines: pricingQuote.lines
          }
        : null,
      serverTotals: {
        subtotal,
        shippingFee,
        discountAmount,
        usedPoints,
        total
      }
    };

    const order = await this.prisma.$transaction(async (tx) => {
      const movementEntries: Array<{ productId: string; quantity: number; movementType: string; reason: string }> = [];

      for (const [productId, quantity] of quantityByProductId.entries()) {
        const product = await tx.product.findUnique({
          where: { id: productId },
          select: { stock: true }
        });

        // If product exists in DB, verify and decrement stock.
        // If product is from fallback data (not in DB), skip stock check and continue.
        if (product !== null) {
          if (product.stock < quantity) {
            throw new BadRequestException(`Insufficient stock for product ${productId}. Available: ${product.stock}, requested: ${quantity}`);
          }

          await tx.product.update({
            where: { id: productId },
            data: {
              stock: {
                decrement: quantity
              },
              inStock: product.stock - quantity > 0
            }
          });

          movementEntries.push({
            productId,
            quantity,
            movementType: 'sale-reserved',
            reason: 'Stock reserved when creating order'
          });
        }
        // else: fallback product not in DB — allow order without stock tracking
      }

      // Create order only after stock has been reserved.
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: 'pending',
          subtotal,
          shippingFee,
          discountAmount,
          usedPoints,
          total,
          pricingSnapshot,
          shippingAddressId: input.shippingAddressId,
          deliveryMethod: input.deliveryMethod || 'standard',
          note: input.note,
          items: {
            create: validItems.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: Number(
                item.unitPrice ??
                  quoteLineUnitPriceMap.get(item.productId) ??
                  productPriceMap.get(item.productId) ??
                  0
              )
            }))
          }
        },
        include: {
          items: true,
          shippingAddress: true
        }
      });

      await Promise.all(
        movementEntries.map((entry) =>
          tx.inventoryMovement.create({
            data: {
              productId: entry.productId,
              orderId: created.id,
              movementType: entry.movementType,
              quantity: entry.quantity,
              reason: entry.reason,
              source: 'order-service'
            }
          })
        )
      );

      // If a voucher/promotion was applied in the pricing quote, increment its usage counter.
      try {
        const voucher = pricingQuote?.voucherApplied as any;
        const promoIdentifier = voucher?.promotionId || voucher?.code || null;
        if (promoIdentifier) {
          // Try to resolve promotion by code first, then by id
          let promo = await tx.promotion.findUnique({ where: { code: String(promoIdentifier) } });
          if (!promo) {
            promo = await tx.promotion.findUnique({ where: { id: String(promoIdentifier) } });
          }

          if (promo) {
            await tx.promotion.update({ where: { id: promo.id }, data: { usedCount: { increment: 1 } } });

            // Create audit record to preserve context of usage
            try {
              await tx.promotionAudit.create({
                data: {
                  promotionId: promo.id,
                  orderId: created.id,
                  userId,
                  amount: Number(voucher?.amount ?? voucher?.value ?? 0),
                  metadata: { source: 'order-service', voucher }
                }
              });
            } catch (auditErr: any) {
              // Log but don't fail order creation
              // eslint-disable-next-line no-console
              console.warn('Failed to create promotion audit', auditErr?.message ?? auditErr);
            }
          }
        }
      } catch (err: any) {
        // Swallow errors to avoid failing order creation; just log for later inspection.
        // In production consider emitting a reconciliation job on failure.
        // eslint-disable-next-line no-console
        console.warn('Failed to increment promotion usage for order', err?.message ?? err);
      }

      return created;
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

  private async quoteOrderPricing(
    items: Array<{ productId: string; quantity: number }>,
    couponCode?: string,
    customerTier?: string
  ) {
    const promoServiceUrl = process.env.PROMOTION_SERVICE_URL || 'http://localhost:4100';
    const catalogServiceUrl = process.env.CATALOG_SERVICE_URL || 'http://localhost:4020';

    // Try promotion-service preview first (it can evaluate coupons + promotions)
    try {
      const resp = await fetch(`${promoServiceUrl}/promotions/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, couponCode, userId: undefined })
      });

      if (resp.ok) {
        const preview = await resp.json();
        // Map preview shape to expected pricing quote shape
        const lines = (preview.items || []).map((ln: any) => ({ productId: ln.product?.id, unitPrice: ln.unitPrice }));
        const subtotal = Number(preview.subtotal || 0);
        const discountTotal = Number(preview.totalDiscount || 0);
        const payableTotal = Number(preview.total || Math.max(0, subtotal - discountTotal + Number(preview.shippingFee || 0)));

        return {
          flowVersion: 'promotion-service-v1',
          subtotal,
          lineDiscountTotal: 0,
          voucherDiscount: 0,
          discountTotal,
          payableTotal,
          voucherApplied: preview.applied && preview.applied.length ? { promotionId: preview.applied[0].promo, code: preview.applied[0].promo, amount: preview.applied[0].discount } : null,
          voucherRejectedReason: null,
          lines
        };
      }
    } catch (err) {
      // swallow errors and fallback to catalog service
    }

    // Fallback: call catalog-service pricing engine
    try {
      const response = await fetch(`${catalogServiceUrl}/pricing/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items,
          couponCode,
          customerTier
        })
      });

      if (!response.ok) {
        return null;
      }

      return (await response.json()) as {
        flowVersion: string;
        subtotal: number;
        lineDiscountTotal: number;
        voucherDiscount: number;
        discountTotal: number;
        payableTotal: number;
        voucherApplied: { promotionId: string; code: string; amount: number } | null;
        voucherRejectedReason: string | null;
        lines: Array<{ productId: string; unitPrice: number }>;
      };
    } catch {
      return null;
    }
  }

  async listOrders(userId?: string) {
    const orders = await this.prisma.order.findMany({
      where: userId ? { userId } : {},
      include: {
        items: { include: { product: { include: { images: true } } } },
        shippingAddress: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return this.attachPaymentMethods(orders);
  }

  async getOrderById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: { include: { images: true } } } },
        shippingAddress: true
      }
    });
    
    if (!order) throw new NotFoundException('Order not found');
    const [enriched] = await this.attachPaymentMethods([order]);
    return enriched;
  }

  async updateOrderStatus(id: string, status: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    if (order.status === status) {
      return this.prisma.order.findUnique({ where: { id }, include: { user: true } });
    }

    const allowedTransitions: Record<string, string[]> = {
      pending: ['confirmed'],
      confirmed: ['processing'],
      processing: ['shipped'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: []
    };

    const allowedNextStatuses = allowedTransitions[order.status] || [];
    if (!allowedNextStatuses.includes(status)) {
      throw new BadRequestException(`Cannot change order from ${order.status} to ${status}`);
    }

    if (status === 'cancelled') {
      throw new BadRequestException('Use the cancel order endpoint to cancel orders');
    }

    if (status !== 'delivered') {
      return this.prisma.order.update({
        where: { id },
        data: { status },
        include: { user: true }
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { status },
        include: { user: true }
      });

      // Loyalty Points Logic: 10.000 VNĐ = 1 Point when delivered
      if (order.status !== 'delivered') {
        const earnedPoints = Math.floor(order.total / 10000);
        if (earnedPoints > 0) {
          await tx.user.update({
            where: { id: order.userId },
            data: { points: { increment: earnedPoints } }
          });
        }

        // Auto-activate warranty for all products in order
        const items = await tx.orderItem.findMany({ where: { orderId: id } });
        const oneYearLater = new Date();
        oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

        await Promise.all(items.map(item =>
          tx.warranty.create({
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
    });
  }

  async cancelOrder(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new BadRequestException('Not authorized to cancel this order');
    
    // Only allow cancellation if pending
    if (order.status !== 'pending') {
      throw new BadRequestException(`Cannot cancel order in ${order.status} state`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const cancelledOrder = await tx.order.update({
        where: { id },
        data: { status: 'cancelled' }
      });

      const items = await tx.orderItem.findMany({
        where: { orderId: id },
        select: {
          productId: true,
          quantity: true
        }
      });

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
            inStock: true
          }
        });

        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            orderId: id,
            movementType: 'sale-reversed',
            quantity: item.quantity,
            reason: 'Stock restored after order cancellation',
            source: 'order-service'
          }
        });
      }

      if (order.usedPoints > 0) {
        await tx.user.update({
          where: { id: order.userId },
          data: { points: { increment: order.usedPoints } }
        });
      }

      return cancelledOrder;
    });

    return updated;
  }

  private async resolvePersistedProductId(productRef: unknown) {
    const normalizedRef = String(productRef || '').trim();
    if (!normalizedRef) {
      return null;
    }

    const byId = await this.prisma.product.findUnique({
      where: { id: normalizedRef },
      select: { id: true }
    });

    if (byId) {
      return byId.id;
    }

    const fallbackItem = fallbackProducts.find(
      (item) => item.id === normalizedRef || item.slug === normalizedRef
    );

    if (!fallbackItem) {
      return null;
    }

    // Try to find in DB by slug (in case it was seeded with a different ID)
    const bySlug = await this.prisma.product.findUnique({
      where: { slug: fallbackItem.slug },
      select: { id: true }
    });

    if (bySlug) {
      return bySlug.id;
    }

    // Product exists in fallback catalog but not in DB.
    // Auto-seed it so FK constraints are satisfied and stock is trackable.
    try {
      // Ensure category exists
      const categorySlug = fallbackItem.category;
      const category = await this.prisma.category.upsert({
        where: { slug: categorySlug },
        update: {},
        create: {
          slug: categorySlug,
          name: categorySlug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        }
      });

      const seeded = await this.prisma.product.create({
        data: {
          id: fallbackItem.id,
          name: fallbackItem.name,
          slug: fallbackItem.slug,
          price: fallbackItem.price,
          originalPrice: fallbackItem.originalPrice,
          discount: fallbackItem.discount,
          brand: fallbackItem.brand,
          rating: fallbackItem.rating,
          reviewCount: fallbackItem.reviewCount,
          inStock: fallbackItem.inStock,
          stock: (fallbackItem as any).stock ?? 50,
          minStockThreshold: (fallbackItem as any).minStockThreshold ?? 5,
          categoryId: category.id,
          images: fallbackItem.images?.length
            ? { create: fallbackItem.images.map((url: string, i: number) => ({ url, sortOrder: i })) }
            : undefined
        },
        select: { id: true }
      });

      return seeded.id;
    } catch (seedErr: any) {
      // Concurrent requests may have already seeded this product
      const existing = await this.prisma.product.findUnique({
        where: { slug: fallbackItem.slug },
        select: { id: true }
      });
      if (existing) return existing.id;
      console.error('Failed to seed fallback product', fallbackItem.id, seedErr?.message);
      return null;
    }
  }

  private async resolveOrderUserId(requestedUserId?: string) {
    if (!requestedUserId || requestedUserId === 'guest') {
      throw new BadRequestException('Authentication required to create order');
    }

    const byRequestedId = await this.prisma.user.findUnique({
      where: { id: requestedUserId },
      select: { id: true }
    });

    if (!byRequestedId) {
      throw new BadRequestException('User not found');
    }

    return byRequestedId.id;
  }

  private async attachPaymentMethods<T extends { id: string }>(orders: T[]) {
    if (orders.length === 0) {
      return orders;
    }

    const payments = await this.prisma.payment.findMany({
      where: {
        orderId: {
          in: orders.map((order) => order.id)
        }
      },
      select: {
        orderId: true,
        method: true
      }
    });

    const paymentMethodByOrderId = new Map(payments.map((payment) => [payment.orderId, payment.method]));

    return orders.map((order) => ({
      ...order,
      paymentMethod: (paymentMethodByOrderId.get(order.id) || 'cod') as 'cod' | 'vnpay' | 'stripe' | 'momo'
    }));
  }
}
