import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeAlert, Box, CircleDollarSign, PackageSearch, ShoppingBag, Users, TrendingUp, TrendingDown, Percent, Package, AlertTriangle, CheckCircle2, Activity, Zap, DollarSign } from 'lucide-react';
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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

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

const mockChartData = [
  { name: 'T2', revenue: 12000000, cost: 8000000, prevRevenue: 10000000 },
  { name: 'T3', revenue: 15000000, cost: 9500000, prevRevenue: 11000000 },
  { name: 'T4', revenue: 18000000, cost: 11000000, prevRevenue: 14000000 },
  { name: 'T5', revenue: 22000000, cost: 14000000, prevRevenue: 16000000 },
  { name: 'T6', revenue: 28750000, cost: 17300000, prevRevenue: 20000000 },
  { name: 'T7', revenue: 35000000, cost: 21000000, prevRevenue: 25000000 },
  { name: 'CN', revenue: 42000000, cost: 25000000, prevRevenue: 30000000 },
];

const mockRecentActivities = [
  { id: 1, type: 'order', text: 'Đơn hàng #ORD-0892 vừa được thanh toán', time: '5 phút trước' },
  { id: 2, type: 'user', text: 'Khách hàng Trần Văn B vừa đăng ký tài khoản', time: '12 phút trước' },
  { id: 3, type: 'order', text: 'Đơn hàng #ORD-0891 đã giao thành công', time: '30 phút trước' },
  { id: 4, type: 'review', text: 'Đánh giá 5 sao mới cho iPhone 15 Pro Max', time: '1 giờ trước' },
];

const mockTopProducts = [
  { productId: 'P1', name: 'iPhone 15 Pro Max 256GB', quantity: 45, revenue: 1439550000 },
  { productId: 'P3', name: 'MacBook Air 15 inch M2', quantity: 28, revenue: 923720000 },
  { productId: 'P2', name: 'Samsung Galaxy S24 Ultra', quantity: 24, revenue: 695760000 },
  { productId: 'P4', name: 'Tivi Samsung QLED 4K 65 inch', quantity: 15, revenue: 269850000 },
];

const mockInventoryWarnings = [
  { id: '1', name: 'Tai nghe AirPods Pro 2', stock: 0, status: 'Hết Hàng' },
  { id: '2', name: 'Ốp lưng iPhone 15 Pro Max', stock: 2, status: 'Sắp Hết Hàng' },
  { id: '3', name: 'Sạc nhanh 20W Type-C', stock: 4, status: 'Sắp Hết Hàng' },
];

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
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-success flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> SỨC KHỎE CỬA HÀNG: TỐT
              </p>
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
          </div>
        </div>
      </section>

      {/* KPI Dashboard */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Doanh Thu */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Doanh Thu (Hôm Nay)</p>
            <CircleDollarSign className="h-5 w-5 text-primary" />
          </div>
          <p className="mt-4 text-3xl font-black text-foreground">28.750.000 ₫</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-success">
            <TrendingUp className="h-4 w-4" />
            <span>+15.2% so với hôm qua</span>
          </div>
        </div>

        {/* Đơn Hàng Mới */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Đơn Hàng Mới</p>
            <ShoppingBag className="h-5 w-5 text-primary" />
          </div>
          <p className="mt-4 text-3xl font-black text-foreground">1.250</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-success">
            <TrendingUp className="h-4 w-4" />
            <span>+8% so với hôm qua</span>
          </div>
        </div>

        {/* Lợi Nhuận Gộp */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Lợi Nhuận (Gộp)</p>
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <p className="mt-4 text-3xl font-black text-foreground">11.450.000 ₫</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-success">
            <TrendingUp className="h-4 w-4" />
            <span>Margin 35%</span>
          </div>
        </div>

        {/* Tỷ Lệ Chuyển Đổi */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Tỷ Lệ Chuyển Đổi</p>
            <Percent className="h-5 w-5 text-primary" />
          </div>
          <p className="mt-4 text-3xl font-black text-foreground">2.8%</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Activity className="h-4 w-4" />
            <span>(Ổn định)</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        
        {/* Left Column: Chart & Inventory */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-lg">Biểu Đồ Doanh Thu</h3>
                <p className="text-sm text-muted-foreground">Theo dõi tăng trưởng thực tế theo ngày</p>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000000}M`} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => formatPrice(value)}
                  />
                  <Line type="monotone" name="Doanh thu" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" name="Chi phí" dataKey="cost" stroke="#eab308" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" name="Kỳ trước" dataKey="prevRevenue" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-lg">Cảnh báo tồn kho</h3>
            </div>
            <div className="space-y-3">
              {mockInventoryWarnings.map(item => (
                <div key={item.id} className={`flex items-center justify-between rounded-2xl border p-4 ${item.status === 'Hết Hàng' ? 'bg-sale/5 border-sale/20' : 'bg-warning/5 border-warning/20'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-10 rounded-full ${item.status === 'Hết Hàng' ? 'bg-sale' : 'bg-warning'}`}></div>
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className={`text-xs font-bold ${item.status === 'Hết Hàng' ? 'text-sale' : 'text-warning'}`}>{item.status} ({item.stock} cái)</p>
                    </div>
                  </div>
                  <Link to="/admin/products" className={`px-4 py-2 text-xs font-bold rounded-full ${item.status === 'Hết Hàng' ? 'bg-sale text-white hover:bg-sale/90' : 'bg-warning text-white hover:bg-warning/90'} transition`}>
                    {item.status === 'Hết Hàng' ? 'Nhập Hàng Ngay' : 'Xem Chi Tiết'}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Top Products & Activities */}
        <div className="space-y-4">
          
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold">Top sản phẩm</h3>
                <p className="text-sm text-muted-foreground">Bán chạy nhất hôm nay</p>
              </div>
              <Link to="/admin/products" className="text-sm font-medium text-primary hover:underline">
                Xem tất cả
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {mockTopProducts.map((product, index) => (
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
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-primary" />
              <h3 className="font-bold">Cập nhật hoạt động mới nhất</h3>
            </div>
            <div className="space-y-4">
              {mockRecentActivities.map(activity => (
                <div key={activity.id} className="relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-[-16px] before:w-[2px] before:bg-border last:before:hidden">
                  <div className="absolute left-[3px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-background"></div>
                  <p className="text-sm font-medium">{activity.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
