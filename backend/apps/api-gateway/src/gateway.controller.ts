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
  UnauthorizedException,
  UseInterceptors,
  UploadedFile
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

type PaymentMethod = 'cod' | 'vnpay' | 'stripe';

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

// Get environment variables from multiple possible sources
function getEnv(key: string): string | undefined {
  // Try global process.env first (Node.js)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  // Try globalThis.process.env
  if (typeof globalThis !== 'undefined') {
    const gThis = globalThis as any;
    if (gThis.process?.env?.[key]) {
      return gThis.process.env[key];
    }
  }
  return undefined;
}

// Validate and normalize service URLs
function normalizeServiceUrl(envUrl: string | undefined, defaultUrl: string): string {
  // Handle null, undefined, or whitespace-only strings
  const url = (envUrl || '').trim() || defaultUrl;
  
  // Validate that it's a valid URL (must start with http:// or https://)
  try {
    new URL(url);
    console.log(`Service URL initialized: ${url.split('://')[0]}://${url.split('://')[1]?.split(':')[0]}:${new URL(url).port || (url.includes('https') ? 443 : 80)}`);
    return url;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn(`Invalid service URL "${url}" (${errorMsg}), falling back to "${defaultUrl}"`);
    return defaultUrl;
  }
}

const authServiceUrl = normalizeServiceUrl(getEnv('AUTH_SERVICE_URL'), 'http://localhost:4010');
const catalogServiceUrl = normalizeServiceUrl(getEnv('CATALOG_SERVICE_URL'), 'http://localhost:4020');
const cartServiceUrl = normalizeServiceUrl(getEnv('CART_SERVICE_URL'), 'http://localhost:4030');
const orderServiceUrl = normalizeServiceUrl(getEnv('ORDER_SERVICE_URL'), 'http://localhost:4040');
const paymentServiceUrl = normalizeServiceUrl(getEnv('PAYMENT_SERVICE_URL'), 'http://localhost:4050');

// Helper function to safely construct service URLs
function buildServiceUrl(baseUrl: string, path: string): URL {
  try {
    // Validate baseUrl is a string and not empty/null
    if (!baseUrl || typeof baseUrl !== 'string') {
      throw new Error(`Invalid baseUrl type or value: ${typeof baseUrl} = "${baseUrl}"`);
    }
    
    // Validate baseUrl starts with protocol
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      throw new Error(`baseUrl must start with http:// or https://: "${baseUrl}"`);
    }
    
    return new URL(path, baseUrl);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`Failed to construct URL with base="${baseUrl}" and path="${path}": ${errorMsg}`);
    throw new Error(`Invalid service URL configuration. Base: "${baseUrl}", Path: "${path}", Error: ${errorMsg}`);
  }
}

