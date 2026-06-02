import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Boxes, Clock3, RefreshCw, ShieldAlert, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  getAdminInventoryReport,
  type AdminInventoryReport,
  type AnalyticsMetricMode,
  type AnalyticsPeriodType
} from '@/services/adminApi';

const periodLabels: Record<AnalyticsPeriodType, string> = {
  month: 'Tháng',
  quarter: 'Quý',
  year: 'Năm'
};

const metricLabels: Record<AnalyticsMetricMode, string> = {
  paid: 'Đã thanh toán',
  delivered: 'Đã giao'
};

const statusLabels = {
  all: 'Tất cả',
  'in-stock': 'Còn hàng',
  'low-stock': 'Sắp hết',
  'out-of-stock': 'Hết hàng'
} as const;

type InventoryStatusFilter = keyof typeof statusLabels;

function buildDatePreset(preset: 'today' | 'yesterday' | 'week' | 'month' | 'year') {
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
  } else {
    start.setFullYear(start.getFullYear() - 1);
    start.setHours(0, 0, 0, 0);
  }

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10)
  };
}

function summarize(report: AdminInventoryReport | null) {
  return {
    totalStock: report?.summary.totalStock || 0,
    lowStockCount: report?.summary.lowStockCount || 0,
    outOfStockCount: report?.summary.outOfStockCount || 0,
    inStockCount: report?.summary.inStockCount || 0,
    totalRows: report?.total || 0
  };
}

