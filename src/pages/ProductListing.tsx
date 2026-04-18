import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  SlidersHorizontal,
  Grid3X3,
  List,
  Star,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { products as fallbackProducts, categories, formatPrice } from "@/data/mockData";
import ProductCard from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/Skeleton";
import { Product } from "@/types/product";
import { fetchProducts } from "@/services/catalogApi";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

const DEFAULT_MIN_PRICE = 0;
const DEFAULT_MAX_PRICE = 50000000;
const PRODUCTS_PER_PAGE = 12;

const sortOptions = [
  { value: "default", label: "Mặc định" },
  { value: "price-asc", label: "Giá tăng dần" },
  { value: "price-desc", label: "Giá giảm dần" },
  { value: "rating", label: "Đánh giá cao" },
  { value: "bestseller", label: "Bán chạy" },
];

const pricePresets: Array<{ label: string; min: number; max: number }> = [
  { label: "Dưới 5 triệu", min: 0, max: 5000000 },
  { label: "5 - 10 triệu", min: 5000000, max: 10000000 },
  { label: "10 - 20 triệu", min: 10000000, max: 20000000 },
  { label: "Trên 20 triệu", min: 20000000, max: DEFAULT_MAX_PRICE },
];

type FilterState = {
  priceRange: [number, number];
  selectedBrands: string[];
  minRating: number;
  sortBy: string;
};

function parseNumberParam(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBrandsParam(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function clampPriceRange(min: number, max: number): [number, number] {
  const nextMin = Math.max(DEFAULT_MIN_PRICE, Math.min(min, DEFAULT_MAX_PRICE));
  const nextMax = Math.max(DEFAULT_MIN_PRICE, Math.min(max, DEFAULT_MAX_PRICE));
  return nextMin <= nextMax ? [nextMin, nextMax] : [nextMax, nextMin];
}

function buildCompactPagination(currentPage: number, totalPages: number): Array<number | "dots"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "dots", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, "dots", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "dots", currentPage - 1, currentPage, currentPage + 1, "dots", totalPages];
}

type FilterSidebarProps = {
  state: FilterState;
  availableBrands: string[];
  brandCounts: Map<string, number>;
  onPriceRangeChange: (range: [number, number]) => void;
  onToggleBrand: (brand: string) => void;
  onRatingChange: (rating: number) => void;
  onApplyPreset: (min: number, max: number) => void;
};

