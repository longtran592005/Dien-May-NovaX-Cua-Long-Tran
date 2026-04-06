import { Body, Controller, Get, Headers, Put } from '@nestjs/common';

interface CartItemInput {
  productId: string;
  quantity: number;
}

const cartStates = new Map<string, CartItemInput[]>();

@Controller('cart')
export class CartController {
  @Get()
  getCart(@Headers('x-user-id') userId?: string) {
    const key = userId || 'guest';
    const items = cartStates.get(key) || [];
    const subtotal = items.reduce((acc, item) => acc + item.quantity * 1000000, 0);
    return {
      userId: key,
      items,
      subtotal,
      total: subtotal
    };
  }

  @Put()
  upsertCart(@Body() payload: { items: CartItemInput[] }, @Headers('x-user-id') userId?: string) {
    const key = userId || 'guest';
    const items = (payload.items || []).filter((item) => item.quantity > 0);
    cartStates.set(key, items);

    const subtotal = items.reduce((acc, item) => acc + item.quantity * 1000000, 0);
    return {
      userId: key,
      items,
      subtotal,
      total: subtotal
    };
  }
}
