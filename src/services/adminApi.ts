import { getAuthHeader } from './authApi';
import { fetchProducts } from './catalogApi';
import type { Product } from '@/types/product';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export interface AdminProductInput {
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  brand: string;
  sku?: string;
  stock: number;
  categorySlug: string;
  images?: string[];
}

export interface AdminOrderItem {
  productId: string;
  quantity: number;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  paymentMethod: 'cod' | 'vnpay' | 'stripe' | 'momo';
  userId: string;
  shippingAddressId: string;
  note?: string | null;
  items: AdminOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrderAudit {
  orderId: string;
  orderNumber: string;
  status: AdminOrder['status'];
  createdAt: string;
  userId: string;
  paymentMethod: AdminOrder['paymentMethod'];
  total: number;
  discountAmount: number;
  usedPoints: number;
  voucherCode: string;
  voucherDiscount: number;
  voucherRejectedReason: string;
  voucherOutcome: 'applied' | 'rejected' | 'none';
  pricingSource: string;
  flowVersion: string;
}

export interface AdminOrderAuditSummary {
  totalAmount: number;
  totalDiscount: number;
  totalVoucherDiscount: number;
  appliedVoucherCount: number;
  rejectedVoucherCount: number;
  voucherOutcomeBreakdown: Array<{ outcome: 'applied' | 'rejected' | 'none'; count: number }>;
  statusBreakdown: Array<{ status: AdminOrder['status']; count: number }>;
  pricingSourceBreakdown: Array<{ source: string; count: number }>;
}

export interface AdminOrderAuditListResponse extends AdminPaginatedResponse<AdminOrderAudit> {
  summary: AdminOrderAuditSummary;
}

export interface ExportOrderAuditResponse {
  fileName: string;
  totalRows: number;
  csv: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin' | 'manager' | 'sales' | 'warehouse' | 'staff';
  verified: boolean;
  createdAt: string;
}

export interface AdminPaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface AdminAnalyticsStatusBreakdown {
  status: AdminOrder['status'];
  count: number;
}

export interface AdminAnalyticsTopProduct {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface AdminAnalytics {
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
  statusBreakdown: AdminAnalyticsStatusBreakdown[];
  topProducts: AdminAnalyticsTopProduct[];
  recentOrders: AdminOrder[];
}

export type AnalyticsPeriodType = 'month' | 'quarter' | 'year';
export type AnalyticsMetricMode = 'paid' | 'delivered';

export interface AdminAnalyticsByPeriodPoint {
  period: string;
  orders: number;
  revenue: number;
}

export interface AdminAnalyticsByPeriod {
  periodType: AnalyticsPeriodType;
  metricMode: AnalyticsMetricMode;
  timezone: 'Asia/Ho_Chi_Minh';
  rangeStart: string;
  rangeEnd: string;
  totalOrders: number;
  totalRevenue: number;
  series: AdminAnalyticsByPeriodPoint[];
  topProducts: AdminAnalyticsTopProduct[];
}

export interface AdminInventoryReportRow {
  productId: string;
  productName: string;
  category: string;
  stock: number;
  threshold: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  soldQuantity: number;
}

export interface AdminInventoryReport extends AdminPaginatedResponse<AdminInventoryReportRow> {
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
}

export interface AdminReportingOverview {
  analytics: AdminAnalytics;
  periodAnalytics: AdminAnalyticsByPeriod;
  inventoryReport: AdminInventoryReport;
  auditSummary: AdminOrderAuditSummary;
}

function buildUrl(path: string) {
  const base = API_BASE_URL.replace(/\/+$/, '');
  const normalizedPath = path.replace(/^\/+/, '');
  if (base.startsWith('/')) {
    return `${window.location.origin}${base}/${normalizedPath}`;
  }
  return `${base}/${normalizedPath}`;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await getAuthHeader();
  const targetUrl = path.startsWith('http') ? path : buildUrl(path);
  
  const response = await fetch(targetUrl, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      ...(init?.headers || {})
    }
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message || 'Request failed');
  }

  return response.json() as Promise<T>;
}

export async function listAdminProducts(): Promise<Product[]> {
  const data = await fetchProducts({ page: 1, pageSize: 200 });
  return data.items;
}

