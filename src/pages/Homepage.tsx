import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Zap, Flame, Clock, Trash2, ArrowRight, ChevronRight } from "lucide-react";
import { categories, formatPrice } from "@/data/mockData";
import ProductCard from "@/components/ProductCard";
import RecommendationSection from "@/components/RecommendationSection";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { fetchProducts } from "@/services/catalogApi";
import { Product } from "@/types/product";
import heroBanner from "@/assets/hero-banner.jpg";
import banner2 from "@/assets/banner-2.jpg";

// Flash sale countdown
const FlashSaleTimer = () => {
  const [time, setTime] = useState({ hours: 5, minutes: 23, seconds: 45 });
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(prev => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 23; minutes = 59; seconds = 59; }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    <div className="flex gap-1 items-center">
      {[pad(time.hours), pad(time.minutes), pad(time.seconds)].map((v, i) => (
        <span key={i} className="flex items-center">
          <span className="bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold text-sm px-2.5 py-1 rounded shadow-[0_2px_10px_rgba(0,0,0,0.1)]">{v}</span>
          {i < 2 && <span className="text-white font-bold mx-0.5">:</span>}
        </span>
      ))}
    </div>
  );
};

const Homepage = () => {
  const { items: recentlyViewed, clearRecentlyViewed } = useRecentlyViewed();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    void fetchProducts({ page: 1, pageSize: 200 })
      .then(res => setProducts(res.items))
      .catch(console.error);
  }, []);

  const flashSaleProducts = products.filter(p => p.discount && p.discount >= 20);
  const bestSellers = products.filter(p => p.isBestSeller);
  const newProducts = products.filter(p => p.isNew);
  const recommended = products.slice(0, 8);

  return (
    <div className="animate-fade-up">
      <div className="container mx-auto px-4 py-6">
        
        {/* PREMIUM BENTO GRID HERO */}
        <section className="mb-10">
          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[500px]">
            
            {/* Box 1: Main featured (Span 2x2) */}
            <div className="md:col-span-2 md:row-span-2 rounded-[2rem] overflow-hidden relative group shadow-card">
              <img 
                src={heroBanner} 
                alt="Khuyen mai chinh" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 z-10">
                <span className="badge-new mb-3">Siêu Ưu Đãi Tháng 4</span>
                <h1 className="text-white text-3xl md:text-5xl font-extrabold mb-3 leading-tight text-gradient from-white to-white/70">
                  Đại Tiệc Công Nghệ
                </h1>
                <p className="text-white/80 mb-6 text-lg font-medium max-w-sm">
                  Giảm đến 50% mặt hàng Apple & Samsung. Miễn phí vận chuyển toàn quốc.
                </p>
                <Link to="/products" className="inline-flex items-center gap-2 glass text-white px-8 py-3.5 rounded-full font-semibold hover:bg-white hover:text-black transition-all">
                  Khám phá ngay <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

            {/* Box 2: Span 2x1 Top Right */}
            <div className="md:col-span-2 md:row-span-1 rounded-[2rem] overflow-hidden relative group gradient-hero shadow-card">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
              <div className="relative h-full p-8 flex flex-col justify-center z-10 w-2/3">
                <span className="badge-sale w-max mb-2">Độc Quyền</span>
                <h2 className="text-white text-2xl md:text-3xl font-bold mb-2">Galaxy S24 Ultra</h2>
                <p className="text-white/70 font-medium">Quyền năng AI trong tay bạn.</p>
              </div>
              {/* Simulated floating device illustration via text since we lack image */}
              <div className="absolute right-6 -bottom-6 text-9xl animate-float opacity-30 drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)]">
                📱
              </div>
            </div>

            {/* Box 3: Span 1x1 Bottom Right 1 */}
            <div className="md:col-span-1 md:row-span-1 rounded-[2rem] bg-secondary p-6 relative group overflow-hidden shadow-card flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg mb-1">Giao Tốc Hành</h3>
                <p className="text-sm text-muted-foreground font-medium">Nhận hàng trong 2h tại nội thành</p>
              </div>
              <div className="w-16 h-16 bg-primary/5 absolute -bottom-4 -right-4 rounded-full group-hover:scale-150 transition-transform duration-500" />
            </div>

            {/* Box 4: Span 1x1 Bottom Right 2 */}
            <div className="md:col-span-1 md:row-span-1 rounded-[2rem] bg-black text-white p-6 relative group overflow-hidden shadow-card flex flex-col justify-between">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div>
                <h3 className="font-bold text-lg mb-1 text-gradient from-white to-white/60">Thu Cũ Đổi Mới</h3>
                <p className="text-sm text-white/60 font-medium">Trợ giá lên đến 3 Triệu đồng</p>
              </div>
              <Link to="/policy" className="mt-4 flex items-center text-sm font-semibold hover:text-white/80 transition-colors">
                Xem chi tiết <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

          </div>
        </section>

        {/* Feature Triggers / Trust badges - Modernized */}
        <section className="mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "🚚", title: "Miễn phí giao hàng", desc: "Cho đơn từ 500K" },
              { icon: "🔄", title: "Đổi trả 30 ngày", desc: "Hoàn tiền 100%" },
              { icon: "🛡️", title: "Bảo hành chính hãng", desc: "Từ 12 đến 24 tháng" },
              { icon: "💳", title: "Trả góp 0%", desc: "Qua thẻ tín dụng" },
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-4 p-4 md:p-5 bg-card/60 backdrop-blur-md rounded-2xl border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-soft">
                <span className="text-3xl bg-secondary w-12 h-12 flex flex-shrink-0 items-center justify-center rounded-xl">{badge.icon}</span>
                <div>
                  <p className="text-sm font-extrabold">{badge.title}</p>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Shimmer Flash Sale */}
        <section className="mb-12">
          <div className="rounded-[2rem] gradient-primary p-1 shimmer-effect shadow-float relative">
            <div className="bg-card rounded-[1.8rem] p-6 relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <h2 className="section-title">
                  <Flame className="w-8 h-8 text-sale animate-pulse" />
                  <span className="text-gradient from-sale to-pink-500">Giờ Vàng Giá Sốc</span>
                </h2>
                <div className="flex items-center gap-3 bg-sale/10 px-4 py-2 rounded-xl">
                  <Clock className="w-5 h-5 text-sale" />
                  <span className="text-sale font-bold text-sm">Kết thúc trong:</span>
                  <div className="scale-90 origin-left"><FlashSaleTimer /></div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {flashSaleProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Categories - Glassmorphism */}
        <section className="mb-12">
          <h2 className="section-title mb-6">📂 Danh mục nổi bật</h2>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4">
            {categories.map(cat => (
              <Link key={cat.id} to={`/products?category=${cat.slug}`} className="flex flex-col items-center gap-3 p-4 bg-background rounded-2xl border border-border hover:border-primary/50 hover:shadow-soft transition-all duration-300 group">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-3xl group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-300">
                  {cat.icon}
                </div>
                <span className="text-xs font-bold text-center text-foreground">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Mid parallax banner */}
        <section className="mb-12">
          <Link to="/products" className="block rounded-[2rem] overflow-hidden relative h-[150px] md:h-[250px] group shadow-card">
             {/* Using fixed background attachment for parallax effect (if supported) */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105" 
              style={{ backgroundImage: `url(${banner2})`, backgroundAttachment: 'fixed', backgroundPosition: 'center' }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-12">
              <h2 className="text-white text-2xl md:text-4xl font-extrabold mb-2">Săn Sale Giữa Nửa Đêm</h2>
              <p className="text-white/80 font-medium md:text-lg mb-4">Voucher lên tới 5 triệu đồng duy nhất cuối tuần</p>
              <div className="w-max">
                <span className="glass text-white px-6 py-2.5 rounded-full font-semibold flex items-center gap-2 hover:bg-white hover:text-black transition-colors">
                  Đến trang mua sắm <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </Link>
        </section>

        {/* Product Recommendations */}
        <div className="space-y-12 mb-12">
          <RecommendationSection title="Sản phẩm bán chạy" icon="🔥" products={bestSellers} />
          <RecommendationSection title="Sản phẩm mới" icon="🆕" products={newProducts} />
          <RecommendationSection title="Gợi ý cho bạn" icon="✨" products={recommended} aiLabel="AI Powered" />
        </div>

        {/* Recently viewed */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">
              👁️ Đã xem gần đây
              <span className="ml-2 text-xs font-bold uppercase tracking-wide bg-primary/10 text-primary px-3 py-1 rounded-md">Cá nhân hóa</span>
            </h2>
            {recentlyViewed.length > 0 && (
              <button onClick={clearRecentlyViewed} className="text-sm font-medium text-muted-foreground hover:text-destructive flex items-center gap-1.5 transition-colors bg-secondary px-3 py-1.5 rounded-lg">
                <Trash2 className="w-4 h-4" /> Xóa lịch sử
              </button>
            )}
          </div>
          {recentlyViewed.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recentlyViewed.slice(0, 6).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border/50 rounded-[2rem] p-10 text-center shadow-soft">
              <p className="text-muted-foreground font-medium mb-3">Bạn chưa xem sản phẩm nào gần đây.</p>
              <Link to="/products" className="text-primary font-bold inline-flex items-center gap-1 hover:underline">
                Khám phá ngay <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default Homepage;
