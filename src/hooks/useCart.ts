import { useCallback, useEffect, useMemo, useState } from 'react';
import { DessertItem } from '../data/desserts';

export interface CartItem {
  key: string;
  dessertId: string;
  name: string;
  frenchSubtitle: string;
  variantLabel: string;
  unitPrice: number;
  quantity: number;
  fallbackImage: string;
}

const STORAGE_KEY = 'eclat_boutique_bag_v1';

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage quota / private mode issues
    }
  }, [items]);

  const addItem = useCallback(
    (dessert: DessertItem, variantLabel?: string, quantity = 1) => {
      const chosenVariant =
        dessert.variants.find((v) => v.label === variantLabel) ??
        dessert.variants[0];
      const key = `${dessert.id}::${chosenVariant.label}`;

      setItems((prev) => {
        const existing = prev.find((item) => item.key === key);
        if (existing) {
          return prev.map((item) =>
            item.key === key
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          );
        }
        return [
          ...prev,
          {
            key,
            dessertId: dessert.id,
            name: dessert.name,
            frenchSubtitle: dessert.frenchSubtitle,
            variantLabel: chosenVariant.label,
            unitPrice: chosenVariant.price,
            quantity,
            fallbackImage: dessert.fallbackImage,
          },
        ];
      });
    },
    [],
  );

  const updateQuantity = useCallback((key: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.key === key ? { ...item, quantity: item.quantity + delta } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items],
  );

  return {
    items,
    totalCount,
    subtotal,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  };
}
