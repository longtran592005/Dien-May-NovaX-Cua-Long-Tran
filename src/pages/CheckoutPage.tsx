import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { createOrder } from '@/services/orderApi';
import { initiatePayment, PaymentMethod } from '@/services/paymentApi';
import { listAddresses, me, Address } from '@/services/authApi';
import { formatPrice } from '@/data/mockData';
import { useCoupon } from '@/hooks/useCoupon';
import { getSafeProductImage, handleProductImageError } from '@/lib/productImage';
import { MapPin, Tag, X, CreditCard, Banknote, Smartphone, Zap, CheckCircle2, ChevronRight, Plus } from 'lucide-react';

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('vnpay');
  const [deliveryMethod, setDeliveryMethod] = useState<'standard' | '2h'>('standard');
  const [usePoints, setUsePoints] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [userAddresses, setUserAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  
  const { appliedCoupon, error: couponError, applyCoupon, removeCoupon, calculateDiscount } = useCoupon();
  const [couponCode, setCouponCode] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profile, addresses] = await Promise.all([me(), listAddresses()]);
        setUserPoints(profile.points || 0);
        setUserAddresses(addresses);
        const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
        if (defaultAddr) setSelectedAddressId(defaultAddr.id || null);
      } catch (err) {
        console.error('Failed to fetch user data', err);
      }
    };
    fetchData();
  }, []);

  const discount = calculateDiscount(totalPrice);
  
  // Point values: 1 point = 1,000 VND
  const pointValue = userPoints * 1000;
  const maxPointSpend = Math.floor(totalPrice * 0.5); // Max 50% discount from points
  const pointsToUse = Math.min(pointValue, maxPointSpend);
  const pointRedemption = usePoints ? pointsToUse : 0;
  
  const shippingFee = deliveryMethod === '2h' ? 50000 : 0;
  const finalTotal = totalPrice - discount - pointRedemption + shippingFee;

  const handleApplyCoupon = () => {
    applyCoupon(couponCode, totalPrice);
  };

  const placeOrder = async () => {
    if (items.length === 0 || isPlacingOrder) return;
    if (!selectedAddressId) {
      toast.error('Vui lòng chọn địa chỉ giao hàng');
      return;
    }

    setIsPlacingOrder(true);
    try {
      const order = await createOrder({
        shippingAddressId: selectedAddressId,
        paymentMethod,
        deliveryMethod,
        note: 'Ecosystem Order',
        total: finalTotal,
        subtotal: totalPrice,
        shippingFee,
        discountAmount: discount,
        usedPoints: usePoints ? Math.floor(pointsToUse / 1000) : 0,
        items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity }))
      });

      const payment = await initiatePayment({
        orderId: order.id,
        amount: finalTotal,
        method: paymentMethod,
        returnUrl: `${window.location.origin}/order-tracking?order=${encodeURIComponent(order.orderNumber)}`
      });

      if (payment.method === 'cod') {
        clearCart();
        toast.success(`Đơn hàng ${order.orderNumber} đã được tạo thành công`);
        navigate(`/order-tracking?order=${encodeURIComponent(order.orderNumber)}`);
        return;
      }

      if (payment.redirectUrl) {
        toast.success('Đang chuyển đến cổng thanh toán...');
        window.location.href = payment.redirectUrl;
        return;
      }

      clearCart();
      navigate('/order-tracking');
    } catch (err: any) {
      toast.error(err.message || 'Không thể tạo đơn hàng');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
        <h1 className="text-2xl font-bold">Thanh toán & Đặt hàng</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address Selection */}
          <div className="bg-card border border-border shadow-sm rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold flex items-center gap-2 text-lg">
                <MapPin className="w-5 h-5 text-primary" /> Địa chỉ giao hàng
              </h2>
              <button 
                onClick={() => navigate('/profile')} 
                className="text-primary text-sm font-medium flex items-center gap-1 hover:underline"
              >
                <Plus className="w-4 h-4" /> Thêm địa chỉ mới
              </button>
            </div>
            
            <div className="grid gap-4">
              {userAddresses.length > 0 ? (
                userAddresses.map(addr => (
                  <button
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id || null)}
                    className={`text-left p-4 rounded-xl border-2 transition-all relative ${selectedAddressId === addr.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold">{addr.fullName}</span>
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                            {addr.label}
                          </span>
                          {addr.isDefault && <CheckCircle2 className="w-4 h-4 text-success" />}
                        </div>
                        <p className="text-sm text-muted-foreground">{addr.phone}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {addr.streetAddress}, {addr.ward}, {addr.district}, {addr.province}
                        </p>
                      </div>
                      {selectedAddressId === addr.id && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-border rounded-xl">
                  <p className="text-muted-foreground mb-4">Bạn chưa có địa chỉ lưu sẵn</p>
                  <button onClick={() => navigate('/profile')} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold">Thêm địa chỉ ngay</button>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Method */}
          <div className="bg-card border border-border shadow-sm rounded-2xl p-6">
            <h2 className="font-bold mb-6 text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-sale" /> Hình thức giao hàng
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => setDeliveryMethod('standard')}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${deliveryMethod === 'standard' ? 'border-primary bg-primary/5' : 'border-border'}`}
              >
                <div className={`p-3 rounded-full ${deliveryMethod === 'standard' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">Giao hàng tiêu chuẩn</p>
                  <p className="text-xs text-muted-foreground">Miễn phí • Dự kiến 2-3 ngày</p>
                </div>
              </button>
              <button
                onClick={() => setDeliveryMethod('2h')}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${deliveryMethod === '2h' ? 'border-sale bg-sale/5' : 'border-border'}`}
              >
                <div className={`p-3 rounded-full ${deliveryMethod === '2h' ? 'bg-sale text-white' : 'bg-secondary'}`}>
                  <Zap className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm text-sale">Giao nhanh 2H</p>
                  <p className="text-xs text-muted-foreground">Phí 50.000đ • Giao ngay lập tức</p>
                </div>
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-card border border-border shadow-sm rounded-2xl p-6">
            <h2 className="font-bold mb-6 text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" /> Phương thức thanh toán
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { value: 'vnpay' as const, label: 'VNPay QR', icon: CreditCard, desc: 'ATM/Visa/MasterCard' },
                { value: 'cod' as const, label: 'Tiền mặt', icon: Banknote, desc: 'Khi nhận hàng' },
              ].map(method => (
                <button
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value)}
                  className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all ${paymentMethod === method.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                >
                  <method.icon className={`w-8 h-8 ${paymentMethod === method.value ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="font-bold text-sm tracking-tight">{method.label}</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">{method.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right column - Summary */}
        <div className="space-y-6">
          <div className="bg-card border border-border shadow-lg rounded-2xl p-6 sticky top-24 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <h3 className="font-bold mb-6 text-lg">Tóm tắt đơn hàng</h3>
            
            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-3">
                  <div className="relative">
                    <img
                      src={getSafeProductImage(item.product)}
                      alt={item.product.name}
                      onError={(event) => handleProductImageError(event, item.product)}
                      className="w-16 h-16 rounded-xl object-cover border border-border"
                    />
                    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-card">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">{formatPrice(item.product.price)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Loyalty Points Redemption */}
            <div className="bg-secondary/50 rounded-xl p-4 mb-6 border border-primary/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold flex items-center gap-1.5">
                  ✨ NovaPoints ({userPoints})
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={usePoints} 
                    disabled={userPoints === 0}
                    onChange={() => setUsePoints(!usePoints)} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {userPoints > 0 
                  ? `Sử dụng điểm để được giảm giá. Bạn có thể giảm tối đa ${formatPrice(maxPointSpend)} (50% đơn hàng).`
                  : 'Bạn chưa có điểm tích lũy. Mua sắm ngay để tích 1% giá trị.'}
              </p>
            </div>

            {/* Vouchers */}
            <div className="mb-6">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    value={couponCode} 
                    onChange={e => setCouponCode(e.target.value)} 
                    placeholder="Mã giảm giá..." 
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-card text-xs focus:ring-2 focus:ring-primary outline-none" 
                  />
                </div>
                <button 
                  onClick={handleApplyCoupon} 
                  className="px-4 py-2 bg-foreground text-background rounded-xl text-xs font-bold hover:opacity-90"
                >
                  Dùng
                </button>
              </div>
              {appliedCoupon && (
                <div className="mt-2 flex items-center justify-between text-xs bg-success/10 text-success p-2 rounded-lg font-bold">
                  <span>Mã: {appliedCoupon.code} (-{formatPrice(discount)})</span>
                  <button onClick={removeCoupon}><X className="w-3 h-3" /></button>
                </div>
              )}
            </div>

            <div className="space-y-3 py-4 border-t border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tạm tính</span>
                <span className="font-medium">{formatPrice(totalPrice)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span>Mã giảm giá</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              {pointRedemption > 0 && (
                <div className="flex justify-between text-sm text-primary">
                  <span>NovaPoints</span>
                  <span>-{formatPrice(pointRedemption)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Phí vận chuyển</span>
                <span className={shippingFee === 0 ? 'text-success font-bold' : ''}>
                  {shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}
                </span>
              </div>
              <div className="pt-4 mt-2 border-t border-border flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Tổng cộng</p>
                  <p className="text-2xl font-black text-sale leading-none">{formatPrice(finalTotal)}</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] text-success font-bold">+ {Math.floor(finalTotal / 10000)} Points</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => void placeOrder()}
              disabled={isPlacingOrder || items.length === 0}
              className="mt-6 w-full gradient-accent text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-accent/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isPlacingOrder ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang xử lý...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 uppercase">
                  <span>Đặt hàng ngay</span>
                  <ChevronRight className="w-5 h-5" />
                </div>
              )}
            </button>
            <p className="text-[10px] text-center text-muted-foreground mt-4 leading-relaxed">
              Nhấn "Đặt hàng" đồng nghĩa với việc bạn đồng ý với <span className="underline">Điều khoản & Điều kiện</span> của NovaX.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
