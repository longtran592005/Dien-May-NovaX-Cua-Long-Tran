import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

type ShippingQuoteInput = {
  provinceCode?: string;
  items: Array<{ productId: string; quantity: number }>;
  orderValue?: number;
};

type WarehouseAllocationInput = {
  items: Array<{ productId: string; quantity: number }>;
  provinceCode?: string;
  customerTier?: string;
};

type CreateShippingZoneInput = {
  name: string;
  provinceCode?: string;
  slug: string;
  priority?: number;
};

type CreateShippingRuleInput = {
  zoneId: string;
  minDistance?: number;
  maxDistance?: number;
  minWeight?: number;
  maxWeight?: number;
  baseFee: number;
  perKmFee?: number;
  weightFactor?: number;
  bulkyFactor?: number;
  maxFee?: number;
  minOrderAmount?: number;
  description?: string;
};

type CreateWarehouseInput = {
  name: string;
  code: string;
  province: string;
  district: string;
  address: string;
  phone?: string;
  isPrimary?: boolean;
  capacity?: number;
};

@Injectable()
export class ShippingService {
  constructor(private readonly prisma: PrismaService) {}

  async createShippingZone(input: CreateShippingZoneInput) {
    return this.prisma.shippingZone.create({
      data: {
        name: input.name,
        provinceCode: input.provinceCode?.toUpperCase() || null,
        slug: input.slug.toLowerCase().trim(),
        priority: input.priority ?? 100
      }
    });
  }

  async createShippingRule(input: CreateShippingRuleInput) {
    const zone = await this.prisma.shippingZone.findUnique({
      where: { id: input.zoneId }
    });
    if (!zone) {
      throw new NotFoundException('Shipping zone not found');
    }

    if (input.minDistance !== undefined && input.maxDistance !== undefined) {
      if (input.minDistance < 0 || input.maxDistance < 0) {
        throw new BadRequestException('Distance values must be non-negative');
      }
      if (input.minDistance > input.maxDistance) {
        throw new BadRequestException('minDistance must be <= maxDistance');
      }
    }

    if (input.baseFee < 0) {
      throw new BadRequestException('baseFee must be non-negative');
    }

    return this.prisma.shippingRule.create({
      data: {
        zoneId: input.zoneId,
        minDistance: input.minDistance ?? null,
        maxDistance: input.maxDistance ?? null,
        minWeight: input.minWeight ?? null,
        maxWeight: input.maxWeight ?? null,
        baseFee: Math.floor(input.baseFee),
        perKmFee: Math.floor(input.perKmFee ?? 0),
        weightFactor: Math.floor(input.weightFactor ?? 0),
        bulkyFactor: Math.max(1.0, input.bulkyFactor ?? 1.0),
        maxFee: input.maxFee ? Math.floor(input.maxFee) : null,
        minOrderAmount: input.minOrderAmount ? Math.floor(input.minOrderAmount) : null,
        description: input.description?.trim() || null,
        isActive: true
      }
    });
  }

  async createWarehouse(input: CreateWarehouseInput) {
    const existing = await this.prisma.warehouse.findUnique({
      where: { code: input.code.toUpperCase() }
    });
    if (existing) {
      throw new BadRequestException(`Warehouse with code ${input.code} already exists`);
    }

    return this.prisma.warehouse.create({
      data: {
        name: input.name,
        code: input.code.toUpperCase(),
        province: input.province,
        district: input.district,
        address: input.address,
        phone: input.phone?.trim() || null,
        isPrimary: Boolean(input.isPrimary),
        capacity: input.capacity ? Math.floor(input.capacity) : null
      }
    });
  }

