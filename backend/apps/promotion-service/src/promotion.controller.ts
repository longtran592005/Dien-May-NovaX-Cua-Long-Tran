import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PromotionService } from './promotion.service';
import { AuthGuard } from './auth.guard';

@Controller('promotions')
export class PromotionController {
  constructor(private readonly svc: PromotionService) {}

  @Get()
  list() {
    return this.svc.listActive();
  }

  @Get('all')
  listAll() {
    return this.svc.listAll();
  }

  @Get('flash-sales')
  listFlashSales() {
    return this.svc.listFlashSales();
  }

  @Get('customer-active')
  getActiveForCustomer() {
    return this.svc.getActiveForCustomer();
  }

  @Post('upsert')
  upsert(@Body() payload: any) {
    return this.svc.upsertPromotion(payload);
  }

  @Post('preview')
  preview(@Body() payload: { items: Array<{ productId: string; quantity: number }>; couponCode?: string; userId?: string }) {
    return this.svc.previewCart(payload);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.svc.deletePromotion(id);
  }
}
