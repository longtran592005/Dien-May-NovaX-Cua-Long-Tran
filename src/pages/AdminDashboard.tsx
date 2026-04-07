import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Box, CircleDollarSign, ShoppingBag, Users } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/data/mockData';
import { getAdminAnalytics, type AdminAnalytics } from '@/services/adminApi';

const statusLabels: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipped: 'Đang giao',
  delivered: 'Hoàn tất',
  cancelled: 'Đã hủy'
};

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState<7 | 30 | 90>(30);

  const rangeLabels: Record<7 | 30 | 90, string> = {
    7: '7 ngày',
    30: '30 ngày',
    90: '90 ngày'
  };

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        setAnalytics(await getAdminAnalytics(rangeDays));
      } catch {
        toast.error('Không tải được dữ liệu dashboard');
      } finally {
        setLoading(false);
      }
    };

    void loadAnalytics();
  }, [rangeDays]);

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

  const topStatus = analytics?.statusBreakdown.reduce((best, current) => (current.count > best.count ? current : best), analytics.statusBreakdown[0]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Dashboard</p>
        <h2 className="mt-2 text-3xl font-black">Quản trị NovaX</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Giám sát sản phẩm, đơn hàng, người dùng và doanh thu trong một giao diện gọn, nhanh, rõ.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/admin/products" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Quản lý sản phẩm
          </Link>
          <Link to="/products" className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary">
            Xem cửa hàng
          </Link>
          <Link to="/admin/orders" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary">
            Xem đơn hàng <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
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
        {analytics && analytics.rangeStart ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Dữ liệu từ {new Date(analytics.rangeStart).toLocaleDateString('vi-VN')} đến {new Date(analytics.rangeEnd).toLocaleDateString('vi-VN')}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <stat.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-4 text-2xl font-black">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.caption}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
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
                  <div key={product.productId} className="rounded-2xl border border-border/70 p-4">
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
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="font-bold">Trạng thái đơn hàng</h3>
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

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="font-bold">Đơn hàng gần đây</h3>
            <div className="mt-4 space-y-3">
              {analytics?.recentOrders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-border/70 p-4">
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
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h3 className="font-bold">Trạng thái hệ thống</h3>
        <p className="mt-3 text-sm text-muted-foreground">
          Auth, catalog, order, payment và email service đang hoạt động trên Docker stack.
          {topStatus ? ` Mảng đơn hàng đang nhiều nhất là ${statusLabels[topStatus.status].toLowerCase()}.` : ''}
        </p>
      </div>
    </div>
  );
}
