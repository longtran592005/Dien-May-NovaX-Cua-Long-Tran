import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Patch,
  Put,
  Query,
  UnauthorizedException
} from '@nestjs/common';

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

type PaymentMethod = 'cod' | 'vnpay' | 'momo' | 'stripe';

type AdminOrderItem = {
  productId: string;
  quantity: number;
};

type AdminOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  paymentMethod: PaymentMethod;
  userId: string;
  shippingAddressId: string;
  note?: string | null;
  items: AdminOrderItem[];
  createdAt: string;
  updatedAt: string;
};

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  verified: boolean;
  createdAt: string;
};

type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  images: string[];
  category: string;
  brand: string;
  rating: number;
  reviewCount: number;
  description?: string;
  inStock: boolean;
};

type AnalyticsTopProduct = {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
};

type AnalyticsStatusBreakdown = {
  status: OrderStatus;
  count: number;
};

type AdminAnalytics = {
  rangeDays: number;
  rangeStart: string;
  rangeEnd: string;
  totalOrders: number;
  totalRevenue: number;
  todayOrders: number;
  todayRevenue: number;
  totalUsers: number;
  verifiedUsers: number;
  totalProducts: number;
  activeProducts: number;
  statusBreakdown: AnalyticsStatusBreakdown[];
  topProducts: AnalyticsTopProduct[];
  recentOrders: AdminOrder[];
};

type PaginatedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

const runtimeEnv = (globalThis as any)['process']?.env || {};

const authServiceUrl = runtimeEnv.AUTH_SERVICE_URL || 'http://auth-service:4010';
const catalogServiceUrl = runtimeEnv.CATALOG_SERVICE_URL || 'http://catalog-service:4020';
const cartServiceUrl = runtimeEnv.CART_SERVICE_URL || 'http://cart-service:4030';
const orderServiceUrl = runtimeEnv.ORDER_SERVICE_URL || 'http://order-service:4040';
const paymentServiceUrl = runtimeEnv.PAYMENT_SERVICE_URL || 'http://payment-service:4050';

@Controller()
export class GatewayController {
  private async resolveUserIdFromAuthorization(authorization?: string) {
    if (!authorization) {
      return 'guest';
    }

    try {
      const response = await fetch(new URL('/auth/me', authServiceUrl), {
        headers: {
          Authorization: authorization
        }
      });

      if (!response.ok) {
        return 'guest';
      }

      const profile = (await response.json()) as { id?: string; user?: { id?: string } };
      return profile.id || profile.user?.id || 'guest';
    } catch {
      return 'guest';
    }
  }

