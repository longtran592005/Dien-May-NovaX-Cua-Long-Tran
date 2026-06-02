import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Clock, Gift, Percent, Plus, Tag, Trash2, Pencil, AlertTriangle, RefreshCw, Zap, Timer, X } from 'lucide-react';

const PROMO_URL = import.meta.env.VITE_PROMOTION_SERVICE_URL || 'http://localhost:4100';

type PromotionRecord = {
  id: string;
  code: string;
  name?: string;
  type?: string;
  status?: string;
  usedCount?: number;
  discountType?: string;
  discountValue?: number;
  minOrderAmount?: number | null;
  maxDiscount?: number | null;
  isExclusive?: boolean;
  startsAt?: string;
  endsAt?: string;
};

type PromotionFormState = {
  code: string;
  name: string;
  type: string;
  discountType: string;
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  isExclusive: boolean;
  status: string;
  startsAt: string;
  endsAt: string;
};

type PromotionPayload = {
  code?: string;
  name: string;
  type: string;
  discountType: string;
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  isExclusive: boolean;
  status: string;
  startsAt?: string;
  endsAt?: string;
  metadata: Record<string, never>;
};

type PromotionPreviewPayload = {
  items: Array<{ productId: string; quantity: number }>;
  couponCode?: string;
};

type PromoTab = 'coupon' | 'flash_sale';

function withTimeout<T>(promise: Promise<T>, timeoutMs = 12000) {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
    promise.then(
      (value) => { window.clearTimeout(timer); resolve(value); },
      (error) => { window.clearTimeout(timer); reject(error); }
    );
  });
}

async function fetchPromotions(signal?: AbortSignal) {
  const res = await withTimeout(fetch(`${PROMO_URL}/promotions/all`, { signal }), 12000);
  if (!res.ok) throw new Error('Failed to load promotions');
  return res.json();
}

function useCountdown(endsAt?: string) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    if (!endsAt) { setRemaining(''); return; }
    const update = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) { setRemaining('Đã hết hạn'); return; }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      if (d > 0) setRemaining(`${d}d ${h}h ${m}m`);
      else setRemaining(`${h}h ${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);
  return remaining;
}

function CountdownBadge({ endsAt }: { endsAt?: string }) {
  const remaining = useCountdown(endsAt);
  if (!remaining) return null;
  const isExpired = remaining === 'Đã hết hạn';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${isExpired ? 'bg-muted text-muted-foreground' : 'bg-amber-500/10 text-amber-600'}`}>
      <Timer className="h-3 w-3" />
      {remaining}
    </span>
  );
}

