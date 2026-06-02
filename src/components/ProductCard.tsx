import { Link } from "react-router-dom";
import { ShoppingCart, Star, Heart, GitCompare, ArrowRight, Bell } from "lucide-react";
import { Product } from "@/types/product";
import { formatPrice } from "@/data/mockData";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useComparison } from "@/contexts/ComparisonContext";
import { getSafeProductImage, handleProductImageError } from "@/lib/productImage";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToComparison, isInComparison } = useComparison();
  const wishlisted = isInWishlist(product.id);
  const compared = isInComparison(product.id);
  const availableStock = typeof product.stock === "number" ? product.stock : (product.inStock ? 999 : 0);
  const isPurchasable = product.inStock && availableStock > 0;
  const lowStockThreshold = typeof product.minStockThreshold === 'number' ? product.minStockThreshold : 5;
  const isLowStock = isPurchasable && availableStock <= lowStockThreshold;
  const reorderTarget = typeof product.reorderTarget === 'number' ? product.reorderTarget : 20;
  const stockRatio = isPurchasable ? Math.min(1, availableStock / Math.max(1, reorderTarget)) : 0;
  const hasDiscount = product.discount && product.discount > 0;

  return (
    <div className="bg-card rounded-[2rem] border border-border/40 shadow-soft card-hover group overflow-hidden flex flex-col p-2 relative">
      <Link to={`/product/${product.slug}`} className="relative overflow-hidden rounded-[1.5rem] bg-secondary/30 block">
        <img
          src={getSafeProductImage(product)}
          alt={product.name}
          onError={(event) => handleProductImageError(event, product)}
          className={`w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-700 ease-out ${!isPurchasable ? 'opacity-50 grayscale-[30%]' : ''}`}
          loading="lazy"
        />
        
        {/* Out of stock overlay */}
        {!isPurchasable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
            <span className="rounded-full bg-black/70 px-4 py-2 text-sm font-bold text-white shadow-lg">
              Hết hàng
            </span>
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {hasDiscount && (
            <span className="badge-sale shadow-[0_4px_10px_rgba(255,42,95,0.3)] animate-pulse">-{product.discount}%</span>
          )}
          {isLowStock && <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow-[0_4px_10px_rgba(245,158,11,0.3)]">Sắp hết</span>}
          {product.isNew && <span className="badge-new shadow-[0_4px_10px_rgba(0,176,155,0.3)]">Mới</span>}
        </div>

        {/* Discount savings badge */}
        {hasDiscount && product.originalPrice && (
          <div className="absolute bottom-3 left-3 z-10">
            <span className="rounded-full bg-sale/90 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg backdrop-blur-sm">
              Tiết kiệm {formatPrice(product.originalPrice - product.price)}
            </span>
          </div>
        )}
        
        {/* Quick actions (Glassmorphism) - Slide in from right */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 z-10">
          <button
            onClick={(e) => { e.preventDefault(); toggleWishlist(product); }}
            className={`p-2.5 rounded-full transition-all duration-300 hover:scale-110 ${wishlisted ? 'bg-sale text-white shadow-md' : 'glass text-foreground hover:text-sale'}`}
            title="Yêu thích"
          >
            <Heart className={`w-4 h-4 ${wishlisted ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); addToComparison(product); }}
            className={`p-2.5 rounded-full transition-all duration-300 hover:scale-110 ${compared ? 'bg-primary text-white shadow-md' : 'glass text-foreground hover:text-primary'}`}
            title="So sánh"
          >
            <GitCompare className="w-4 h-4" />
          </button>
        </div>
      </Link>
      
      <div className="px-3 py-3 flex-1 flex flex-col">
        <Link to={`/product/${product.slug}`}>
          <h3 className="text-sm font-normal text-foreground line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem] leading-[20px]">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-1 mt-1.5">
          <Star className="w-3.5 h-3.5 fill-warning text-warning" />
          <span className="text-xs font-bold text-foreground">{product.rating}</span>
          <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
        </div>
        <div className="mt-2 mb-2 flex-1 flex flex-col gap-0.5">
          <div className="flex items-baseline gap-2">
            <p className="text-[16px] font-bold text-sale leading-tight">{formatPrice(product.price)}</p>
            {hasDiscount && (
              <span className="rounded bg-sale/10 px-1.5 py-0.5 text-[10px] font-bold text-sale">-{product.discount}%</span>
            )}
          </div>
          {product.originalPrice && (
            <p className="text-xs text-muted-foreground line-through">{formatPrice(product.originalPrice)}</p>
          )}
          
          {/* Stock indicator */}
          {isPurchasable ? (
            <div className="mt-1.5 space-y-1">
              <p className={`text-xs font-medium ${isLowStock ? 'text-amber-600' : 'text-muted-foreground'}`}>
                {isLowStock ? `Chỉ còn ${availableStock}` : `Còn ${availableStock.toLocaleString('vi-VN')}`} sản phẩm
              </p>
              {/* Mini stock bar */}
              <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    stockRatio > 0.5 ? 'bg-emerald-500' : stockRatio > 0.2 ? 'bg-amber-500' : 'bg-sale'
                  }`}
                  style={{ width: `${Math.max(4, stockRatio * 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="mt-1 text-xs font-bold text-sale">Hết hàng</p>
          )}
        </div>
        
        {/* Premium Add to cart / Notify button */}
        {isPurchasable ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              addToCart(product);
            }}
            className="w-full flex items-center justify-center gap-2 bg-secondary/80 text-foreground py-2.5 rounded-xl text-sm font-bold group-hover:gradient-primary group-hover:text-primary-foreground transition-all duration-300 overflow-hidden relative"
          >
            <div className="absolute inset-0 w-full h-full gradient-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></div>
            <span className="relative z-10 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 group-hover:-translate-y-10 transition-transform duration-300 absolute left-0" />
              <ArrowRight className="w-4 h-4 translate-y-10 group-hover:translate-y-0 transition-transform duration-300 absolute left-0" />
              <span className="ml-6">Thêm vào giỏ</span>
            </span>
          </button>
        ) : (
          <button
            onClick={(e) => { e.preventDefault(); }}
            className="w-full flex items-center justify-center gap-2 bg-secondary/60 text-muted-foreground py-2.5 rounded-xl text-sm font-medium cursor-default border border-border/50"
          >
            <Bell className="w-4 h-4" />
            <span>Thông báo khi có hàng</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
