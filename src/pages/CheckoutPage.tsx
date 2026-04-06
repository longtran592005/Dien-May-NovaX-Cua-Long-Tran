import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { createOrder } from '@/services/orderApi';
import { initiatePayment, PaymentMethod } from '@/services/paymentApi';
import { formatPrice } from '@/data/mockData';

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [paymentQrUrl, setPaymentQrUrl] = useState<string | null>(null);
  const navigate = useNavigate();

  const placeOrder = async () => {
    if (items.length === 0 || isPlacingOrder) {
      return;
    }

    setIsPlacingOrder(true);
    setPaymentQrUrl(null);
    try {
      const order = await createOrder({
        shippingAddressId: 'addr_demo_1',
        paymentMethod,
        note: 'Checkout page flow',
        total: totalPrice,
        items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity }))
      });

      const payment = await initiatePayment({
        orderId: order.id,
        amount: totalPrice,
        method: paymentMethod,
        returnUrl: `${window.location.origin}/checkout`
      });

      if (payment.method === 'cod') {
        clearCart();
        toast.success(`Don hang ${order.orderNumber} da duoc tao`);
        navigate('/profile');
        return;
      }

      if (payment.qrCodeUrl) {
        setPaymentQrUrl(payment.qrCodeUrl);
      }

      if (payment.redirectUrl) {
        toast.success('Dang chuyen den cong thanh toan...');
        window.location.href = payment.redirectUrl;
        return;
      }

      clearCart();
      toast.success(`Don hang ${order.orderNumber} da duoc tao, vui long hoan tat thanh toan`);
      navigate('/profile');
    } catch {
      toast.error('Khong the tao don hang');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>

      <div className="bg-card border border-border rounded-xl p-5">
        <div className="space-y-3 mb-4">
          {items.map((item) => (
            <div key={item.product.id} className="flex items-center justify-between text-sm">
              <span>
                {item.product.name} x{item.quantity}
              </span>
              <span className="font-semibold">{formatPrice(item.product.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-3 flex items-center justify-between font-bold">
          <span>Tong thanh toan</span>
          <span className="text-sale">{formatPrice(totalPrice)}</span>
        </div>

        <div className="mt-5 border-t border-border pt-4 space-y-2">
          <p className="text-sm font-semibold">Phuong thuc thanh toan</p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="paymentMethod"
              checked={paymentMethod === 'cod'}
              onChange={() => setPaymentMethod('cod')}
            />
            Thanh toan khi nhan hang (COD)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="paymentMethod"
              checked={paymentMethod === 'vnpay'}
              onChange={() => setPaymentMethod('vnpay')}
            />
            VNPay
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="paymentMethod"
              checked={paymentMethod === 'momo'}
              onChange={() => setPaymentMethod('momo')}
            />
            MoMo
          </label>
        </div>

        {paymentQrUrl && (
          <div className="mt-4 p-3 rounded-lg border border-border bg-muted/20">
            <p className="text-sm font-semibold mb-2">Quet QR de thanh toan</p>
            <img src={paymentQrUrl} alt="Payment QR" className="w-44 h-44" />
          </div>
        )}

        <button
          onClick={() => void placeOrder()}
          disabled={isPlacingOrder || items.length === 0}
          className="mt-5 w-full gradient-accent text-accent-foreground py-3 rounded-xl font-semibold disabled:opacity-60"
        >
          {isPlacingOrder ? 'Dang tao don...' : `Dat hang (${paymentMethod.toUpperCase()})`}
        </button>
      </div>
    </div>
  );
}
