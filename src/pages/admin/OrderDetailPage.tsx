import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, Circle, Clock3, Truck } from 'lucide-react';
import { formatPrice } from '@/data/mockData';
import { getAdminOrder, updateAdminOrderStatus, type AdminOrder } from '@/services/adminApi';

const statusOptions: AdminOrder['status'][] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const statusLabel: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy'
};

const timelineFlow: AdminOrder['status'][] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadOrder = async () => {
    if (!id) {
      return;
    }

    setLoading(true);
    try {
      setOrder(await getAdminOrder(id));
    } catch {
      toast.error('Không tải được chi tiết đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrder();
  }, [id]);

  const timelineItems = useMemo(() => {
    if (!order) {
      return [];
    }

    if (order.status === 'cancelled') {
      return [
        { status: 'pending', active: false, done: true, timestamp: order.createdAt },
        { status: 'cancelled', active: true, done: false, timestamp: order.updatedAt }
      ];
    }

    const activeIndex = timelineFlow.indexOf(order.status as AdminOrder['status']);

    return timelineFlow.map((status, index) => ({
      status,
      done: activeIndex > index,
      active: activeIndex === index,
      timestamp: index === 0 ? order.createdAt : order.updatedAt
    }));
  }, [order]);

  const updateStatus = async (status: AdminOrder['status']) => {
    if (!id) {
      return;
    }

    setSaving(true);
    try {
      await updateAdminOrderStatus(id, status);
      toast.success('Đã cập nhật trạng thái đơn hàng');
      await loadOrder();
    } catch {
      toast.error('Không thể cập nhật trạng thái');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Order Detail</p>
            <h2 className="mt-1 text-2xl font-black">Chi tiết đơn hàng</h2>
          </div>
          <Link to="/admin/orders" className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary">
            <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground">Đang tải...</div>
      ) : !order ? (
        <div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground">Không tìm thấy đơn hàng.</div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Mã đơn hàng</p>
                  <p className="font-semibold">{order.orderNumber}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {statusLabel[order.status] || order.status}
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs text-muted-foreground">Khách hàng</p>
                  <p className="font-semibold">{order.userId}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs text-muted-foreground">Địa chỉ giao</p>
                  <p className="font-semibold">{order.shippingAddressId}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs text-muted-foreground">Thanh toán</p>
                  <p className="font-semibold uppercase">{order.paymentMethod}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs text-muted-foreground">Tổng tiền</p>
                  <p className="text-lg font-bold text-primary">{formatPrice(order.total)}</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-border p-3">
                <p className="text-xs text-muted-foreground">Ghi chú</p>
                <p className="font-semibold">{order.note || 'Không có ghi chú'}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-bold">Danh sách sản phẩm</h3>
              <div className="mt-3 space-y-2">
                {order.items.map((item) => (
                  <div key={`${order.id}-${item.productId}`} className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
                    <span>{item.productId}</span>
                    <span className="font-semibold">x{item.quantity}</span>
                  </div>
                ))}
                {order.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Không có sản phẩm.</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-bold">Timeline trạng thái</h3>
              <div className="mt-4 space-y-3">
                {timelineItems.map((item) => (
                  <div key={item.status} className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {item.done ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : item.active ? (
                        <Clock3 className="h-4 w-4 text-warning" />
                      ) : item.status === 'shipped' ? (
                        <Truck className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${item.active ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {statusLabel[item.status] || item.status}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(item.timestamp).toLocaleString('vi-VN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-bold">Cập nhật trạng thái</h3>
              <div className="mt-3 space-y-2">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    onClick={() => void updateStatus(status)}
                    disabled={saving || order.status === status}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm text-left hover:bg-secondary disabled:opacity-60"
                  >
                    {statusLabel[status] || status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