  @Post('auth/register')
  async register(@Body() payload: { email: string; password: string; fullName: string }) {
    const response = await fetch(new URL('/auth/register', authServiceUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const body = (await response.json()) as unknown;
    if (!response.ok) {
      throw new BadRequestException(body as object);
    }

    return body;
  }

  @Post('auth/verify-otp')
  async verifyOtp(@Body() payload: { email: string; otpCode: string }) {
    const response = await fetch(new URL('/auth/verify-otp', authServiceUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const body = (await response.json()) as unknown;
    if (!response.ok) {
      throw new BadRequestException(body as object);
    }

    return body;
  }

  @Post('auth/request-otp')
  async requestOtp(@Body() payload: { email: string }) {
    const response = await fetch(new URL('/auth/request-otp', authServiceUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const body = (await response.json()) as unknown;
    if (!response.ok) {
      throw new BadRequestException(body as object);
    }

    return body;
  }

  @Get('products')
  async listProducts(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    const url = new URL('/products', catalogServiceUrl);
    if (q) url.searchParams.set('q', q);
    if (category) url.searchParams.set('category', category);
    if (minPrice) url.searchParams.set('minPrice', minPrice);
    if (maxPrice) url.searchParams.set('maxPrice', maxPrice);
    if (page) url.searchParams.set('page', page);
    if (pageSize) url.searchParams.set('pageSize', pageSize);

    const response = await fetch(url.toString());
    return response.json();
  }

  @Get('products/:slug')
  async getProductBySlug(@Param('slug') slug: string) {
    const response = await fetch(new URL(`/products/${slug}`, catalogServiceUrl));
    return response.json();
  }

  @Post('admin/products')
  async createProduct(@Body() payload: Record<string, unknown>) {
    const response = await fetch(new URL('/products/admin/create', catalogServiceUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const body = (await response.json()) as unknown;
    if (!response.ok) {
      throw new BadRequestException(body as object);
    }

    return body;
  }

  @Put('admin/products/:id')
  async updateProduct(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const response = await fetch(new URL(`/products/admin/${id}`, catalogServiceUrl), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const body = (await response.json()) as unknown;
    if (!response.ok) {
      throw new BadRequestException(body as object);
    }

    return body;
  }

  @Delete('admin/products/:id')
  async deactivateProduct(@Param('id') id: string) {
    const response = await fetch(new URL(`/products/admin/${id}`, catalogServiceUrl), {
      method: 'DELETE'
    });

    const body = (await response.json()) as unknown;
    if (!response.ok) {
      throw new BadRequestException(body as object);
    }

    return body;
  }

  @Post('auth/login')
  async login(@Body() payload: { email: string; password: string }) {
    const response = await fetch(new URL('/auth/login', authServiceUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return response.json();
  }

  @Post('auth/refresh')
  async refresh(@Body() payload: { refreshToken: string }) {
    const response = await fetch(new URL('/auth/refresh', authServiceUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return response.json();
  }

  @Get('auth/me')
  async me(@Headers('authorization') authorization?: string) {
    const response = await fetch(new URL('/auth/me', authServiceUrl), {
      headers: {
        Authorization: authorization || ''
      }
    });

    if (!response.ok) {
      throw new UnauthorizedException('Unauthorized');
    }

    return response.json();
  }

  @Post('auth/logout')
  async logout(@Headers('authorization') authorization?: string) {
    const response = await fetch(new URL('/auth/logout', authServiceUrl), {
      method: 'POST',
      headers: {
        Authorization: authorization || ''
      }
    });

    if (!response.ok) {
      throw new BadRequestException('Logout failed');
    }

    return response.json();
  }

  @Post('auth/request-password-reset')
  async requestPasswordReset(@Body() payload: { email: string }) {
    const response = await fetch(new URL('/auth/request-password-reset', authServiceUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const body = (await response.json()) as unknown;
    if (!response.ok) {
      throw new BadRequestException(body as object);
    }

    return body;
  }

  @Post('auth/reset-password')
  async resetPassword(@Body() payload: { email: string; otpCode: string; newPassword: string }) {
    const response = await fetch(new URL('/auth/reset-password', authServiceUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const body = (await response.json()) as unknown;
    if (!response.ok) {
      throw new BadRequestException(body as object);
    }

    return body;
  }

  @Get('cart')
  async getCart(@Headers('authorization') authorization?: string) {
    const userId = await this.resolveUserIdFromAuthorization(authorization);
    const response = await fetch(new URL('/cart', cartServiceUrl), {
      headers: {
        'x-user-id': userId
      }
    });
    return response.json();
  }

  @Put('cart')
  async upsertCart(
    @Body() payload: { items: Array<{ productId: string; quantity: number }> },
    @Headers('authorization') authorization?: string
  ) {
    const userId = await this.resolveUserIdFromAuthorization(authorization);
    const response = await fetch(new URL('/cart', cartServiceUrl), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify(payload)
    });

    return response.json();
  }

  @Post('orders')
  async createOrder(
    @Body()
    payload: {
      shippingAddressId: string;
      paymentMethod: 'cod' | 'vnpay' | 'momo';
      note?: string;
      items?: Array<{ productId: string; quantity: number }>;
      total?: number;
    },
    @Headers('authorization') authorization?: string
  ) {
    const userId = await this.resolveUserIdFromAuthorization(authorization);
    const response = await fetch(new URL('/orders', orderServiceUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify(payload)
    });

    return response.json();
  }

  @Get('admin/orders')
  async listAdminOrders(
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: string,
    @Query('page') pageQuery?: string,
    @Query('pageSize') pageSizeQuery?: string
  ): Promise<PaginatedResult<AdminOrder>> {
    const response = await fetch(new URL('/orders', orderServiceUrl));
    const orders = (await response.json()) as AdminOrder[];

    const page = Math.max(1, Number(pageQuery) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(pageSizeQuery) || 10));
    const normalizedQuery = (q || '').trim().toLowerCase();

    let filtered = [...orders];

    if (status && status !== 'all') {
      filtered = filtered.filter((order) => order.status === status);
    }

    if (normalizedQuery) {
      filtered = filtered.filter((order) => {
        return (
          order.id.toLowerCase().includes(normalizedQuery) ||
          order.orderNumber.toLowerCase().includes(normalizedQuery) ||
          order.userId.toLowerCase().includes(normalizedQuery)
        );
      });
    }

    if (sortBy === 'oldest') {
      filtered.sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
    } else if (sortBy === 'value-high') {
      filtered.sort((left, right) => right.total - left.total);
    } else if (sortBy === 'value-low') {
      filtered.sort((left, right) => left.total - right.total);
    } else {
      filtered.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return {
      items,
      page,
      pageSize,
      total
    };
  }

  @Get('admin/analytics')
  async getAdminAnalytics(@Query('rangeDays') rangeDaysQuery?: string) {
    const [ordersResponse, usersResponse, productsResponse] = await Promise.all([
      fetch(new URL('/orders', orderServiceUrl)),
      fetch(new URL('/auth/admin/users', authServiceUrl)),
      fetch(new URL('/products?page=1&pageSize=500', catalogServiceUrl))
    ]);

    if (!ordersResponse.ok || !usersResponse.ok || !productsResponse.ok) {
      throw new BadRequestException('Failed to load analytics data');
    }

    const [orders, users, products] = (await Promise.all([
      ordersResponse.json(),
      usersResponse.json(),
      productsResponse.json()
    ])) as [AdminOrder[], AdminUser[], { items?: CatalogProduct[] }];

    const parsedRangeDays = Number(rangeDaysQuery || '30');
    const rangeDays = Number.isFinite(parsedRangeDays) && parsedRangeDays > 0 ? parsedRangeDays : 30;

    const rangeEnd = new Date();
    const rangeStart = new Date(rangeEnd);
    rangeStart.setDate(rangeStart.getDate() - (rangeDays - 1));

    const inRangeOrders = orders.filter((order) => {
      const created = new Date(order.createdAt);
      return created >= rangeStart && created <= rangeEnd;
    });

    const todayKey = new Date().toISOString().slice(0, 10);

    const totalRevenue = inRangeOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
    const todayOrders = inRangeOrders.filter((order) => order.createdAt.slice(0, 10) === todayKey).length;
    const todayRevenue = inRangeOrders
      .filter((order) => order.createdAt.slice(0, 10) === todayKey)
      .reduce((sum, order) => sum + (Number(order.total) || 0), 0);

    const statusOrder: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    const statusBreakdown = statusOrder.map((status) => ({
      status,
      count: inRangeOrders.filter((order) => order.status === status).length
    }));

    const productMap = new Map((products.items || []).map((product) => [product.id, product]));
    const productStats = new Map<string, { quantity: number; revenue: number }>();

    for (const order of inRangeOrders) {
      for (const item of order.items) {
        const current = productStats.get(item.productId) || { quantity: 0, revenue: 0 };
        const product = productMap.get(item.productId);
        const unitPrice = product?.price || 0;
        productStats.set(item.productId, {
          quantity: current.quantity + item.quantity,
          revenue: current.revenue + unitPrice * item.quantity
        });
      }
    }

    const topProducts = Array.from(productStats.entries())
      .map(([productId, value]) => ({
        productId,
        name: productMap.get(productId)?.name || productId,
        quantity: value.quantity,
        revenue: value.revenue
      }))
      .sort((left, right) => right.quantity - left.quantity)
      .slice(0, 5);

    const analytics: AdminAnalytics = {
      rangeDays,
      rangeStart: rangeStart.toISOString(),
      rangeEnd: rangeEnd.toISOString(),
      totalOrders: inRangeOrders.length,
      totalRevenue,
      todayOrders,
      todayRevenue,
      totalUsers: users.length,
      verifiedUsers: users.filter((user) => user.verified).length,
      totalProducts: products.items?.length || 0,
      activeProducts: (products.items || []).filter((product) => product.inStock).length,
      statusBreakdown,
      topProducts,
      recentOrders: inRangeOrders
        .slice()
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
        .slice(0, 5)
    };

    return analytics;
  }

  @Get('admin/orders/:id')
  async getAdminOrder(@Param('id') id: string) {
    const response = await fetch(new URL(`/orders/${id}`, orderServiceUrl));
    return response.json();
  }

  @Patch('admin/orders/:id/status')
  async updateAdminOrderStatus(
    @Param('id') id: string,
    @Body() payload: { status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' }
  ) {
    const response = await fetch(new URL(`/orders/${id}/status`, orderServiceUrl), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const body = (await response.json()) as unknown;
    if (!response.ok) {
      throw new BadRequestException(body as object);
    }

    return body;
  }

  @Get('admin/users')
  async listAdminUsers(
    @Query('q') q?: string,
    @Query('role') role?: string,
    @Query('verified') verifiedQuery?: string,
    @Query('sortBy') sortBy?: string,
    @Query('page') pageQuery?: string,
    @Query('pageSize') pageSizeQuery?: string
  ): Promise<PaginatedResult<AdminUser>> {
    const response = await fetch(new URL('/auth/admin/users', authServiceUrl));
    const users = (await response.json()) as AdminUser[];

    const page = Math.max(1, Number(pageQuery) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(pageSizeQuery) || 10));
    const normalizedQuery = (q || '').trim().toLowerCase();

    let filtered = [...users];

    if (role && role !== 'all') {
      filtered = filtered.filter((user) => user.role === role);
    }

    if (verifiedQuery === 'true' || verifiedQuery === 'false') {
      const expected = verifiedQuery === 'true';
      filtered = filtered.filter((user) => user.verified === expected);
    }

    if (normalizedQuery) {
      filtered = filtered.filter((user) => {
        return (
          user.id.toLowerCase().includes(normalizedQuery) ||
          user.email.toLowerCase().includes(normalizedQuery) ||
          user.name.toLowerCase().includes(normalizedQuery)
        );
      });
    }

    if (sortBy === 'oldest') {
      filtered.sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
    } else if (sortBy === 'name') {
      filtered.sort((left, right) => left.name.localeCompare(right.name, 'vi'));
    } else {
      filtered.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return {
      items,
      page,
      pageSize,
      total
    };
  }

  @Patch('admin/users/:id/role')
  async updateAdminUserRole(@Param('id') id: string, @Body() payload: { role: 'customer' | 'admin' }) {
    const response = await fetch(new URL(`/auth/admin/users/${id}/role`, authServiceUrl), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const body = (await response.json()) as unknown;
    if (!response.ok) {
      throw new BadRequestException(body as object);
    }

    return body;
  }

  @Patch('admin/users/:id/verified')
  async updateAdminUserVerified(@Param('id') id: string, @Body() payload: { verified: boolean }) {
    const response = await fetch(new URL(`/auth/admin/users/${id}/verified`, authServiceUrl), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const body = (await response.json()) as unknown;
    if (!response.ok) {
      throw new BadRequestException(body as object);
    }

    return body;
  }

  @Post('payments/initiate')
  async initiatePayment(
    @Body()
    payload: {
      orderId: string;
      amount: number;
      method: 'cod' | 'vnpay' | 'momo' | 'stripe';
      returnUrl?: string;
    }
  ) {
    const response = await fetch(new URL('/payments/initiate', paymentServiceUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    return response.json();
  }

  @Get('payments/verify/:transactionId')
  async verifyPayment(@Param('transactionId') transactionId: string) {
    const response = await fetch(new URL(`/payments/verify/${transactionId}`, paymentServiceUrl));
    return response.json();
  }

  @Post('payments/callback')
  async paymentCallback(@Body() payload: Record<string, unknown>) {
    const response = await fetch(new URL('/payments/callback', paymentServiceUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    return response.json();
  }
}
