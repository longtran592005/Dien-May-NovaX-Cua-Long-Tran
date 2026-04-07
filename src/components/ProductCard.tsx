import { Link } from "react-router-dom";
import { ShoppingCart, Star, Heart, GitCompare, ArrowRight } from "lucide-react";
import { Product } from "@/types/product";
import { formatPrice } from "@/data/mockData";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useComparison } from "@/contexts/ComparisonContext";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToComparison, isInComparison } = useComparison();
  const wishlisted = isInWishlist(product.id);
  const compared = isInComparison(product.id);

  return (
    <div className="bg-card rounded-[2rem] border border-border/40 shadow-soft card-hover group overflow-hidden flex flex-col p-2 relative">
      <Link to={`/product/${product.slug}`} className="relative overflow-hidden rounded-[1.5rem] bg-secondary/30 block">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
          loading="lazy"
        />
        
        {/* Badges overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.discount && product.discount > 0 && (
            <span className="badge-sale shadow-[0_4px_10px_rgba(255,42,95,0.3)]">-{product.discount}%</span>
          )}
          {product.isNew && <span className="badge-new shadow-[0_4px_10px_rgba(0,176,155,0.3)]">Mới</span>}
        </div>
        
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
      
      <div className="px-3 py-4 flex-1 flex flex-col">
        <Link to={`/product/${product.slug}`}>
          <h3 className="text-[15px] font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem] leading-snug">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-1.5 mt-2">
          <Star className="w-4 h-4 fill-warning text-warning" />
          <span className="text-xs font-bold text-foreground">{product.rating}</span>
          <span className="text-xs text-muted-foreground font-medium">({product.reviewCount})</span>
        </div>
        <div className="mt-3 mb-3 flex-1 flex items-baseline gap-2">
          <p className="text-lg font-extrabold text-sale tracking-tight">{formatPrice(product.price)}</p>
          {product.originalPrice && (
            <p className="text-xs font-medium text-muted-foreground line-through">{formatPrice(product.originalPrice)}</p>
          )}
        </div>
        
        {/* Premium Add to cart button */}
        <button
          onClick={(e) => { e.preventDefault(); addToCart(product); }}
          className="w-full flex items-center justify-center gap-2 bg-secondary/80 text-foreground py-2.5 rounded-xl text-sm font-bold group-hover:gradient-primary group-hover:text-primary-foreground transition-all duration-300 overflow-hidden relative"
        >
          <div className="absolute inset-0 w-full h-full gradient-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></div>
          <span className="relative z-10 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 group-hover:-translate-y-10 transition-transform duration-300 absolute left-0" />
            <ArrowRight className="w-4 h-4 translate-y-10 group-hover:translate-y-0 transition-transform duration-300 absolute left-0" />
            <span className="ml-6">Thêm vào giỏ</span>
          </span>
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
