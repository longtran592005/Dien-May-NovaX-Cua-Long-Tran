import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShoppingCart, Zap, Star, ThumbsUp, ThumbsDown, Minus, Plus, Heart, GitCompare, Camera, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { products as fallbackProducts, reviews as mockReviews, formatPrice } from "@/data/mockData";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useComparison } from "@/contexts/ComparisonContext";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import RecommendationSection from "@/components/RecommendationSection";
import { Product } from "@/types/product";
import { Review } from "@/types/product";
import { fetchProductBySlug, fetchProducts } from "@/services/catalogApi";

const ProductDetail = () => {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToComparison, isInComparison } = useComparison();
  const { addToRecentlyViewed } = useRecentlyViewed();
  const [activeTab, setActiveTab] = useState<"desc" | "specs" | "reviews">("desc");
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>(fallbackProducts);
  const [isLoading, setIsLoading] = useState(true);

  // User review form
  const [userReviews, setUserReviews] = useState<Review[]>(mockReviews);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });

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
    setSelectedImage(0);
    setQuantity(1);

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Track recently viewed
  useEffect(() => {
    if (product) {
      addToRecentlyViewed(product);
    }
  }, [product, addToRecentlyViewed]);

  const handleSubmitReview = () => {
    if (!newReview.comment.trim()) return;
    const review: Review = {
      id: `r_${Date.now()}`,
      userName: "Bạn",
      rating: newReview.rating,
      comment: newReview.comment,
      date: new Date().toISOString().split("T")[0],
      sentiment: newReview.rating >= 4 ? "positive" : newReview.rating >= 3 ? "neutral" : "negative",
      helpful: 0,
    };
    setUserReviews(prev => [review, ...prev]);
    setNewReview({ rating: 5, comment: "" });
    setShowReviewForm(false);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="animate-pulse space-y-6 max-w-4xl mx-auto">
          <div className="h-4 bg-secondary rounded w-48 mb-8"></div>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="aspect-square bg-secondary rounded-[2rem]"></div>
            <div className="space-y-6 text-left">
              <div className="h-10 bg-secondary rounded-xl w-3/4"></div>
              <div className="h-6 bg-secondary rounded w-1/4"></div>
              <div className="h-20 bg-secondary rounded-2xl w-full"></div>
              <div className="h-14 bg-secondary rounded-2xl w-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-md mx-auto bg-card rounded-[2rem] shadow-soft border border-border/50 p-12">
          <p className="text-xl font-bold mb-2">Sản phẩm không tồn tại</p>
          <p className="text-muted-foreground mb-6">Xin lỗi, chúng tôi không tìm thấy sản phẩm này trong hệ thống.</p>
          <Link to="/products" className="gradient-primary text-white px-8 py-3 rounded-xl font-bold inline-block hover:scale-105 transition-transform">← Khám phá sản phẩm khác</Link>
        </div>
      </div>
    );
  }

  const wishlisted = isInWishlist(product.id);
  const compared = isInComparison(product.id);
  const similarProducts = allProducts.filter(p => p.category === product.category && p.id !== product.id);
  const crossSellProducts = allProducts.filter(p => p.category !== product.category).slice(0, 6);

  const tabs = [
    { key: "desc" as const, label: "Đặc điểm nổi bật" },
    { key: "specs" as const, label: "Thông số chi tiết" },
    { key: "reviews" as const, label: `Đánh giá (${userReviews.length})` },
  ];

  return (
    <div className="animate-fade-up">
      {/* Premium Breadcrumb bar */}
      <div className="border-b border-border/40 bg-card/40 backdrop-blur-md sticky top-[68px] z-40 hidden md:block">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground py-3 font-medium">
            <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
            <span>/</span>
            <Link to={`/products?category=${product.category}`} className="hover:text-primary transition-colors">{product.category}</Link>
            <span>/</span>
            <span className="text-foreground truncate max-w-[400px]">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-12 gap-8 md:gap-12 mb-16">
          
          {/* Image Gallery - Left Side (Span 7) */}
          <div className="md:col-span-7">
            <div className="sticky top-32">
              <div className="bg-secondary/20 rounded-[2.5rem] border border-border/30 overflow-hidden mb-4 relative group p-8 lg:p-16 flex items-center justify-center aspect-square shadow-inner">
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full max-h-[500px] object-contain group-hover:scale-110 transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
                />
                
                {/* Badges */}
                <div className="absolute top-6 left-6 flex flex-col gap-2">
                  {product.isNew && <span className="badge-new scale-110 origin-top-left">Model 2026</span>}
                  {product.discount && product.discount > 0 && (
                    <span className="badge-sale scale-110 origin-top-left">Giảm {product.discount}%</span>
                  )}
                </div>

                {/* Floating Actions */}
                <div className="absolute top-6 right-6 flex flex-col gap-3">
                  <button
                    onClick={() => toggleWishlist(product)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-float border ${wishlisted ? 'bg-sale border-sale text-white' : 'glass border-white/40 text-foreground hover:text-sale'}`}
                  >
                    <Heart className={`w-5 h-5 ${wishlisted ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => addToComparison(product)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-float border ${compared ? 'bg-primary border-primary text-white' : 'glass border-white/40 text-foreground hover:text-primary'}`}
                  >
                    <GitCompare className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Thumbnails */}
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide justify-center">
                {product.images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={`shrink-0 w-20 h-20 rounded-2xl p-2 transition-all duration-300 ${i === selectedImage ? 'bg-secondary/40 border-2 border-primary shadow-soft' : 'bg-transparent border border-border hover:bg-secondary/20'}`}>
                    <img src={img} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Product Info & Buy Box - Right Side (Span 5) */}
          <div className="md:col-span-5">
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4 leading-tight tracking-tight">
              {product.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1.5 rounded-full">
                <Star className="w-4 h-4 fill-warning text-warning" />
                <span className="font-bold">{product.rating}</span>
                <span className="text-sm text-muted-foreground font-medium">({product.reviewCount} đánh giá)</span>
              </div>
              <span className="text-sm font-medium text-muted-foreground bg-secondary/30 px-3 py-1.5 rounded-full border border-border/50">Mã: {product.slug.split('-').pop()?.toUpperCase() || 'NVX'}</span>
            </div>

            {/* Premium Price Box */}
            <div className="glass rounded-[2rem] p-6 md:p-8 mb-8 border border-primary/10 shadow-[0_8px_40px_-12px_rgba(37,99,235,0.15)] relative overflow-hidden">
              {/* Decorative shimmer */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[50px] rounded-full -z-10" />
              
              <div className="flex flex-col mb-2">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Giá chính thức</p>
                <div className="flex items-baseline gap-4">
                  <span className="text-4xl md:text-5xl font-black text-primary tracking-tighter">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-xl font-semibold text-muted-foreground line-through decoration-2 decoration-sale/40">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>
              </div>
              
              {product.discount && (
                <div className="inline-block bg-sale/10 text-sale font-bold px-3 py-1 rounded-lg text-sm mt-2 mb-4">
                  Tiết kiệm {formatPrice((product.originalPrice || product.price) - product.price)}
                </div>
              )}

              <div className="h-px bg-border/50 w-full my-6" />

              {/* Installment Widget */}
              <div className="flex items-center justify-between bg-background/50 rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Trả góp 0% qua thẻ</p>
                    <p className="text-xs font-medium text-muted-foreground">Chỉ từ <span className="font-bold text-foreground">{formatPrice(Math.ceil(product.price / 12))}</span> / tháng</p>
                  </div>
                </div>
                <Link to="/policy" className="text-xs font-bold text-primary hover:underline">Chi tiết</Link>
              </div>
            </div>

            {/* Quantity & Add to Cart */}
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-foreground">Số lượng</span>
                <div className="flex items-center bg-secondary/50 rounded-xl border border-border/50 w-max">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 hover:bg-white/50 rounded-l-xl transition-colors"><Minus className="w-4 h-4" /></button>
                  <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="p-3 hover:bg-white/50 rounded-r-xl transition-colors"><Plus className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => { for (let i = 0; i < quantity; i++) addToCart(product); }}
                  className="flex-1 flex flex-col items-center justify-center gap-1 gradient-primary text-white py-4 rounded-[1.2rem] font-bold shadow-float hover:scale-[1.02] transition-transform"
                >
                  <span className="text-lg">Mua Ngay</span>
                  <span className="text-[10px] font-medium opacity-80">Giao nhanh tận nơi toàn quốc</span>
                </button>
                <button
                  onClick={() => { for (let i = 0; i < quantity; i++) addToCart(product); }}
                  className="flex flex-col items-center justify-center gap-1 bg-secondary text-foreground py-4 rounded-[1.2rem] font-bold border border-border hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <span className="text-lg flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> Thêm Giỏ</span>
                  <span className="text-[10px] font-medium text-muted-foreground">Mua tiếp sản phẩm khác</span>
                </button>
              </div>
            </div>

            {/* Quick Specs Highlight */}
            {product.specs && (
              <div className="bg-secondary/30 rounded-2xl p-6 border border-border/50">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /> Cấu hình tóm tắt</h3>
                <div className="space-y-3">
                  {Object.entries(product.specs).slice(0, 5).map(([key, val]) => (
                    <div key={key} className="flex text-sm">
                      <span className="text-muted-foreground font-medium w-32 shrink-0">{key}</span>
                      <span className="font-bold text-foreground">{val}</span>
                    </div>
                  ))}
                  <button onClick={() => setActiveTab('specs')} className="text-sm font-bold text-primary mt-2 flex items-center gap-1 hover:underline">
                    Xem cấu hình chi tiết <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            
            {/* Trust promises */}
            <div className="grid grid-cols-3 gap-2 mt-8 border-t border-border/50 pt-6">
              <div className="flex flex-col items-center text-center gap-2 p-2">
                <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center"><ShieldCheck className="w-5 h-5" /></div>
                <span className="text-xs font-bold">100% Chính hãng</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2 p-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center"><Truck className="w-5 h-5" /></div>
                <span className="text-xs font-bold">Giao nhanh 2h</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2 p-2">
                <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center"><RotateCcw className="w-5 h-5" /></div>
                <span className="text-xs font-bold">Đổi trả 30 ngày</span>
              </div>
            </div>
            
          </div>
        </div>

        {/* Detailed Information Tabs */}
        <div className="max-w-5xl mx-auto">
          <div className="flex border-b border-border/50 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-8 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          <div className="py-10">
            {activeTab === "desc" && (
              <div className="prose max-w-none text-foreground font-medium leading-relaxed bg-card text-lg rounded-3xl p-8 border border-border/50">
                <p>{product.description}</p>
              </div>
            )}
            
            {activeTab === "specs" && product.specs && (
              <div className="bg-card rounded-3xl border border-border/50 overflow-hidden shadow-soft max-w-3xl">
                {Object.entries(product.specs).map(([key, val], i) => (
                  <div key={key} className={`flex px-6 py-4 text-sm ${i % 2 === 0 ? 'bg-secondary/30' : ''}`}>
                    <span className="text-muted-foreground font-medium w-1/3 shrink-0">{key}</span>
                    <span className="font-bold text-foreground w-2/3">{val}</span>
                  </div>
                ))}
              </div>
            )}
            
            {activeTab === "reviews" && (
              <div className="space-y-6 max-w-4xl">
                {/* AI-ready sentiment summary */}
                <div className="glass rounded-[2rem] p-6 mb-8 border border-primary/20 flex flex-col md:flex-row items-center gap-8">
                  <div className="text-center md:border-r border-border/50 md:pr-8">
                    <p className="text-5xl font-black text-primary mb-2">{product.rating.toFixed(1)}</p>
                    <div className="flex items-center gap-1 justify-center mb-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-warning text-warning' : 'text-border'}`} />
                      ))}
                    </div>
                    <p className="text-xs font-bold text-muted-foreground">{product.reviewCount} đánh giá</p>
                  </div>
                  
                  <div className="flex-1 w-full space-y-4">
                    <p className="text-sm font-bold flex items-center gap-2">📊 NovaX AI Sentiment Analysis <span className="text-[10px] uppercase bg-primary text-white px-2 py-0.5 rounded-full">BETA</span></p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm font-medium">
                      <div className="bg-success/10 border border-success/20 rounded-xl p-3 flex flex-col gap-1 items-center justify-center">
                        <span className="flex items-center gap-1 text-success font-bold"><ThumbsUp className="w-5 h-5" /> Tích cực</span>
                        <span className="text-lg font-black text-foreground">60%</span>
                      </div>
                      <div className="bg-secondary/50 border border-border/50 rounded-xl p-3 flex flex-col gap-1 items-center justify-center">
                        <span className="flex items-center gap-1 text-muted-foreground font-bold">Trung lập</span>
                        <span className="text-lg font-black text-foreground">20%</span>
                      </div>
                      <div className="bg-sale/10 border border-sale/20 rounded-xl p-3 flex flex-col gap-1 items-center justify-center">
                        <span className="flex items-center gap-1 text-sale font-bold"><ThumbsDown className="w-5 h-5" /> Tiêu cực</span>
                        <span className="text-lg font-black text-foreground">20%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Write review button */}
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <h3 className="font-extrabold text-xl">Đánh giá từ khách hàng</h3>
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="text-sm gradient-primary text-white px-5 py-2.5 rounded-full font-bold shadow-md hover:scale-105 transition-transform flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" /> Viết đánh giá
                  </button>
                </div>

                {/* Review form */}
                {showReviewForm && (
                  <div className="bg-card rounded-[2rem] border border-primary/30 p-6 shadow-[0_10px_40px_-10px_rgba(37,99,235,0.1)] animate-fade-in my-6">
                    <h4 className="font-extrabold text-lg mb-4">Đánh giá của bạn</h4>
                    <div className="flex items-center gap-2 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button key={i} onClick={() => setNewReview(p => ({ ...p, rating: i + 1 }))} className="hover:scale-110 transition-transform">
                          <Star className={`w-8 h-8 transition-colors ${i < newReview.rating ? 'fill-warning text-warning' : 'text-secondary hover:text-warning/50'}`} />
                        </button>
                      ))}
                      <span className="text-sm font-bold ml-3 text-muted-foreground bg-secondary px-3 py-1 rounded-full">{newReview.rating}/5 sao</span>
                    </div>
                    <textarea
                      value={newReview.comment}
                      onChange={e => setNewReview(p => ({ ...p, comment: e.target.value }))}
                      placeholder="Chia sẻ trải nghiệm sử dụng sản phẩm này..."
                      rows={4}
                      className="w-full px-5 py-4 rounded-2xl border border-border bg-secondary/30 text-sm font-medium focus:ring-2 focus:ring-primary focus:bg-background outline-none resize-none transition-all"
                    />
                    <div className="flex gap-3 mt-5">
                      <button onClick={handleSubmitReview} className="gradient-primary text-white px-6 py-2.5 rounded-full text-sm font-bold hover:scale-105 transition-transform">
                        Gửi đánh giá
                      </button>
                      <button onClick={() => setShowReviewForm(false)} className="px-6 py-2.5 rounded-full text-sm font-bold border border-border hover:bg-secondary transition-colors">
                        Hủy
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {userReviews.map(review => (
                    <div key={review.id} className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm hover:border-primary/20 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full gradient-hero flex items-center justify-center text-white font-black text-sm shadow-md">
                            {review.userName[0]}
                          </div>
                          <div>
                            <span className="font-bold text-sm block">{review.userName}</span>
                            <div className="flex items-center gap-0.5 mt-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-warning text-warning' : 'text-border'}`} />
                              ))}
                            </div>
                          </div>
                          
                          {review.sentiment && (
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ml-2 hidden sm:inline-block ${
                              review.sentiment === 'positive' ? 'bg-success/10 text-success' :
                              review.sentiment === 'negative' ? 'bg-sale/10 text-sale' : 'bg-muted text-muted-foreground'
                            }`}>
                              {review.sentiment === 'positive' ? 'Tích cực' : review.sentiment === 'negative' ? 'Tiêu cực' : 'Trung lập'}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-medium text-muted-foreground truncate">{review.date}</span>
                      </div>
                      <p className="text-sm text-foreground font-medium leading-relaxed pl-[3.25rem]">{review.comment}</p>
                      <div className="mt-4 pl-[3.25rem] text-xs font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer w-max flex items-center gap-1.5">
                        <ThumbsUp className="w-3.5 h-3.5" /> Thích ({review.helpful})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Recommendations - Overhauled style via RecommendationSection is applied globally ✨ */}
        <div className="mt-12 space-y-12">
          <RecommendationSection title="Sản phẩm tương tự" icon="🔄" products={similarProducts} aiLabel="AI Recommendation" />
          <RecommendationSection title="Khách hàng cũng mua" icon="🛒" products={crossSellProducts} aiLabel="Cross-sell AI" />
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