function PromoStatusBadge({ status }: { status?: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', label: 'Đang hoạt động' },
    draft: { bg: 'bg-slate-500/10', text: 'text-slate-500', label: 'Nháp' },
    expired: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Hết hạn' },
    deleted: { bg: 'bg-sale/10', text: 'text-sale', label: 'Đã xoá' },
    paused: { bg: 'bg-amber-500/10', text: 'text-amber-600', label: 'Tạm dừng' }
  };
  const c = config[status || 'draft'] || config.draft;
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

function PromoTypeBadge({ type }: { type?: string }) {
  if (type === 'coupon' || type === 'cart') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
        <Tag className="h-3 w-3" /> {type === 'coupon' ? 'Mã giảm giá' : 'Giỏ hàng'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sale/10 px-2 py-0.5 text-[11px] font-semibold text-sale">
      <Zap className="h-3 w-3" /> {type === 'bogo' ? 'Mua X tặng Y' : 'Sản phẩm'}
    </span>
  );
}

function SkeletonCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 rounded bg-secondary" />
            <div className="h-5 w-16 rounded-full bg-secondary" />
          </div>
          <div className="mt-4 h-3 w-full rounded bg-secondary" />
          <div className="mt-2 h-3 w-2/3 rounded bg-secondary" />
          <div className="mt-4 flex gap-2">
            <div className="h-6 w-16 rounded-full bg-secondary" />
            <div className="h-6 w-20 rounded-full bg-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}

const defaultForm: PromotionFormState = {
  code: '',
  name: '',
  type: 'coupon',
  discountType: 'percent',
  discountValue: 10,
  minOrderAmount: 0,
  maxDiscount: null,
  isExclusive: false,
  status: 'active',
  startsAt: '',
  endsAt: ''
};

export default function PromotionsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<PromoTab>('coupon');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PromotionRecord | null>(null);
  const [form, setForm] = useState<PromotionFormState>({ ...defaultForm });
  const [formError, setFormError] = useState<string | null>(null);
  const [previewInput, setPreviewInput] = useState({ productId: '', quantity: 1 });
  const [previewResult, setPreviewResult] = useState<unknown>(null);
  const [showPreview, setShowPreview] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['promotions'],
    queryFn: ({ signal }) => fetchPromotions(signal),
    retry: 2,
    retryDelay: 3000,
    refetchOnWindowFocus: false,
    staleTime: 30_000
  });

  const promos = useMemo<PromotionRecord[]>(
    () => (Array.isArray(data) ? data : data?.items ?? []),
    [data]
  );

  const couponPromos = useMemo(
    () => promos.filter(p => p.type === 'coupon' || p.type === 'cart'),
    [promos]
  );
  const flashSalePromos = useMemo(
    () => promos.filter(p => p.type === 'product' || p.type === 'bogo'),
    [promos]
  );

  const activeList = tab === 'coupon' ? couponPromos : flashSalePromos;

  const upsertMutation = useMutation({
    mutationFn: async (payload: PromotionPayload) => {
      const res = await fetch(`${PROMO_URL}/promotions/upsert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Upsert failed');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['promotions'] });
      setShowForm(false);
      setEditing(null);
      setForm({ ...defaultForm });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      else if (import.meta.env.VITE_PROMOTION_ADMIN_KEY) headers['x-api-key'] = String(import.meta.env.VITE_PROMOTION_ADMIN_KEY);

      const res = await fetch(`${PROMO_URL}/promotions/${id}`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) throw new Error('Delete failed');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotions'] })
  });

  const previewMutation = useMutation({
    mutationFn: async (payload: PromotionPreviewPayload) => {
      const res = await withTimeout(fetch(`${PROMO_URL}/promotions/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }), 12000);
      if (!res.ok) throw new Error('Preview failed');
      return res.json();
    }
  });

  function openCreateForm() {
    setEditing(null);
    setForm({
      ...defaultForm,
      type: tab === 'coupon' ? 'coupon' : 'product'
    });
    setFormError(null);
    setShowForm(true);
  }

  function startEdit(p: PromotionRecord) {
    setEditing(p);
    setForm({
      code: p.code,
      name: p.name || p.code,
      type: p.type || 'coupon',
      discountType: p.discountType || 'percent',
      discountValue: p.discountValue ?? 0,
      minOrderAmount: p.minOrderAmount ?? 0,
      maxDiscount: p.maxDiscount ?? null,
      isExclusive: !!p.isExclusive,
      status: p.status || 'draft',
      startsAt: p.startsAt ? new Date(p.startsAt).toISOString().slice(0, 16) : '',
      endsAt: p.endsAt ? new Date(p.endsAt).toISOString().slice(0, 16) : ''
    });
    setFormError(null);
    setShowForm(true);
  }

  async function submitForm(e?: React.FormEvent<HTMLFormElement>) {
    if (e) e.preventDefault();
    setFormError(null);

    if (!form.name || String(form.name).trim().length === 0) {
      setFormError('Tên khuyến mãi là bắt buộc');
      return;
    }
    if (Number(form.discountValue) <= 0) {
      setFormError('Giá trị khuyến mãi phải lớn hơn 0');
      return;
    }
    if (form.startsAt && form.endsAt && new Date(form.startsAt) >= new Date(form.endsAt)) {
      setFormError('Ngày bắt đầu phải trước ngày kết thúc');
      return;
    }

    const payload: PromotionPayload = {
      code: form.code || undefined,
      name: form.name,
      type: form.type,
      discountType: form.discountType,
      discountValue: Number(form.discountValue || 0),
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
      isExclusive: !!form.isExclusive,
      status: form.status,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
      metadata: {}
    };

    await upsertMutation.mutateAsync(payload);
  }

  async function handleDelete(p: PromotionRecord) {
    if (!confirm(`Xác nhận xoá khuyến mãi "${p.name || p.code}"?`)) return;
    try {
      await deleteMutation.mutateAsync(p.id);
    } catch {
      alert('Xoá thất bại');
    }
  }

  async function runPreview() {
    const payload: PromotionPreviewPayload = {
      items: [{ productId: previewInput.productId || 'dummy', quantity: Number(previewInput.quantity || 1) }],
      couponCode: form.code || undefined
    };
    const res = await previewMutation.mutateAsync(payload);
    setPreviewResult(res);
  }

  // ─── ERROR STATE ───
  if (error) {
    return (
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sale/10">
              <AlertTriangle className="h-8 w-8 text-sale" />
            </div>
            <h3 className="text-xl font-bold">Không tải được khuyến mãi</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Hệ thống đã chờ quá lâu hoặc dịch vụ khuyến mãi đang phản hồi chậm. Vui lòng thử lại.
            </p>
            <button
              onClick={() => void refetch()}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5"
            >
              <RefreshCw className="h-4 w-4" /> Thử tải lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── HERO HEADER ─── */}
      <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="p-6 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">Khuyến mãi</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Quản lý khuyến mãi</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
              Tạo và quản lý mã giảm giá cho khách nhập tay, hoặc thiết lập chương trình khuyến mãi tự động theo sản phẩm với countdown thời gian thực.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={openCreateForm}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4" /> Tạo khuyến mãi
              </button>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-semibold transition hover:bg-secondary"
              >
                <Gift className="h-4 w-4" /> Preview Coupon
              </button>
            </div>

            {/* Tab switcher */}
            <div className="mt-5 flex items-center gap-2">
              <button
                onClick={() => setTab('coupon')}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${tab === 'coupon' ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-secondary'}`}
              >
                <Tag className="h-3.5 w-3.5" /> Mã giảm giá
                <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">{couponPromos.length}</span>
              </button>
              <button
                onClick={() => setTab('flash_sale')}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${tab === 'flash_sale' ? 'bg-sale text-white' : 'border border-border hover:bg-secondary'}`}
              >
                <Zap className="h-3.5 w-3.5" /> Flash Sale / Sản phẩm
                <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">{flashSalePromos.length}</span>
              </button>
            </div>
          </div>

          <div className="border-t border-border/70 bg-gradient-to-br from-slate-950 to-slate-900 p-6 text-slate-50 lg:border-l lg:border-t-0 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">Tổng quan</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Tổng khuyến mãi</p>
                <p className="mt-2 text-2xl font-black text-white">{isLoading ? '...' : promos.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Đang hoạt động</p>
                <p className="mt-2 text-2xl font-black text-white">
                  {isLoading ? '...' : promos.filter(p => p.status === 'active').length}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Mã đã sử dụng</p>
                <p className="mt-2 text-2xl font-black text-white">
                  {isLoading ? '...' : promos.reduce((s, p) => s + (p.usedCount || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PREVIEW PANEL ─── */}
      {showPreview && (
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold">Preview Coupon</h3>
              <p className="text-sm text-muted-foreground">Test thử mã giảm giá trước khi áp dụng.</p>
            </div>
            <button onClick={() => setShowPreview(false)} className="rounded-xl border border-border p-2 transition hover:bg-secondary">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <input
              placeholder="Product ID (optional)"
              value={previewInput.productId}
              onChange={(e) => setPreviewInput({ ...previewInput, productId: e.target.value })}
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={previewInput.quantity}
              onChange={(e) => setPreviewInput({ ...previewInput, quantity: Number(e.target.value) })}
              className="w-24 rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
            <button
              onClick={runPreview}
              disabled={previewMutation.isPending}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {previewMutation.isPending ? 'Đang test...' : 'Preview'}
            </button>
          </div>
          {previewResult && (
            <pre className="mt-4 max-h-60 overflow-auto rounded-xl bg-secondary/50 p-4 text-xs">{JSON.stringify(previewResult, null, 2)}</pre>
          )}
        </section>
      )}

      {/* ─── CREATE/EDIT MODAL ─── */}
      {showForm && (
        <section className="rounded-3xl border-2 border-primary/30 bg-card p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">{editing ? `Sửa: ${editing.name || editing.code}` : 'Tạo khuyến mãi mới'}</h3>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="rounded-xl border border-border p-2 transition hover:bg-secondary">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={submitForm} className="mt-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Mã code</label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Để trống = tự sinh" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Tên khuyến mãi *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VD: Giảm 20% đơn mùa hè" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Loại</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm">
                  <option value="coupon">Mã giảm giá (Coupon)</option>
                  <option value="cart">Giỏ hàng (Cart)</option>
                  <option value="product">Sản phẩm (Product)</option>
                  <option value="bogo">Mua X tặng Y (BOGO)</option>
                </select>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Kiểu giảm</label>
                <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm">
                  <option value="percent">Phần trăm (%)</option>
                  <option value="fixed">Cố định (VNĐ)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Giá trị giảm *</label>
                <input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Đơn tối thiểu</label>
                <input type="number" value={form.minOrderAmount ?? ''} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value ? Number(e.target.value) : null })} placeholder="0" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Giảm tối đa</label>
                <input type="number" value={form.maxDiscount ?? ''} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value ? Number(e.target.value) : null })} placeholder="Không giới hạn" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isExclusive} onChange={(e) => setForm({ ...form, isExclusive: e.target.checked })} className="rounded" />
                Exclusive (không kết hợp)
              </label>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-muted-foreground">Trạng thái:</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="rounded-xl border border-border bg-background px-3 py-1.5 text-sm">
                  <option value="draft">Nháp</option>
                  <option value="active">Kích hoạt</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-muted-foreground">Bắt đầu:</label>
                <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className="rounded-xl border border-border bg-background px-3 py-1.5 text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-muted-foreground">Kết thúc:</label>
                <input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} className="rounded-xl border border-border bg-background px-3 py-1.5 text-sm" />
              </div>
            </div>

            {formError && (
              <div className="rounded-xl bg-sale/10 px-4 py-3 text-sm font-medium text-sale">
                {formError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-secondary">
                Huỷ
              </button>
              <button type="submit" disabled={upsertMutation.isPending} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50">
                {upsertMutation.isPending ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ─── STATS ROW ─── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: tab === 'coupon' ? 'Mã giảm giá' : 'Flash Sale', value: activeList.length, icon: tab === 'coupon' ? Tag : Zap, caption: 'Tổng số trong nhóm' },
          { label: 'Đang hoạt động', value: activeList.filter(p => p.status === 'active').length, icon: Clock, caption: 'Promotions đang chạy' },
          { label: 'Nháp', value: activeList.filter(p => p.status === 'draft').length, icon: Pencil, caption: 'Chưa kích hoạt' },
          { label: 'Đã sử dụng', value: activeList.reduce((s, p) => s + (p.usedCount || 0), 0), icon: Percent, caption: 'Tổng lượt áp dụng' }
        ].map(item => (
          <div key={item.label} className="rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-4 text-2xl font-black">{isLoading ? '...' : item.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.caption}</p>
          </div>
        ))}
      </div>

      {/* ─── PROMO CARDS ─── */}
      {isLoading ? (
        <SkeletonCards />
      ) : activeList.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            {tab === 'coupon' ? <Tag className="h-8 w-8 text-muted-foreground" /> : <Zap className="h-8 w-8 text-muted-foreground" />}
          </div>
          <h3 className="text-lg font-bold">Chưa có {tab === 'coupon' ? 'mã giảm giá' : 'chương trình flash sale'}</h3>
          <p className="mt-2 text-sm text-muted-foreground">Tạo {tab === 'coupon' ? 'mã giảm giá' : 'flash sale'} đầu tiên để bắt đầu.</p>
          <button onClick={openCreateForm} className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5">
            <Plus className="h-4 w-4" /> Tạo mới
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {activeList.map(p => (
            <div key={p.id} className="group relative rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold">{p.name || p.code}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground font-mono">{p.code}</p>
                </div>
                <PromoStatusBadge status={p.status} />
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <PromoTypeBadge type={p.type} />
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-foreground">
                  <Percent className="h-3 w-3" />
                  {p.discountType === 'percent' ? `${p.discountValue}%` : `${(p.discountValue || 0).toLocaleString('vi-VN')}₫`}
                </span>
                {p.isExclusive && (
                  <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[11px] font-semibold text-purple-600">
                    Exclusive
                  </span>
                )}
              </div>

              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                {p.startsAt && (
                  <p>Bắt đầu: {new Date(p.startsAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                )}
                {p.endsAt && (
                  <p>Kết thúc: {new Date(p.endsAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                )}
                {p.minOrderAmount ? <p>Đơn tối thiểu: {p.minOrderAmount.toLocaleString('vi-VN')}₫</p> : null}
                {p.maxDiscount ? <p>Giảm tối đa: {p.maxDiscount.toLocaleString('vi-VN')}₫</p> : null}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Đã dùng: <strong className="text-foreground">{p.usedCount || 0}</strong></span>
                  <CountdownBadge endsAt={p.endsAt} />
                </div>
                <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => startEdit(p)} className="rounded-lg border border-border p-1.5 transition hover:bg-secondary" title="Sửa">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(p)} className="rounded-lg border border-border p-1.5 text-sale transition hover:bg-sale/10" title="Xoá">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
