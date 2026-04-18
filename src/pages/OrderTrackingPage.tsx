import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Package, Truck, CheckCircle, Clock, MapPin, Phone, ChevronRight, ReceiptText } from 'lucide-react';
import { formatPrice } from '@/data/mockData';
import { listOrders } from '@/services/orderApi';
import { listAddresses, Address } from '@/services/authApi';

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

type OrderItem = {
  productId: string;
  quantity: number;
};

type TrackingOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  paymentMethod: 'cod' | 'vnpay' | 'stripe';
  shippingAddressId: string;
  note?: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
};

const statusSteps: Array<{ key: OrderStatus; label: string; icon: typeof Package }> = [
  { key: 'pending', label: 'Đặt hàng thành công', icon: Package },
  { key: 'confirmed', label: 'Đã xác nhận', icon: CheckCircle },
  { key: 'processing', label: 'Đang chuẩn bị hàng', icon: Package },
  { key: 'shipped', label: 'Đang vận chuyển', icon: Truck },
  { key: 'delivered', label: 'Đã giao hàng', icon: CheckCircle }
];

const statusRank: Record<OrderStatus, number> = {
  pending: 0,
  confirmed: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
  cancelled: -1
};

function paymentLabel(method: TrackingOrder['paymentMethod']) {
  if (method === 'cod') return 'Tiền mặt (COD)';
  if (method === 'vnpay') return 'VNPay';
  return 'Stripe';
}

function statusLabel(status: OrderStatus) {
  switch (status) {
    case 'pending':
      return 'Chờ xử lý';
    case 'confirmed':
      return 'Đã xác nhận';
    case 'processing':
      return 'Đang chuẩn bị';
    case 'shipped':
      return 'Đang giao';
    case 'delivered':
      return 'Đã giao';
    case 'cancelled':
      return 'Đã hủy';
  }
}

function statusTone(status: OrderStatus) {
  switch (status) {
    case 'delivered':
      return 'bg-success/10 text-success';
    case 'cancelled':
      return 'bg-sale/10 text-sale';
    case 'shipped':
    case 'processing':
    case 'confirmed':
      return 'bg-primary/10 text-primary';
    default:
      return 'bg-secondary text-muted-foreground';
  }
}

