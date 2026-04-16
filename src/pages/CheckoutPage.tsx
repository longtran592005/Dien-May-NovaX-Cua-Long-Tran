import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { createOrder } from '@/services/orderApi';
import { initiatePayment, PaymentMethod } from '@/services/paymentApi';
import { formatPrice } from '@/data/mockData';
import { useCoupon } from '@/hooks/useCoupon';
import { getSafeProductImage, handleProductImageError } from '@/lib/productImage';
import { MapPin, Tag, X, CreditCard, Banknote, Smartphone } from 'lucide-react';

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [paymentQrUrl, setPaymentQrUrl] = useState<string | null>(null);
  const { appliedCoupon, error: couponError, applyCoupon, removeCoupon, calculateDiscount } = useCoupon();
  const [couponCode, setCouponCode] = useState('');
  const navigate = useNavigate();

  // Shipping address form state
  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    province: '',
    district: '',
    ward: '',
    street: '',
    note: '',
  });

  const discount = calculateDiscount(totalPrice);
  const finalTotal = totalPrice - discount;

  const handleApplyCoupon = () => {
    applyCoupon(couponCode, totalPrice);
  };

  // Installment calculator
  const [installmentMonths, setInstallmentMonths] = useState(0);
  const monthlyPayment = installmentMonths > 0 ? Math.ceil(finalTotal / installmentMonths) : 0;

  const placeOrder = async () => {
    if (items.length === 0 || isPlacingOrder) return;
    if (!address.fullName || !address.phone || !address.street) {
      toast.error('Vui lòng nhập đầy đủ thông tin giao hàng');
      return;
    }

    setIsPlacingOrder(true);
    setPaymentQrUrl(null);
    try {
      const order = await createOrder({
        shippingAddressId: 'addr_demo_1',
        paymentMethod,
        note: address.note || 'Checkout page flow',
        total: finalTotal,
        items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity }))
      });

      const payment = await initiatePayment({
        orderId: order.id,
        amount: finalTotal,
        method: paymentMethod,
        returnUrl: `${window.location.origin}/checkout`
      });

      if (payment.method === 'cod') {
        clearCart();
        toast.success(`Đơn hàng ${order.orderNumber} đã được tạo thành công`);
        navigate('/profile');
        return;
      }

      if (payment.qrCodeUrl) {
        setPaymentQrUrl(payment.qrCodeUrl);
      }

      if (payment.redirectUrl) {
        toast.success('Đang chuyển đến cổng thanh toán...');
        window.location.href = payment.redirectUrl;
        return;
      }

      clearCart();
      toast.success(`Đơn hàng ${order.orderNumber} đã được tạo, vui lòng hoàn tất thanh toán`);
      navigate('/profile');
    } catch {
      toast.error('Không thể tạo đơn hàng');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Thanh toán</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Shipping Address */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-bold flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-primary" /> Địa chỉ giao hàng
            </h2>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Họ và tên *</label>
                <input value={address.fullName} onChange={e => setAddress(p => ({ ...p, fullName: e.target.value }))} placeholder="Nguyễn Văn A" className="w-full mt-1 px-3 py-2.5 rounded-lg border border-border bg-card text-sm focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Số điện thoại *</label>
                <input value={address.phone} onChange={e => setAddress(p => ({ ...p, phone: e.target.value }))} placeholder="0901234567" className="w-full mt-1 px-3 py-2.5 rounded-lg border border-border bg-card text-sm focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Tỉnh/Thành phố</label>
                <select value={address.province} onChange={e => setAddress(p => ({ ...p, province: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-lg border border-border bg-card text-sm focus:ring-2 focus:ring-primary outline-none">
                  <option value="">Chọn tỉnh/thành</option>
                  <option value="hcm">TP. Hồ Chí Minh</option>
                  <option value="hn">Hà Nội</option>
                  <option value="dn">Đà Nẵng</option>
                  <option value="hp">Hải Phòng</option>
                  <option value="ct">Cần Thơ</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Quận/Huyện</label>
                <select value={address.district} onChange={e => setAddress(p => ({ ...p, district: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-lg border border-border bg-card text-sm focus:ring-2 focus:ring-primary outline-none">
                  <option value="">Chọn quận/huyện</option>
                  <option value="q1">Quận 1</option>
                  <option value="q3">Quận 3</option>
                  <option value="q7">Quận 7</option>
                  <option value="td">TP. Thủ Đức</option>
                  <option value="bt">Bình Thạnh</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Địa chỉ cụ thể *</label>
                <input value={address.street} onChange={e => setAddress(p => ({ ...p, street: e.target.value }))} placeholder="Số nhà, đường, phường..." className="w-full mt-1 px-3 py-2.5 rounded-lg border border-border bg-card text-sm focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Ghi chú</label>
                <textarea value={address.note} onChange={e => setAddress(p => ({ ...p, note: e.target.value }))} placeholder="Ghi chú cho shipper (tùy chọn)" rows={2} className="w-full mt-1 px-3 py-2.5 rounded-lg border border-border bg-card text-sm focus:ring-2 focus:ring-primary outline-none resize-none" />
              </div>
            </div>
          </div>

          {/* Payment method */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-bold flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-primary" /> Phương thức thanh toán
            </h2>
            <div className="grid md:grid-cols-3 gap-3">
              {[
                { value: 'cod' as const, label: 'Thanh toán khi nhận hàng', icon: Banknote, desc: 'COD - Trả tiền mặt' },
                { value: 'vnpay' as const, label: 'VNPay', icon: CreditCard, desc: 'Thẻ ATM, Visa, MasterCard' },
                { value: 'momo' as const, label: 'MoMo', icon: Smartphone, desc: 'Ví điện tử MoMo' },
              ].map(method => (
                <button
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${paymentMethod === method.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                >
                  <method.icon className={`w-6 h-6 ${paymentMethod === method.value ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="text-sm font-medium">{method.label}</span>
                  <span className="text-xs text-muted-foreground">{method.desc}</span>
                </button>
              ))}
            </div>

            {/* Installment option */}
            <div className="mt-4 p-3 bg-secondary rounded-lg">
              <p className="text-sm font-medium mb-2">💳 Mua trả góp 0% lãi suất</p>
              <div className="flex gap-2 flex-wrap">
                {[0, 3, 6, 12].map(m => (
                  <button key={m} onClick={() => setInstallmentMonths(m)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${installmentMonths === m ? 'gradient-primary text-primary-foreground' : 'bg-card border border-border text-foreground hover:border-primary'}`}>
                    {m === 0 ? 'Trả thẳng' : `${m} tháng`}
                  </button>
                ))}
              </div>
              {installmentMonths > 0 && (
                <p className="text-sm mt-2 text-primary font-medium">
                  Trả mỗi tháng: {formatPrice(monthlyPayment)} × {installmentMonths} tháng
                </p>
              )}
            </div>
          </div>

          {paymentQrUrl && (
            <div className="p-3 rounded-lg border border-border bg-muted/20">
              <p className="text-sm font-semibold mb-2">Quét QR để thanh toán</p>
              <img src={paymentQrUrl} alt="Payment QR" className="w-44 h-44" />
            </div>
          )}
        </div>

        {/* Right column - Order summary */}
        <div>
          <div className="bg-card border border-border rounded-xl p-5 sticky top-24">
            <h3 className="font-bold mb-4">Đơn hàng ({items.length} sản phẩm)</h3>
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3">
                  <img
                    src={getSafeProductImage(item.product)}
                    alt={item.product.name}
                    onError={(event) => handleProductImageError(event, item.product)}
                    className="w-14 h-14 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold">{formatPrice(item.product.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Coupon input */}
            <div className="border-t border-border pt-3 mb-3">
              <p className="text-sm font-medium flex items-center gap-1 mb-2"><Tag className="w-4 h-4 text-accent" /> Mã giảm giá</p>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-success/10 rounded-lg px-3 py-2">
                  <span className="text-sm font-medium text-success">✅ {appliedCoupon.code} — {appliedCoupon.description}</span>
                  <button onClick={removeCoupon}><X className="w-4 h-4 text-muted-foreground hover:text-sale" /></button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="Nhập mã (VD: NOVAX100K)" className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-sm focus:ring-2 focus:ring-primary outline-none" />
                  <button onClick={handleApplyCoupon} className="px-4 py-2 gradient-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90">Áp dụng</button>
                </div>
              )}
              {couponError && <p className="text-xs text-sale mt-1">{couponError}</p>}
            </div>

            {/* Totals */}
            <div className="space-y-2 text-sm border-t border-border pt-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tạm tính</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Giảm giá</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phí vận chuyển</span>
                <span className="text-success font-medium">Miễn phí</span>
              </div>
              <div className="border-t border-border pt-2 mt-2 flex justify-between font-bold text-base">
                <span>Tổng thanh toán</span>
                <span className="text-sale">{formatPrice(finalTotal)}</span>
              </div>
            </div>

            <button
              onClick={() => void placeOrder()}
              disabled={isPlacingOrder || items.length === 0}
              className="mt-4 w-full gradient-accent text-accent-foreground py-3 rounded-xl font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity"
            >
              {isPlacingOrder ? 'Đang tạo đơn...' : `Đặt hàng (${paymentMethod.toUpperCase()})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
