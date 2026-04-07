const ProductCardSkeleton = () => (
  <div className="bg-card rounded-xl border border-border overflow-hidden animate-pulse">
    <div className="w-full aspect-square bg-secondary"></div>
    <div className="p-3 space-y-2">
      <div className="h-4 bg-secondary rounded w-full"></div>
      <div className="h-4 bg-secondary rounded w-3/4"></div>
      <div className="flex items-center gap-1">
        <div className="h-3 bg-secondary rounded w-8"></div>
        <div className="h-3 bg-secondary rounded w-12"></div>
      </div>
      <div className="h-5 bg-secondary rounded w-1/2"></div>
      <div className="h-3 bg-secondary rounded w-1/3"></div>
      <div className="h-9 bg-secondary rounded w-full mt-2"></div>
    </div>
  </div>
);

export const ProductGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

export const BannerSkeleton = () => (
  <div className="w-full h-[200px] md:h-[400px] bg-secondary animate-pulse rounded-xl"></div>
);

export const CategorySkeleton = () => (
  <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
    {Array.from({ length: 9 }).map((_, i) => (
      <div key={i} className="flex flex-col items-center gap-2 p-3 bg-card rounded-xl border border-border animate-pulse">
        <div className="w-8 h-8 bg-secondary rounded-full"></div>
        <div className="h-3 bg-secondary rounded w-12"></div>
      </div>
    ))}
  </div>
);

export const HorizontalScrollSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="flex gap-4 overflow-hidden">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="min-w-[200px] max-w-[220px] flex-shrink-0">
        <ProductCardSkeleton />
      </div>
    ))}
  </div>
);

export default ProductCardSkeleton;
