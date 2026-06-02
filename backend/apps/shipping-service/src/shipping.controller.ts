import { Body, Controller, Get, Post, Patch, Param, Query } from '@nestjs/common';
import { ShippingService } from './shipping.service';

@Controller()
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get('shipping/zones')
  async listShippingZones() {
    return this.shippingService.listShippingZones();
  }

  @Post('shipping/zones/admin/create')
  async createZone(@Body() payload: any) {
    return this.shippingService.createShippingZone(payload);
  }

  @Post('shipping/rules/admin/create')
  async createRule(@Body() payload: any) {
    return this.shippingService.createShippingRule(payload);
  }

  @Post('shipping/quote')
  async quoteShipping(@Body() payload: { provinceCode?: string; items: Array<{ productId: string; quantity: number }>; orderValue?: number }) {
    return this.shippingService.calculateShippingFee(payload);
  }

  @Post('shipping/allocate-warehouse')
  async allocateWarehouse(@Body() payload: { items: Array<{ productId: string; quantity: number }>; provinceCode?: string; customerTier?: string }) {
    return this.shippingService.allocateWarehouse(payload);
  }

  @Get('warehouses')
  async listWarehouses() {
    return this.shippingService.listWarehouses();
  }

  @Post('warehouses/admin/create')
  async createWarehouse(@Body() payload: any) {
    return this.shippingService.createWarehouse(payload);
  }

  @Patch('warehouses/:warehouseId/stock/:productId')
  async updateStock(
    @Param('warehouseId') warehouseId: string,
    @Param('productId') productId: string,
    @Body() payload: { quantityDelta: number }
  ) {
    return this.shippingService.updateWarehouseStock(warehouseId, productId, payload.quantityDelta);
  }
}
