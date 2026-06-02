import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeAlert, Box, CircleDollarSign, PackageSearch, ShoppingBag, Users } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/data/mockData';
import {
  getAdminAnalytics,
  getAdminAnalyticsByPeriod,
  getAdminInventoryReport,
  type AdminAnalytics,
  type AdminAnalyticsByPeriod,
  type AdminInventoryReport,
  type AnalyticsMetricMode,
  type AnalyticsPeriodType
} from '@/services/adminApi';

const statusLabels: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipped: 'Đang giao',
  delivered: 'Hoàn tất',
  cancelled: 'Đã hủy'
};

const roleTiles = [
  {
    title: 'Quản lý',
    description: 'Theo dõi KPI, doanh thu, cảnh báo và hiệu suất tổng thể.',
    href: '/admin/reporting'
  },
  {
    title: 'Bán hàng',
    description: 'Ưu tiên đơn chờ xử lý, cập nhật trạng thái nhanh và giảm thời gian thao tác.',
    href: '/admin/orders'
  },
  {
    title: 'Kho',
    description: 'Tập trung sản phẩm, tồn kho và các mặt hàng sắp hết để xử lý trước.',
    href: '/admin/products'
  }
] as const;

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [periodAnalytics, setPeriodAnalytics] = useState<AdminAnalyticsByPeriod | null>(null);
  const [inventoryReport, setInventoryReport] = useState<AdminInventoryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState<7 | 30 | 90>(30);
  const [periodType, setPeriodType] = useState<AnalyticsPeriodType>('month');
  const [metricMode, setMetricMode] = useState<AnalyticsMetricMode>('paid');

  const rangeLabels: Record<7 | 30 | 90, string> = {
    7: '7 ngày',
    30: '30 ngày',
    90: '90 ngày'
  };

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const [coreAnalytics, periodResult, inventoryResult] = await Promise.all([
          getAdminAnalytics(rangeDays),
          getAdminAnalyticsByPeriod({ periodType, metricMode }),
          getAdminInventoryReport({ periodType, metricMode, pageSize: 20 })
        ]);

        setAnalytics(coreAnalytics);
        setPeriodAnalytics(periodResult);
        setInventoryReport(inventoryResult);
      } catch {
        toast.error('Không tải được dữ liệu dashboard');
      } finally {
        setLoading(false);
      }
    };

    void loadAnalytics();
  }, [rangeDays, periodType, metricMode]);

  const stats = useMemo(
    () => [
      {
        label: 'Sản phẩm',
        value: analytics ? analytics.totalProducts.toString() : '...',
        icon: Box,
        caption: analytics ? `${analytics.activeProducts} đang bán` : 'Đang tải'
      },
      {
        label: 'Đơn hàng hôm nay',
        value: analytics ? analytics.todayOrders.toString() : '...',
        icon: ShoppingBag,
        caption: analytics ? `${analytics.totalOrders} tổng đơn` : 'Đang tải'
      },
      {
        label: 'Doanh thu',
        value: analytics ? formatPrice(analytics.totalRevenue) : '...',
        icon: CircleDollarSign,
        caption: analytics ? `${formatPrice(analytics.todayRevenue)} hôm nay` : 'Đang tải'
      },
      {
        label: 'Người dùng',
        value: analytics ? analytics.totalUsers.toString() : '...',
        icon: Users,
        caption: analytics ? `${analytics.verifiedUsers} đã xác thực` : 'Đang tải'
      }
    ],
    [analytics]
  );

  const topStatus = useMemo(() => {
    if (!analytics || !analytics.statusBreakdown || analytics.statusBreakdown.length === 0) return null;
    return analytics.statusBreakdown.reduce((best, current) => (current.count > best.count ? current : best), analytics.statusBreakdown[0]);
  }, [analytics]);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="relative p-6 lg:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.14),_transparent_30%)]" />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">Dashboard</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Quản trị NovaX</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Không gian điều hành tập trung cho quản lý, bán hàng và kho: nhìn nhanh tình trạng hệ thống, xử lý việc cần làm, và đi thẳng tới hành động.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link to="/admin/orders" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5">
                  Hàng chờ cần xử lý
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/admin/products" className="rounded-full border border-border bg-background px-4 py-2.5 text-sm font-semibold transition hover:bg-secondary">
                  Mở kho hàng
                </Link>
                <Link to="/products" className="rounded-full border border-border bg-background px-4 py-2.5 text-sm font-semibold transition hover:bg-secondary">
                  Xem cửa hàng
                </Link>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Khung thời gian</span>
                {(Object.keys(rangeLabels) as unknown as Array<keyof typeof rangeLabels>).map((key) => (
                  <button
                    key={key}
                    onClick={() => setRangeDays(key)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      rangeDays === key ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-secondary'
                    }`}
                  >
                    {rangeLabels[key]}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Kỳ báo cáo</span>
                {(['month', 'quarter', 'year'] as const).map((item) => (
                  <button
                    key={item}
                    onClick={() => setPeriodType(item)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      periodType === item ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-secondary'
                    }`}
                  >
                    {item === 'month' ? 'Tháng' : item === 'quarter' ? 'Quý' : 'Năm'}
                  </button>
                ))}
                {(['paid', 'delivered'] as const).map((item) => (
                  <button
                    key={item}
                    onClick={() => setMetricMode(item)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      metricMode === item ? 'bg-foreground text-background' : 'border border-border hover:bg-secondary'
                    }`}
                  >
                    {item === 'paid' ? 'Doanh số đã thanh toán' : 'Doanh số đã giao'}
                  </button>
                ))}
              </div>
              {analytics && analytics.rangeStart ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Dữ liệu từ {new Date(analytics.rangeStart).toLocaleDateString('vi-VN')} đến {new Date(analytics.rangeEnd).toLocaleDateString('vi-VN')}
                </p>
              ) : null}
            </div>
          </div>

          <div className="border-t border-border/70 bg-gradient-to-br from-slate-950 to-slate-900 p-6 text-slate-50 lg:border-l lg:border-t-0 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">Vai trò & lối tắt</p>
            <div className="mt-4 space-y-3">
              {roleTiles.map((tile) => (
                <Link
                  key={tile.title}
                  to={tile.href}
                  className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  <p className="text-sm font-semibold text-white">{tile.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{tile.description}</p>
                </Link>
              ))}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Ưu tiên hôm nay</p>
                <p className="mt-2 text-lg font-black text-white">{loading ? 'Đang tải...' : analytics?.todayOrders ? `${analytics.todayOrders} đơn cần theo dõi` : 'Không có đơn mới'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Cảnh báo tồn kho</p>
                <p className="mt-2 text-lg font-black text-white">
                  {loading ? 'Đang tải...' : inventoryReport ? `${inventoryReport.summary.lowStockCount} sản phẩm sắp hết` : 'Chưa có dữ liệu'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <stat.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-4 text-2xl font-black">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.caption}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Doanh số theo kỳ</p>
          <p className="mt-3 text-2xl font-black">{periodAnalytics ? formatPrice(periodAnalytics.totalRevenue) : '...'}</p>
          <p className="mt-1 text-xs text-muted-foreground">{periodAnalytics ? `${periodAnalytics.totalOrders} đơn (${metricMode})` : 'Đang tải'}</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Tổng tồn kho</p>
          <p className="mt-3 text-2xl font-black">{inventoryReport ? inventoryReport.summary.totalStock.toLocaleString('vi-VN') : '...'}</p>
          <p className="mt-1 text-xs text-muted-foreground">Tồn kho hiện tại toàn hệ thống</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Sắp hết hàng</p>
          <p className="mt-3 text-2xl font-black text-amber-600">{inventoryReport ? inventoryReport.summary.lowStockCount : '...'}</p>
          <p className="mt-1 text-xs text-muted-foreground">Sản phẩm dưới ngưỡng cảnh báo</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Hết hàng</p>
          <p className="mt-3 text-2xl font-black text-sale">{inventoryReport ? inventoryReport.summary.outOfStockCount : '...'}</p>
          <p className="mt-1 text-xs text-muted-foreground">Sản phẩm đang ở trạng thái chỉ xem</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold">Top sản phẩm</h3>
              <p className="text-sm text-muted-foreground">Dựa trên số lượng trong đơn hàng đã tạo.</p>
            </div>
            <Link to="/admin/products" className="text-sm font-medium text-primary hover:underline">
              Quản lý sản phẩm
            </Link>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-muted-foreground">Đang tải...</p>
          ) : (
            <div className="mt-4 space-y-3">
              {analytics?.topProducts.length ? (
                analytics.topProducts.map((product, index) => (
                  <div key={product.productId} className="rounded-2xl border border-border/70 p-4 transition hover:bg-secondary/30">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">
                          {index + 1}. {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">SKU: {product.productId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{product.quantity} pcs</p>
                        <p className="text-xs text-muted-foreground">{formatPrice(product.revenue)}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có dữ liệu bán hàng.</p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              <h3 className="font-bold">Trạng thái đơn hàng</h3>
            </div>
            <div className="mt-4 space-y-3">
              {analytics?.statusBreakdown.map((item) => {
                const total = analytics.totalOrders || 1;
                const percentage = Math.round((item.count / total) * 100);

                return (
                  <div key={item.status}>
                    <div className="flex items-center justify-between text-sm">
                      <span>{statusLabels[item.status]}</span>
                      <span className="font-medium">{item.count}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(percentage, item.count > 0 ? 8 : 0)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <BadgeAlert className="h-4 w-4 text-primary" />
              <h3 className="font-bold">Đơn hàng gần đây</h3>
            </div>
            <div className="mt-4 space-y-3">
              {analytics?.recentOrders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-border/70 p-4 transition hover:bg-secondary/30">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                    <p className="text-sm font-bold text-primary">{formatPrice(order.total)}</p>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {statusLabels[order.status]} · {order.paymentMethod.toUpperCase()} · {order.items.length} sản phẩm
                  </p>
                </div>
              ))}
              {analytics && analytics.recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có đơn hàng mới.</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <PackageSearch className="h-4 w-4 text-primary" />
              <h3 className="font-bold">Luồng xử lý nhanh</h3>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <Link to="/admin/orders" className="rounded-2xl border border-border bg-muted/30 p-4 transition hover:bg-secondary">
                <p className="text-sm font-semibold">1. Lọc đơn chờ</p>
                <p className="mt-1 text-xs text-muted-foreground">Ưu tiên đơn cần xác nhận hoặc giao ngay.</p>
              </Link>
              <Link to="/admin/products" className="rounded-2xl border border-border bg-muted/30 p-4 transition hover:bg-secondary">
                <p className="text-sm font-semibold">2. Kiểm tra tồn kho</p>
                <p className="mt-1 text-xs text-muted-foreground">Xử lý sản phẩm sắp hết trước khi phát sinh lỗi.</p>
              </Link>
              <Link to="/admin/reporting" className="rounded-2xl border border-border bg-muted/30 p-4 transition hover:bg-secondary">
                <p className="text-sm font-semibold">3. Đọc cảnh báo</p>
                <p className="mt-1 text-xs text-muted-foreground">Xem KPI và điểm nghẽn của hệ thống theo kỳ báo cáo.</p>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <h3 className="font-bold">Trạng thái hệ thống</h3>
        <p className="mt-3 text-sm text-muted-foreground">
          Auth, catalog, order, payment và email service đang hoạt động trên Docker stack.
          {topStatus ? ` Mảng đơn hàng đang nhiều nhất là ${statusLabels[topStatus.status].toLowerCase()}.` : ''}
        </p>
      </div>
    </div>
  );
}
