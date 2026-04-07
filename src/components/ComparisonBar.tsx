import { Link } from "react-router-dom";
import { X, GitCompare } from "lucide-react";
import { useComparison } from "@/contexts/ComparisonContext";

const ComparisonBar = () => {
  const { items, removeFromComparison, clearComparison, setComparisonOpen, isComparisonOpen } = useComparison();

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-float animate-fade-in">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold flex items-center gap-1.5">
              <GitCompare className="w-4 h-4 text-primary" />
              So sánh ({items.length}/4)
            </span>
            <div className="flex gap-2">
              {items.map(product => (
                <div key={product.id} className="relative group">
                  <img src={product.images[0]} alt={product.name} className="w-12 h-12 rounded-lg object-cover border border-border" />
                  <button
                    onClick={() => removeFromComparison(product.id)}
                    className="absolute -top-1.5 -right-1.5 bg-card rounded-full p-0.5 shadow border border-border opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={clearComparison} className="text-xs text-muted-foreground hover:text-sale px-3 py-1.5 rounded-lg border border-border">
              Xóa tất cả
            </button>
            <Link to="/comparison" className="gradient-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
              So sánh ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonBar;