export default function OrderTrackingPage() {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<TrackingOrder[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const initialQuery = searchParams.get('order') || searchParams.get('id') || '';
    if (initialQuery) {
      setSearchValue(initialQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const [ordersResult, addressesResult] = await Promise.allSettled([listOrders(), listAddresses()]);

        if (ordersResult.status === 'fulfilled') {
          setOrders(Array.isArray(ordersResult.value) ? (ordersResult.value as TrackingOrder[]) : []);
        } else {
          setOrders([]);
          setErrorMessage('Không tải được danh sách đơn hàng.');
        }

        if (addressesResult.status === 'fulfilled') {
          setAddresses(addressesResult.value || []);
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, []);

  const addressById = useMemo(() => {
    return new Map(addresses.filter((address) => address.id).map((address) => [address.id as string, address]));
  }, [addresses]);

  const filteredOrders = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) {
      return [...orders].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    }

    return orders.filter((order) => {
      const searchable = [
        order.id,
        order.orderNumber,
        order.shippingAddressId,
        order.paymentMethod,
        order.status,
        ...order.items.map((item) => item.productId)
      ]
        .join(' ')
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [orders, searchValue]);

  const selectedOrder = useMemo(() => {
    if (selectedOrderId) {
      return filteredOrders.find((order) => order.id === selectedOrderId) || null;
    }

    return filteredOrders[0] || null;
  }, [filteredOrders, selectedOrderId]);

  useEffect(() => {
    if (filteredOrders.length > 0 && !selectedOrderId) {
      setSelectedOrderId(filteredOrders[0].id);
    }
  }, [filteredOrders, selectedOrderId]);

  const selectedAddress = selectedOrder?.shippingAddressId ? addressById.get(selectedOrder.shippingAddressId) : undefined;
  const currentStatusIndex = selectedOrder ? statusRank[selectedOrder.status] : -1;

  return (
    <div className="container mx-auto px-4 py-6">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link to="/" className="hover:text-primary">Trang chủ</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Theo dõi đơn hàng</span>
      </nav>

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Theo dõi đơn hàng</h1>
          <p className="text-sm text-muted-foreground">Xem đơn mới nhất sau khi đặt hàng bằng VNPay hoặc COD.</p>
        </div>

        <form onSubmit={(event) => event.preventDefault()} className="max-w-2xl mx-auto">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchValue}
                onChange={(event) => {
                  setSearchValue(event.target.value);
                  setSelectedOrderId(null);
                }}
                placeholder="Nhập mã đơn hàng, mã sản phẩm, hoặc shipping address id..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setSelectedOrderId(filteredOrders[0]?.id || null)}
              className="gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Tra cứu
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">Đơn mới nhất sẽ tự hiện khi bạn vừa đặt hàng.</p>
        </form>

        {isLoading && (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <Clock className="w-16 h-16 mx-auto text-muted-foreground mb-3 opacity-30" />
            <p className="text-muted-foreground">Đang tải đơn hàng...</p>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">{errorMessage}</p>
          </div>
        )}

        {!isLoading && !errorMessage && filteredOrders.length === 0 && (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <ReceiptText className="w-16 h-16 mx-auto text-muted-foreground mb-3 opacity-30" />
            <p className="text-muted-foreground">Không tìm thấy đơn hàng phù hợp.</p>
            <Link to="/products" className="inline-block mt-4 gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold">
              Tiếp tục mua sắm
            </Link>
          </div>
        )}

        {!isLoading && !errorMessage && filteredOrders.length > 0 && (
          <div className="grid lg:grid-cols-[380px,1fr] gap-6">
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`w-full text-left bg-card rounded-2xl border p-4 transition-all ${selectedOrder?.id === order.id ? 'border-primary shadow-md' : 'border-border hover:border-primary/40'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-sm">#{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${statusTone(order.status)}`}>
                      {statusLabel(order.status)}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{paymentLabel(order.paymentMethod)}</span>
                    <span className="font-bold text-sale">{formatPrice(order.total)}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{order.items.length} sản phẩm</span>
                    <span className="flex items-center gap-1"><ChevronRight className="w-4 h-4" /> Chi tiết</span>
                  </div>
                </button>
              ))}
            </div>

            {selectedOrder && (
              <div className="space-y-6">
                <div className="bg-card rounded-xl border border-border p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-bold text-lg">Đơn hàng #{selectedOrder.orderNumber}</h2>
                      <p className="text-sm text-muted-foreground">Ngày đặt: {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                    <span className={`text-sm font-medium px-3 py-1 rounded-full ${statusTone(selectedOrder.status)}`}>
                      {statusLabel(selectedOrder.status)}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Phương thức thanh toán</p>
                      <p className="font-semibold">{paymentLabel(selectedOrder.paymentMethod)}</p>
                    </div>
                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Ghi chú</p>
                      <p className="font-semibold">{selectedOrder.note || 'Không có ghi chú'}</p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-3 mt-3 space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={`${item.productId}-${index}`} className="flex items-center justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">Sản phẩm: {item.productId}</p>
                          <p className="text-xs text-muted-foreground">Số lượng: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border pt-3 mt-3 flex justify-between">
                    <span className="text-sm text-muted-foreground">Tổng cộng</span>
                    <span className="font-bold text-sale">{formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>

                <div className="bg-card rounded-xl border border-border p-5">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Địa chỉ nhận hàng
                  </h3>
                  {selectedAddress ? (
                    <>
                      <p className="text-sm font-medium">{selectedAddress.fullName}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedAddress.streetAddress}, {selectedAddress.ward}, {selectedAddress.district}, {selectedAddress.province}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Phone className="w-3.5 h-3.5" /> {selectedAddress.phone}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Mã địa chỉ: {selectedOrder.shippingAddressId}</p>
                  )}
                </div>

                <div className="bg-card rounded-xl border border-border p-5">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Truck className="w-4 h-4" /> Trạng thái đơn hàng
                  </h3>
                  <div className="space-y-0">
                    {statusSteps.map((step, index) => {
                      const done = selectedOrder.status !== 'cancelled' && currentStatusIndex >= index;
                      return (
                        <div key={step.key} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${done ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                              <step.icon className="w-4 h-4" />
                            </div>
                            {index < statusSteps.length - 1 && <div className={`w-0.5 h-12 ${done ? 'bg-primary' : 'bg-border'}`} />}
                          </div>
                          <div className="pb-8">
                            <p className={`font-medium text-sm ${done ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</p>
                            <p className="text-xs text-muted-foreground">{done ? 'Đã hoàn tất' : 'Đang chờ...'}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
