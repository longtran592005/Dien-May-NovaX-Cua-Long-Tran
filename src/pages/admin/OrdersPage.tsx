import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6">
        <h2 className="text-2xl font-black">Quản lý đơn hàng</h2>
        <p className="mt-2 text-sm text-muted-foreground">Xem danh sách, trạng thái và cập nhật tiến trình giao hàng.</p>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-bold">Danh sách đơn hàng</h3>
          <button onClick={() => void loadOrders()} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-secondary">
            Làm mới
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
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
              <div key={order.id} className="rounded-2xl border border-border p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">Khách: {order.userId} · {order.items.length} sản phẩm · {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
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
                    <Link to={`/admin/orders/${order.id}`} className="rounded-lg border border-border px-3 py-2 text-xs hover:bg-secondary">
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
          </div>
        )}
      </div>
    </div>
  );
}
