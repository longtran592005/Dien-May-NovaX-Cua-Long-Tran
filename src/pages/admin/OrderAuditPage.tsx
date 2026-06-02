import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Activity, ArrowRight, Copy, Download, FilterX, RotateCcw, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import {
  exportAdminOrderAuditCsv,
  listAdminOrderAudit,
  type AdminOrder,
  type AdminOrderAudit,
  type AdminOrderAuditSummary
} from '@/services/adminApi';
import { formatPrice } from '@/data/mockData';

const statusOptions: Array<'all' | AdminOrder['status']> = [
  'all',
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled'
];

const pageSizeOptions = [20, 50, 100] as const;

const sortOptions = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'discount-high', label: 'Giảm tổng cao nhất' },
  { value: 'discount-low', label: 'Giảm tổng thấp nhất' },
  { value: 'voucher-high', label: 'Giảm voucher cao nhất' },
  { value: 'voucher-low', label: 'Giảm voucher thấp nhất' }
] as const;

function toDateInputValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}

export default function AdminOrderAuditPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<AdminOrderAudit[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<AdminOrderAuditSummary>({
    totalAmount: 0,
    totalDiscount: 0,
    totalVoucherDiscount: 0,
    appliedVoucherCount: 0,
    rejectedVoucherCount: 0,
    voucherOutcomeBreakdown: [],
    statusBreakdown: [],
    pricingSourceBreakdown: []
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [status, setStatus] = useState<'all' | AdminOrder['status']>('all');
  const [sortBy, setSortBy] = useState<(typeof sortOptions)[number]['value']>('newest');
  const [pricingSourceInput, setPricingSourceInput] = useState('');
  const [pricingSource, setPricingSource] = useState('');
  const [hasVoucher, setHasVoucher] = useState<'all' | 'with-voucher' | 'without-voucher'>('all');
  const [voucherOutcome, setVoucherOutcome] = useState<'all' | 'applied' | 'rejected' | 'none'>('all');
  const [minDiscountInput, setMinDiscountInput] = useState('');
  const [minDiscount, setMinDiscount] = useState<number>(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof pageSizeOptions)[number]>(20);
  const hydratedFromQueryRef = useRef(false);

  useEffect(() => {
    if (hydratedFromQueryRef.current) {
      return;
    }

    const queryVoucherCode = (searchParams.get('voucherCode') || '').trim();
    const queryStatus = (searchParams.get('status') || 'all').trim();
    const querySortBy = (searchParams.get('sortBy') || 'newest').trim();
    const queryPricingSource = (searchParams.get('pricingSource') || '').trim();
    const queryHasVoucher = (searchParams.get('hasVoucher') || 'all').trim();
    const queryVoucherOutcome = (searchParams.get('voucherOutcome') || 'all').trim();
    const queryMinDiscount = (searchParams.get('minDiscount') || '').trim();
    const queryStartDate = (searchParams.get('startDate') || '').trim();
    const queryEndDate = (searchParams.get('endDate') || '').trim();
    const queryPage = Number(searchParams.get('page') || '1');
    const queryPageSize = Number(searchParams.get('pageSize') || '20');

    if (queryVoucherCode) {
      setVoucherCodeInput(queryVoucherCode);
      setVoucherCode(queryVoucherCode);
    }
    if (statusOptions.includes(queryStatus as 'all' | AdminOrder['status'])) {
      setStatus(queryStatus as 'all' | AdminOrder['status']);
    }
    if (sortOptions.some((option) => option.value === querySortBy)) {
      setSortBy(querySortBy as (typeof sortOptions)[number]['value']);
    }
    if (queryPricingSource) {
      setPricingSourceInput(queryPricingSource);
      setPricingSource(queryPricingSource);
    }
    if (queryHasVoucher === 'with-voucher' || queryHasVoucher === 'without-voucher') {
      setHasVoucher(queryHasVoucher);
    }
    if (queryVoucherOutcome === 'applied' || queryVoucherOutcome === 'rejected' || queryVoucherOutcome === 'none') {
      setVoucherOutcome(queryVoucherOutcome);
    }
    if (queryMinDiscount) {
      const parsed = Number(queryMinDiscount);
      if (Number.isFinite(parsed) && parsed > 0) {
        setMinDiscountInput(String(parsed));
        setMinDiscount(parsed);
      }
    }
    if (queryStartDate) {
      setStartDate(queryStartDate);
    }
    if (queryEndDate) {
      setEndDate(queryEndDate);
    }
    if (Number.isFinite(queryPage) && queryPage > 0) {
      setPage(Math.floor(queryPage));
    }
    if (pageSizeOptions.includes(queryPageSize as (typeof pageSizeOptions)[number])) {
      setPageSize(queryPageSize as (typeof pageSizeOptions)[number]);
    }

    hydratedFromQueryRef.current = true;
  }, [searchParams]);

  useEffect(() => {
    if (!hydratedFromQueryRef.current) {
      return;
    }

    const next = new URLSearchParams();
    if (voucherCode.trim()) next.set('voucherCode', voucherCode.trim());
    if (status !== 'all') next.set('status', status);
    if (sortBy !== 'newest') next.set('sortBy', sortBy);
    if (pricingSource.trim()) next.set('pricingSource', pricingSource.trim());
    if (hasVoucher !== 'all') next.set('hasVoucher', hasVoucher);
    if (voucherOutcome !== 'all') next.set('voucherOutcome', voucherOutcome);
    if (minDiscount > 0) next.set('minDiscount', String(minDiscount));
    if (startDate.trim()) next.set('startDate', startDate.trim());
    if (endDate.trim()) next.set('endDate', endDate.trim());
    if (page > 1) next.set('page', String(page));
    if (pageSize !== 20) next.set('pageSize', String(pageSize));

    const current = searchParams.toString();
    const target = next.toString();
    if (current !== target) {
      setSearchParams(next, { replace: true });
    }
  }, [voucherCode, status, sortBy, pricingSource, hasVoucher, voucherOutcome, minDiscount, startDate, endDate, page, pageSize, searchParams, setSearchParams]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const normalized = voucherCodeInput.trim();
      if (normalized !== voucherCode) {
        setPage(1);
        setVoucherCode(normalized);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [voucherCodeInput, voucherCode]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const normalized = pricingSourceInput.trim();
      if (normalized !== pricingSource) {
        setPage(1);
        setPricingSource(normalized);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [pricingSourceInput, pricingSource]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const parsed = Number(minDiscountInput.trim() || '0');
      const normalized = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
      if (normalized !== minDiscount) {
        setPage(1);
        setMinDiscount(normalized);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [minDiscountInput, minDiscount]);

  const applyDatePreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - Math.max(0, days - 1));
    setPage(1);
    setStartDate(toDateInputValue(start));
    setEndDate(toDateInputValue(end));
  };

  const clearDatePreset = () => {
    setPage(1);
    setStartDate('');
    setEndDate('');
  };

  const loadAudit = async () => {
    setLoading(true);
    try {
      const data = await listAdminOrderAudit({
        voucherCode,
        status,
        sortBy,
        pricingSource,
        hasVoucher,
        voucherOutcome,
        minDiscount,
        startDate,
        endDate,
        page,
        pageSize
      });
      setItems(data.items);
      setTotal(data.total);
      setSummary(data.summary || {
        totalAmount: 0,
        totalDiscount: 0,
        totalVoucherDiscount: 0,
        appliedVoucherCount: 0,
        rejectedVoucherCount: 0,
        voucherOutcomeBreakdown: [],
        statusBreakdown: [],
        pricingSourceBreakdown: []
      });
    } catch {
      toast.error('Không tải được dữ liệu audit voucher');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);
  const visibleSummary = useMemo(() => {
    return items.reduce(
      (acc, row) => {
        acc.totalAmount += row.total;
        acc.totalDiscount += row.discountAmount;
        acc.totalVoucherDiscount += row.voucherDiscount;
        return acc;
      },
      { totalAmount: 0, totalDiscount: 0, totalVoucherDiscount: 0 }
    );
  }, [items]);
  const dateRangeError = useMemo(() => {
    if (!startDate.trim() || !endDate.trim()) {
      return '';
    }
    if (new Date(startDate).getTime() > new Date(endDate).getTime()) {
      return 'Khoảng ngày không hợp lệ: Từ ngày phải nhỏ hơn hoặc bằng Đến ngày.';
    }
    return '';
  }, [startDate, endDate]);

  const hasDateRangeError = Boolean(dateRangeError);
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    if (hasDateRangeError) {
      return;
    }
    void loadAudit();
  }, [page, pageSize, voucherCode, status, sortBy, pricingSource, hasVoucher, voucherOutcome, minDiscount, startDate, endDate, hasDateRangeError]);

  const activeFilters = useMemo(() => {
    const entries: string[] = [];
    if (voucherCode.trim()) entries.push(`Voucher: ${voucherCode.trim()}`);
    if (status !== 'all') entries.push(`Trang thai: ${status}`);
    if (sortBy !== 'newest') entries.push(`Sap xep: ${sortOptions.find((option) => option.value === sortBy)?.label || sortBy}`);
    if (pricingSource.trim()) entries.push(`Pricing source: ${pricingSource.trim()}`);
    if (hasVoucher !== 'all') entries.push(`Voucher filter: ${hasVoucher}`);
    if (voucherOutcome !== 'all') entries.push(`Voucher outcome: ${voucherOutcome}`);
    if (minDiscount > 0) entries.push(`Giảm tối thiểu: ${formatPrice(minDiscount)}`);
    if (startDate.trim()) entries.push(`Tu ngay: ${startDate.trim()}`);
    if (endDate.trim()) entries.push(`Den ngay: ${endDate.trim()}`);
    if (page > 1) entries.push(`Trang: ${page}`);
    if (pageSize !== 20) entries.push(`Kich thuoc trang: ${pageSize}`);
    return entries;
  }, [voucherCode, status, sortBy, pricingSource, hasVoucher, voucherOutcome, minDiscount, startDate, endDate, page, pageSize]);

  const rejectedVoucherPercent = useMemo(() => {
    if (total <= 0) {
      return 0;
    }
    return Math.round((summary.rejectedVoucherCount * 1000) / total) / 10;
  }, [summary.rejectedVoucherCount, total]);

  const selectedPricingSource = pricingSource.trim().toLowerCase();

  const statusBreakdownWithPercent = useMemo(() => {
    return summary.statusBreakdown.map((entry) => ({
      ...entry,
      percent: total > 0 ? Math.round((entry.count * 1000) / total) / 10 : 0
    }));
  }, [summary.statusBreakdown, total]);

  const pricingSourceBreakdownWithPercent = useMemo(() => {
    return summary.pricingSourceBreakdown.map((entry) => ({
      ...entry,
      percent: total > 0 ? Math.round((entry.count * 1000) / total) / 10 : 0,
      displaySource: entry.source === 'unknown' ? '(không rõ nguồn)' : entry.source
    }));
  }, [summary.pricingSourceBreakdown, total]);

  const voucherOutcomeBreakdownWithPercent = useMemo(() => {
    const labelMap: Record<'applied' | 'rejected' | 'none', string> = {
      applied: 'Áp dụng',
      rejected: 'Từ chối',
      none: 'Không voucher'
    };
    return summary.voucherOutcomeBreakdown.map((entry) => ({
      ...entry,
      label: labelMap[entry.outcome],
      percent: total > 0 ? Math.round((entry.count * 1000) / total) / 10 : 0
    }));
  }, [summary.voucherOutcomeBreakdown, total]);

  const applyRejectedVoucherPreset = () => {

    setPage(1);
    setHasVoucher('all');
    setVoucherOutcome('rejected');
  };

  const handleExport = async () => {
    if (hasDateRangeError) {
      toast.error(dateRangeError);
      return;
    }

    setExporting(true);
    try {
      const data = await exportAdminOrderAuditCsv({
        voucherCode,
        status,
        sortBy,
        pricingSource,
        hasVoucher,
        voucherOutcome,
        minDiscount,
        startDate,
        endDate
      });
      const blob = new Blob([data.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', data.fileName || 'order-voucher-audit.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Đã xuất ${data.totalRows} dòng audit`);
    } catch {
      toast.error('Không thể xuất CSV audit');
    } finally {
      setExporting(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Đã sao chép liên kết bộ lọc');
    } catch {
      toast.error('Không thể sao chép liên kết');
    }
  };

  const resetAllFilters = () => {
    setVoucherCodeInput('');
    setVoucherCode('');
    setStatus('all');
    setSortBy('newest');
    setPricingSourceInput('');
    setPricingSource('');
    setHasVoucher('all');
    setVoucherOutcome('all');
    setMinDiscountInput('');
    setMinDiscount(0);
    setStartDate('');
    setEndDate('');
    setPage(1);
    setPageSize(20);
  };

  const handleReload = async () => {
    if (hasDateRangeError) {
      toast.error(dateRangeError);
      return;
    }
    await loadAudit();
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="p-6 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">Audit & đối soát</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Voucher Audit</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Theo dõi áp dụng mã giảm giá, nguồn pricing và xuất CSV phục vụ đối soát vận hành với bộ lọc mạnh nhưng trình bày gọn.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => void handleReload()}
                disabled={hasDateRangeError}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Làm mới
              </button>
              <button
                onClick={() => void handleExport()}
                disabled={exporting || hasDateRangeError}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-semibold transition hover:bg-secondary disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {exporting ? 'Đang xuất...' : 'Xuất CSV'}
              </button>
              <button onClick={() => void handleCopyLink()} className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-semibold transition hover:bg-secondary">
                <Copy className="h-4 w-4" />
                Copy link
              </button>
            </div>
          </div>

          <div className="border-t border-border/70 bg-gradient-to-br from-slate-950 to-slate-900 p-6 text-slate-50 lg:border-l lg:border-t-0 lg:p-8">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-slate-300" />
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">Cảnh báo nhanh</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Tổng bản ghi</p>
                <p className="mt-2 text-2xl font-black text-white">{total}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Voucher bị từ chối</p>
                <p className="mt-2 text-2xl font-black text-white">{summary.rejectedVoucherCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Tỷ lệ từ chối</p>
                <p className="mt-2 text-2xl font-black text-white">{rejectedVoucherPercent}%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold">Bộ lọc audit</h3>
            <p className="text-sm text-muted-foreground">Kết hợp theo voucher, trạng thái, pricing source, ngày và mức giảm tối thiểu.</p>
          </div>
          <button onClick={resetAllFilters} className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-sm font-medium transition hover:bg-secondary">
            <FilterX className="h-4 w-4" />
            Reset bộ lọc
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-8">
          <input
            value={voucherCodeInput}
            onChange={(event) => {
              setVoucherCodeInput(event.target.value);
            }}
            placeholder="Lọc theo voucher code"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
          />
          <select
            value={status}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value as 'all' | AdminOrder['status']);
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? 'Tất cả trạng thái' : option}
              </option>
            ))}
          </select>
          <input
            value={pricingSourceInput}
            onChange={(event) => {
              setPricingSourceInput(event.target.value);
            }}
            placeholder="Lọc theo pricing source"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
          />
          <select
            value={hasVoucher}
            onChange={(event) => {
              setPage(1);
              setHasVoucher(event.target.value as 'all' | 'with-voucher' | 'without-voucher');
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
            title="Lọc theo trạng thái áp dụng voucher"
          >
            <option value="all">Voucher: Tất cả</option>
            <option value="with-voucher">Voucher: Có áp dụng</option>
            <option value="without-voucher">Voucher: Không áp dụng</option>
          </select>
          <select
            value={voucherOutcome}
            onChange={(event) => {
              setPage(1);
              setVoucherOutcome(event.target.value as 'all' | 'applied' | 'rejected');
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
            title="Kết quả voucher"
          >
            <option value="all">KQ voucher: Tất cả</option>
            <option value="applied">KQ voucher: Áp dụng</option>
            <option value="rejected">KQ voucher: Từ chối</option>
          </select>
          <input
            type="number"
            min={0}
            step={1000}
            value={minDiscountInput}
            onChange={(event) => {
              setMinDiscountInput(event.target.value);
            }}
            placeholder="Giảm tối thiểu"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
            title="Ngưỡng giảm tối thiểu"
          />
          <select
            value={sortBy}
            onChange={(event) => {
              setPage(1);
              setSortBy(event.target.value as (typeof sortOptions)[number]['value']);
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
            title="Sắp xếp"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(event) => {
              setPage(1);
              setStartDate(event.target.value);
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
            title="Từ ngày"
          />
          <input
            type="date"
            value={endDate}
            onChange={(event) => {
              setPage(1);
              setEndDate(event.target.value);
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
            title="Đến ngày"
          />
          <select
            value={pageSize}
            onChange={(event) => {
              setPage(1);
              setPageSize(Number(event.target.value) as (typeof pageSizeOptions)[number]);
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
            title="Số dòng mỗi trang"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} dòng/trang
              </option>
            ))}
          </select>
        </div>

        {activeFilters.length ? (
          <div className="rounded-2xl border border-border bg-muted/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bộ lọc đang áp dụng</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {activeFilters.map((filterItem) => (
                <span key={filterItem} className="rounded-full border border-border bg-background px-2.5 py-1 text-xs">
                  {filterItem}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {hasDateRangeError ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {dateRangeError}
          </div>
        ) : null}

        <div className="rounded-2xl border border-border bg-muted/30 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phân bố trạng thái (toàn bộ kết quả lọc)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={() => {
                setPage(1);
                setStatus('all');
              }}
              className={`rounded-full border px-2.5 py-1 text-xs hover:bg-secondary ${
                status === 'all' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background'
              }`}
            >
              Tất cả: {total}
            </button>
            {statusBreakdownWithPercent.map((entry) => (
              <button
                key={entry.status}
                onClick={() => {
                  setPage(1);
                  setStatus(entry.status);
                }}
                className={`rounded-full border px-2.5 py-1 text-xs hover:bg-secondary ${
                  status === entry.status ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background'
                }`}
              >
                {entry.status}: {entry.count} ({entry.percent}%)
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-muted/30 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phân bố nguồn pricing (toàn bộ kết quả lọc)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={() => {
                setPage(1);
                setPricingSourceInput('');
                setPricingSource('');
              }}
              className={`rounded-full border px-2.5 py-1 text-xs hover:bg-secondary ${
                !selectedPricingSource ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background'
              }`}
            >
              Tất cả: {total}
            </button>
            {pricingSourceBreakdownWithPercent.map((entry) => (
              <button
                key={entry.source}
                onClick={() => {
                  setPage(1);
                  setPricingSourceInput(entry.source);
                  setPricingSource(entry.source);
                }}
                className={`rounded-full border px-2.5 py-1 text-xs hover:bg-secondary ${
                  selectedPricingSource === entry.source.toLowerCase()
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background'
                }`}
              >
                {entry.displaySource}: {entry.count} ({entry.percent}%)
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-muted/30 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phân bố kết quả voucher (toàn bộ kết quả lọc)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={() => {
                setPage(1);
                setHasVoucher('all');
                setVoucherOutcome('all');
              }}
              className={`rounded-full border px-2.5 py-1 text-xs hover:bg-secondary ${
                hasVoucher === 'all' && voucherOutcome === 'all' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background'
              }`}
            >
              Tất cả: {total}
            </button>
            {voucherOutcomeBreakdownWithPercent.map((entry) => (
              <button
                key={entry.outcome}
                onClick={() => {
                  setPage(1);
                  setHasVoucher('all');
                  setVoucherOutcome(entry.outcome);
                }}
                className={`rounded-full border px-2.5 py-1 text-xs hover:bg-secondary ${
                  voucherOutcome === entry.outcome && hasVoucher === 'all'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background'
                }`}
              >
                {entry.label}: {entry.count} ({entry.percent}%)
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Tổng tiền (toàn bộ kết quả lọc)</p>
            <p className="mt-1 text-sm font-semibold">{formatPrice(summary.totalAmount)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Trang hiện tại: {formatPrice(visibleSummary.totalAmount)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Giảm tổng (toàn bộ kết quả lọc)</p>
            <p className="mt-1 text-sm font-semibold">{formatPrice(summary.totalDiscount)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Trang hiện tại: {formatPrice(visibleSummary.totalDiscount)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Giảm voucher (toàn bộ kết quả lọc)</p>
            <p className="mt-1 text-sm font-semibold">{formatPrice(summary.totalVoucherDiscount)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Trang hiện tại: {formatPrice(visibleSummary.totalVoucherDiscount)}</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Đơn có voucher áp dụng</p>
            <p className="mt-1 text-sm font-semibold">{summary.appliedVoucherCount}</p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Đơn có voucher bị từ chối</p>
            <p className="mt-1 text-sm font-semibold">{summary.rejectedVoucherCount}</p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Tỷ lệ từ chối voucher</p>
            <p className="mt-1 text-sm font-semibold">{rejectedVoucherPercent}%</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => applyDatePreset(1)}
            className="rounded-full border border-border px-3 py-1.5 text-xs transition hover:bg-secondary"
          >
            Hôm nay
          </button>
          <button
            onClick={() => applyDatePreset(7)}
            className="rounded-full border border-border px-3 py-1.5 text-xs transition hover:bg-secondary"
          >
            7 ngày
          </button>
          <button
            onClick={() => applyDatePreset(30)}
            className="rounded-full border border-border px-3 py-1.5 text-xs transition hover:bg-secondary"
          >
            30 ngày
          </button>
          <button
            onClick={clearDatePreset}
            className="rounded-full border border-border px-3 py-1.5 text-xs transition hover:bg-secondary"
          >
            Xóa lọc ngày
          </button>
          <button
            onClick={applyRejectedVoucherPreset}
            className="rounded-full border border-border px-3 py-1.5 text-xs transition hover:bg-secondary"
          >
            Chỉ voucher bị từ chối
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Đang tải dữ liệu audit...</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-3xl border border-border bg-background">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left">Đơn hàng</th>
                    <th className="px-3 py-2 text-left">Voucher</th>
                    <th className="px-3 py-2 text-left">Lý do từ chối</th>
                    <th className="px-3 py-2 text-left">Kết quả voucher</th>
                    <th className="px-3 py-2 text-left">Giảm voucher</th>
                    <th className="px-3 py-2 text-left">Giảm tổng</th>
                    <th className="px-3 py-2 text-left">Điểm dùng</th>
                    <th className="px-3 py-2 text-left">Nguồn pricing</th>
                    <th className="px-3 py-2 text-left">Trạng thái</th>
                    <th className="px-3 py-2 text-left">Tổng tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={row.orderId} className="border-t border-border">
                      <td className="px-3 py-2">
                        <Link
                          to={`/admin/orders/${row.orderId}`}
                          className="font-semibold text-primary underline-offset-2 hover:underline"
                        >
                          {row.orderNumber}
                        </Link>
                        <div className="text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleString('vi-VN')}</div>
                      </td>
                      <td className="px-3 py-2">{row.voucherCode || '-'}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{row.voucherRejectedReason || '-'}</td>
                      <td className="px-3 py-2">
                        {row.voucherOutcome === 'applied'
                          ? 'Áp dụng'
                          : row.voucherOutcome === 'rejected'
                            ? 'Từ chối'
                            : 'Không voucher'}
                      </td>
                      <td className="px-3 py-2">{row.voucherDiscount ? formatPrice(row.voucherDiscount) : '-'}</td>
                      <td className="px-3 py-2">{formatPrice(row.discountAmount)}</td>
                      <td className="px-3 py-2">{row.usedPoints}</td>
                      <td className="px-3 py-2">
                        <div>{row.pricingSource || '-'}</div>
                        <div className="text-xs text-muted-foreground">{row.flowVersion || '-'}</div>
                      </td>
                      <td className="px-3 py-2">{row.status}</td>
                      <td className="px-3 py-2 font-semibold text-primary">{formatPrice(row.total)}</td>
                    </tr>
                  ))}
                  {!items.length ? (
                    <tr>
                      <td colSpan={10} className="px-3 py-6 text-center text-muted-foreground">
                        Không có dữ liệu audit phù hợp bộ lọc.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-muted-foreground">
                Trang {page}/{totalPages} · {total} bản ghi
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-secondary disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-secondary disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
