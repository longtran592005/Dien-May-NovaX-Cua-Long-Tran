import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, RefreshCw, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/data/mockData';
import { listAdminOrders, updateAdminOrderStatus, type AdminOrder } from '@/services/adminApi';

const statusOptions: AdminOrder['status'][] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AdminOrder['status']>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'value-high' | 'value-low'>('newest');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await listAdminOrders({
        q: search,
        status: statusFilter,
        sortBy,
        page,
        pageSize
      });
      setOrders(data.items);
      setTotal(data.total);
    } catch {
      toast.error('Không tải được danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, [page, search, statusFilter, sortBy]);

  const changeStatus = async (id: string, status: AdminOrder['status']) => {
    setSavingId(id);
    try {
      await updateAdminOrderStatus(id, status);
      toast.success('Đã cập nhật trạng thái đơn hàng');
      await loadOrders();
    } catch {
      toast.error('Không thể cập nhật trạng thái');
    } finally {
      setSavingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const summary = useMemo(() => {
    const pageRevenue = orders.reduce((sum, order) => sum + order.total, 0);

    return {
      pending: orders.filter((order) => order.status === 'pending').length,
      processing: orders.filter((order) => order.status === 'processing').length,
      shipped: orders.filter((order) => order.status === 'shipped').length,
      revenue: pageRevenue
    };
  }, [orders]);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="p-6 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">Vận hành đơn hàng</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Quản lý đơn hàng</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Theo dõi, lọc và cập nhật trạng thái đơn theo một luồng xử lý ngắn gọn, tập trung vào tốc độ thao tác.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/admin/reporting" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5">
                Mở báo cáo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button onClick={() => void loadOrders()} className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-semibold transition hover:bg-secondary">
                <RefreshCw className="h-4 w-4" />
                Làm mới
              </button>
            </div>
          </div>

          <div className="border-t border-border/70 bg-gradient-to-br from-slate-950 to-slate-900 p-6 text-slate-50 lg:border-l lg:border-t-0 lg:p-8">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-slate-300" />
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">Tổng quan trang</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Đơn chờ xử lý</p>
                <p className="mt-2 text-2xl font-black text-white">{summary.pending}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Đang xử lý</p>
                <p className="mt-2 text-2xl font-black text-white">{summary.processing}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Đang giao</p>
                <p className="mt-2 text-2xl font-black text-white">{summary.shipped}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Doanh số trang</p>
                <p className="mt-2 text-2xl font-black text-white">{formatPrice(summary.revenue)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold">Danh sách đơn hàng</h3>
            <p className="text-sm text-muted-foreground">Lọc theo trạng thái, sắp xếp theo giá trị và đổi trạng thái ngay tại danh sách.</p>
          </div>
          <button onClick={() => void loadOrders()} className="rounded-full border border-border bg-background px-3 py-2 text-sm font-medium transition hover:bg-secondary">
            Làm mới
          </button>
        </div>

        <div className="mt-4 grid gap-3 rounded-2xl border border-border/70 bg-muted/20 p-3 md:grid-cols-3">
          <input
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Tìm theo mã đơn hoặc khách"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
          />
          <select
            value={statusFilter}
            onChange={(event) => {
              setPage(1);
              setStatusFilter(event.target.value as 'all' | AdminOrder['status']);
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(event) => {
              setPage(1);
              setSortBy(event.target.value as 'newest' | 'oldest' | 'value-high' | 'value-low');
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="value-high">Giá trị cao nhất</option>
            <option value="value-low">Giá trị thấp nhất</option>
          </select>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">Đang tải...</p>
        ) : (
          <div className="mt-4 space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="rounded-2xl border border-border p-4 transition hover:bg-secondary/30">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      Khách: {order.userId} · {order.items.length} sản phẩm · {new Date(order.createdAt).toLocaleString('vi-VN')}
                    </p>
                    <p className="mt-1 text-sm font-bold text-primary">{formatPrice(order.total)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={order.status}
                      onChange={(e) => void changeStatus(order.id, e.target.value as AdminOrder['status'])}
                      disabled={savingId === order.id}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">{order.paymentMethod}</span>
                    <Link to={`/admin/orders/${order.id}`} className="rounded-lg border border-border px-3 py-2 text-xs font-medium transition hover:bg-secondary">
                      Chi tiết
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            {!orders.length ? <p className="text-sm text-muted-foreground">Không có đơn hàng phù hợp bộ lọc.</p> : null}

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Trang {page}/{totalPages} · {total} đơn hàng
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs transition hover:bg-secondary disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs transition hover:bg-secondary disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
