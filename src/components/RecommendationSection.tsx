import ProductCard from "@/components/ProductCard";
import { Product } from "@/types/product";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

interface RecommendationSectionProps {
  title: string;
  icon?: string;
  products: Product[];
  aiLabel?: string;
}

const RecommendationSection = ({ title, icon, products, aiLabel }: RecommendationSectionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
    }
  };

  if (products.length === 0) return null;

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">
          {icon && <span>{icon}</span>}
          {title}
          {aiLabel && (
            <span className="ml-2 text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {aiLabel}
            </span>
          )}
        </h2>
        <div className="flex gap-2">
          <button onClick={() => scroll("left")} className="p-1.5 rounded-full border border-border hover:bg-secondary transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scroll("right")} className="p-1.5 rounded-full border border-border hover:bg-secondary transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {products.map(product => (
          <div key={product.id} className="min-w-[200px] max-w-[220px] flex-shrink-0">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecommendationSection;
