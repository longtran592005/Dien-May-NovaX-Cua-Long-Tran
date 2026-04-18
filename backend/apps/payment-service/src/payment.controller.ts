import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PaymentService } from './payment.service';

type PaymentMethod = 'cod' | 'vnpay' | 'stripe';

interface InitiatePaymentDto {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  returnUrl?: string;
}

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initiate')
  initiate(@Body() payload: InitiatePaymentDto) {
    return this.paymentService.initiate(payload);
  }

  @Get('verify/:transactionId')
  verify(@Param('transactionId') transactionId: string) {
    return this.paymentService.verify(transactionId);
  }

  @Post('callback')
  callback(@Body() payload: Record<string, unknown>) {
    return this.paymentService.callback(payload);
  }
}
