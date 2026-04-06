import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShoppingCart, Zap, Star, ChevronLeft, ThumbsUp, ThumbsDown, Minus, Plus } from "lucide-react";
import { products as fallbackProducts, reviews, formatPrice } from "@/data/mockData";
import { useCart } from "@/contexts/CartContext";
import RecommendationSection from "@/components/RecommendationSection";
import { Product } from "@/types/product";
import { fetchProductBySlug, fetchProducts } from "@/services/catalogApi";

const ProductDetail = () => {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState<"desc" | "specs" | "reviews">("desc");
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>(fallbackProducts);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadProduct = async () => {
      if (!slug) {
        setProduct(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [detail, list] = await Promise.all([
          fetchProductBySlug(slug),
          fetchProducts({ page: 1, pageSize: 100 })
        ]);

        if (isMounted) {
          setProduct(detail);
          setAllProducts(list.items.length > 0 ? list.items : fallbackProducts);
        }
      } catch {
        if (isMounted) {
          setProduct(fallbackProducts.find((item) => item.slug === slug) || null);
          setAllProducts(fallbackProducts);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProduct();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-lg text-muted-foreground">Dang tai thong tin san pham...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-lg text-muted-foreground">Sản phẩm không tồn tại.</p>
        <Link to="/products" className="text-primary font-medium mt-2 inline-block hover:underline">← Quay lại</Link>
      </div>
    );
  }

  const similarProducts = allProducts.filter(p => p.category === product.category && p.id !== product.id);
  const crossSellProducts = allProducts.filter(p => p.category !== product.category).slice(0, 6);

  const tabs = [
    { key: "desc" as const, label: "Mô tả" },
    { key: "specs" as const, label: "Thông số kỹ thuật" },
    { key: "reviews" as const, label: `Đánh giá (${reviews.length})` },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link to="/" className="hover:text-primary">Trang chủ</Link>
        <span>/</span>
        <Link to={`/products?category=${product.category}`} className="hover:text-primary">{product.category}</Link>
        <span>/</span>
        <span className="text-foreground font-medium line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div>
          <div className="bg-card rounded-xl border border-border overflow-hidden mb-3">
            <img
              src={product.images[selectedImage]}
              alt={product.name}
              className="w-full aspect-square object-cover"
            />
          </div>
          <div className="flex gap-2">
            {product.images.map((img, i) => (
              <button key={i} onClick={() => setSelectedImage(i)}
                className={`w-16 h-16 rounded-lg border overflow-hidden ${i === selectedImage ? 'border-primary ring-2 ring-primary/30' : 'border-border'}`}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div>
          <div className="flex gap-2 mb-2">
            {product.isNew && <span className="badge-new">Mới</span>}
            {product.isBestSeller && <span className="bg-warning text-warning-foreground text-xs font-bold px-2 py-0.5 rounded">Bán chạy</span>}
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground mb-2">{product.name}</h1>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-warning text-warning' : 'text-border'}`} />
              ))}
            </div>
            <span className="text-sm font-medium">{product.rating}</span>
            <span className="text-sm text-muted-foreground">({product.reviewCount} đánh giá)</span>
          </div>

          <div className="bg-secondary rounded-xl p-4 mb-4">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl md:text-3xl font-extrabold text-sale">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <span className="text-lg text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
              )}
            </div>
            {product.discount && (
              <p className="text-sm text-sale font-medium mt-1">Tiết kiệm {formatPrice(product.originalPrice! - product.price)} ({product.discount}%)</p>
            )}
          </div>

          {product.specs && (
            <div className="mb-4 space-y-1.5">
              {Object.entries(product.specs).slice(0, 4).map(([key, val]) => (
                <div key={key} className="flex text-sm">
                  <span className="text-muted-foreground w-32">{key}:</span>
                  <span className="font-medium">{val}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-muted-foreground">Số lượng:</span>
            <div className="flex items-center border border-border rounded-lg">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-secondary"><Minus className="w-4 h-4" /></button>
              <span className="px-4 font-medium">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="p-2 hover:bg-secondary"><Plus className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { for (let i = 0; i < quantity; i++) addToCart(product); }}
              className="flex-1 flex items-center justify-center gap-2 gradient-accent text-accent-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              <Zap className="w-5 h-5" /> Mua ngay
            </button>
            <button
              onClick={() => { for (let i = 0; i < quantity; i++) addToCart(product); }}
              className="flex items-center justify-center gap-2 border-2 border-primary text-primary px-6 py-3 rounded-xl font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <ShoppingCart className="w-5 h-5" /> Thêm giỏ
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8">
        <div className="flex border-b border-border">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="py-6">
          {activeTab === "desc" && (
            <div className="prose max-w-none text-foreground">
              <p>{product.description}</p>
            </div>
          )}
          {activeTab === "specs" && product.specs && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {Object.entries(product.specs).map(([key, val], i) => (
                <div key={key} className={`flex px-4 py-3 text-sm ${i % 2 === 0 ? 'bg-secondary' : ''}`}>
                  <span className="text-muted-foreground w-48">{key}</span>
                  <span className="font-medium">{val}</span>
                </div>
              ))}
            </div>
          )}
          {activeTab === "reviews" && (
            <div className="space-y-4">
              {/* AI-ready sentiment summary */}
              <div className="bg-secondary rounded-xl p-4 mb-4">
                <p className="text-sm font-medium mb-2">📊 Tóm tắt đánh giá <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-1">AI Ready</span></p>
                <div className="flex gap-4 text-sm">
                  <span className="flex items-center gap-1 text-success"><ThumbsUp className="w-4 h-4" /> Tích cực: 60%</span>
                  <span className="flex items-center gap-1 text-muted-foreground">Trung lập: 20%</span>
                  <span className="flex items-center gap-1 text-sale"><ThumbsDown className="w-4 h-4" /> Tiêu cực: 20%</span>
                </div>
              </div>
              {reviews.map(review => (
                <div key={review.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {review.userName[0]}
                      </div>
                      <span className="font-medium text-sm">{review.userName}</span>
                      {review.sentiment && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          review.sentiment === 'positive' ? 'bg-success/10 text-success' :
                          review.sentiment === 'negative' ? 'bg-sale/10 text-sale' : 'bg-muted text-muted-foreground'
                        }`}>
                          {review.sentiment === 'positive' ? '👍 Tích cực' : review.sentiment === 'negative' ? '👎 Tiêu cực' : '😐 Trung lập'}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{review.date}</span>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-warning text-warning' : 'text-border'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-foreground">{review.comment}</p>
                  <div className="mt-2 text-xs text-muted-foreground">👍 {review.helpful} người thấy hữu ích</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Recommendation Sections */}
      <RecommendationSection title="Sản phẩm tương tự" icon="🔄" products={similarProducts} aiLabel="AI Recommendation" />
      <RecommendationSection title="Khách hàng cũng mua" icon="🛒" products={crossSellProducts} aiLabel="Cross-sell AI" />
    </div>
  );
};

export default ProductDetail;