export default function InventoryPage() {
  const [periodType, setPeriodType] = useState<AnalyticsPeriodType>('month');
  const [metricMode, setMetricMode] = useState<AnalyticsMetricMode>('paid');
  const [status, setStatus] = useState<InventoryStatusFilter>('all');
  const [startDate, setStartDate] = useState(() => buildDatePreset('month').startDate);
  const [endDate, setEndDate] = useState(() => buildDatePreset('month').endDate);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminInventoryReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await getAdminInventoryReport({
          periodType,
          metricMode,
          status: status === 'all' ? undefined : status,
          startDate,
          endDate,
          page,
          pageSize: 20
        });
        setData(result);
      } catch {
        toast.error('Không tải được báo cáo tồn kho');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [periodType, metricMode, status, startDate, endDate, page]);

  const summary = useMemo(() => summarize(data), [data]);
  const lowStockRows = (data?.items || []).filter((row) => row.status !== 'in-stock').slice(0, 6);
  const selectedPreset = useMemo(() => {
    const current = `${startDate}:${endDate}`;
    const presets: Array<{ key: 'today' | 'yesterday' | 'week' | 'month' | 'year'; label: string }> = [
      { key: 'today', label: 'Hôm nay' },
      { key: 'yesterday', label: 'Hôm qua' },
      { key: 'week', label: '7 ngày' },
      { key: 'month', label: '1 tháng' },
      { key: 'year', label: '1 năm' }
    ];

    return presets.find((preset) => {
      const range = buildDatePreset(preset.key);
      return `${range.startDate}:${range.endDate}` === current;
    })?.label || 'Tùy chỉnh';
  }, [startDate, endDate]);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="p-6 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">Quản lý tồn kho</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Theo dõi hàng hóa theo thời gian thực</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
              Một bảng điều hành tập trung cho số lượng còn lại, sản phẩm sắp hết, hàng đã bán, và các điểm cần xử lý trước khi hết hàng.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => setPage(1)}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5"
              >
                <RefreshCw className="h-4 w-4" />
                Làm mới
              </button>
              <Link
                to="/admin/reporting"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-semibold transition hover:bg-secondary"
              >
                Mở báo cáo tổng quan
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="border-t border-border/70 bg-gradient-to-br from-slate-950 to-slate-900 p-6 text-slate-50 lg:border-l lg:border-t-0 lg:p-8">
            <div className="flex items-center gap-2">
              <Boxes className="h-4 w-4 text-slate-300" />
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">Điểm nhìn nhanh</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Tổng tồn kho</p>
                <p className="mt-2 text-2xl font-black text-white">{loading ? '...' : summary.totalStock.toLocaleString('vi-VN')}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Sắp hết / hết hàng</p>
                <p className="mt-2 text-2xl font-black text-white">{loading ? '...' : `${summary.lowStockCount + summary.outOfStockCount}`}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Khoảng lọc</p>
                <p className="mt-2 text-lg font-semibold text-white">{selectedPreset}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Kỳ báo cáo</span>
            {(Object.keys(periodLabels) as AnalyticsPeriodType[]).map((item) => (
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
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Chế độ tính</span>
            {(Object.keys(metricLabels) as AnalyticsMetricMode[]).map((item) => (
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

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Trạng thái</span>
            {(Object.keys(statusLabels) as InventoryStatusFilter[]).map((item) => (
              <button
                key={item}
                onClick={() => {
                  setStatus(item);
                  setPage(1);
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  status === item ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-secondary'
                }`}
              >
                {statusLabels[item]}
              </button>
            ))}
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={endDate}
              onChange={(event) => {
                setEndDate(event.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Tổng tồn kho', value: loading ? '...' : summary.totalStock.toLocaleString('vi-VN'), caption: 'Số lượng hàng khả dụng', icon: Boxes },
          { label: 'Còn hàng', value: loading ? '...' : summary.inStockCount, caption: 'SKU đang bán được', icon: TrendingDown },
          { label: 'Sắp hết hàng', value: loading ? '...' : summary.lowStockCount, caption: 'Cần nhập thêm', icon: AlertTriangle },
          { label: 'Hết hàng', value: loading ? '...' : summary.outOfStockCount, caption: 'Tạm ngưng bán', icon: ShieldAlert }
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

      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold">Phân bố hàng hóa</h3>
              <p className="text-sm text-muted-foreground">Cái nhìn nhanh theo trạng thái tồn kho trong bộ lọc hiện tại.</p>
            </div>
            <Link to="/admin/products" className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1">
              Chỉnh sản phẩm <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-4 h-[300px]">
            {loading ? (
              <p className="text-sm text-muted-foreground">Đang tải...</p>
            ) : (
              <div className="space-y-4">
                {[
                  { label: 'Còn hàng', value: summary.inStockCount, color: 'bg-emerald-500' },
                  { label: 'Sắp hết', value: summary.lowStockCount, color: 'bg-amber-500' },
                  { label: 'Hết hàng', value: summary.outOfStockCount, color: 'bg-sale' }
                ].map((item) => {
                  const total = Math.max(1, summary.totalRows);
                  const width = Math.max(8, Math.round((item.value / total) * 100));

                  return (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.label}</span>
                        <span className="text-muted-foreground">{item.value}</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-secondary">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
                <p className="text-xs text-muted-foreground">
                  Tỷ lệ hiển thị theo số SKU trong bộ lọc hiện tại, giúp kho nhìn nhanh mặt hàng cần ưu tiên.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-bold">Danh sách cần xử lý</h3>
          <p className="mt-1 text-sm text-muted-foreground">Nhóm hàng có rủi ro hết hàng hoặc cần bổ sung sớm.</p>
          <div className="mt-4 space-y-3">
            {lowStockRows.length ? lowStockRows.map((row) => (
              <div key={row.productId} className="rounded-2xl border border-border/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{row.productName}</p>
                    <p className="text-xs text-muted-foreground">{row.category} · ngưỡng {row.threshold}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${row.status === 'out-of-stock' ? 'bg-sale/10 text-sale' : 'bg-amber-500/10 text-amber-600'}`}>
                    {row.status}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Tồn kho: {row.stock}</span>
                  <span>Đã bán: {row.soldQuantity}</span>
                </div>
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                Không có sản phẩm cần xử lý trong bộ lọc hiện tại.
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold">Danh sách SKU</h3>
            <p className="text-sm text-muted-foreground">Theo dõi hàng hóa theo trang, ngưỡng và trạng thái hiện tại.</p>
          </div>
          <p className="text-sm text-muted-foreground">Trang {data?.page || 1} / {Math.max(1, Math.ceil((data?.total || 0) / (data?.pageSize || 20)))}</p>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Sản phẩm</th>
                <th className="px-4 py-3 font-medium">Danh mục</th>
                <th className="px-4 py-3 font-medium">Tồn kho</th>
                <th className="px-4 py-3 font-medium">Đã bán</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={5}>Đang tải...</td>
                </tr>
              ) : data?.items?.length ? (
                data.items.map((row) => (
                  <tr key={row.productId} className="border-t border-border/70">
                    <td className="px-4 py-3">
                      <p className="font-medium">{row.productName}</p>
                      <p className="text-xs text-muted-foreground">ID: {row.productId}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.category}</td>
                    <td className="px-4 py-3 font-semibold">{row.stock.toLocaleString('vi-VN')}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.soldQuantity.toLocaleString('vi-VN')}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${row.status === 'out-of-stock' ? 'bg-sale/10 text-sale' : row.status === 'low-stock' ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={5}>Không có dữ liệu trong bộ lọc này.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1 || loading}
            className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Trang trước
          </button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock3 className="h-4 w-4" />
            <span>Trang hiện tại: {page}</span>
          </div>
          <button
            onClick={() => setPage((prev) => prev + 1)}
            disabled={loading || (data?.items?.length || 0) < (data?.pageSize || 20)}
            className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Trang sau
          </button>
        </div>
      </section>
    </div>
  );
}