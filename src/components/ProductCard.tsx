import { Link } from "react-router-dom";
import { ShoppingCart, Star } from "lucide-react";
import { Product } from "@/types/product";
import { formatPrice } from "@/data/mockData";
import { useCart } from "@/contexts/CartContext";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();

  return (
    <div className="bg-card rounded-xl border border-border shadow-card card-hover group overflow-hidden flex flex-col">
      <Link to={`/product/${product.slug}`} className="relative overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.discount && product.discount > 0 && (
            <span className="badge-sale">-{product.discount}%</span>
          )}
          {product.isNew && <span className="badge-new">Mới</span>}
        </div>
      </Link>
      <div className="p-3 flex-1 flex flex-col">
        <Link to={`/product/${product.slug}`}>
          <h3 className="text-sm font-medium text-foreground line-clamp-2 hover:text-primary transition-colors min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-1 mt-1">
          <Star className="w-3.5 h-3.5 fill-warning text-warning" />
          <span className="text-xs font-medium text-foreground">{product.rating}</span>
          <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
        </div>
        <div className="mt-2 flex-1">
          <p className="text-base font-bold text-sale">{formatPrice(product.price)}</p>
          {product.originalPrice && (
            <p className="text-xs text-muted-foreground line-through">{formatPrice(product.originalPrice)}</p>
          )}
        </div>
        <button
          onClick={(e) => { e.preventDefault(); addToCart(product); }}
          className="mt-2 w-full flex items-center justify-center gap-1.5 gradient-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <ShoppingCart className="w-4 h-4" />
          Thêm vào giỏ
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
