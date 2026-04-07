import { useState, useMemo, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { SlidersHorizontal, Grid3X3, List, Star, X, ChevronLeft, ChevronRight } from "lucide-react";
import { products as fallbackProducts, categories, formatPrice } from "@/data/mockData";
import ProductCard from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/Skeleton";
import { Product } from "@/types/product";
import { fetchProducts } from "@/services/catalogApi";

const brands = ["Apple", "Samsung", "Xiaomi", "Dell", "LG", "Sony", "Daikin", "Panasonic", "Cuckoo", "OPPO"];
const PRODUCTS_PER_PAGE = 12;

const ProductListing = () => {
  const [searchParams] = useSearchParams();
  const categorySlug = searchParams.get("category");
  const query = searchParams.get("q");

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("default");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [apiProducts, setApiProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      setIsLoadingProducts(true);
      setApiError(null);

      try {
        const data = await fetchProducts({
          q: query,
          category: categorySlug,
          page: 1,
          pageSize: 100
        });

        if (isMounted) {
          setApiProducts(data.items);
        }
      } catch {
        if (isMounted) {
          setApiError("Không kết nối được API. Đang dùng dữ liệu mẫu.");
          setApiProducts(fallbackProducts);
        }
      } finally {
        if (isMounted) {
          setIsLoadingProducts(false);
        }
      }
    };

    void loadProducts();
    setCurrentPage(1);

    return () => {
      isMounted = false;
    };
  }, [categorySlug, query]);

  const filteredProducts = useMemo(() => {
    let result = [...apiProducts];
    if (categorySlug) result = result.filter(p => p.category === categorySlug);
    if (query) result = result.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (selectedBrands.length > 0) result = result.filter(p => selectedBrands.includes(p.brand));
    if (minRating > 0) result = result.filter(p => p.rating >= minRating);

    switch (sortBy) {
      case "price-asc": result.sort((a, b) => a.price - b.price); break;
      case "price-desc": result.sort((a, b) => b.price - a.price); break;
      case "rating": result.sort((a, b) => b.rating - a.rating); break;
      case "bestseller": result.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0)); break;
    }
    return result;
  }, [apiProducts, categorySlug, query, priceRange, selectedBrands, minRating, sortBy]);

  const currentCategory = categories.find(c => c.slug === categorySlug);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE);

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
    setCurrentPage(1);
  };

  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Price Range */}
      <div>
        <h4 className="font-semibold text-sm mb-3">Khoảng giá</h4>
        <input type="range" min={0} max={50000000} step={1000000} value={priceRange[1]}
          onChange={e => { setPriceRange([priceRange[0], Number(e.target.value)]); setCurrentPage(1); }}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{formatPrice(priceRange[0])}</span>
          <span>{formatPrice(priceRange[1])}</span>
        </div>
      </div>

      {/* Brands */}
      <div>
        <h4 className="font-semibold text-sm mb-3">Thương hiệu</h4>
        <div className="space-y-2">
          {brands.map(brand => (
            <label key={brand} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={selectedBrands.includes(brand)} onChange={() => toggleBrand(brand)}
                className="rounded border-border text-primary focus:ring-primary" />
              <span className="text-sm">{brand}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h4 className="font-semibold text-sm mb-3">Đánh giá</h4>
        <div className="space-y-1">
          {[4, 3, 2, 1].map(rating => (
            <button key={rating} onClick={() => { setMinRating(minRating === rating ? 0 : rating); setCurrentPage(1); }}
              className={`flex items-center gap-1 px-2 py-1 rounded text-sm w-full ${minRating === rating ? 'bg-primary/10 text-primary' : 'hover:bg-secondary'}`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? 'fill-warning text-warning' : 'text-border'}`} />
              ))}
              <span className="ml-1">trở lên</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link to="/" className="hover:text-primary">Trang chủ</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{currentCategory?.name || query ? `Kết quả: "${query}"` : "Tất cả sản phẩm"}</span>
      </nav>

      <div className="flex gap-6">
        {/* Desktop filter sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="bg-card rounded-xl border border-border p-4 sticky top-24">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" /> Bộ lọc
            </h3>
            <FilterSidebar />
          </div>
        </aside>

        {/* Products */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 bg-card rounded-xl border border-border p-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg text-sm">
                <SlidersHorizontal className="w-4 h-4" /> Lọc
              </button>
              <span className="text-sm text-muted-foreground">{filteredProducts.length} sản phẩm</span>
            </div>
            <div className="flex items-center gap-2">
              <select value={sortBy} onChange={e => { setSortBy(e.target.value); setCurrentPage(1); }}
                className="px-3 py-1.5 border border-border rounded-lg text-sm bg-card focus:ring-2 focus:ring-primary outline-none">
                <option value="default">Mặc định</option>
                <option value="price-asc">Giá tăng dần</option>
                <option value="price-desc">Giá giảm dần</option>
                <option value="rating">Đánh giá cao</option>
                <option value="bestseller">Bán chạy</option>
              </select>
              <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode("list")} className={`p-1.5 rounded ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile filter drawer */}
          {showFilters && (
            <div className="lg:hidden bg-card rounded-xl border border-border p-4 mb-4 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">Bộ lọc</h3>
                <button onClick={() => setShowFilters(false)}><X className="w-4 h-4" /></button>
              </div>
              <FilterSidebar />
            </div>
          )}

          {/* Loading skeleton */}
          {isLoadingProducts && <ProductGridSkeleton count={8} />}

          {apiError && (
            <div className="mb-3 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-foreground">
              {apiError}
            </div>
          )}

          {/* Product grid */}
          {!isLoadingProducts && (
            <div className={viewMode === "grid"
              ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
              : "space-y-3"
            }>
              {paginatedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {filteredProducts.length === 0 && !isLoadingProducts && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">Không tìm thấy sản phẩm phù hợp.</p>
              <Link to="/products" className="text-primary font-medium mt-2 inline-block hover:underline">Xem tất cả sản phẩm</Link>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-border hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${currentPage === i + 1 ? 'gradient-primary text-primary-foreground' : 'border border-border hover:bg-secondary'}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-border hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductListing;
