import React, { createContext, useContext, useState, useCallback } from "react";
import { Product } from "@/types/product";
import { toast } from "sonner";

interface ComparisonContextType {
  items: Product[];
  addToComparison: (product: Product) => void;
  removeFromComparison: (productId: string) => void;
  isInComparison: (productId: string) => boolean;
  clearComparison: () => void;
  isComparisonOpen: boolean;
  setComparisonOpen: (open: boolean) => void;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);
const MAX_COMPARISON = 4;

export const ComparisonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Product[]>([]);
  const [isComparisonOpen, setComparisonOpen] = useState(false);

  const addToComparison = useCallback((product: Product) => {
    setItems(prev => {
      if (prev.find(p => p.id === product.id)) {
        toast.info("Sản phẩm đã có trong danh sách so sánh");
        return prev;
      }
      if (prev.length >= MAX_COMPARISON) {
        toast.error(`Chỉ được so sánh tối đa ${MAX_COMPARISON} sản phẩm`);
        return prev;
      }
      toast.success(`Đã thêm ${product.name} vào so sánh`);
      return [...prev, product];
    });
  }, []);

  const removeFromComparison = useCallback((productId: string) => {
    setItems(prev => prev.filter(p => p.id !== productId));
  }, []);

  const isInComparison = useCallback((productId: string) => {
    return items.some(p => p.id === productId);
  }, [items]);

  const clearComparison = useCallback(() => {
    setItems([]);
    setComparisonOpen(false);
  }, []);

  return (
    <ComparisonContext.Provider value={{ items, addToComparison, removeFromComparison, isInComparison, clearComparison, isComparisonOpen, setComparisonOpen }}>
      {children}
    </ComparisonContext.Provider>
  );
};

export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (!context) throw new Error("useComparison must be used within ComparisonProvider");
  return context;
};
