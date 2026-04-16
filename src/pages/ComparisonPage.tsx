import { Link } from "react-router-dom";
import { X, Star } from "lucide-react";
import { useComparison } from "@/contexts/ComparisonContext";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/data/mockData";
import { getSafeProductImage, handleProductImageError } from "@/lib/productImage";

const ComparisonPage = () => {
  const { items, removeFromComparison, clearComparison } = useComparison();
  const { addToCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">So sánh sản phẩm</h1>
        <p className="text-muted-foreground mb-4">Chưa có sản phẩm nào để so sánh.</p>
        <Link to="/products" className="inline-flex items-center gap-2 gradient-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
          Chọn sản phẩm
        </Link>
      </div>
    );
  }

  // Gather all unique spec keys
  const allSpecKeys = Array.from(new Set(items.flatMap(p => Object.keys(p.specs || {}))));

  return (
    <div className="container mx-auto px-4 py-6">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link to="/" className="hover:text-primary">Trang chủ</Link>
        <span>/</span>
        <span className="text-foreground font-medium">So sánh sản phẩm</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">So sánh sản phẩm ({items.length})</h1>
        <button onClick={clearComparison} className="text-sm text-muted-foreground hover:text-sale transition-colors">
          Xóa tất cả
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr>
              <th className="text-left p-3 bg-secondary rounded-tl-xl w-40 text-sm font-semibold">Tiêu chí</th>
              {items.map(product => (
                <th key={product.id} className="p-3 bg-secondary text-center last:rounded-tr-xl">
                  <div className="relative">
                    <button onClick={() => removeFromComparison(product.id)} className="absolute -top-1 -right-1 bg-card rounded-full p-0.5 shadow hover:bg-secondary">
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <Link to={`/product/${product.slug}`}>
                      <img
                        src={getSafeProductImage(product)}
                        alt={product.name}
                        onError={(event) => handleProductImageError(event, product)}
                        className="w-24 h-24 object-cover rounded-lg mx-auto mb-2"
                      />
                      <p className="text-sm font-medium hover:text-primary line-clamp-2">{product.name}</p>
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Price */}
            <tr className="border-b border-border">
              <td className="p-3 text-sm font-medium text-muted-foreground">Giá bán</td>
              {items.map(p => (
                <td key={p.id} className="p-3 text-center">
                  <span className="font-bold text-sale">{formatPrice(p.price)}</span>
                  {p.originalPrice && <p className="text-xs text-muted-foreground line-through">{formatPrice(p.originalPrice)}</p>}
                </td>
              ))}
            </tr>

            {/* Rating */}
            <tr className="border-b border-border bg-secondary/50">
              <td className="p-3 text-sm font-medium text-muted-foreground">Đánh giá</td>
              {items.map(p => (
                <td key={p.id} className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 fill-warning text-warning" />
                    <span className="font-medium">{p.rating}</span>
                    <span className="text-xs text-muted-foreground">({p.reviewCount})</span>
                  </div>
                </td>
              ))}
            </tr>

            {/* Brand */}
            <tr className="border-b border-border">
              <td className="p-3 text-sm font-medium text-muted-foreground">Thương hiệu</td>
              {items.map(p => (
                <td key={p.id} className="p-3 text-center text-sm font-medium">{p.brand}</td>
              ))}
            </tr>

            {/* Dynamic specs */}
            {allSpecKeys.map((key, i) => (
              <tr key={key} className={`border-b border-border ${i % 2 === 0 ? 'bg-secondary/50' : ''}`}>
                <td className="p-3 text-sm font-medium text-muted-foreground">{key}</td>
                {items.map(p => (
                  <td key={p.id} className="p-3 text-center text-sm">{p.specs?.[key] || "—"}</td>
                ))}
              </tr>
            ))}

            {/* Add to cart */}
            <tr>
              <td className="p-3"></td>
              {items.map(p => (
                <td key={p.id} className="p-3 text-center">
                  <button
                    onClick={() => addToCart(p)}
                    className="gradient-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Thêm vào giỏ
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparisonPage;
