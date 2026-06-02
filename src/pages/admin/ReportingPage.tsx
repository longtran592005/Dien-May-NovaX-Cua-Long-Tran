import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, BarChart3, CircleDollarSign, LineChart, Package, ShieldAlert, ShoppingBag, TrendingDown, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart as ReLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { formatPrice } from '@/data/mockData';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  getAdminReportingOverview,
  type AdminReportingOverview,
  type AnalyticsMetricMode,
  type AnalyticsPeriodType
} from '@/services/adminApi';

const rangeLabels: Record<7 | 30 | 90, string> = {
  7: '7 ngày',
  30: '30 ngày',
  90: '90 ngày'
};

type ReportPreset = 'today' | 'yesterday' | 'week' | 'month' | 'ytd' | 'year';

const reportPresetLabels: Record<ReportPreset, string> = {
  today: 'Hôm nay',
  yesterday: 'Hôm qua',
  week: 'Tuần này',
  month: 'Tháng này',
  ytd: 'Năm nay',
  year: 'Năm ngoái'
};

function buildPresetRange(preset: ReportPreset) {
  const end = new Date();
  const start = new Date(end);

  if (preset === 'today') {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (preset === 'yesterday') {
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
  } else if (preset === 'week') {
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else if (preset === 'month') {
    start.setMonth(start.getMonth() - 1);
    start.setHours(0, 0, 0, 0);
  } else if (preset === 'ytd') {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setFullYear(start.getFullYear() - 1);
    start.setHours(0, 0, 0, 0);
  }

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10)
  };
}

const periodLabels: Record<AnalyticsPeriodType, string> = {
  month: 'Tháng',
  quarter: 'Quý',
  year: 'Năm'
};

const metricLabels: Record<AnalyticsMetricMode, string> = {
  paid: 'Đã thanh toán',
  delivered: 'Đã giao'
};

function toIssueCount(summary: AdminReportingOverview) {
  const cancelled = summary.analytics.statusBreakdown.find((item) => item.status === 'cancelled')?.count || 0;
  const lowStock = summary.inventoryReport.summary.lowStockCount;
  const outOfStock = summary.inventoryReport.summary.outOfStockCount;
  const rejectedVoucher = summary.auditSummary.rejectedVoucherCount;

  return {
    cancelled,
    lowStock,
    outOfStock,
    rejectedVoucher,
    total: cancelled + lowStock + outOfStock + rejectedVoucher
  };
}