export async function createAdminProduct(payload: AdminProductInput) {
  return fetchJson('/admin/products', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateAdminProduct(id: string, payload: Partial<AdminProductInput>) {
  return fetchJson(`/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function uploadAdminProductImage(file: File, category?: string): Promise<{ url: string }> {
  const headers = await getAuthHeader();
  const targetUrl = buildUrl('/admin/products/upload');
  
  const formData = new FormData();
  formData.append('file', file);
  if (category?.trim()) {
    formData.append('category', category.trim());
  }

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      ...headers,
    },
    body: formData
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message || 'Upload failed');
  }

  return response.json() as Promise<{ url: string }>;
}

export async function deleteAdminProduct(id: string) {
  return fetchJson(`/admin/products/${id}`, {
    method: 'DELETE'
  });
}

export interface ListAdminOrdersParams {
  q?: string;
  status?: 'all' | AdminOrder['status'];
  sortBy?: 'newest' | 'oldest' | 'value-high' | 'value-low';
  page?: number;
  pageSize?: number;
}

export async function listAdminOrders(params: ListAdminOrdersParams = {}): Promise<AdminPaginatedResponse<AdminOrder>> {
  const query = new URLSearchParams();
  if (params.q?.trim()) query.set('q', params.q.trim());
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));

  const suffix = query.toString();
  return fetchJson(`/admin/orders${suffix ? `?${suffix}` : ''}`);
}

export async function getAdminOrder(id: string): Promise<AdminOrder | null> {
  return fetchJson(`/admin/orders/${id}`);
}

export interface ListAdminOrderAuditParams {
  voucherCode?: string;
  status?: 'all' | AdminOrder['status'];
  sortBy?: 'newest' | 'oldest' | 'discount-high' | 'discount-low' | 'voucher-high' | 'voucher-low';
  pricingSource?: string;
  hasVoucher?: 'all' | 'with-voucher' | 'without-voucher';
  voucherOutcome?: 'all' | 'applied' | 'rejected' | 'none';
  minDiscount?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export async function listAdminOrderAudit(
  params: ListAdminOrderAuditParams = {}
): Promise<AdminOrderAuditListResponse> {
  const query = new URLSearchParams();
  if (params.voucherCode?.trim()) query.set('voucherCode', params.voucherCode.trim());
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.sortBy && params.sortBy !== 'newest') query.set('sortBy', params.sortBy);
  if (params.pricingSource?.trim()) query.set('pricingSource', params.pricingSource.trim());
  if (params.hasVoucher && params.hasVoucher !== 'all') query.set('hasVoucher', params.hasVoucher);
  if (params.voucherOutcome && params.voucherOutcome !== 'all') query.set('voucherOutcome', params.voucherOutcome);
  if (typeof params.minDiscount === 'number' && Number.isFinite(params.minDiscount) && params.minDiscount > 0) {
    query.set('minDiscount', String(Math.max(0, params.minDiscount)));
  }
  if (params.startDate?.trim()) query.set('startDate', params.startDate.trim());
  if (params.endDate?.trim()) query.set('endDate', params.endDate.trim());
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  const suffix = query.toString();
  return fetchJson(`/admin/orders/audit${suffix ? `?${suffix}` : ''}`);
}

export async function exportAdminOrderAuditCsv(
  params: Pick<ListAdminOrderAuditParams, 'voucherCode' | 'status' | 'sortBy' | 'pricingSource' | 'hasVoucher' | 'voucherOutcome' | 'minDiscount' | 'startDate' | 'endDate'> = {}
): Promise<ExportOrderAuditResponse> {
  const query = new URLSearchParams();
  if (params.voucherCode?.trim()) query.set('voucherCode', params.voucherCode.trim());
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.sortBy && params.sortBy !== 'newest') query.set('sortBy', params.sortBy);
  if (params.pricingSource?.trim()) query.set('pricingSource', params.pricingSource.trim());
  if (params.hasVoucher && params.hasVoucher !== 'all') query.set('hasVoucher', params.hasVoucher);
  if (params.voucherOutcome && params.voucherOutcome !== 'all') query.set('voucherOutcome', params.voucherOutcome);
  if (typeof params.minDiscount === 'number' && Number.isFinite(params.minDiscount) && params.minDiscount > 0) {
    query.set('minDiscount', String(Math.max(0, params.minDiscount)));
  }
  if (params.startDate?.trim()) query.set('startDate', params.startDate.trim());
  if (params.endDate?.trim()) query.set('endDate', params.endDate.trim());
  const suffix = query.toString();
  return fetchJson(`/admin/orders/audit/export${suffix ? `?${suffix}` : ''}`);
}

export async function updateAdminOrderStatus(
  id: string,
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
) {
  return fetchJson(`/admin/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

export interface ListAdminUsersParams {
  q?: string;
  role?: 'all' | 'admin' | 'customer' | 'manager' | 'sales' | 'warehouse' | 'staff';
  verified?: 'all' | 'verified' | 'unverified';
  sortBy?: 'newest' | 'oldest' | 'name';
  page?: number;
  pageSize?: number;
}

export async function listAdminUsers(params: ListAdminUsersParams = {}): Promise<AdminPaginatedResponse<AdminUser>> {
  const query = new URLSearchParams();
  if (params.q?.trim()) query.set('q', params.q.trim());
  if (params.role && params.role !== 'all') query.set('role', params.role);
  if (params.verified && params.verified !== 'all') query.set('verified', params.verified === 'verified' ? 'true' : 'false');
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));

  const suffix = query.toString();
  return fetchJson(`/admin/users${suffix ? `?${suffix}` : ''}`);
}

export async function updateAdminUserRole(id: string, role: 'customer' | 'admin' | 'manager' | 'sales' | 'warehouse' | 'staff'): Promise<AdminUser> {
  return fetchJson(`/admin/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role })
  });
}

export async function updateAdminUserVerified(id: string, verified: boolean): Promise<AdminUser> {
  return fetchJson(`/admin/users/${id}/verified`, {
    method: 'PATCH',
    body: JSON.stringify({ verified })
  });
}

export interface ListAdminStaffParams {
  q?: string;
  verified?: 'all' | 'verified' | 'unverified';
  sortBy?: 'newest' | 'oldest' | 'name';
  page?: number;
  pageSize?: number;
}

export async function listAdminCustomers(
  params: Omit<ListAdminUsersParams, 'role'> = {}
): Promise<AdminPaginatedResponse<AdminUser>> {
  return listAdminUsers({ ...params, role: 'customer' });
}

export async function listAdminStaff(params: ListAdminStaffParams = {}): Promise<AdminPaginatedResponse<AdminUser>> {
  const query = new URLSearchParams();
  if (params.q?.trim()) query.set('q', params.q.trim());
  if (params.verified && params.verified !== 'all') query.set('verified', params.verified === 'verified' ? 'true' : 'false');
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));

  const suffix = query.toString();
  return fetchJson(`/admin/staff${suffix ? `?${suffix}` : ''}`);
}

export async function createAdminStaff(payload: {
  email: string;
  fullName: string;
  tempPassword: string;
  role?: 'admin' | 'manager' | 'sales' | 'warehouse' | 'staff';
}): Promise<AdminUser> {
  return fetchJson('/admin/staff', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateAdminStaffVerified(id: string, verified: boolean): Promise<AdminUser> {
  return fetchJson(`/admin/staff/${id}/verified`, {
    method: 'PATCH',
    body: JSON.stringify({ verified })
  });
}

export async function getAdminAnalytics(rangeDays = 30): Promise<AdminAnalytics> {
  const safeRangeDays = Number.isFinite(rangeDays) && rangeDays > 0 ? Math.round(rangeDays) : 30;
  return fetchJson(`/admin/analytics?rangeDays=${safeRangeDays}`);
}

export async function getAdminAnalyticsByPeriod(params: {
  periodType?: AnalyticsPeriodType;
  metricMode?: AnalyticsMetricMode;
  startDate?: string;
  endDate?: string;
} = {}): Promise<AdminAnalyticsByPeriod> {
  const query = new URLSearchParams();
  if (params.periodType) query.set('periodType', params.periodType);
  if (params.metricMode) query.set('metricMode', params.metricMode);
  if (params.startDate?.trim()) query.set('startDate', params.startDate.trim());
  if (params.endDate?.trim()) query.set('endDate', params.endDate.trim());
  const suffix = query.toString();
  return fetchJson(`/admin/analytics/by-period${suffix ? `?${suffix}` : ''}`);
}

export async function getAdminInventoryReport(params: {
  periodType?: AnalyticsPeriodType;
  metricMode?: AnalyticsMetricMode;
  startDate?: string;
  endDate?: string;
  status?: 'in-stock' | 'low-stock' | 'out-of-stock';
  page?: number;
  pageSize?: number;
} = {}): Promise<AdminInventoryReport> {
  const query = new URLSearchParams();
  if (params.periodType) query.set('periodType', params.periodType);
  if (params.metricMode) query.set('metricMode', params.metricMode);
  if (params.startDate?.trim()) query.set('startDate', params.startDate.trim());
  if (params.endDate?.trim()) query.set('endDate', params.endDate.trim());
  if (params.status) query.set('status', params.status);
  if (params.page) query.set('page', String(Math.max(1, params.page)));
  if (params.pageSize) query.set('pageSize', String(Math.min(200, Math.max(1, params.pageSize))));
  const suffix = query.toString();
  return fetchJson(`/admin/inventory/report${suffix ? `?${suffix}` : ''}`);
}

export async function getAdminReportingOverview(params: {
  rangeDays?: number;
  periodType?: AnalyticsPeriodType;
  metricMode?: AnalyticsMetricMode;
  startDate?: string;
  endDate?: string;
  pageSize?: number;
} = {}): Promise<AdminReportingOverview> {
  const rangeDays = Number.isFinite(params.rangeDays) && (params.rangeDays || 0) > 0 ? Math.round(params.rangeDays || 30) : 30;
  const [analytics, periodAnalytics, inventoryReport, auditSummary] = await Promise.all([
    getAdminAnalytics(rangeDays),
    getAdminAnalyticsByPeriod({
      periodType: params.periodType,
      metricMode: params.metricMode,
      startDate: params.startDate,
      endDate: params.endDate
    }),
    getAdminInventoryReport({
      periodType: params.periodType,
      metricMode: params.metricMode,
      startDate: params.startDate,
      endDate: params.endDate,
      pageSize: params.pageSize || 20
    }),
    listAdminOrderAudit({
      startDate: params.startDate,
      endDate: params.endDate,
      pageSize: 1
    })
  ]);

  return {
    analytics,
    periodAnalytics,
    inventoryReport,
    auditSummary: auditSummary.summary
  };
}

export interface FlashSale {
  id: string;
  name: string;
  type: 'flash_sale';
  status: 'draft' | 'active' | 'paused' | 'expired';
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  priority: number;
  isExclusive: boolean;
  startsAt: string;
  endsAt: string;
  usageLimit?: number;
  usedCount: number;
  targetTier?: string;
  productScopes: Array<{ productId: string; minQuantity: number }>;
  categoryScopes: Array<{ categorySlug: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface ListFlashSalesResponse extends AdminPaginatedResponse<FlashSale> {}

export interface PromotionConflict {
  promotion1Id: string;
  promotion1Name: string;
  promotion2Id: string;
  promotion2Name: string;
  conflictType: 'time' | 'scope';
  details: string;
}

export interface PricingSimulationResult {
  original: {
    flowVersion: string;
    subtotal: number;
    lineDiscountTotal: number;
    voucherDiscount: number;
    discountTotal: number;
    payableTotal: number;
  };
  simulated: {
    flowVersion: string;
    subtotal: number;
    lineDiscountTotal: number;
    discountTotal: number;
    payableTotal: number;
  };
  comparison: {
    discountSavings: number;
    priceDifference: number;
    excludedPromotions: string[];
  };
}

export async function listFlashSales(status?: string, page = 1, pageSize = 20): Promise<ListFlashSalesResponse> {
  const query = new URLSearchParams();
  if (status?.trim()) query.set('status', status.trim());
  query.set('page', String(Math.max(1, page)));
  query.set('pageSize', String(Math.min(100, Math.max(1, pageSize))));
  const suffix = query.toString();
  return fetchJson(`/flash-sales${suffix ? `?${suffix}` : ''}`);
}

export async function detectPromotionConflicts(promotionId?: string): Promise<PromotionConflict[]> {
  const query = new URLSearchParams();
  if (promotionId?.trim()) query.set('promotionId', promotionId.trim());
  const suffix = query.toString();
  return fetchJson(`/promotions/admin/conflicts${suffix ? `?${suffix}` : ''}`);
}

export async function simulatePricing(payload: {
  items: Array<{ productId: string; quantity: number }>;
  couponCode?: string;
  customerTier?: string;
  excludePromotions?: string[];
}): Promise<PricingSimulationResult> {
  return fetchJson('/pricing/simulate', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export interface ActivePromotion {
  id: string;
  name: string;
  code?: string;
  type: string;
  discountType: string;
  discountValue: number;
  maxDiscount?: number | null;
  minOrderAmount?: number | null;
  startsAt: string;
  endsAt: string;
  isExclusive: boolean;
  metadata?: Record<string, any>;
}

export async function fetchActivePromotionsForCustomer(): Promise<ActivePromotion[]> {
  const PROMO_URL = import.meta.env.VITE_PROMOTION_SERVICE_URL || 'http://localhost:4100';
  const targetUrl = `${PROMO_URL}/promotions/customer-active`;
  const response = await fetch(targetUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch active promotions');
  }

  return response.json() as Promise<ActivePromotion[]>;
}

// ============= SHIPPING TYPES & FUNCTIONS =============

export interface ShippingZone {
  id: string;
  name: string;
  provinceCode: string;
  slug: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingRule {
  id: string;
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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  province: string;
  district: string;
  address: string;
  phone?: string;
  isPrimary: boolean;
  capacity?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingFeeQuote {
  fee: number;
  zoneId: string;
  estimatedDays: number;
}

export interface WarehouseAllocation {
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  available: boolean;
}

export async function listShippingZones(): Promise<ShippingZone[]> {
  return fetchJson('/shipping/zones');
}

export async function createShippingZone(payload: {
  name: string;
  provinceCode: string;
  slug: string;
  priority: number;
}): Promise<ShippingZone> {
  return fetchJson('/shipping/zones/admin/create', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function createShippingRule(payload: {
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
}): Promise<ShippingRule> {
  return fetchJson('/shipping/rules/admin/create', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function calculateShippingFee(payload: {
  provinceCode: string;
  items: Array<{ productId: string; quantity: number }>;
  orderValue?: number;
}): Promise<ShippingFeeQuote> {
  return fetchJson('/shipping/quote', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function allocateWarehouse(payload: {
  items: Array<{ productId: string; quantity: number }>;
  provinceCode?: string;
  customerTier?: string;
}): Promise<WarehouseAllocation> {
  return fetchJson('/shipping/allocate-warehouse', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function listWarehouses(): Promise<Warehouse[]> {
  return fetchJson('/warehouses');
}

export async function createWarehouse(payload: {
  name: string;
  code: string;
  province: string;
  district: string;
  address: string;
  phone?: string;
  isPrimary: boolean;
  capacity?: number;
}): Promise<Warehouse> {
  return fetchJson('/warehouses/admin/create', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateWarehouseStock(
  warehouseId: string,
  productId: string,
  quantityDelta: number
): Promise<{ success: boolean; message?: string }> {
  return fetchJson(`/warehouses/${warehouseId}/stock/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantityDelta })
  });
}

