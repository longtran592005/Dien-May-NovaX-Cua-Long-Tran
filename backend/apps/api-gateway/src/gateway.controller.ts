import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Patch,
  Put,
  Query,
  Res,
  UnauthorizedException,
  UseInterceptors,
  UploadedFile
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

type PaymentMethod = 'cod' | 'vnpay' | 'stripe' | 'momo';
type UserRole = 'customer' | 'admin' | 'manager' | 'sales' | 'warehouse' | 'staff';

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
  pricingSnapshot?: {
    source?: string;
    flowVersion?: string;
    quote?: {
      voucherApplied?: {
        code?: string;
        amount?: number;
      } | null;
      voucherRejectedReason?: string | null;
    } | null;
    serverTotals?: {
      subtotal?: number;
      shippingFee?: number;
      discountAmount?: number;
      usedPoints?: number;
      total?: number;
    };
  } | null;
};

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
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
  stock?: number;
  minStockThreshold?: number;
  reorderTarget?: number;
};

type AnalyticsPeriodType = 'month' | 'quarter' | 'year';
type AnalyticsMetricMode = 'paid' | 'delivered';

type PeriodSeriesPoint = {
  period: string;
  orders: number;
  revenue: number;
};

type AdminAnalyticsByPeriod = {
  periodType: AnalyticsPeriodType;
  metricMode: AnalyticsMetricMode;
  timezone: 'Asia/Ho_Chi_Minh';
  rangeStart: string;
  rangeEnd: string;
  totalOrders: number;
  totalRevenue: number;
  series: PeriodSeriesPoint[];
  topProducts: AnalyticsTopProduct[];
};

type InventoryReportRow = {
  productId: string;
  productName: string;
  category: string;
  stock: number;
  threshold: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  soldQuantity: number;
};

