import { useState, useCallback, useEffect } from "react";
import { Product } from "@/types/product";

const STORAGE_KEY = "novax-recently-viewed";
const MAX_ITEMS = 12;

export function useRecentlyViewed() {
  const [items, setItems] = useState<Product[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) as Product[] : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToRecentlyViewed = useCallback((product: Product) => {
    setItems(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      return [product, ...filtered].slice(0, MAX_ITEMS);
    });
  }, []);

  const clearRecentlyViewed = useCallback(() => {
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { items, addToRecentlyViewed, clearRecentlyViewed };
}
