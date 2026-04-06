import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { CartItem, Product } from "@/types/product";
import { toast } from "sonner";
import { products as fallbackProducts } from "@/data/mockData";
import { fetchRemoteCart, toRemoteCartItems, upsertRemoteCart } from "@/services/cartApi";

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = "novax-cart";

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) {
        return [];
      }
      return JSON.parse(raw) as CartItem[];
    } catch {
      return [];
    }
  });
  const hasHydratedRemoteRef = useRef(false);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (hasHydratedRemoteRef.current) {
      return;
    }

    hasHydratedRemoteRef.current = true;

    const hydrateFromRemote = async () => {
      try {
        const remote = await fetchRemoteCart();
        if (!remote.items || remote.items.length === 0) {
          return;
        }

        const remoteItems: CartItem[] = remote.items
          .map((remoteItem) => {
            const product = fallbackProducts.find((item) => item.id === remoteItem.productId);
            if (!product) {
              return null;
            }

            return {
              product,
              quantity: remoteItem.quantity
            };
          })
          .filter((item): item is CartItem => Boolean(item));

        if (remoteItems.length > 0) {
          setItems(remoteItems);
        }
      } catch {
        // Keep local cart when backend is unavailable.
      }
    };

    void hydrateFromRemote();
  }, []);

  const syncRemoteCart = useCallback(async (nextItems: CartItem[]) => {
    try {
      await upsertRemoteCart(toRemoteCartItems(nextItems));
    } catch {
      // Keep local cart as source of truth when API is down.
    }
  }, []);

  const addToCart = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find(item => item.product.id === product.id);
      let nextItems: CartItem[];

      if (existing) {
        toast.success(`Đã tăng số lượng ${product.name}`);
        nextItems = prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        toast.success(`Đã thêm ${product.name} vào giỏ hàng`);
        nextItems = [...prev, { product, quantity: 1 }];
      }

      void syncRemoteCart(nextItems);
      return nextItems;
    });
  }, [syncRemoteCart]);

  const removeFromCart = useCallback((productId: string) => {
    setItems((prev) => {
      const nextItems = prev.filter((item) => item.product.id !== productId);
      void syncRemoteCart(nextItems);
      return nextItems;
    });
    toast.info("Đã xóa sản phẩm khỏi giỏ hàng");
  }, [syncRemoteCart]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) => {
      let nextItems: CartItem[];

      if (quantity <= 0) {
        nextItems = prev.filter((item) => item.product.id !== productId);
      } else {
        nextItems = prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item));
      }

      void syncRemoteCart(nextItems);
      return nextItems;
    });
  }, [syncRemoteCart]);

  const clearCart = useCallback(() => {
    setItems([]);
    void syncRemoteCart([]);
    toast.info("Đã xóa toàn bộ giỏ hàng");
  }, [syncRemoteCart]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