// ============= SEARCH TYPES & FUNCTIONS =============

export interface SearchHit {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category: string;
  brand: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  images?: string[];
}

export interface SearchResult {
  hits: SearchHit[];
  totalHits: number;
  page: number;
  pageSize: number;
  facets?: {
    categories: Array<{ name: string; count: number }>;
    brands: Array<{ name: string; count: number }>;
    priceRanges: Array<{ range: string; count: number }>;
    ratings: Array<{ rating: number; count: number }>;
  };
}

export interface SearchFilters {
  categories: string[];
  brands: string[];
  priceRange: { min: number; max: number };
  ratings: number[];
}

export async function searchProducts(payload: {
  q?: string;
  page?: number;
  pageSize?: number;
  category?: string;
  brand?: string;
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  sortBy?: 'newest' | 'price-low' | 'price-high' | 'rating-high' | 'popular';
  facets?: boolean;
}): Promise<SearchResult> {
  return fetchJson('/search', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function getSearchFilters(): Promise<SearchFilters> {
  return fetchJson('/search/filters');
}

export async function getSearchSuggestions(q: string, limit: number = 10): Promise<string[]> {
  const url = new URL(`${API_BASE_URL}/search/suggestions`);
  url.searchParams.append('q', q);
  url.searchParams.append('limit', String(limit));

  const response = await fetch(url.toString(), {
    headers: getAuthHeader()
  });

  if (!response.ok) {
    throw new Error(`Search suggestions failed: ${response.statusText}`);
  }

  return response.json();
}