const FilterSidebar = ({
  state,
  availableBrands,
  brandCounts,
  onPriceRangeChange,
  onToggleBrand,
  onRatingChange,
  onApplyPreset,
}: FilterSidebarProps) => {
  const [sliderValue, setSliderValue] = useState<[number, number]>(state.priceRange);

  useEffect(() => {
    setSliderValue(state.priceRange);
  }, [state.priceRange]);

  return (
    <Accordion type="multiple" defaultValue={["price", "brand", "rating"]} className="w-full">
      <AccordionItem value="price">
        <AccordionTrigger className="py-3 text-sm font-semibold">Khoảng giá</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            <Slider
              value={[sliderValue[0], sliderValue[1]]}
              min={DEFAULT_MIN_PRICE}
              max={DEFAULT_MAX_PRICE}
              step={500000}
              onValueChange={(value) => {
                if (value.length !== 2) return;
                setSliderValue(clampPriceRange(value[0], value[1]));
              }}
              onValueCommit={(value) => {
                if (value.length !== 2) return;
                onPriceRangeChange(clampPriceRange(value[0], value[1]));
              }}
              className="pt-2"
            />

            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-muted-foreground">
                Từ
                <input
                  type="number"
                  min={DEFAULT_MIN_PRICE}
                  max={state.priceRange[1]}
                  step={500000}
                  value={state.priceRange[0]}
                  onChange={(event) => {
                    const nextMin = parseNumberParam(event.target.value, DEFAULT_MIN_PRICE);
                    onPriceRangeChange(clampPriceRange(nextMin, state.priceRange[1]));
                  }}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
              <label className="text-xs text-muted-foreground">
                Đến
                <input
                  type="number"
                  min={state.priceRange[0]}
                  max={DEFAULT_MAX_PRICE}
                  step={500000}
                  value={state.priceRange[1]}
                  onChange={(event) => {
                    const nextMax = parseNumberParam(event.target.value, DEFAULT_MAX_PRICE);
                    onPriceRangeChange(clampPriceRange(state.priceRange[0], nextMax));
                  }}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              {pricePresets.map((preset) => {
                const active = state.priceRange[0] === preset.min && state.priceRange[1] === preset.max;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => onApplyPreset(preset.min, preset.max)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                      active ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/70"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatPrice(state.priceRange[0])}</span>
              <span>{formatPrice(state.priceRange[1])}</span>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="brand">
        <AccordionTrigger className="py-3 text-sm font-semibold">Thương hiệu</AccordionTrigger>
        <AccordionContent>
          <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
            {availableBrands.map((brand) => (
              <label
                key={brand}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-secondary"
              >
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={state.selectedBrands.includes(brand)}
                    onChange={() => onToggleBrand(brand)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  {brand}
                </span>
                <span className="text-xs text-muted-foreground">{brandCounts.get(brand) || 0}</span>
              </label>
            ))}
            {availableBrands.length === 0 && (
              <p className="rounded-lg bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">Chưa có thương hiệu.</p>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="rating">
        <AccordionTrigger className="py-3 text-sm font-semibold">Đánh giá</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-1">
            {[4, 3, 2, 1].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => onRatingChange(state.minRating === rating ? 0 : rating)}
                className={`flex w-full items-center gap-1 rounded-lg px-2 py-1.5 text-sm ${
                  state.minRating === rating ? "bg-primary/10 text-primary" : "hover:bg-secondary"
                }`}
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i < rating ? "fill-warning text-warning" : "text-border"}`} />
                ))}
                <span className="ml-1">trở lên</span>
              </button>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

const ProductListing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySlug = searchParams.get("category");
  const query = searchParams.get("q");

  const [priceRange, setPriceRange] = useState<[number, number]>([DEFAULT_MIN_PRICE, DEFAULT_MAX_PRICE]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("default");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [apiProducts, setApiProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [draftFilters, setDraftFilters] = useState<FilterState>({
    priceRange: [DEFAULT_MIN_PRICE, DEFAULT_MAX_PRICE],
    selectedBrands: [],
    minRating: 0,
    sortBy: "default",
  });

  useEffect(() => {
    const parsedMin = parseNumberParam(searchParams.get("minPrice"), DEFAULT_MIN_PRICE);
    const parsedMax = parseNumberParam(searchParams.get("maxPrice"), DEFAULT_MAX_PRICE);
    const [nextMin, nextMax] = clampPriceRange(parsedMin, parsedMax);
    const nextBrands = parseBrandsParam(searchParams.get("brands"));
    const nextRating = Math.max(0, Math.min(5, parseNumberParam(searchParams.get("rating"), 0)));
    const nextSort = searchParams.get("sort") || "default";
    const nextView = searchParams.get("view") === "list" ? "list" : "grid";
    const nextPage = Math.max(1, parseNumberParam(searchParams.get("page"), 1));

    setPriceRange([nextMin, nextMax]);
    setSelectedBrands(nextBrands);
    setMinRating(nextRating);
    setSortBy(nextSort);
    setViewMode(nextView);
    setCurrentPage(nextPage);
  }, [searchParams]);

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
          pageSize: 100,
        });

        if (isMounted) {
          setApiProducts(data.items);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to load products:", err);
          setApiError("Không kết nối được API. Đang hiển thị dữ liệu mẫu.");
          setApiProducts(fallbackProducts);
        }
      } finally {
        if (isMounted) {
          setIsLoadingProducts(false);
        }
      }
    };

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, [categorySlug, query]);

  const baseProducts = useMemo(() => {
    let result = [...apiProducts];
    if (categorySlug) result = result.filter((p) => p.category === categorySlug);
    if (query) result = result.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
    return result;
  }, [apiProducts, categorySlug, query]);

  const availableBrands = useMemo(() => {
    return Array.from(new Set(baseProducts.map((product) => product.brand).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, "vi"),
    );
  }, [baseProducts]);

  const brandCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of baseProducts) {
      const next = (counts.get(product.brand) || 0) + 1;
      counts.set(product.brand, next);
    }
    return counts;
  }, [baseProducts]);

  const filteredProducts = useMemo(() => {
    let result = [...baseProducts];

    result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    if (selectedBrands.length > 0) {
      result = result.filter((p) => selectedBrands.includes(p.brand));
    }

    if (minRating > 0) {
      result = result.filter((p) => p.rating >= minRating);
    }

    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "bestseller":
        result.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
        break;
      default:
        break;
    }

    return result;
  }, [baseProducts, priceRange, selectedBrands, minRating, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedProducts = filteredProducts.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE);
  const currentCategory = categories.find((c) => c.slug === categorySlug);
  const paginationItems = buildCompactPagination(currentPage, totalPages);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    if (priceRange[0] !== DEFAULT_MIN_PRICE) params.set("minPrice", String(priceRange[0]));
    else params.delete("minPrice");

    if (priceRange[1] !== DEFAULT_MAX_PRICE) params.set("maxPrice", String(priceRange[1]));
    else params.delete("maxPrice");

    if (selectedBrands.length > 0) params.set("brands", selectedBrands.join(","));
    else params.delete("brands");

    if (minRating > 0) params.set("rating", String(minRating));
    else params.delete("rating");

    if (sortBy !== "default") params.set("sort", sortBy);
    else params.delete("sort");

    if (viewMode !== "grid") params.set("view", viewMode);
    else params.delete("view");

    if (currentPage > 1) params.set("page", String(currentPage));
    else params.delete("page");

    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [
    currentPage,
    minRating,
    priceRange,
    searchParams,
    selectedBrands,
    setSearchParams,
    sortBy,
    viewMode,
  ]);

  const activeFiltersCount =
    (priceRange[0] !== DEFAULT_MIN_PRICE || priceRange[1] !== DEFAULT_MAX_PRICE ? 1 : 0) +
    selectedBrands.length +
    (minRating > 0 ? 1 : 0) +
    (sortBy !== "default" ? 1 : 0);

  const clearAllFilters = () => {
    setPriceRange([DEFAULT_MIN_PRICE, DEFAULT_MAX_PRICE]);
    setSelectedBrands([]);
    setMinRating(0);
    setSortBy("default");
    setCurrentPage(1);
  };

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];

    if (priceRange[0] !== DEFAULT_MIN_PRICE || priceRange[1] !== DEFAULT_MAX_PRICE) {
      chips.push({
        key: "price",
        label: `${formatPrice(priceRange[0])} - ${formatPrice(priceRange[1])}`,
        onRemove: () => setPriceRange([DEFAULT_MIN_PRICE, DEFAULT_MAX_PRICE]),
      });
    }

    for (const brand of selectedBrands) {
      chips.push({
        key: `brand-${brand}`,
        label: brand,
        onRemove: () => setSelectedBrands((prev) => prev.filter((item) => item !== brand)),
      });
    }

    if (minRating > 0) {
      chips.push({
        key: "rating",
        label: `${minRating} sao trở lên`,
        onRemove: () => setMinRating(0),
      });
    }

    if (sortBy !== "default") {
      chips.push({
        key: "sort",
        label: sortOptions.find((option) => option.value === sortBy)?.label || "Sắp xếp",
        onRemove: () => setSortBy("default"),
      });
    }

    return chips;
  }, [minRating, priceRange, selectedBrands, sortBy]);

  const applyMobileFilters = () => {
    setPriceRange(draftFilters.priceRange);
    setSelectedBrands(draftFilters.selectedBrands);
    setMinRating(draftFilters.minRating);
    setSortBy(draftFilters.sortBy);
    setCurrentPage(1);
    setShowFilters(false);
  };

  const clearMobileDraft = () => {
    setDraftFilters({
      priceRange: [DEFAULT_MIN_PRICE, DEFAULT_MAX_PRICE],
      selectedBrands: [],
      minRating: 0,
      sortBy: "default",
    });
  };

  const openMobileFilters = () => {
    setDraftFilters({
      priceRange,
      selectedBrands,
      minRating,
      sortBy,
    });
    setShowFilters(true);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary">
          Trang chủ
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground">
          {currentCategory?.name || query ? `Kết quả: "${query}"` : "Tất cả sản phẩm"}
        </span>
      </nav>

      <div className="flex gap-6">
        <aside className="hidden w-72 shrink-0 xl:block">
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-bold">
                <SlidersHorizontal className="h-4 w-4" /> Bộ lọc
              </h3>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </button>
              )}
            </div>

            <FilterSidebar
              state={{ priceRange, selectedBrands, minRating, sortBy }}
              availableBrands={availableBrands}
              brandCounts={brandCounts}
              onPriceRangeChange={(range) => {
                setPriceRange(range);
                setCurrentPage(1);
              }}
              onToggleBrand={(brand) => {
                setSelectedBrands((prev) =>
                  prev.includes(brand) ? prev.filter((item) => item !== brand) : [...prev, brand],
                );
                setCurrentPage(1);
              }}
              onRatingChange={(rating) => {
                setMinRating(rating);
                setCurrentPage(1);
              }}
              onApplyPreset={(min, max) => {
                setPriceRange([min, max]);
                setCurrentPage(1);
              }}
            />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="sticky top-[72px] z-20 mb-4 rounded-xl border border-border bg-card/95 p-3 backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={openMobileFilters}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm xl:hidden"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Lọc
                  {activeFiltersCount > 0 && (
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
                <span className="text-sm text-muted-foreground">{filteredProducts.length} sản phẩm</span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(event) => {
                    setSortBy(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setViewMode("grid")}
                  className={`rounded p-1.5 ${
                    viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`rounded p-1.5 ${
                    viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>

            {activeFilterChips.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/70 pt-3">
                {activeFilterChips.map((chip) => (
                  <button
                    key={chip.key}
                    onClick={() => {
                      chip.onRemove();
                      setCurrentPage(1);
                    }}
                    className="group inline-flex items-center gap-1 rounded-full border border-border bg-secondary/70 px-2.5 py-1 text-xs hover:bg-secondary"
                  >
                    {chip.label}
                    <X className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
                  </button>
                ))}
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
                >
                  <RotateCcw className="h-3 w-3" /> Xóa tất cả
                </button>
              </div>
            )}
          </div>

          <Drawer open={showFilters} onOpenChange={setShowFilters}>
            <DrawerContent className="max-h-[88vh]">
              <DrawerHeader className="border-b pb-3">
                <DrawerTitle className="flex items-center gap-2 text-base">
                  <SlidersHorizontal className="h-4 w-4" /> Bộ lọc sản phẩm
                </DrawerTitle>
                <DrawerDescription>Chọn bộ lọc rồi bấm Áp dụng để cập nhật kết quả.</DrawerDescription>
              </DrawerHeader>

              <div className="overflow-y-auto px-4 pb-2">
                <div className="mb-3 rounded-lg bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
                  Kết quả tạm tính: {filteredProducts.length} sản phẩm
                </div>
                <div className="mb-4 rounded-lg border border-border/60 p-3">
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground">Sắp xếp</label>
                  <select
                    value={draftFilters.sortBy}
                    onChange={(event) => setDraftFilters((prev) => ({ ...prev, sortBy: event.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <FilterSidebar
                  state={draftFilters}
                  availableBrands={availableBrands}
                  brandCounts={brandCounts}
                  onPriceRangeChange={(range) => setDraftFilters((prev) => ({ ...prev, priceRange: range }))}
                  onToggleBrand={(brand) => {
                    setDraftFilters((prev) => ({
                      ...prev,
                      selectedBrands: prev.selectedBrands.includes(brand)
                        ? prev.selectedBrands.filter((item) => item !== brand)
                        : [...prev.selectedBrands, brand],
                    }));
                  }}
                  onRatingChange={(rating) => setDraftFilters((prev) => ({ ...prev, minRating: rating }))}
                  onApplyPreset={(min, max) => setDraftFilters((prev) => ({ ...prev, priceRange: [min, max] }))}
                />
              </div>

              <DrawerFooter className="border-t bg-background/95">
                <div className="flex gap-2">
                  <button
                    onClick={clearMobileDraft}
                    className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-semibold"
                  >
                    Xóa lọc
                  </button>
                  <button
                    onClick={applyMobileFilters}
                    className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                  >
                    Áp dụng
                  </button>
                </div>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>

          {isLoadingProducts && <ProductGridSkeleton count={8} />}

          {apiError && (
            <div className="mb-3 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-foreground">
              {apiError}
            </div>
          )}

          {!isLoadingProducts && (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4"
                  : "space-y-3"
              }
            >
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {filteredProducts.length === 0 && !isLoadingProducts && (
            <div className="py-16 text-center">
              <p className="text-lg text-muted-foreground">Không tìm thấy sản phẩm phù hợp.</p>
              <Link to="/products" className="mt-2 inline-block font-medium text-primary hover:underline">
                Xem tất cả sản phẩm
              </Link>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-border p-2 transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {paginationItems.map((item, index) => {
                if (item === "dots") {
                  return (
                    <span key={`dots-${index}`} className="px-2 text-sm text-muted-foreground">
                      ...
                    </span>
                  );
                }

                return (
                  <button
                    key={item}
                    onClick={() => setCurrentPage(item)}
                    className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === item
                        ? "gradient-primary text-primary-foreground"
                        : "border border-border hover:bg-secondary"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-border p-2 transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductListing;