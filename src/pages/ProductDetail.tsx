import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShoppingCart, Zap, Star, ThumbsUp, ThumbsDown, Minus, Plus, Heart, GitCompare, Camera, ShieldCheck, Truck, ArrowRight, RotateCcw, MapPin, CheckCircle2 } from "lucide-react";
import { products as fallbackProducts, reviews as mockReviews, formatPrice } from "@/data/mockData";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useComparison } from "@/contexts/ComparisonContext";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import RecommendationSection from "@/components/RecommendationSection";
import { Product } from "@/types/product";
import { Review } from "@/types/product";
import { fetchProductBySlug, fetchProducts, submitProductReview } from "@/services/catalogApi";
import { getSafeProductImage, handleProductImageError } from "@/lib/productImage";
import { toast } from "sonner";

const ProductDetail = () => {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToComparison, isInComparison } = useComparison();
  const { addToRecentlyViewed } = useRecentlyViewed();
  const [activeTab, setActiveTab] = useState<"desc" | "specs" | "reviews">("desc");
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [product, setProduct] = useState<Product | any>(null);
  const [allProducts, setAllProducts] = useState<Product[]>(fallbackProducts);
  const [isLoading, setIsLoading] = useState(true);

  // User review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadProduct = async () => {
      if (!slug) {
        setProduct(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      let resolvedProduct: Product | null = null;

      try {
        resolvedProduct = await fetchProductBySlug(slug);
      } catch (err) {
        console.error("Failed to load product detail:", err);
        resolvedProduct = fallbackProducts.find((item) => item.slug === slug) || null;
      }

      if (isMounted) {
        setProduct(resolvedProduct);
      }

      // Related list is non-critical; do not break detail page if this request fails.
      try {
        const list = await fetchProducts({ page: 1, pageSize: 100 });
        if (isMounted) {
          setAllProducts(list.items.length > 0 ? list.items : fallbackProducts);
        }
      } catch (err) {
        console.error("Failed to load related products:", err);
        if (isMounted) {
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

  const handleSubmitReview = async () => {
    if (!newReview.comment.trim() || !product) return;
    setIsSubmittingReview(true);
    try {
      await submitProductReview(product.id, newReview);
      toast.success("Cảm ơn bạn đã đánh giá!");
      setNewReview({ rating: 5, comment: "" });
      setShowReviewForm(false);
      // Reload product to get new reviews
      if (slug) fetchProductBySlug(slug).then(setProduct);
    } catch (err: any) {
      toast.error(err.message || "Không thể gửi đánh giá");
    } finally {
      setIsSubmittingReview(false);
    }
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
    { key: "reviews" as const, label: `Đánh giá (${product.reviewCount || 0})` },
  ];

  const productImages = product.images.length > 0 ? product.images : [getSafeProductImage(product)];

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
                  src={productImages[selectedImage] || productImages[0]}
                  alt={product.name}
                  onError={(event) => handleProductImageError(event, product, selectedImage)}
                  className="w-full max-h-[500px] object-contain group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                
                {/* Badges */}
                <div className="absolute top-6 left-6 flex flex-col gap-2">
                  <span className="badge-new scale-110 origin-top-left flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Bảo hành 1 năm
                  </span>
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
                {productImages.map((img: string, i: number) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={`shrink-0 w-20 h-20 rounded-2xl p-2 transition-all duration-300 ${i === selectedImage ? 'bg-secondary/40 border-2 border-primary shadow-soft' : 'bg-transparent border border-border hover:bg-secondary/20'}`}>
                    <img
                      src={img}
                      alt=""
                      onError={(event) => handleProductImageError(event, product, i)}
                      className="w-full h-full object-contain"
                    />
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
            <div className="glass rounded-[2rem] p-6 md:p-8 mb-6 border border-primary/10 shadow-[0_8px_40px_-12px_rgba(37,99,235,0.15)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[50px] rounded-full -z-10" />
              
              <div className="flex flex-col mb-2">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Giá NovaX</p>
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
              
              <div className="flex items-center gap-2 mt-2 mb-4">
                <span className="text-xs bg-success/10 text-success font-bold px-2 py-1 rounded">Vận chuyển miễn phí 24h</span>
                <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-1 rounded">Tích 1% Points</span>
              </div>

              <div className="h-px bg-border/50 w-full my-4" />

              {/* Installment Widget */}
              <div className="flex items-center justify-between bg-background/50 rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Trả góp 0% Kaypay/Fundiin</p>
                    <p className="text-xs font-medium text-muted-foreground">Chỉ từ <span className="font-bold text-foreground">{formatPrice(Math.ceil(product.price / 12))}</span> / tháng</p>
                  </div>
                </div>
                <Link to="/policy" className="text-xs font-bold text-primary hover:underline">Chi tiết</Link>
              </div>
            </div>

            {/* Store Stock Alert */}
            {product.storeStock && product.storeStock.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4 mb-6">
                <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 mb-2 px-1">
                  <MapPin className="w-3.5 h-3.5 text-primary" /> CÓ HÀNG TẠI CỬA HÀNG:
                </p>
                <div className="space-y-2">
                  {product.storeStock.map((ss: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-sm bg-secondary/30 p-2 rounded-lg">
                      <div className="flex flex-col">
                        <span className="font-bold text-xs">{ss.storeName}</span>
                        <span className="text-[10px] text-muted-foreground tracking-tight">{ss.address}</span>
                      </div>
                      <span className="text-[10px] font-bold text-success px-2 py-0.5 rounded-full bg-success/10 whitespace-nowrap">
                        Còn {ss.quantity} máy
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-foreground font-inter uppercase tracking-wide">Số lượng</span>
                <div className="flex items-center bg-secondary/50 rounded-xl border border-border/50 w-max overflow-hidden">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 hover:bg-white/50 transition-colors"><Minus className="w-4 h-4" /></button>
                  <span className="w-10 text-center font-black text-lg">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="p-3 hover:bg-white/50 transition-colors"><Plus className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => { for (let i = 0; i < quantity; i++) addToCart(product); }}
                  className="flex-1 flex flex-col items-center justify-center gap-1 gradient-accent text-white py-4 rounded-[1.2rem] font-black shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <span className="text-lg">CHỐT ĐƠN NGAY</span>
                  <span className="text-[10px] font-bold opacity-80">Giao nhanh tận nơi toàn quốc</span>
                </button>
                <button
                  onClick={() => { for (let i = 0; i < quantity; i++) addToCart(product); }}
                  className="flex flex-col items-center justify-center gap-1 bg-white text-foreground py-4 rounded-[1.2rem] font-bold border-2 border-border hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <span className="text-lg flex items-center gap-2 font-black"><ShoppingCart className="w-5 h-5 text-primary" /> THÊM GIỎ</span>
                  <span className="text-[10px] font-bold text-muted-foreground">Mua nhiều giảm sâu</span>
                </button>
              </div>
            </div>
            
            {/* Trust promises */}
            <div className="grid grid-cols-3 gap-2 mt-8 border-t border-border/50 pt-6">
              <div className="flex flex-col items-center text-center gap-2 p-2 group">
                <div className="w-12 h-12 rounded-2xl bg-success/10 text-success flex items-center justify-center group-hover:scale-110 transition-transform"><ShieldCheck className="w-6 h-6" /></div>
                <span className="text-[10px] font-black uppercase">100% Nguyên Seal</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2 p-2 group">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform"><Truck className="w-6 h-6" /></div>
                <span className="text-[10px] font-black uppercase">Giao hỏa tốc 2h</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2 p-2 group">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center group-hover:scale-110 transition-transform"><RotateCcw className="w-6 h-6" /></div>
                <span className="text-[10px] font-black uppercase">Đổi mới 30 ngày</span>
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
                className={`px-8 py-4 text-sm font-black uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          <div className="py-10">
            {activeTab === "desc" && (
              <div className="prose max-w-none text-foreground font-medium bg-card text-lg rounded-3xl p-8 border border-border/50 leading-relaxed shadow-sm">
                <p className="whitespace-pre-line">{product.description}</p>
                {product.images.slice(1).map((img: string, i: number) => (
                   <img key={i} src={img} className="rounded-2xl mt-8 w-full shadow-lg" alt={`${product.name} detail ${i}`} />
                ))}
              </div>
            )}
            
            {activeTab === "specs" && product.specs && (
              <div className="bg-card rounded-3xl border border-border/50 overflow-hidden shadow-soft max-w-3xl">
                {Object.entries(product.specs).map(([key, val]: [string, any], i) => (
                  <div key={key} className={`flex px-6 py-4 text-sm ${i % 2 === 0 ? 'bg-secondary/30' : ''}`}>
                    <span className="text-muted-foreground font-bold w-1/3 shrink-0 uppercase tracking-tighter text-[11px]">{key}</span>
                    <span className="font-bold text-foreground w-2/3">{val}</span>
                  </div>
                ))}
              </div>
            )}
            
            {activeTab === "reviews" && (
              <div className="space-y-6 max-w-4xl">
                {/* AI-ready sentiment summary */}
                <div className="glass rounded-[2rem] p-6 mb-8 border border-primary/20 flex flex-col md:flex-row items-center gap-8 shadow-lg">
                  <div className="text-center md:border-r border-border/50 md:pr-10">
                    <p className="text-6xl font-black text-primary mb-2 leading-none">{(product.rating || 0).toFixed(1)}</p>
                    <div className="flex items-center gap-1 justify-center mb-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating || 0) ? 'fill-warning text-warning' : 'text-border'}`} />
                      ))}
                    </div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase opacity-60 tracking-widest">{product.reviewCount || 0} reviews</p>
                  </div>
                  
                  <div className="flex-1 w-full space-y-4">
                    <p className="text-sm font-black flex items-center gap-2 tracking-tight">🤖 NOVAX AI ANALYSIS <span className="text-[10px] uppercase bg-black text-white px-2 py-0.5 rounded-full font-black tracking-widest">LIVE</span></p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm font-medium">
                      <div className="bg-success/5 border border-success/10 rounded-2xl p-4 flex flex-col gap-1 items-center justify-center">
                        <span className="flex items-center gap-1 text-success font-black text-xs uppercase"><ThumbsUp className="w-4 h-4" /> Tuyệt vời</span>
                        <span className="text-xl font-black text-foreground">92%</span>
                      </div>
                      <div className="bg-secondary/50 border border-border/50 rounded-2xl p-4 flex flex-col gap-1 items-center justify-center">
                        <span className="flex items-center gap-1 text-muted-foreground font-black text-xs uppercase">Hài lòng</span>
                        <span className="text-xl font-black text-foreground">5%</span>
                      </div>
                      <div className="bg-sale/5 border border-sale/10 rounded-2xl p-4 flex flex-col gap-1 items-center justify-center">
                        <span className="flex items-center gap-1 text-sale font-black text-xs uppercase"><ThumbsDown className="w-4 h-4" /> Cần cải thiện</span>
                        <span className="text-xl font-black text-foreground">3%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Write review button */}
                <div className="flex items-center justify-between border-b border-border/50 pb-6 mb-8">
                  <h3 className="font-black text-2xl tracking-tighter uppercase">Đánh giá thực tế</h3>
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="text-xs gradient-accent text-white px-6 py-3 rounded-full font-black shadow-lg hover:scale-105 transition-all flex items-center gap-2 uppercase"
                  >
                    <Camera className="w-4 h-4" /> Viết đánh giá
                  </button>
                </div>

                {/* Review form */}
                {showReviewForm && (
                  <div className="bg-card rounded-[2.5rem] border-2 border-primary/20 p-8 shadow-2xl animate-fade-in my-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 blur-3xl -z-10 rounded-full" />
                    <h4 className="font-black text-xl mb-6 tracking-tight">TRẢI NGHIỆM CỦA BẠN</h4>
                    <div className="flex items-center gap-3 mb-6">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button key={i} onClick={() => setNewReview(p => ({ ...p, rating: i + 1 }))} className="hover:scale-125 transition-transform duration-300">
                          <Star className={`w-10 h-10 transition-colors drop-shadow-sm ${i < newReview.rating ? 'fill-warning text-warning' : 'text-secondary hover:text-warning/40'}`} />
                        </button>
                      ))}
                      <span className="text-xs font-black ml-4 text-primary bg-primary/10 px-4 py-2 rounded-full uppercase tracking-widest">{newReview.rating}/5 sao</span>
                    </div>
                    <textarea
                      value={newReview.comment}
                      onChange={e => setNewReview(p => ({ ...p, comment: e.target.value }))}
                      placeholder="Sản phẩm này có gì khiến bạn hài lòng?"
                      rows={5}
                      className="w-full px-6 py-5 rounded-[1.5rem] border-2 border-border bg-secondary/20 text-base font-bold placeholder:text-muted-foreground/50 focus:border-primary focus:bg-white outline-none resize-none transition-all shadow-inner"
                    />
                    <div className="flex gap-4 mt-8">
                      <button 
                        onClick={handleSubmitReview} 
                        disabled={isSubmittingReview}
                        className="gradient-primary text-white px-10 py-4 rounded-[1.2rem] text-sm font-black hover:scale-[1.05] active:scale-[0.95] transition-all disabled:opacity-50 uppercase tracking-widest shadow-lg shadow-primary/20"
                      >
                        {isSubmittingReview ? 'Đang gửi...' : 'Gửi đánh giá ngay'}
                      </button>
                      <button onClick={() => setShowReviewForm(false)} className="px-8 py-4 rounded-[1.2rem] text-sm font-black border-2 border-border hover:bg-secondary transition-all uppercase tracking-widest">
                        Đóng
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {(product.reviews || []).map((review: any) => (
                    <div key={review.id} className="bg-white rounded-3xl border border-border/80 p-8 shadow-sm hover:shadow-md transition-all group">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl gradient-hero flex items-center justify-center text-white font-black text-lg shadow-inner ring-4 ring-secondary/30">
                            {review.id.slice(0,1)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                               <span className="font-black text-base uppercase tracking-tight">USER_{review.userId.slice(-4)}</span>
                               {review.isVerified && (
                                 <span className="flex items-center gap-1 text-[10px] font-black text-success bg-success/10 px-2 py-0.5 rounded-full uppercase">
                                   <CheckCircle2 className="w-3 h-3" /> Đã mua tại NovaX
                                 </span>
                               )}
                            </div>
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-warning text-warning' : 'text-border'}`} />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-muted-foreground opacity-60 uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <p className="text-base text-foreground font-black leading-relaxed pl-[4.5rem] tracking-tight">{review.comment}</p>
                      <div className="mt-6 pl-[4.5rem] flex items-center gap-6">
                         <div className="text-[11px] font-black text-muted-foreground hover:text-primary transition-all cursor-pointer flex items-center gap-2 group/btn">
                           <ThumbsUp className="w-4 h-4 group-hover/btn:scale-125 transition-transform" /> HỮU ÍCH (0)
                         </div>
                         <div className="text-[11px] font-black text-muted-foreground hover:text-sale transition-all cursor-pointer flex items-center gap-2 group/btn2">
                           <ThumbsDown className="w-4 h-4 group-hover/btn2:scale-125 transition-transform" /> KHÔNG TỐT (0)
                         </div>
                      </div>
                    </div>
                  ))}
                  {(product.reviews?.length === 0) && (
                    <div className="text-center py-20 bg-secondary/20 rounded-[3rem] border border-dashed border-border/50">
                       <p className="text-muted-foreground font-bold mb-4">Chưa có đánh giá nào cho sản phẩm này.</p>
                       <button onClick={() => setShowReviewForm(true)} className="text-primary font-black uppercase text-xs hover:underline decoration-2 underline-offset-4">Hãy là người đầu tiên đánh giá!</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="mt-16 space-y-20 border-t border-border/50 pt-20">
          <RecommendationSection title="Sản phẩm tương tự" icon="🔄" products={similarProducts} aiLabel="AI Recommendation" />
          <RecommendationSection title="Tiết kiệm hơn với NovaX" icon="🔥" products={crossSellProducts} aiLabel="Smart Upsell AI" />
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
