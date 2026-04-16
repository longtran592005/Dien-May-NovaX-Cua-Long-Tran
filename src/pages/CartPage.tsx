import { Link, useNavigate } from "react-router-dom";
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/data/mockData";
import { getSafeProductImage, handleProductImageError } from "@/lib/productImage";

const CartPage = () => {
  const { items, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (items.length === 0) {
      return;
    }

    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">Giỏ hàng trống</h2>
        <p className="text-muted-foreground mb-4">Bạn chưa thêm sản phẩm nào vào giỏ hàng.</p>
        <Link to="/products" className="inline-flex items-center gap-2 gradient-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
          Khám phá sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Link to="/products" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold">Giỏ hàng ({totalItems} sản phẩm)</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {items.map(item => (
            <div key={item.product.id} className="bg-card rounded-xl border border-border p-4 flex gap-4">
              <Link to={`/product/${item.product.slug}`}>
                <img
                  src={getSafeProductImage(item.product)}
                  alt={item.product.name}
                  onError={(event) => handleProductImageError(event, item.product)}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-lg object-cover"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/product/${item.product.slug}`} className="font-medium text-sm hover:text-primary line-clamp-2">{item.product.name}</Link>
                <p className="text-sale font-bold mt-1">{formatPrice(item.product.price)}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center border border-border rounded-lg">
                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-1.5 hover:bg-secondary"><Minus className="w-3.5 h-3.5" /></button>
                    <span className="px-3 text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-1.5 hover:bg-secondary"><Plus className="w-3.5 h-3.5" /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.product.id)} className="text-muted-foreground hover:text-sale transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button onClick={clearCart} className="text-sm text-muted-foreground hover:text-sale transition-colors">
            Xóa tất cả
          </button>
        </div>

        {/* Order summary */}
        <div>
          <div className="bg-card rounded-xl border border-border p-5 sticky top-24">
            <h3 className="font-bold mb-4">Tóm tắt đơn hàng</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tạm tính</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phí vận chuyển</span>
                <span className="text-success font-medium">Miễn phí</span>
              </div>
              <div className="border-t border-border pt-2 mt-2 flex justify-between font-bold text-base">
                <span>Tổng cộng</span>
                <span className="text-sale">{formatPrice(totalPrice)}</span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full gradient-accent text-accent-foreground py-3 rounded-xl font-semibold mt-4 hover:opacity-90 transition-opacity"
            >
              Tiến hành thanh toán
            </button>
            <Link to="/products" className="block text-center text-sm text-primary mt-3 hover:underline">
              ← Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
