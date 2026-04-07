import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, User, Menu, X, ChevronDown, Heart, GitCompare, Zap } from "lucide-react";
import { categories, products } from "@/data/mockData";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import NotificationDropdown from "@/components/NotificationDropdown";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const { totalItems } = useCart();
  const { totalItems: wishlistCount } = useWishlist();
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const megaMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (megaMenuRef.current && !megaMenuRef.current.contains(e.target as Node)) {
        setMegaMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setSearchFocused(false);
    }
  };

  const suggestions = searchQuery.length > 1
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
    : [];

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/40 shadow-soft">
      {/* Top bar */}
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="text-primary font-black text-2xl md:text-3xl tracking-tighter flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white group-hover:rotate-12 transition-transform">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <span className="text-gradient from-primary to-accent">NovaX</span>
        </Link>

        {/* Premium Search bar */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-8">
          <div className="relative w-full group">
            <div className={`absolute inset-0 bg-primary/20 blur-xl rounded-full transition-opacity duration-300 -z-10 ${searchFocused ? 'opacity-100' : 'opacity-0'}`}></div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              placeholder="Bạn tìm gì hôm nay?"
              className="w-full pl-6 pr-14 py-3.5 rounded-full text-foreground bg-secondary/40 backdrop-blur-sm border border-border/50 focus:border-primary/50 focus:bg-background outline-none text-sm font-medium transition-all shadow-inner"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full gradient-primary text-white flex items-center justify-center hover:scale-105 transition-transform shadow-md">
              <Search className="w-5 h-5" />
            </button>
            
            {/* Live autocomplete dropdown (Glass) */}
            {searchFocused && searchQuery.length > 0 && (
              <div className="absolute top-[calc(100%+8px)] left-0 right-0 glass rounded-2xl border border-border/50 overflow-hidden animate-fade-up">
                {suggestions.length > 0 ? (
                  <div className="py-2">
                    {suggestions.map(p => (
                      <Link
                        key={p.id}
                        to={`/product/${p.slug}`}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-secondary/50 transition-colors"
                        onClick={() => { setSearchQuery(""); setSearchFocused(false); }}
                      >
                        <img src={p.images[0]} alt="" className="w-12 h-12 rounded-xl object-cover bg-white" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate text-foreground">{p.name}</p>
                          <p className="text-sm text-sale font-extrabold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price)}</p>
                        </div>
                      </Link>
                    ))}
                    <Link to={`/products?q=${encodeURIComponent(searchQuery)}`} className="block text-center py-3 text-sm text-primary font-bold hover:bg-secondary/50 border-t border-border/50">
                      Xem tất cả kết quả →
                    </Link>
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-sm text-muted-foreground font-medium">🔍 Đang tìm kiếm "{searchQuery}"...</p>
                    <p className="text-xs text-muted-foreground/70 mt-2">💡 Gợi ý sẽ hiển thị nếu tìm thấy sản phẩm</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </form>

        {/* Quick Actions */}
        <div className="flex items-center gap-1 md:gap-2">
          <NotificationDropdown />
          <Link to="/profile?tab=wishlist" className="relative text-foreground hover:text-sale hover:bg-secondary p-2.5 rounded-full transition-all hidden md:flex items-center justify-center">
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute 0 top-0 right-0 bg-sale text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center border-2 border-background">
                {wishlistCount}
              </span>
            )}
          </Link>
          <Link to="/cart" className="relative text-foreground hover:text-primary hover:bg-secondary p-2.5 rounded-full transition-all flex items-center justify-center">
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute 0 top-0 right-0 bg-primary text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center border-2 border-background shadow-md">
                {totalItems}
              </span>
            )}
          </Link>
          
          <div className="hidden md:flex items-center gap-2 ml-2 pl-2 border-l border-border/50">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link to="/profile" className="flex items-center gap-2 hover:bg-secondary px-3 py-1.5 rounded-full transition-colors">
                  <div className="w-7 h-7 rounded-full gradient-hero text-white flex items-center justify-center text-xs font-bold">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-semibold truncate max-w-[100px]">{user?.name}</span>
                </Link>
                {user?.role === 'admin' && (
                  <Link to="/admin" className="text-xs font-bold px-3 py-2 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors">
                    Admin
                  </Link>
                )}
                <button onClick={() => void logout()} className="text-xs font-bold px-3 py-2 rounded-full border border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors">
                  Thoát
                </button>
              </div>
            ) : (
              <Link to="/login" className="flex items-center gap-2 gradient-primary text-white px-5 py-2 rounded-full text-sm font-bold shadow-md hover:shadow-lg hover:opacity-90 transition-all">
                <User className="w-4 h-4" /> Đăng nhập
              </Link>
            )}
          </div>
          
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-foreground p-2 rounded-full hover:bg-secondary transition-colors">
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Category nav - Glass styling */}
      <nav className="hidden md:block border-t border-border/40" ref={megaMenuRef}>
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMegaMenuOpen(!megaMenuOpen)}
              className={`flex items-center gap-2 px-5 py-3 font-bold text-sm transition-colors rounded-t-xl ${megaMenuOpen ? 'bg-primary/10 text-primary' : 'hover:text-primary hover:bg-secondary/50'}`}
            >
              <Menu className="w-4 h-4" />
              Danh mục
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${megaMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {categories.slice(0, 6).map(cat => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.slug}`}
                className="px-4 py-3 text-sm font-semibold text-muted-foreground hover:text-primary hover:bg-secondary/30 transition-colors whitespace-nowrap rounded-lg"
              >
                {cat.name}
              </Link>
            ))}
            <div className="flex-1"></div>
            <Link to="/blog" className="px-4 py-3 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">
              Tin tức
            </Link>
            <Link to="/order-tracking" className="px-4 py-3 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">
              Tra cứu đơn
            </Link>
          </div>

          {/* Mega menu - Glass dropdown */}
          {megaMenuOpen && (
            <div className="absolute left-0 right-0 glass border-b border-border shadow-float animate-fade-in origin-top">
              <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-3 md:grid-cols-5 gap-8">
                  {categories.map(cat => (
                    <div key={cat.id} className="group/cat">
                      <Link
                        to={`/products?category=${cat.slug}`}
                        className="font-extrabold text-sm text-foreground hover:text-primary flex items-center gap-2 mb-4"
                        onClick={() => setMegaMenuOpen(false)}
                      >
                        <span className="text-2xl bg-secondary w-10 h-10 rounded-xl flex items-center justify-center group-hover/cat:scale-110 transition-transform">{cat.icon}</span> 
                        {cat.name}
                      </Link>
                      <div className="flex flex-col gap-2">
                        {cat.subcategories?.map(sub => (
                          <Link
                            key={sub.id}
                            to={`/products?category=${cat.slug}&sub=${sub.slug}`}
                            className="text-sm font-medium text-muted-foreground hover:text-primary hover:translate-x-1 transition-all pl-12"
                            onClick={() => setMegaMenuOpen(false)}
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile menu (Glass) */}
      {menuOpen && (
        <div className="md:hidden glass border-b border-border/50 animate-fade-in absolute w-full top-full">
          <form onSubmit={handleSearch} className="px-4 py-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm sản phẩm..."
                className="w-full pl-4 pr-12 py-3 rounded-xl border border-border/50 bg-secondary/50 text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center gradient-primary text-white rounded-lg">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>
          <div className="px-4 pb-6 space-y-2 max-h-[70vh] overflow-y-auto">
            <div className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-2 px-2">Danh mục</div>
            {categories.map(cat => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.slug}`}
                className="flex items-center gap-3 py-3 px-4 text-sm font-bold text-foreground bg-secondary/30 rounded-xl"
                onClick={() => setMenuOpen(false)}
              >
                <span className="text-lg">{cat.icon}</span> {cat.name}
              </Link>
            ))}
            <div className="h-px bg-border my-4"></div>
            <Link to="/blog" className="block py-2.5 px-4 text-sm font-bold text-foreground hover:bg-secondary/50 rounded-xl" onClick={() => setMenuOpen(false)}>
              Tin tức
            </Link>
            <Link to="/order-tracking" className="block py-2.5 px-4 text-sm font-bold text-foreground hover:bg-secondary/50 rounded-xl" onClick={() => setMenuOpen(false)}>
              Tra cứu đơn hàng
            </Link>
            <Link to="/stores" className="block py-2.5 px-4 text-sm font-bold text-foreground hover:bg-secondary/50 rounded-xl" onClick={() => setMenuOpen(false)}>
              Hệ thống cửa hàng
            </Link>
            <div className="mt-4 pt-4 border-t border-border">
              {isAuthenticated ? (
                <div className="flex flex-col gap-2">
                  <Link to="/profile" className="flex items-center justify-center gap-2 gradient-primary text-white py-3 rounded-xl font-bold" onClick={() => setMenuOpen(false)}>
                    Tài khoản của tôi
                  </Link>
                  <button onClick={() => { logout(); setMenuOpen(false); }} className="py-3 text-sm font-bold text-destructive">
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <Link to="/login" className="flex items-center justify-center gap-2 gradient-primary text-white py-3 rounded-xl font-bold" onClick={() => setMenuOpen(false)}>
                  <User className="w-5 h-5" /> Đăng nhập / Đăng ký
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