type InventoryReportResult = PaginatedResult<InventoryReportRow> & {
  periodType: AnalyticsPeriodType;
  metricMode: AnalyticsMetricMode;
  timezone: 'Asia/Ho_Chi_Minh';
  rangeStart: string;
  rangeEnd: string;
  summary: {
    totalStock: number;
    outOfStockCount: number;
    lowStockCount: number;
    inStockCount: number;
  };
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

type VoucherAuditRow = {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  userId: string;
  paymentMethod: PaymentMethod;
  total: number;
  discountAmount: number;
  usedPoints: number;
  voucherCode: string;
  voucherDiscount: number;
  voucherRejectedReason: string;
  voucherOutcome: 'applied' | 'rejected' | 'none';
  pricingSource: string;
  flowVersion: string;
};

type VoucherAuditSortBy = 'newest' | 'oldest' | 'discount-high' | 'discount-low' | 'voucher-high' | 'voucher-low';

type VoucherAuditSummary = {
  totalAmount: number;
  totalDiscount: number;
  totalVoucherDiscount: number;
  appliedVoucherCount: number;
  rejectedVoucherCount: number;
  voucherOutcomeBreakdown: Array<{ outcome: 'applied' | 'rejected' | 'none'; count: number }>;
  statusBreakdown: Array<{ status: OrderStatus; count: number }>;
  pricingSourceBreakdown: Array<{ source: string; count: number }>;
};

type VoucherAuditListResult = PaginatedResult<VoucherAuditRow> & {
  summary: VoucherAuditSummary;
};

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

type IdempotencyRecord = {
  createdAt: number;
  payloadSignature: string;
  responseBody: unknown;
};

type RateLimitDecision = {
  limit: number;
  remaining: number;
  resetAt: number;
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
const shippingServiceUrl = normalizeServiceUrl(getEnv('SHIPPING_SERVICE_URL'), 'http://localhost:4060');
const searchServiceUrl = normalizeServiceUrl(getEnv('SEARCH_SERVICE_URL'), 'http://localhost:4070');

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

function csvEscape(value: unknown) {
  const text = String(value ?? '');
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

@Controller()
export class GatewayController {
  private readonly idempotencyTtlMs = 5 * 60 * 1000;
  private readonly idempotencyMaxEntries = 5000;
  private readonly rateLimitStore = new Map<string, RateLimitRecord>();
  private readonly idempotencyStore = new Map<string, IdempotencyRecord>();

  private purgeExpiredRateLimitEntries() {
    const now = Date.now();
    for (const [key, entry] of this.rateLimitStore.entries()) {
      if (entry.resetAt <= now) {
        this.rateLimitStore.delete(key);
      }
    }
  }

  private enforceRateLimit(key: string, maxRequests: number, windowMs: number) {
    this.purgeExpiredRateLimitEntries();
    const now = Date.now();
    const existing = this.rateLimitStore.get(key);

    if (!existing || existing.resetAt <= now) {
      this.rateLimitStore.set(key, {
        count: 1,
        resetAt: now + windowMs
      });
      return {
        limit: maxRequests,
        remaining: Math.max(0, maxRequests - 1),
        resetAt: now + windowMs
      } as RateLimitDecision;
    }

    if (existing.count >= maxRequests) {
      throw new HttpException('Too many requests, please try again later', HttpStatus.TOO_MANY_REQUESTS);
    }

    existing.count += 1;
    this.rateLimitStore.set(key, existing);
    return {
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - existing.count),
      resetAt: existing.resetAt
    } as RateLimitDecision;
  }

  private attachRateLimitHeaders(response: Response, decision: RateLimitDecision) {
    response.setHeader('x-ratelimit-limit', String(decision.limit));
    response.setHeader('x-ratelimit-remaining', String(decision.remaining));
    response.setHeader('x-ratelimit-reset-at', new Date(decision.resetAt).toISOString());
  }

  private buildIdempotencyStorageKey(endpoint: string, scope: string, idempotencyKey: string) {
    return `${endpoint}|${scope}|${idempotencyKey.trim()}`;
  }

  private purgeExpiredIdempotencyEntries() {
    const now = Date.now();
    for (const [key, entry] of this.idempotencyStore.entries()) {
      if (now - entry.createdAt > this.idempotencyTtlMs) {
        this.idempotencyStore.delete(key);
      }
    }
  }

  private trimIdempotencyStoreIfNeeded() {
    if (this.idempotencyStore.size <= this.idempotencyMaxEntries) {
      return;
    }

    const entries = Array.from(this.idempotencyStore.entries())
      .sort((left, right) => left[1].createdAt - right[1].createdAt);
    const toDelete = this.idempotencyStore.size - this.idempotencyMaxEntries;
    for (let index = 0; index < toDelete; index += 1) {
      this.idempotencyStore.delete(entries[index][0]);
    }
  }

  private getIdempotentResponse(endpoint: string, scope: string, idempotencyKey: string | undefined, payload: unknown) {
    this.purgeExpiredIdempotencyEntries();

    if (!idempotencyKey || !idempotencyKey.trim()) {
      return null;
    }

    const storageKey = this.buildIdempotencyStorageKey(endpoint, scope, idempotencyKey);
    const cached = this.idempotencyStore.get(storageKey);
    if (!cached) {
      return null;
    }

    // 5-minute replay window keeps retries safe while avoiding stale cache growth.
    if (Date.now() - cached.createdAt > this.idempotencyTtlMs) {
      this.idempotencyStore.delete(storageKey);
      return null;
    }

    const payloadSignature = JSON.stringify(payload);
    if (cached.payloadSignature !== payloadSignature) {
      throw new BadRequestException('Idempotency-Key already used with a different payload');
    }

    return cached.responseBody;
  }

  private saveIdempotentResponse(endpoint: string, scope: string, idempotencyKey: string | undefined, payload: unknown, responseBody: unknown) {
    this.purgeExpiredIdempotencyEntries();

    if (!idempotencyKey || !idempotencyKey.trim()) {
      return;
    }

    const storageKey = this.buildIdempotencyStorageKey(endpoint, scope, idempotencyKey);
    this.idempotencyStore.set(storageKey, {
      createdAt: Date.now(),
      payloadSignature: JSON.stringify(payload),
      responseBody
    });
    this.trimIdempotencyStoreIfNeeded();
  }

  private async checkDependency(name: string, serviceUrl: string) {
    const startedAt = Date.now();
    try {
      const response = await fetch(buildServiceUrl(serviceUrl, '/health'));
      return {
        name,
        ok: response.ok,
        statusCode: response.status,
        latencyMs: Date.now() - startedAt
      };
    } catch (error) {
      return {
        name,
        ok: false,
        statusCode: 0,
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  @Get('health/dependencies')
  async dependenciesHealth() {
    const services = await Promise.all([
      this.checkDependency('auth-service', authServiceUrl),
      this.checkDependency('catalog-service', catalogServiceUrl),
      this.checkDependency('cart-service', cartServiceUrl),
      this.checkDependency('order-service', orderServiceUrl),
      this.checkDependency('payment-service', paymentServiceUrl),
      this.checkDependency('shipping-service', shippingServiceUrl),
      this.checkDependency('search-service', searchServiceUrl)
    ]);

    return {
      status: services.some((service) => !service.ok) ? 'degraded' : 'healthy',
      timestamp: new Date().toISOString(),
      services
    };
  }

  @Get('admin/runtime/limits')
  async runtimeLimits(@Headers('authorization') authorization?: string) {
    await this.requireAdmin(authorization);
    this.purgeExpiredRateLimitEntries();
    this.purgeExpiredIdempotencyEntries();

    const now = Date.now();
    const earliestRateLimitResetAt = this.rateLimitStore.size
      ? Math.min(...Array.from(this.rateLimitStore.values()).map((item) => item.resetAt))
      : null;
    const earliestIdempotencyCreatedAt = this.idempotencyStore.size
      ? Math.min(...Array.from(this.idempotencyStore.values()).map((item) => item.createdAt))
      : null;

    return {
      timestamp: new Date(now).toISOString(),
      rateLimit: {
        keys: this.rateLimitStore.size,
        earliestResetAt: earliestRateLimitResetAt ? new Date(earliestRateLimitResetAt).toISOString() : null,
        windowSec: 60
      },
      idempotency: {
        keys: this.idempotencyStore.size,
        ttlMs: this.idempotencyTtlMs,
        maxEntries: this.idempotencyMaxEntries,
        oldestAgeMs: earliestIdempotencyCreatedAt ? now - earliestIdempotencyCreatedAt : 0
      }
    };
  }

  private normalizeDateQuery(value: string | undefined, endOfDay = false): Date | null {
    const raw = (value || '').trim();
    if (!raw) {
      return null;
    }

    const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/;
    const normalizedInput = isoDateOnly.test(raw)
      ? `${raw}${endOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z'}`
      : raw;
    const parsed = new Date(normalizedInput);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`Invalid date query: ${value}`);
    }
    return parsed;
  }

  private buildVoucherAuditRows(orders: AdminOrder[]): VoucherAuditRow[] {
    return orders.map((order) => {
      const quote = order.pricingSnapshot?.quote;
      const voucher = quote?.voucherApplied;
      const voucherCode = voucher?.code || '';
      const voucherRejectedReason = quote?.voucherRejectedReason || '';
      const voucherOutcome: 'applied' | 'rejected' | 'none' = voucherCode.trim()
        ? 'applied'
        : voucherRejectedReason.trim()
          ? 'rejected'
          : 'none';
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt,
        userId: order.userId,
        paymentMethod: order.paymentMethod,
        total: order.total,
        discountAmount: Number(order.pricingSnapshot?.serverTotals?.discountAmount ?? order.pricingSnapshot?.quote?.voucherApplied?.amount ?? 0),
        usedPoints: Number(order.pricingSnapshot?.serverTotals?.usedPoints ?? 0),
        voucherCode,
        voucherDiscount: Number(voucher?.amount ?? 0),
        voucherRejectedReason,
        voucherOutcome,
        pricingSource: order.pricingSnapshot?.source || '',
        flowVersion: order.pricingSnapshot?.flowVersion || ''
      };
    });
  }

  private applyVoucherAuditFilters(
    rows: VoucherAuditRow[],
    params: {
      voucherCode?: string;
      status?: string;
      pricingSource?: string;
      hasVoucher?: string;
      voucherOutcome?: string;
      minDiscount?: string;
      startDate?: string;
      endDate?: string;
      sortBy?: string;
    }
  ) {
    const normalizedVoucher = (params.voucherCode || '').trim().toLowerCase();
    const normalizedPricingSource = (params.pricingSource || '').trim().toLowerCase();
    const normalizedHasVoucher = (params.hasVoucher || '').trim().toLowerCase();
    const normalizedVoucherOutcome = (params.voucherOutcome || '').trim().toLowerCase();
    const parsedMinDiscount = Number(params.minDiscount);
    const minDiscount = Number.isFinite(parsedMinDiscount) ? Math.max(0, parsedMinDiscount) : 0;
    const startDate = this.normalizeDateQuery(params.startDate, false);
    const endDate = this.normalizeDateQuery(params.endDate, true);

    if (startDate && endDate && startDate.getTime() > endDate.getTime()) {
      throw new BadRequestException('startDate must be before or equal to endDate');
    }

    const filteredRows = rows
      .filter((row) => !params.status || params.status === 'all' || row.status === params.status)
      .filter((row) => {
        if (normalizedVoucher && !row.voucherCode.toLowerCase().includes(normalizedVoucher)) {
          return false;
        }
        if (normalizedPricingSource && !row.pricingSource.toLowerCase().includes(normalizedPricingSource)) {
          return false;
        }
        if (normalizedHasVoucher === 'with-voucher' && !row.voucherCode.trim()) {
          return false;
        }
        if (normalizedHasVoucher === 'without-voucher' && row.voucherCode.trim()) {
          return false;
        }
        if (normalizedVoucherOutcome === 'applied' && row.voucherOutcome !== 'applied') {
          return false;
        }
        if (normalizedVoucherOutcome === 'rejected' && row.voucherOutcome !== 'rejected') {
          return false;
        }
        if (normalizedVoucherOutcome === 'none' && row.voucherOutcome !== 'none') {
          return false;
        }
        if (minDiscount > 0 && row.discountAmount < minDiscount) {
          return false;
        }

        const createdAtTs = new Date(row.createdAt).getTime();
        if (startDate && createdAtTs < startDate.getTime()) {
          return false;
        }
        if (endDate && createdAtTs > endDate.getTime()) {
          return false;
        }
        return true;
      });

    const compareNewest = (left: VoucherAuditRow, right: VoucherAuditRow) => {
      const createdDiff = new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      if (createdDiff !== 0) {
        return createdDiff;
      }
      return right.orderNumber.localeCompare(left.orderNumber);
    };

    const compareOldest = (left: VoucherAuditRow, right: VoucherAuditRow) => {
      const createdDiff = new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      if (createdDiff !== 0) {
        return createdDiff;
      }
      return left.orderNumber.localeCompare(right.orderNumber);
    };

    const sortBy = (params.sortBy || 'newest') as VoucherAuditSortBy;
    if (sortBy === 'oldest') {
      filteredRows.sort(compareOldest);
    } else if (sortBy === 'discount-high') {
      filteredRows.sort((left, right) => {
        const valueDiff = right.discountAmount - left.discountAmount;
        if (valueDiff !== 0) {
          return valueDiff;
        }
        return compareNewest(left, right);
      });
    } else if (sortBy === 'discount-low') {
      filteredRows.sort((left, right) => {
        const valueDiff = left.discountAmount - right.discountAmount;
        if (valueDiff !== 0) {
          return valueDiff;
        }
        return compareNewest(left, right);
      });
    } else if (sortBy === 'voucher-high') {
      filteredRows.sort((left, right) => {
        const valueDiff = right.voucherDiscount - left.voucherDiscount;
        if (valueDiff !== 0) {
          return valueDiff;
        }
        return compareNewest(left, right);
      });
    } else if (sortBy === 'voucher-low') {
      filteredRows.sort((left, right) => {
        const valueDiff = left.voucherDiscount - right.voucherDiscount;
        if (valueDiff !== 0) {
          return valueDiff;
        }
        return compareNewest(left, right);
      });
    } else {
      filteredRows.sort(compareNewest);
    }

    return filteredRows;
  }

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

  private async resolveAuthUser(authorization?: string): Promise<{ id: string; role: string }> {
    if (!authorization) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const response = await fetch(buildServiceUrl(authServiceUrl, '/auth/me'), {
      headers: {
        Authorization: authorization
      }
    });

    if (!response.ok) {
      throw new UnauthorizedException('Unauthorized');
    }

    const profile = (await response.json()) as { id?: string; role?: string };
    const userId = profile.id?.trim();
    const role = profile.role?.trim().toLowerCase() || 'customer';

    if (!userId) {
      throw new UnauthorizedException('Invalid user profile');
    }

    return { id: userId, role };
  }

  private async requireRole(
    authorization: string | undefined,
    allowedRoles: UserRole[],
    errorMessage: string
  ): Promise<{ id: string; role: string }> {
    const authUser = await this.resolveAuthUser(authorization);
    if (!allowedRoles.includes(authUser.role as UserRole)) {
      throw new ForbiddenException(errorMessage);
    }
    return authUser;
  }

  private async requireAdmin(authorization?: string): Promise<{ id: string; role: string }> {
    return this.requireRole(authorization, ['admin'], 'Admin permission required');
  }

  private async requireAdminOrStaff(authorization?: string): Promise<{ id: string; role: string }> {
    return this.requireRole(authorization, ['admin', 'manager', 'sales', 'warehouse', 'staff'], 'Admin or staff permission required');
  }

  private async requireAdminForMutation(
    authorization: string | undefined,
    mutationKey: string,
    allowedRoles: UserRole[] = ['admin']
  ): Promise<{ id: string; role: string }> {
    const actor = await this.requireRole(authorization, allowedRoles, 'Admin permission required');
    this.enforceRateLimit(`admin:mutate:${actor.id}:${mutationKey}`, 30, 60_000);
    return actor;
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

  @Get('promotions/active')
  async listActivePromotions() {
    const response = await fetch(buildServiceUrl(catalogServiceUrl, '/promotions/active'));
    return response.json();
  }

  @Get('promotions/validate')
  async validatePromotion(
    @Query('code') code: string,
    @Query('subtotal') subtotal: string,
    @Query('customerTier') customerTier?: string
  ) {
    const url = buildServiceUrl(catalogServiceUrl, '/promotions/validate');
    if (code) url.searchParams.set('code', code);
    if (subtotal) url.searchParams.set('subtotal', subtotal);
    if (customerTier) url.searchParams.set('customerTier', customerTier);

    const response = await fetch(url.toString());
    return response.json();
  }

  @Post('pricing/quote')
  async quotePricing(
    @Body() payload: { items: Array<{ productId: string; quantity: number }>; couponCode?: string; customerTier?: string }
  ) {
    const response = await fetch(buildServiceUrl(catalogServiceUrl, '/pricing/quote'), {
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

  @Post('admin/promotions')
  async createPromotion(@Body() payload: Record<string, unknown>, @Headers('authorization') authorization?: string) {
    await this.requireAdminForMutation(authorization, 'promotions:create');
    const response = await fetch(buildServiceUrl(catalogServiceUrl, '/promotions/admin/create'), {
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

  @Patch('admin/promotions/:id/status')
  async updatePromotionStatus(
    @Param('id') id: string,
    @Body() payload: { status: 'draft' | 'active' | 'paused' | 'expired' },
    @Headers('authorization') authorization?: string
  ) {
    await this.requireAdminForMutation(authorization, 'promotions:update-status');
    const response = await fetch(buildServiceUrl(catalogServiceUrl, `/promotions/admin/${id}/status`), {
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
  async uploadProductImage(@UploadedFile() file: Express.Multer.File, @Headers('authorization') authorization?: string) {
    await this.requireAdminForMutation(authorization, 'products:upload-image', ['admin', 'manager', 'warehouse']);
    if (!file) throw new BadRequestException('No file uploaded');
    const categoryFolder = sanitizeCategoryFolder((file as any)?.destination?.split(/[/\\]/).pop());
    return { url: `/images/products/${categoryFolder}/${file.filename}` };
  }

  @Post('admin/products')
  async createProduct(@Body() payload: Record<string, unknown>, @Headers('authorization') authorization?: string) {
    await this.requireAdminForMutation(authorization, 'products:create', ['admin', 'manager', 'warehouse']);
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
  async updateProduct(
    @Param('id') id: string,
    @Body() payload: Record<string, unknown>,
    @Headers('authorization') authorization?: string
  ) {
    await this.requireAdminForMutation(authorization, 'products:update', ['admin', 'manager', 'warehouse']);
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
  async deactivateProduct(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    await this.requireAdminForMutation(authorization, 'products:deactivate', ['admin', 'manager', 'warehouse']);
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
  async login(
    @Body() payload: { email: string; password: string },
    @Headers('x-forwarded-for') forwardedFor?: string,
    @Res({ passthrough: true }) res?: Response
  ) {
    const clientIp = (forwardedFor || '').split(',')[0].trim() || 'local';
    const normalizedEmail = (payload.email || '').trim().toLowerCase();
    const decision = this.enforceRateLimit(`auth:login:${clientIp}:${normalizedEmail}`, 10, 60_000);
    if (res) {
      this.attachRateLimitHeaders(res, decision);
    }

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
      paymentMethod: 'cod' | 'vnpay' | 'stripe' | 'momo';
      note?: string;
      items?: Array<{ productId: string; quantity: number }>;
      couponCode?: string;
      customerTier?: string;
      subtotal?: number;
      shippingFee?: number;
      discountAmount?: number;
      usedPoints?: number;
      total?: number;
    },
    @Headers('authorization') authorization?: string,
    @Headers('idempotency-key') idempotencyKey?: string
  ) {
    const userId = await this.resolveUserIdFromAuthorization(authorization);

    const cached = this.getIdempotentResponse('orders:create', userId, idempotencyKey, payload);
    if (cached !== null) {
      return cached;
    }

    const response = await fetch(buildServiceUrl(orderServiceUrl, '/orders'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify(payload)
    });

    const body = (await response.json()) as unknown;
    if (!response.ok) {
      throw new BadRequestException(body as object);
    }

    this.saveIdempotentResponse('orders:create', userId, idempotencyKey, payload, body);

    return body;
  }

  @Get('admin/orders')
  async listAdminOrders(
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: string,
    @Query('page') pageQuery?: string,
    @Query('pageSize') pageSizeQuery?: string,
    @Headers('authorization') authorization?: string
  ): Promise<PaginatedResult<AdminOrder>> {
    await this.requireAdminOrStaff(authorization);
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

  @Get('admin/orders/audit')
  async listOrderVoucherAudit(
    @Query('voucherCode') voucherCode?: string,
    @Query('status') status?: string,
    @Query('pricingSource') pricingSource?: string,
    @Query('hasVoucher') hasVoucher?: string,
    @Query('voucherOutcome') voucherOutcome?: string,
    @Query('minDiscount') minDiscount?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sortBy') sortBy?: string,
    @Query('page') pageQuery?: string,
    @Query('pageSize') pageSizeQuery?: string,
    @Headers('authorization') authorization?: string
  ): Promise<VoucherAuditListResult> {
    await this.requireAdminForMutation(authorization, 'orders:audit:list', ['admin', 'manager']);
    const response = await fetch(buildServiceUrl(orderServiceUrl, '/orders'));
    const orders = (await response.json()) as AdminOrder[];

    const page = Math.max(1, Number(pageQuery) || 1);
    const pageSize = Math.min(200, Math.max(1, Number(pageSizeQuery) || 20));

    const rows = this.applyVoucherAuditFilters(this.buildVoucherAuditRows(orders), {
      voucherCode,
      status,
      pricingSource,
      hasVoucher,
      voucherOutcome,
      minDiscount,
      startDate,
      endDate,
      sortBy
    });

    const total = rows.length;
    const start = (page - 1) * pageSize;
    const items = rows.slice(start, start + pageSize);
    const summary = rows.reduce<VoucherAuditSummary>(
      (acc, row) => {
        acc.totalAmount += row.total;
        acc.totalDiscount += row.discountAmount;
        acc.totalVoucherDiscount += row.voucherDiscount;
        if (row.voucherOutcome === 'applied') {
          acc.appliedVoucherCount += 1;
        }
        if (row.voucherOutcome === 'rejected') {
          acc.rejectedVoucherCount += 1;
        }
        const outcomeBucket = acc.voucherOutcomeBreakdown.find((entry) => entry.outcome === row.voucherOutcome);
        if (outcomeBucket) {
          outcomeBucket.count += 1;
        }
        const statusBucket = acc.statusBreakdown.find((entry) => entry.status === row.status);
        if (statusBucket) {
          statusBucket.count += 1;
        }
        const sourceKey = row.pricingSource || 'unknown';
        const sourceBucket = acc.pricingSourceBreakdown.find((entry) => entry.source === sourceKey);
        if (sourceBucket) {
          sourceBucket.count += 1;
        } else {
          acc.pricingSourceBreakdown.push({ source: sourceKey, count: 1 });
        }
        return acc;
      },
      {
        totalAmount: 0,
        totalDiscount: 0,
        totalVoucherDiscount: 0,
        appliedVoucherCount: 0,
        rejectedVoucherCount: 0,
        voucherOutcomeBreakdown: [
          { outcome: 'applied', count: 0 },
          { outcome: 'rejected', count: 0 },
          { outcome: 'none', count: 0 }
        ],
        statusBreakdown: [
          { status: 'pending', count: 0 },
          { status: 'confirmed', count: 0 },
          { status: 'processing', count: 0 },
          { status: 'shipped', count: 0 },
          { status: 'delivered', count: 0 },
          { status: 'cancelled', count: 0 }
        ],
        pricingSourceBreakdown: []
      }
    );

    summary.pricingSourceBreakdown.sort((left, right) => {
      const countDiff = right.count - left.count;
      if (countDiff !== 0) {
        return countDiff;
      }
      return left.source.localeCompare(right.source);
    });

    return {
      items,
      page,
      pageSize,
      total,
      summary
    };
  }

  @Get('admin/orders/audit/export')
  async exportOrderVoucherAuditCsv(
    @Query('voucherCode') voucherCode?: string,
    @Query('status') status?: string,
    @Query('pricingSource') pricingSource?: string,
    @Query('hasVoucher') hasVoucher?: string,
    @Query('voucherOutcome') voucherOutcome?: string,
    @Query('minDiscount') minDiscount?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sortBy') sortBy?: string,
    @Headers('authorization') authorization?: string
  ) {
    await this.requireAdminForMutation(authorization, 'orders:audit:export', ['admin', 'manager']);
    const response = await fetch(buildServiceUrl(orderServiceUrl, '/orders'));
    const orders = (await response.json()) as AdminOrder[];

    const rows = this.applyVoucherAuditFilters(this.buildVoucherAuditRows(orders), {
      voucherCode,
      status,
      pricingSource,
      hasVoucher,
      voucherOutcome,
      minDiscount,
      startDate,
      endDate,
      sortBy
    });

    const headers = [
      'orderId',
      'orderNumber',
      'status',
      'createdAt',
      'userId',
      'paymentMethod',
      'total',
      'discountAmount',
      'usedPoints',
      'voucherCode',
      'voucherDiscount',
      'voucherRejectedReason',
      'voucherOutcome',
      'pricingSource',
      'flowVersion'
    ];

    const lines = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((header) => csvEscape((row as unknown as Record<string, unknown>)[header]))
          .join(',')
      )
    ];

    const csv = lines.join('\n');
    return {
      fileName: `order-voucher-audit-${new Date().toISOString().slice(0, 10)}.csv`,
      totalRows: rows.length,
      csv
    };
  }

  @Get('admin/analytics')
  async getAdminAnalytics(@Query('rangeDays') rangeDaysQuery?: string, @Headers('authorization') authorization?: string) {
    await this.requireAdminForMutation(authorization, 'analytics:overview', ['admin', 'manager']);
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

  @Get('admin/analytics/by-period')
  async getAdminAnalyticsByPeriod(
    @Query('periodType') periodTypeQuery?: string,
    @Query('metricMode') metricModeQuery?: string,
    @Query('startDate') startDateQuery?: string,
    @Query('endDate') endDateQuery?: string,
    @Headers('authorization') authorization?: string
  ): Promise<AdminAnalyticsByPeriod> {
    await this.requireAdminForMutation(authorization, 'analytics:by-period', ['admin', 'manager']);

    const periodType: AnalyticsPeriodType =
      periodTypeQuery === 'quarter' || periodTypeQuery === 'year' ? periodTypeQuery : 'month';
    const metricMode: AnalyticsMetricMode = metricModeQuery === 'delivered' ? 'delivered' : 'paid';

    const endDate = endDateQuery ? new Date(endDateQuery) : new Date();
    const startDate = startDateQuery ? new Date(startDateQuery) : new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);

    if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime()) || startDate > endDate) {
      throw new BadRequestException('Invalid date range');
    }

    const [ordersResponse, productsResponse] = await Promise.all([
      fetch(buildServiceUrl(orderServiceUrl, '/orders')),
      fetch(buildServiceUrl(catalogServiceUrl, '/products?page=1&pageSize=1000'))
    ]);

    if (!ordersResponse.ok || !productsResponse.ok) {
      throw new BadRequestException('Failed to load analytics data');
    }

    const [orders, products] = (await Promise.all([ordersResponse.json(), productsResponse.json()])) as [
      AdminOrder[],
      { items?: CatalogProduct[] }
    ];

    const uniqueOrderIds = [...new Set(orders.map((order) => order.id))];
    const paymentsResponse = uniqueOrderIds.length
      ? await fetch(buildServiceUrl(paymentServiceUrl, `/payments/by-order?orderIds=${encodeURIComponent(uniqueOrderIds.join(','))}`))
      : null;

    if (paymentsResponse && !paymentsResponse.ok) {
      throw new BadRequestException('Failed to load payment status data');
    }

    const paymentRecords = paymentsResponse
      ? (await paymentsResponse.json()) as Array<{ orderId: string; status: string }>
      : [];
    const paidOrderIds = new Set(
      paymentRecords.filter((payment) => payment.status === 'completed').map((payment) => payment.orderId)
    );

    const tzOffsetMs = 7 * 60 * 60 * 1000;
    const toTzDate = (isoDate: string) => new Date(new Date(isoDate).getTime() + tzOffsetMs);
    const toPeriodKey = (isoDate: string) => {
      const local = toTzDate(isoDate);
      const year = local.getUTCFullYear();
      const month = local.getUTCMonth() + 1;

      if (periodType === 'year') {
        return `${year}`;
      }

      if (periodType === 'quarter') {
        const quarter = Math.floor((month - 1) / 3) + 1;
        return `${year}-Q${quarter}`;
      }

      return `${year}-${String(month).padStart(2, '0')}`;
    };

    const isCountedByMode = (order: AdminOrder) => {
      if (metricMode === 'delivered') {
        return order.status === 'delivered';
      }

      return paidOrderIds.has(order.id);
    };

    const rangedOrders = orders.filter((order) => {
      const created = new Date(order.createdAt);
      return created >= startDate && created <= endDate && isCountedByMode(order);
    });

    const periodMap = new Map<string, { orders: number; revenue: number }>();
    const productStats = new Map<string, { quantity: number; revenue: number }>();
    const productMap = new Map((products.items || []).map((product) => [product.id, product]));

    for (const order of rangedOrders) {
      const periodKey = toPeriodKey(order.createdAt);
      const current = periodMap.get(periodKey) || { orders: 0, revenue: 0 };
      periodMap.set(periodKey, {
        orders: current.orders + 1,
        revenue: current.revenue + (Number(order.total) || 0)
      });

      for (const item of order.items || []) {
        const product = productMap.get(item.productId);
        const unitPrice = Number(product?.price || 0);
        const currentProduct = productStats.get(item.productId) || { quantity: 0, revenue: 0 };
        productStats.set(item.productId, {
          quantity: currentProduct.quantity + Number(item.quantity || 0),
          revenue: currentProduct.revenue + unitPrice * Number(item.quantity || 0)
        });
      }
    }

    const series = Array.from(periodMap.entries())
      .map(([period, value]) => ({
        period,
        orders: value.orders,
        revenue: value.revenue
      }))
      .sort((left, right) => left.period.localeCompare(right.period));

    const topProducts = Array.from(productStats.entries())
      .map(([productId, value]) => ({
        productId,
        name: productMap.get(productId)?.name || productId,
        quantity: value.quantity,
        revenue: value.revenue
      }))
      .sort((left, right) => right.quantity - left.quantity)
      .slice(0, 10);

    return {
      periodType,
      metricMode,
      timezone: 'Asia/Ho_Chi_Minh',
      rangeStart: startDate.toISOString(),
      rangeEnd: endDate.toISOString(),
      totalOrders: rangedOrders.length,
      totalRevenue: rangedOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0),
      series,
      topProducts
    };
  }

  @Get('admin/inventory/report')
  async getAdminInventoryReport(
    @Query('periodType') periodTypeQuery?: string,
    @Query('metricMode') metricModeQuery?: string,
    @Query('startDate') startDateQuery?: string,
    @Query('endDate') endDateQuery?: string,
    @Query('status') statusQuery?: string,
    @Query('page') pageQuery?: string,
    @Query('pageSize') pageSizeQuery?: string,
    @Headers('authorization') authorization?: string
  ): Promise<InventoryReportResult> {
    await this.requireAdminForMutation(authorization, 'inventory:report', ['admin', 'manager', 'warehouse']);

    const periodType: AnalyticsPeriodType =
      periodTypeQuery === 'quarter' || periodTypeQuery === 'year' ? periodTypeQuery : 'month';
    const metricMode: AnalyticsMetricMode = metricModeQuery === 'delivered' ? 'delivered' : 'paid';
    const page = Math.max(1, Number(pageQuery) || 1);
    const pageSize = Math.min(200, Math.max(1, Number(pageSizeQuery) || 20));

    const endDate = endDateQuery ? new Date(endDateQuery) : new Date();
    const startDate = startDateQuery ? new Date(startDateQuery) : new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);

    if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime()) || startDate > endDate) {
      throw new BadRequestException('Invalid date range');
    }

    const [ordersResponse, productsResponse] = await Promise.all([
      fetch(buildServiceUrl(orderServiceUrl, '/orders')),
      fetch(buildServiceUrl(catalogServiceUrl, '/products?page=1&pageSize=2000'))
    ]);

    if (!ordersResponse.ok || !productsResponse.ok) {
      throw new BadRequestException('Failed to load inventory report data');
    }

    const [orders, products] = (await Promise.all([ordersResponse.json(), productsResponse.json()])) as [
      AdminOrder[],
      { items?: CatalogProduct[] }
    ];

    const uniqueOrderIds = [...new Set(orders.map((order) => order.id))];
    const paymentsResponse = uniqueOrderIds.length
      ? await fetch(buildServiceUrl(paymentServiceUrl, `/payments/by-order?orderIds=${encodeURIComponent(uniqueOrderIds.join(','))}`))
      : null;

    if (paymentsResponse && !paymentsResponse.ok) {
      throw new BadRequestException('Failed to load payment status data');
    }

    const paymentRecords = paymentsResponse
      ? (await paymentsResponse.json()) as Array<{ orderId: string; status: string }>
      : [];
    const paidOrderIds = new Set(
      paymentRecords.filter((payment) => payment.status === 'completed').map((payment) => payment.orderId)
    );

    const isCountedByMode = (order: AdminOrder) => {
      if (metricMode === 'delivered') {
        return order.status === 'delivered';
      }

      return paidOrderIds.has(order.id);
    };

    const soldQtyByProduct = new Map<string, number>();
    for (const order of orders) {
      const created = new Date(order.createdAt);
      if (created < startDate || created > endDate || !isCountedByMode(order)) {
        continue;
      }

      for (const item of order.items || []) {
        soldQtyByProduct.set(item.productId, (soldQtyByProduct.get(item.productId) || 0) + Number(item.quantity || 0));
      }
    }

    const rows = (products.items || []).map((product) => {
      const stock = Math.max(0, Number(product.stock || 0));
      const threshold = Math.max(0, Number(product.minStockThreshold || 5));
      const status: InventoryReportRow['status'] = stock <= 0 ? 'out-of-stock' : stock <= threshold ? 'low-stock' : 'in-stock';

      return {
        productId: product.id,
        productName: product.name,
        category: product.category,
        stock,
        threshold,
        status,
        soldQuantity: soldQtyByProduct.get(product.id) || 0
      };
    });

    const filteredRows = statusQuery && ['in-stock', 'low-stock', 'out-of-stock'].includes(statusQuery)
      ? rows.filter((row) => row.status === statusQuery)
      : rows;

    filteredRows.sort((left, right) => {
      if (left.stock !== right.stock) {
        return left.stock - right.stock;
      }
      return right.soldQuantity - left.soldQuantity;
    });

    const total = filteredRows.length;
    const start = (page - 1) * pageSize;
    const items = filteredRows.slice(start, start + pageSize);

    const summary = {
      totalStock: rows.reduce((sum, row) => sum + row.stock, 0),
      outOfStockCount: rows.filter((row) => row.status === 'out-of-stock').length,
      lowStockCount: rows.filter((row) => row.status === 'low-stock').length,
      inStockCount: rows.filter((row) => row.status === 'in-stock').length
    };

    return {
      periodType,
      metricMode,
      timezone: 'Asia/Ho_Chi_Minh',
      rangeStart: startDate.toISOString(),
      rangeEnd: endDate.toISOString(),
      items,
      page,
      pageSize,
      total,
      summary
    };
  }

  @Get('admin/orders/:id')
  async getAdminOrder(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    await this.requireAdminOrStaff(authorization);
    const response = await fetch(buildServiceUrl(orderServiceUrl, `/orders/${id}`));
    return response.json();
  }

  @Patch('admin/orders/:id/status')
  async updateAdminOrderStatus(
    @Param('id') id: string,
    @Body() payload: { status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' },
    @Headers('authorization') authorization?: string
  ) {
    await this.requireAdminForMutation(authorization, 'orders:update-status', ['admin', 'manager', 'sales', 'warehouse', 'staff']);
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
    @Query('pageSize') pageSizeQuery?: string,
    @Headers('authorization') authorization?: string
  ): Promise<PaginatedResult<AdminUser>> {
    await this.requireAdminForMutation(authorization, 'users:list', ['admin', 'manager', 'sales']);
    const response = await fetch(buildServiceUrl(authServiceUrl, '/auth/admin/users'));
    const users = (await response.json()) as AdminUser[];

    const page = Math.max(1, Number(pageQuery) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(pageSizeQuery) || 10));
    const normalizedQuery = (q || '').trim().toLowerCase();

    let filtered = users.filter((user) => user.role !== 'staff');

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

  @Get('admin/staff')
  async listAdminStaff(
    @Query('q') q?: string,
    @Query('verified') verifiedQuery?: string,
    @Query('sortBy') sortBy?: string,
    @Query('page') pageQuery?: string,
    @Query('pageSize') pageSizeQuery?: string,
    @Headers('authorization') authorization?: string
  ): Promise<PaginatedResult<AdminUser>> {
    await this.requireAdmin(authorization);
    const response = await fetch(buildServiceUrl(authServiceUrl, '/auth/admin/staff'));
    const users = (await response.json()) as AdminUser[];

    const page = Math.max(1, Number(pageQuery) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(pageSizeQuery) || 10));
    const normalizedQuery = (q || '').trim().toLowerCase();

    let filtered = [...users];

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

  @Post('admin/staff')
  async createAdminStaff(
    @Body() payload: { email: string; fullName: string; tempPassword: string; role?: 'admin' | 'manager' | 'sales' | 'warehouse' | 'staff' },
    @Headers('authorization') authorization?: string
  ) {
    await this.requireAdminForMutation(authorization, 'staff:create', ['admin']);
    const response = await fetch(buildServiceUrl(authServiceUrl, '/auth/admin/staff'), {
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

  @Patch('admin/staff/:id/verified')
  async updateAdminStaffVerified(
    @Param('id') id: string,
    @Body() payload: { verified: boolean },
    @Headers('authorization') authorization?: string
  ) {
    await this.requireAdminForMutation(authorization, 'staff:update-verified', ['admin']);
    const response = await fetch(buildServiceUrl(authServiceUrl, `/auth/admin/staff/${id}/verified`), {
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

  @Patch('admin/users/:id/role')
  async updateAdminUserRole(
    @Param('id') id: string,
    @Body() payload: { role: 'customer' | 'admin' | 'manager' | 'sales' | 'warehouse' | 'staff' },
    @Headers('authorization') authorization?: string
  ) {
    await this.requireAdminForMutation(authorization, 'users:update-role', ['admin']);
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
  async updateAdminUserVerified(
    @Param('id') id: string,
    @Body() payload: { verified: boolean },
    @Headers('authorization') authorization?: string
  ) {
    await this.requireAdminForMutation(authorization, 'users:update-verified', ['admin']);
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
      method: 'cod' | 'vnpay' | 'stripe' | 'momo';
      returnUrl?: string;
    },
    @Headers('idempotency-key') idempotencyKey?: string
  ) {
    const paymentScope = `${(payload.orderId || '').trim() || 'unknown-order'}|${payload.method || 'unknown-method'}`;
    const cached = this.getIdempotentResponse('payments:initiate', paymentScope, idempotencyKey, payload);
    if (cached !== null) {
      return cached;
    }

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

    const body = (await response.json()) as unknown;
    this.saveIdempotentResponse('payments:initiate', paymentScope, idempotencyKey, payload, body);
    return body;
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

  // ============= SHIPPING =============

  @Get('shipping/zones')
  async listShippingZones() {
    const response = await fetch(buildServiceUrl(shippingServiceUrl, '/shipping/zones'));
    return response.json();
  }

  @Post('shipping/zones/admin/create')
  async createShippingZone(@Body() payload: Record<string, unknown>, @Headers('authorization') authorization?: string) {
    await this.requireAdminForMutation(authorization, 'shipping:zones:create');
    const response = await fetch(buildServiceUrl(shippingServiceUrl, '/shipping/zones/admin/create'), {
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

  @Post('shipping/rules/admin/create')
  async createShippingRule(@Body() payload: Record<string, unknown>, @Headers('authorization') authorization?: string) {
    await this.requireAdminForMutation(authorization, 'shipping:rules:create');
    const response = await fetch(buildServiceUrl(shippingServiceUrl, '/shipping/rules/admin/create'), {
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

  @Post('shipping/quote')
  async calculateShippingFee(
    @Body() payload: { provinceCode: string; items: Array<{ productId: string; quantity: number }>; orderValue?: number }
  ) {
    const response = await fetch(buildServiceUrl(shippingServiceUrl, '/shipping/quote'), {
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

  @Post('shipping/allocate-warehouse')
  async allocateWarehouse(
    @Body() payload: { items: Array<{ productId: string; quantity: number }>; provinceCode?: string; customerTier?: string }
  ) {
    const response = await fetch(buildServiceUrl(shippingServiceUrl, '/shipping/allocate-warehouse'), {
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

  @Get('warehouses')
  async listWarehouses() {
    const response = await fetch(buildServiceUrl(shippingServiceUrl, '/warehouses'));
    return response.json();
  }

  @Post('warehouses/admin/create')
  async createWarehouse(@Body() payload: Record<string, unknown>, @Headers('authorization') authorization?: string) {
    await this.requireAdminForMutation(authorization, 'warehouses:create');
    const response = await fetch(buildServiceUrl(shippingServiceUrl, '/warehouses/admin/create'), {
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

  @Patch('warehouses/:warehouseId/stock/:productId')
  async updateWarehouseStock(
    @Param('warehouseId') warehouseId: string,
    @Param('productId') productId: string,
    @Body() payload: { quantityDelta: number },
    @Headers('authorization') authorization?: string
  ) {
    await this.requireAdminForMutation(authorization, 'warehouses:update-stock');
    const response = await fetch(buildServiceUrl(shippingServiceUrl, `/warehouses/${warehouseId}/stock/${productId}`), {
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

  // ============= SEARCH =============

  @Get('search')
  async search(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('category') category?: string,
    @Query('brand') brand?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('minRating') minRating?: string,
    @Query('inStock') inStock?: string,
    @Query('sortBy') sortBy?: string,
    @Query('facets') facets?: string
  ) {
    const queryParams = new URLSearchParams({
      ...(q && { q }),
      ...(page && { page }),
      ...(pageSize && { pageSize }),
      ...(category && { category }),
      ...(brand && { brand }),
      ...(minPrice && { minPrice }),
      ...(maxPrice && { maxPrice }),
      ...(minRating && { minRating }),
      ...(inStock && { inStock }),
      ...(sortBy && { sortBy }),
      ...(facets && { facets })
    });

    const response = await fetch(
      buildServiceUrl(searchServiceUrl, `/search?${queryParams.toString()}`)
    );
    return response.json();
  }

  @Post('search')
  async searchPost(
    @Body()
    payload: {
      q?: string;
      page?: number;
      pageSize?: number;
      category?: string;
      brand?: string;
      minPrice?: number;
      maxPrice?: number;
      minRating?: number;
      inStock?: boolean;
      sortBy?: string;
      facets?: boolean;
    },
    @Headers('x-forwarded-for') forwardedFor?: string,
    @Res({ passthrough: true }) res?: Response
  ) {
    const clientIp = (forwardedFor || '').split(',')[0].trim() || 'local';
    const decision = this.enforceRateLimit(`search:post:${clientIp}`, 120, 60_000);
    if (res) {
      this.attachRateLimitHeaders(res, decision);
    }

    const response = await fetch(buildServiceUrl(searchServiceUrl, '/search'), {
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

  @Get('search/filters')
  async getSearchFilters() {
    const response = await fetch(buildServiceUrl(searchServiceUrl, '/search/filters'));
    return response.json();
  }

  @Get('search/suggestions')
  async getSearchSuggestions(
    @Query('q') q?: string,
    @Query('limit') limit?: string,
    @Headers('x-forwarded-for') forwardedFor?: string,
    @Res({ passthrough: true }) res?: Response
  ) {
    const clientIp = (forwardedFor || '').split(',')[0].trim() || 'local';
    const decision = this.enforceRateLimit(`search:suggestions:${clientIp}`, 60, 60_000);
    if (res) {
      this.attachRateLimitHeaders(res, decision);
    }

    const queryParams = new URLSearchParams({
      ...(q && { q }),
      ...(limit && { limit })
    });

    const response = await fetch(
      buildServiceUrl(searchServiceUrl, `/search/suggestions?${queryParams.toString()}`)
    );
    return response.json();
  }
}