function sanitizeCategoryFolder(raw?: string): string {
  const normalized = (raw || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  return normalized || 'khac';
}

@Controller()
export class GatewayController {
  private async resolveUserIdFromAuthorization(authorization?: string) {
    if (!authorization) {
      return 'guest';
    }

    try {
      const response = await fetch(buildServiceUrl(authServiceUrl, '/auth/me'), {
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
    const response = await fetch(buildServiceUrl(authServiceUrl, '/auth/register'), {
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
    const response = await fetch(buildServiceUrl(authServiceUrl, '/auth/verify-otp'), {
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
    const response = await fetch(buildServiceUrl(authServiceUrl, '/auth/request-otp'), {
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
    const url = buildServiceUrl(catalogServiceUrl, '/products');
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
    const response = await fetch(buildServiceUrl(catalogServiceUrl, `/products/${slug}`));
    return response.json();
  }

  @Post('admin/products/upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const categoryFolder = sanitizeCategoryFolder((req.body?.category as string) || '');
        const targetDir = join(process.cwd(), '..', 'public', 'images', 'products', categoryFolder);
        mkdirSync(targetDir, { recursive: true });
        cb(null, targetDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
      }
    })
  }))
  async uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const categoryFolder = sanitizeCategoryFolder((file as any)?.destination?.split(/[/\\]/).pop());
    return { url: `/images/products/${categoryFolder}/${file.filename}` };
  }

  @Post('admin/products')
  async createProduct(@Body() payload: Record<string, unknown>) {
    const response = await fetch(buildServiceUrl(catalogServiceUrl, '/products/admin/create'), {
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
    const response = await fetch(buildServiceUrl(catalogServiceUrl, `/products/admin/${id}`), {
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
    const response = await fetch(buildServiceUrl(catalogServiceUrl, `/products/admin/${id}`), {
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
    const response = await fetch(buildServiceUrl(authServiceUrl, '/auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const body = (await response.json()) as { message?: string } | unknown;

    if (!response.ok) {
      const message = typeof body === 'object' && body && 'message' in body ? body.message : undefined;

      if (response.status === 400) {
        throw new BadRequestException(message || 'Invalid credentials');
      }

      throw new UnauthorizedException(message || 'Invalid credentials');
    }

    return body;
  }

  @Post('auth/google')
  async googleLogin(@Body() payload: { idToken: string }) {
    const response = await fetch(buildServiceUrl(authServiceUrl, '/auth/google'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const body = (await response.json()) as unknown;
    if (!response.ok) {
      throw new UnauthorizedException(body as object);
    }

    return body;
  }

  @Post('auth/refresh')
  async refresh(@Body() payload: { refreshToken: string }) {
    const response = await fetch(buildServiceUrl(authServiceUrl, '/auth/refresh'), {
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
    const response = await fetch(buildServiceUrl(authServiceUrl, '/auth/me'), {
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
    const response = await fetch(buildServiceUrl(authServiceUrl, '/auth/logout'), {
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
    const response = await fetch(buildServiceUrl(authServiceUrl, '/auth/request-password-reset'), {
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
    const response = await fetch(buildServiceUrl(authServiceUrl, '/auth/reset-password'), {
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
    const response = await fetch(buildServiceUrl(cartServiceUrl, '/cart'), {
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
    const response = await fetch(buildServiceUrl(cartServiceUrl, '/cart'), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify(payload)
    });

    return response.json();
  }

  @Get('orders')
  async listOrders(@Headers('authorization') authorization?: string) {
    const userId = await this.resolveUserIdFromAuthorization(authorization);
    const response = await fetch(buildServiceUrl(orderServiceUrl, '/orders'), {
      headers: {
        'x-user-id': userId
      }
    });

    return response.json();
  }

  @Post('orders')
  async createOrder(
    @Body()
    payload: {
      shippingAddressId: string;
      paymentMethod: 'cod' | 'vnpay';
      note?: string;
      items?: Array<{ productId: string; quantity: number }>;
      total?: number;
    },
    @Headers('authorization') authorization?: string
  ) {
    const userId = await this.resolveUserIdFromAuthorization(authorization);
    const response = await fetch(buildServiceUrl(orderServiceUrl, '/orders'), {
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
    const response = await fetch(buildServiceUrl(orderServiceUrl, '/orders'));
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
      fetch(buildServiceUrl(orderServiceUrl, '/orders')),
      fetch(buildServiceUrl(authServiceUrl, '/auth/admin/users')),
      fetch(buildServiceUrl(catalogServiceUrl, '/products?page=1&pageSize=500'))
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
    const response = await fetch(buildServiceUrl(orderServiceUrl, `/orders/${id}`));
    return response.json();
  }

  @Patch('admin/orders/:id/status')
  async updateAdminOrderStatus(
    @Param('id') id: string,
    @Body() payload: { status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' }
  ) {
    const response = await fetch(buildServiceUrl(orderServiceUrl, `/orders/${id}/status`), {
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
    const response = await fetch(buildServiceUrl(authServiceUrl, '/auth/admin/users'));
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
    const response = await fetch(buildServiceUrl(authServiceUrl, `/auth/admin/users/${id}/role`), {
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
    const response = await fetch(buildServiceUrl(authServiceUrl, `/auth/admin/users/${id}/verified`), {
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

  @Post('orders/:id/cancel')
  async cancelOrder(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    const userId = await this.resolveUserIdFromAuthorization(authorization);
    const response = await fetch(buildServiceUrl(orderServiceUrl, `/orders/${id}/cancel`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      }
    });

    const body = await response.json();
    if (!response.ok) throw new BadRequestException(body);
    return body;
  }

  // ============= PAYMENTS =============

  @Post('payments/initiate')
  async initiatePayment(
    @Body()
    payload: {
      orderId: string;
      amount: number;
      method: 'cod' | 'vnpay' | 'stripe';
      returnUrl?: string;
    }
  ) {
    const response = await fetch(buildServiceUrl(paymentServiceUrl, '/payments/initiate'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new BadRequestException(`Payment service error: ${response.statusText}`);
    }

    return response.json();
  }

  @Get('payments/verify/:transactionId')
  async verifyPayment(@Param('transactionId') transactionId: string) {
    const response = await fetch(buildServiceUrl(paymentServiceUrl, `/payments/verify/${transactionId}`));
    
    if (!response.ok) {
      throw new BadRequestException(`Payment verification failed: ${response.statusText}`);
    }
    
    return response.json();
  }

  @Post('payments/callback')
  async paymentCallback(@Body() payload: Record<string, unknown>) {
    const response = await fetch(buildServiceUrl(paymentServiceUrl, '/payments/callback'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new BadRequestException(`Payment callback processing failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * VNPay Return Handler
   * GET /api/v1/payment/vnpay-return
   */
  @Get('payment/vnpay-return')
  async vnpayReturn(@Query() query: any) {
    console.log('VNPay Return:', query);
    const vnp_ResponseCode = query.vnp_ResponseCode;
    const transactionId = query.vnp_TxnRef;

    // In a real app, we would verify the hash here again in the gateway or payment service
    // For now, we update order status based on vnp_ResponseCode (00 is success)
    
    // Redirect user to frontend success/fail page
    const success = vnp_ResponseCode === '00';
    return `
      <html>
        <head><title>Payment Redirect</title></head>
        <body>
          <script>
            window.location.href = 'http://localhost:8080/checkout?status=${success ? 'success' : 'fail'}&transactionId=${transactionId}';
          </script>
        </body>
      </html>
    `;
  }

  // ============= ADDRESS BOOK =============

  @Get('auth/addresses')
  async listAddresses(@Headers('authorization') authorization?: string) {
    const userId = await this.resolveUserIdFromAuthorization(authorization);
    const response = await fetch(buildServiceUrl(authServiceUrl, '/auth/addresses'), {
      headers: { 'x-user-id': userId }
    });
    return response.json();
  }

  @Post('auth/addresses')
  async addAddress(@Body() data: any, @Headers('authorization') authorization?: string) {
    const userId = await this.resolveUserIdFromAuthorization(authorization);
    const response = await fetch(buildServiceUrl(authServiceUrl, '/auth/addresses'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  @Put('auth/addresses/:id')
  async updateAddress(@Param('id') id: string, @Body() data: any, @Headers('authorization') authorization?: string) {
    const userId = await this.resolveUserIdFromAuthorization(authorization);
    const response = await fetch(buildServiceUrl(authServiceUrl, `/auth/addresses/${id}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  @Delete('auth/addresses/:id')
  async deleteAddress(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    const userId = await this.resolveUserIdFromAuthorization(authorization);
    const response = await fetch(buildServiceUrl(authServiceUrl, `/auth/addresses/${id}`), {
      method: 'DELETE',
      headers: { 'x-user-id': userId }
    });
    return response.json();
  }

  // ============= STORES & REVIEWS =============

  @Get('stores')
  async listStores() {
    const response = await fetch(buildServiceUrl(catalogServiceUrl, '/products/stores/list'));
    return response.json();
  }

  @Get('products/:id/stock')
  async getProductStoreStock(@Param('id') id: string) {
    const response = await fetch(buildServiceUrl(catalogServiceUrl, `/products/${id}/stock`));
    return response.json();
  }

  @Post('products/:id/reviews')
  async addProductReview(
    @Param('id') id: string,
    @Body() data: any,
    @Headers('authorization') authorization?: string
  ) {
    const userId = await this.resolveUserIdFromAuthorization(authorization);
    const response = await fetch(buildServiceUrl(catalogServiceUrl, `/products/${id}/reviews`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }
}
