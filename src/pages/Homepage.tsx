import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Zap, Flame, Clock } from "lucide-react";
import { categories, products, formatPrice } from "@/data/mockData";
import ProductCard from "@/components/ProductCard";
import RecommendationSection from "@/components/RecommendationSection";
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
          <span className="bg-foreground text-primary-foreground font-bold text-sm px-2 py-1 rounded">{v}</span>
          {i < 2 && <span className="text-foreground font-bold mx-0.5">:</span>}
        </span>
      ))}
    </div>
  );
};

const Homepage = () => {
  const [currentBanner, setCurrentBanner] = useState(0);
  const banners = [heroBanner, banner2];

  useEffect(() => {
    const timer = setInterval(() => setCurrentBanner(p => (p + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const flashSaleProducts = products.filter(p => p.discount && p.discount >= 20);
  const bestSellers = products.filter(p => p.isBestSeller);
  const newProducts = products.filter(p => p.isNew);
  const recommended = products.slice(0, 8);

  return (
    <div>
      {/* Hero Banner Carousel */}
      <section className="relative overflow-hidden">
        <div className="relative h-[200px] md:h-[400px]">
          {banners.map((banner, i) => (
            <img
              key={i}
              src={banner}
              alt={`Banner ${i + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === currentBanner ? "opacity-100" : "opacity-0"}`}
              width={1920}
              height={600}
              {...(i === 0 ? {} : { loading: "lazy" as const })}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 to-transparent flex items-center">
            <div className="container mx-auto px-4">
              <h1 className="text-primary-foreground text-2xl md:text-5xl font-extrabold mb-2 md:mb-4 max-w-lg">
                Siêu ưu đãi<br />Điện máy online
              </h1>
              <p className="text-primary-foreground/80 text-sm md:text-lg mb-4 max-w-md">
                Giảm đến 50% + Freeship toàn quốc
              </p>
              <Link to="/products" className="inline-flex items-center gap-2 gradient-accent text-accent-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm md:text-base">
                <Zap className="w-4 h-4" /> Mua ngay
              </Link>
            </div>
          </div>
          <button onClick={() => setCurrentBanner(p => (p - 1 + banners.length) % banners.length)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-card/80 p-2 rounded-full hover:bg-card transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setCurrentBanner(p => (p + 1) % banners.length)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-card/80 p-2 rounded-full hover:bg-card transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, i) => (
              <button key={i} onClick={() => setCurrentBanner(i)} className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentBanner ? "bg-accent w-6" : "bg-card/60"}`} />
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4">
        {/* Flash Sale */}
        <section className="py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">
              <Flame className="w-6 h-6 text-sale" />
              Flash Sale
            </h2>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <FlashSaleTimer />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {flashSaleProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Featured Categories */}
        <section className="py-6">
          <h2 className="section-title mb-4">📂 Danh mục nổi bật</h2>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
            {categories.map(cat => (
              <Link key={cat.id} to={`/products?category=${cat.slug}`} className="flex flex-col items-center gap-2 p-3 bg-card rounded-xl border border-border hover:border-primary hover:shadow-card transition-all group">
                <span className="text-3xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className="text-xs font-medium text-center text-foreground">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* AI Recommendations */}
        <RecommendationSection
          title="Gợi ý cho bạn"
          icon="✨"
          products={recommended}
          aiLabel="AI Powered"
        />

        {/* Mid banner */}
        <section className="py-4">
          <Link to="/products" className="block rounded-xl overflow-hidden">
            <img src={banner2} alt="Khuyến mãi điện máy" className="w-full h-[120px] md:h-[200px] object-cover" loading="lazy" width={1920} height={600} />
          </Link>
        </section>

        {/* Best Sellers */}
        <RecommendationSection
          title="Sản phẩm bán chạy"
          icon="🔥"
          products={bestSellers}
        />

        {/* New Products */}
        <RecommendationSection
          title="Sản phẩm mới"
          icon="🆕"
          products={newProducts}
        />

        {/* Recently viewed - AI ready placeholder */}
        <section className="py-6">
          <h2 className="section-title mb-4">
            👁️ Đã xem gần đây
            <span className="ml-2 text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">Tracking</span>
          </h2>
          <div className="bg-secondary rounded-xl p-8 text-center">
            <p className="text-muted-foreground text-sm">Bạn chưa xem sản phẩm nào gần đây.</p>
            <Link to="/products" className="text-primary text-sm font-medium mt-2 inline-block hover:underline">
              Khám phá ngay →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Homepage;
