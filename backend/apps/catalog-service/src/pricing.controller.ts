import { Body, Controller, Get, Patch, Param, Post, Query } from '@nestjs/common';
import { PricingService } from './pricing.service';

@Controller()
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('promotions/active')
  async listActivePromotions() {
    return this.pricingService.listActivePromotions();
  }

  @Get('promotions/validate')
  async validateVoucher(
    @Query('code') code: string,
    @Query('subtotal') subtotal: string,
    @Query('customerTier') customerTier?: string
  ) {
    const parsedSubtotal = Math.max(0, Number(subtotal || 0));
    return this.pricingService.validateVoucher(code, parsedSubtotal, customerTier);
  }

  @Post('promotions/admin/create')
  async createPromotion(@Body() payload: any) {
    return this.pricingService.createPromotion(payload);
  }

  @Patch('promotions/admin/:id/status')
  async updatePromotionStatus(@Param('id') id: string, @Body() payload: { status: 'draft' | 'active' | 'paused' | 'expired' }) {
    return this.pricingService.updatePromotionStatus(id, payload.status);
  }

  @Post('pricing/quote')
  async quotePricing(@Body() payload: { items: Array<{ productId: string; quantity: number }>; couponCode?: string; customerTier?: string }) {
    return this.pricingService.quotePricing(payload);
  }

  @Get('flash-sales')
  async listFlashSales(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    const parsedPage = Math.max(1, Number(page || 1));
    const parsedPageSize = Math.min(100, Math.max(1, Number(pageSize || 20)));
    return this.pricingService.listFlashSales(status, parsedPage, parsedPageSize);
  }

  @Get('promotions/admin/conflicts')
  async detectConflicts(@Query('promotionId') promotionId?: string) {
    return this.pricingService.detectPromotionConflicts(promotionId);
  }

  @Post('pricing/simulate')
  async simulatePricing(
    @Body() payload: { items: Array<{ productId: string; quantity: number }>; couponCode?: string; customerTier?: string; excludePromotions?: string[] }
  ) {
    return this.pricingService.simulatePricing(payload);
  }
}

