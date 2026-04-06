import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, User, Menu, X, ChevronDown } from "lucide-react";
import { categories } from "@/data/mockData";
import { useCart } from "@/contexts/CartContext";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const { totalItems } = useCart();
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

  return (
    <header className="sticky top-0 z-50 bg-card shadow-card">
      {/* Top bar */}
      <div className="gradient-primary">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <Link to="/" className="text-primary-foreground font-extrabold text-xl md:text-2xl tracking-tight flex items-center gap-2">
            ⚡ TechMart
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                placeholder="Bạn tìm gì hôm nay?"
                className="w-full pl-4 pr-12 py-2.5 rounded-lg text-foreground bg-card border-0 focus:ring-2 focus:ring-accent outline-none text-sm"
              />
              <button type="submit" className="absolute right-0 top-0 h-full px-4 gradient-accent rounded-r-lg text-accent-foreground hover:opacity-90 transition-opacity">
                <Search className="w-5 h-5" />
              </button>
              {/* AI-ready autocomplete placeholder */}
              {searchFocused && searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card rounded-lg shadow-float border border-border p-3 z-50">
                  <p className="text-xs text-muted-foreground">🔍 Gợi ý: {searchQuery}...</p>
                  <p className="text-xs text-muted-foreground mt-1">💡 AI sẽ gợi ý sản phẩm tại đây</p>
                </div>
              )}
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link to="/cart" className="relative text-primary-foreground hover:opacity-80 transition-opacity p-2">
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
            <Link to="/profile" className="text-primary-foreground hover:opacity-80 transition-opacity p-2 hidden md:block">
              <User className="w-6 h-6" />
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-primary-foreground p-2">
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Category nav */}
      <nav className="hidden md:block bg-card border-b border-border" ref={megaMenuRef}>
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMegaMenuOpen(!megaMenuOpen)}
              className="flex items-center gap-1 px-4 py-3 font-semibold text-sm hover:text-primary transition-colors"
            >
              <Menu className="w-4 h-4" />
              Danh mục
              <ChevronDown className={`w-3 h-3 transition-transform ${megaMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {categories.slice(0, 7).map(cat => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.slug}`}
                className="px-3 py-3 text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
              >
                {cat.icon} {cat.name}
              </Link>
            ))}
          </div>

          {/* Mega menu */}
          {megaMenuOpen && (
            <div className="absolute left-0 right-0 bg-card border-b border-border shadow-float animate-fade-in">
              <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-3 md:grid-cols-5 gap-6">
                  {categories.map(cat => (
                    <div key={cat.id}>
                      <Link
                        to={`/products?category=${cat.slug}`}
                        className="font-semibold text-sm text-foreground hover:text-primary flex items-center gap-2 mb-2"
                        onClick={() => setMegaMenuOpen(false)}
                      >
                        <span className="text-lg">{cat.icon}</span> {cat.name}
                      </Link>
                      {cat.subcategories?.map(sub => (
                        <Link
                          key={sub.id}
                          to={`/products?category=${cat.slug}&sub=${sub.slug}`}
                          className="block text-sm text-muted-foreground hover:text-primary py-0.5 pl-7"
                          onClick={() => setMegaMenuOpen(false)}
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-card border-b border-border animate-fade-in">
          <form onSubmit={handleSearch} className="px-4 py-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm..."
                className="w-full pl-4 pr-10 py-2 rounded-lg border border-border bg-secondary text-sm focus:ring-2 focus:ring-primary outline-none"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>
          <div className="px-4 pb-4 space-y-1">
            {categories.map(cat => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.slug}`}
                className="block py-2 px-3 text-sm text-foreground hover:bg-secondary rounded-md"
                onClick={() => setMenuOpen(false)}
              >
                {cat.icon} {cat.name}
              </Link>
            ))}
            <Link to="/profile" className="block py-2 px-3 text-sm text-foreground hover:bg-secondary rounded-md" onClick={() => setMenuOpen(false)}>
              👤 Tài khoản
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