  async calculateShippingFee(input: ShippingQuoteInput): Promise<{ fee: number; zoneId: string; estimatedDays: number }> {
    if (!input.provinceCode) {
      throw new BadRequestException('provinceCode is required for shipping calculation');
    }

    // Find zone by province code
    const zone = await this.prisma.shippingZone.findFirst({
      where: {
        provinceCode: input.provinceCode.toUpperCase(),
        OR: [{ provinceCode: null }] // Fall back to zones without specific province
      },
      orderBy: { priority: 'asc' },
      include: { rules: { where: { isActive: true } } }
    });

    if (!zone || zone.rules.length === 0) {
      // Fallback: use default zone or throw error
      throw new BadRequestException(`No shipping rules found for province ${input.provinceCode}`);
    }

    // Estimate weight from quantity because the catalog schema does not yet persist product weight.
    const totalWeight = input.items.reduce((sum, item) => {
      const quantity = Math.max(1, Math.floor(item.quantity || 1));
      return sum + quantity * 1000;
    }, 0);

    // Find applicable rule
    let applicableRule = zone.rules[0];
    for (const rule of zone.rules) {
      const weightMatch =
        (rule.minWeight === null || totalWeight >= rule.minWeight) &&
        (rule.maxWeight === null || totalWeight <= rule.maxWeight);
      const valueMatch =
        rule.minOrderAmount === null || (input.orderValue || 0) >= rule.minOrderAmount;

      if (weightMatch && valueMatch) {
        applicableRule = rule;
        break;
      }
    }

    // Calculate fee
    let baseFee = applicableRule.baseFee;
    const isBulky = totalWeight > 5000; // Over 5kg = bulky
    if (isBulky) {
      baseFee = Math.floor(baseFee * applicableRule.bulkyFactor);
    }

    // Add per-kg fee
    const kgFee = Math.floor((totalWeight / 1000) * applicableRule.weightFactor);
    let finalFee = baseFee + kgFee;

    // Apply max fee cap
    if (applicableRule.maxFee && finalFee > applicableRule.maxFee) {
      finalFee = applicableRule.maxFee;
    }

    // Estimate delivery time based on zone
    const estimatedDays = zone.slug.includes('noi-thanh') ? 1 : zone.slug.includes('ngoai-thanh') ? 2 : 3;

    return {
      fee: finalFee,
      zoneId: zone.id,
      estimatedDays
    };
  }

  async allocateWarehouse(input: WarehouseAllocationInput) {
    if (!input.items || input.items.length === 0) {
      throw new BadRequestException('items are required');
    }

    const productIds = [...new Set(input.items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } }
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('Some products not found');
    }

    // Find warehouses with stock
    let warehouses = await this.prisma.warehouse.findMany({
      where: { inventory: { some: { quantity: { gt: 0 } } } },
      include: {
        inventory: {
          where: { productId: { in: productIds } }
        }
      },
      orderBy: [{ isPrimary: 'desc' }, { id: 'asc' }]
    });

    // Filter by province if provided
    if (input.provinceCode) {
      warehouses = warehouses.filter((w) => w.province.includes(input.provinceCode!));
    }

    if (warehouses.length === 0) {
      throw new BadRequestException('No warehouses with sufficient stock found');
    }

    // Greedy allocation: find warehouse with all items in stock
    for (const warehouse of warehouses) {
      const inventoryMap = new Map(warehouse.inventory.map((i) => [i.productId, i.quantity]));
      const canFulfill = input.items.every((item) => {
        const stock = inventoryMap.get(item.productId) || 0;
        return stock >= item.quantity;
      });

      if (canFulfill) {
        return {
          warehouseId: warehouse.id,
          warehouseName: warehouse.name,
          warehouseCode: warehouse.code,
          province: warehouse.province,
          district: warehouse.district,
          canFulfill: true
        };
      }
    }

    // Fallback: use primary warehouse or first available
    const primary = warehouses.find((w) => w.isPrimary) || warehouses[0];
    return {
      warehouseId: primary.id,
      warehouseName: primary.name,
      warehouseCode: primary.code,
      province: primary.province,
      district: primary.district,
      canFulfill: false,
      note: 'Warehouse does not have all items in stock; partial fulfillment may be required'
    };
  }

  async listShippingZones() {
    return this.prisma.shippingZone.findMany({
      include: { rules: { where: { isActive: true } } },
      orderBy: { priority: 'asc' }
    });
  }

  async listWarehouses() {
    return this.prisma.warehouse.findMany({
      include: {
        inventory: {
          where: { quantity: { gt: 0 } }
        }
      },
      orderBy: [{ isPrimary: 'desc' }, { code: 'asc' }]
    });
  }

  async updateWarehouseStock(warehouseId: string, productId: string, quantityDelta: number) {
    const inventory = await this.prisma.warehouseProduct.findUnique({
      where: { warehouseId_productId: { warehouseId, productId } }
    });

    if (!inventory) {
      throw new NotFoundException('Warehouse product not found');
    }

    const newQuantity = Math.max(0, inventory.quantity + quantityDelta);

    return this.prisma.warehouseProduct.update({
      where: { warehouseId_productId: { warehouseId, productId } },
      data: { quantity: newQuantity }
    });
  }
}