export default function ReportingPage() {
  const [rangeDays, setRangeDays] = useState<7 | 30 | 90>(30);
  const [preset, setPreset] = useState<ReportPreset>('month');
  const [periodType, setPeriodType] = useState<AnalyticsPeriodType>('month');
  const [metricMode, setMetricMode] = useState<AnalyticsMetricMode>('paid');
  const [data, setData] = useState<AdminReportingOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const activeRange = useMemo(() => buildPresetRange(preset), [preset]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await getAdminReportingOverview({
          rangeDays,
          periodType,
          metricMode,
          startDate: activeRange.startDate,
          endDate: activeRange.endDate,
          pageSize: 20
        });
        setData(result);
      } catch {
        toast.error('Không tải được báo cáo admin');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [rangeDays, periodType, metricMode, activeRange.endDate, activeRange.startDate]);

  const issueSummary = useMemo(() => (data ? toIssueCount(data) : null), [data]);
  const discountCost = data?.auditSummary.totalDiscount || 0;
  const voucherCost = data?.auditSummary.totalVoucherDiscount || 0;
  const estimatedMargin = Math.max(0, (data?.analytics.totalRevenue || 0) - discountCost - voucherCost);

  const seriesData = data?.periodAnalytics.series || [];
  const inventoryRows = (data?.inventoryReport.items || []).slice(0, 6);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="p-6 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">Báo cáo & phân tích</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Báo cáo theo thời gian</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
              Theo dõi doanh thu, chi phí chiết khấu và tín hiệu rủi ro vận hành theo khung thời gian bạn chọn, trong một giao diện dễ đọc hơn.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Khoảng thời gian</span>
              {(Object.keys(reportPresetLabels) as ReportPreset[]).map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setPreset(item);
                    setRangeDays(item === 'today' || item === 'yesterday' ? 7 : item === 'week' ? 7 : item === 'month' ? 30 : 90);
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    preset === item ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-secondary'
                  }`}
                >
                  {reportPresetLabels[item]}
                </button>
              ))}
          {(Object.keys(rangeLabels) as unknown as Array<keyof typeof rangeLabels>).map((key) => (
            <button
              key={key}
              onClick={() => {
                setRangeDays(key);
                setPreset(key === 7 ? 'week' : key === 30 ? 'month' : 'year');
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                rangeDays === key ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-secondary'
              }`}
            >
              {rangeLabels[key]}
            </button>
          ))}
          <span className="ml-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Kỳ báo cáo</span>
          {(Object.keys(periodLabels) as Array<AnalyticsPeriodType>).map((item) => (
            <button
              key={item}
              onClick={() => setPeriodType(item)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                periodType === item ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-secondary'
              }`}
            >
              {periodLabels[item]}
            </button>
          ))}
          <span className="ml-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Chế độ tính</span>
          {(Object.keys(metricLabels) as Array<AnalyticsMetricMode>).map((item) => (
            <button
              key={item}
              onClick={() => setMetricMode(item)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                metricMode === item ? 'bg-foreground text-background' : 'border border-border hover:bg-secondary'
              }`}
            >
              {metricLabels[item]}
            </button>
          ))}
            </div>
            {data?.analytics.rangeStart ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Dữ liệu từ {new Date(data.analytics.rangeStart).toLocaleDateString('vi-VN')} đến {new Date(data.analytics.rangeEnd).toLocaleDateString('vi-VN')}
              </p>
            ) : null}
          </div>

          <div className="border-t border-border/70 bg-gradient-to-br from-slate-950 to-slate-900 p-6 text-slate-50 lg:border-l lg:border-t-0 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">Điểm nhìn nhanh</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Doanh thu</p>
                <p className="mt-2 text-2xl font-black text-white">{data ? formatPrice(data.analytics.totalRevenue) : '...'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Chi phí khuyến mãi</p>
                <p className="mt-2 text-2xl font-black text-white">{data ? formatPrice(discountCost + voucherCost) : '...'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Lợi nhuận tạm tính</p>
                <p className="mt-2 text-2xl font-black text-white">{data ? formatPrice(estimatedMargin) : '...'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Doanh thu', value: data ? formatPrice(data.analytics.totalRevenue) : '...', caption: `${data?.analytics.totalOrders || 0} đơn`, icon: CircleDollarSign },
          { label: 'Thu đã chốt', value: data ? formatPrice(data.periodAnalytics.totalRevenue) : '...', caption: `${metricLabels[metricMode]} trong kỳ`, icon: TrendingDown },
          { label: 'Chi phí khuyến mãi', value: data ? formatPrice(discountCost + voucherCost) : '...', caption: 'Chiết khấu + voucher', icon: BarChart3 },
          { label: 'Lợi nhuận tạm tính', value: data ? formatPrice(estimatedMargin) : '...', caption: 'Doanh thu trừ chiết khấu', icon: Package }
        ].map((item) => (
          <div key={item.label} className="rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-4 text-2xl font-black">{item.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.caption}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold">Biểu đồ doanh thu theo kỳ</h3>
              <p className="text-sm text-muted-foreground">Kết hợp số đơn và doanh thu theo khung báo cáo đã chọn.</p>
            </div>
            <Link to="/admin" className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1">
              Về dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-4 h-[320px]">
            {loading ? (
              <p className="text-sm text-muted-foreground">Đang tải...</p>
            ) : (
              <ChartContainer
                config={{
                  revenue: { label: 'Doanh thu', color: 'hsl(var(--primary))' },
                  orders: { label: 'Đơn hàng', color: 'hsl(var(--chart-2))' }
                }}
                className="h-full"
              >
                <ReLineChart data={seriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="orders" stroke="var(--color-orders)" strokeWidth={2} dot={false} />
                </ReLineChart>
              </ChartContainer>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <h3 className="font-bold">Tín hiệu rủi ro</h3>
            <div className="mt-4 space-y-3 text-sm">
              {issueSummary ? (
                <>
                  <div className="flex items-center justify-between"><span>Đơn hủy</span><span className="font-semibold text-destructive">{issueSummary.cancelled}</span></div>
                  <div className="flex items-center justify-between"><span>Sắp hết hàng</span><span className="font-semibold text-amber-500">{issueSummary.lowStock}</span></div>
                  <div className="flex items-center justify-between"><span>Hết hàng</span><span className="font-semibold text-sale">{issueSummary.outOfStock}</span></div>
                  <div className="flex items-center justify-between"><span>Voucher bị từ chối</span><span className="font-semibold text-muted-foreground">{issueSummary.rejectedVoucher}</span></div>
                  {/* Tỉ lệ đơn hủy */}
                  <div className="mt-4 border-t border-border/70 pt-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Tỉ lệ đơn hủy</p>
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden flex">
                      <div className="h-full bg-destructive transition-all" style={{ width: `${data?.analytics.totalOrders ? Math.min(100, Math.round((issueSummary.cancelled / data.analytics.totalOrders) * 100)) : 0}%` }}></div>
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                      <span>{data?.analytics.totalOrders ? Math.round((issueSummary.cancelled / data.analytics.totalOrders) * 100) : 0}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">Đang tải...</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <h3 className="font-bold">Tổng hợp chi tiết</h3>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-between"><span>Đơn hàng hôm nay</span><span className="font-semibold text-foreground">{data?.analytics.todayOrders || 0}</span></div>
              <div className="flex items-center justify-between"><span>Người dùng đã xác thực</span><span className="font-semibold text-foreground">{data?.analytics.verifiedUsers || 0}</span></div>
              <div className="flex items-center justify-between"><span>SKU sắp hết</span><span className="font-semibold text-foreground">{data?.inventoryReport.summary.lowStockCount || 0}</span></div>
              <div className="flex items-center justify-between"><span>SKU hết hàng</span><span className="font-semibold text-foreground">{data?.inventoryReport.summary.outOfStockCount || 0}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-bold">Cảnh báo tồn kho</h3>
          <p className="mt-1 text-sm text-muted-foreground">Những mặt hàng cần xử lý sớm để tránh đứt hàng.</p>
          <div className="mt-4 space-y-3">
            {inventoryRows.length ? inventoryRows.map((row) => (
              <div key={row.productId} className="rounded-2xl border border-border/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{row.productName}</p>
                    <p className="text-xs text-muted-foreground">{row.category} · ngưỡng {row.threshold}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${row.status === 'out-of-stock' ? 'bg-sale/10 text-sale' : row.status === 'low-stock' ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                    {row.status}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Tồn kho: {row.stock}</span>
                  <span>Đã bán: {row.soldQuantity}</span>
                </div>
              </div>
            )) : <p className="text-sm text-muted-foreground">Chưa có dữ liệu tồn kho.</p>}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold">Cơ cấu vấn đề theo tín hiệu</h3>
              <p className="text-sm text-muted-foreground">Tạm ghép từ trạng thái đơn, voucher và tồn kho để theo dõi rủi ro.</p>
            </div>
            <ShieldAlert className="h-5 w-5 text-primary" />
          </div>

          <div className="mt-4 h-[280px]">
            {loading ? (
              <p className="text-sm text-muted-foreground">Đang tải...</p>
            ) : (
              <ChartContainer
                config={{
                  cancelled: { label: 'Đơn hủy', color: 'hsl(var(--destructive))' },
                  lowStock: { label: 'Sắp hết hàng', color: 'hsl(38 92% 50%)' },
                  outOfStock: { label: 'Hết hàng', color: 'hsl(var(--sale))' },
                  rejectedVoucher: { label: 'Voucher từ chối', color: 'hsl(var(--chart-2))' }
                }}
                className="h-full"
              >
                <BarChart data={issueSummary ? [issueSummary] : []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="total" tickLine={false} axisLine={false} hide />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="cancelled" fill="var(--color-cancelled)" radius={8} />
                  <Bar dataKey="lowStock" fill="var(--color-lowStock)" radius={8} />
                  <Bar dataKey="outOfStock" fill="var(--color-outOfStock)" radius={8} />
                  <Bar dataKey="rejectedVoucher" fill="var(--color-rejectedVoucher)" radius={8} />
                </BarChart>
              </ChartContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mt-4">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-bold">Top sản phẩm bán chạy</h3>
          <p className="mt-1 text-sm text-muted-foreground">Sản phẩm có doanh số cao nhất trong kỳ.</p>
          <div className="mt-4 space-y-3">
            {data?.periodAnalytics.topProducts?.length ? data.periodAnalytics.topProducts.slice(0, 5).map((prod, index) => (
              <div key={prod.productId} className="flex items-center justify-between p-3 rounded-xl border border-border/70 hover:bg-secondary/30 transition">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold truncate max-w-[200px]">{prod.name}</p>
                    <p className="text-xs text-muted-foreground">{prod.quantity} đã bán</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{formatPrice(prod.revenue)}</p>
                </div>
              </div>
            )) : <p className="text-sm text-muted-foreground">Chưa có dữ liệu sản phẩm bán chạy.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}