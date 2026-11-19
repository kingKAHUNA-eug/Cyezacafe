import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useCafe } from './CafeContext.jsx';
import { defaultCustomization, estimateDiscount, unitPrice } from '../utils/pricing.js';

const CartContext = createContext(null);
const CART_KEY = 'cyeza_cart';
const MAX_QTY = 20;

const load = () => {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
};

// Same drink with the same options merges into one line
const lineKey = (id, customization) => `${id}|${JSON.stringify(customization || {})}`;

export function CartProvider({ children }) {
  const { options, promos } = useCafe();
  const [lines, setLines] = useState(load);

  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(lines)); } catch { /* ignore */ }
  }, [lines]);

  const addItem = useCallback((item, customization, quantity = 1) => {
    const c = customization || defaultCustomization(item);
    const key = lineKey(item._id, c);
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        return prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(MAX_QTY, l.quantity + quantity) } : l));
      }
      return [
        ...prev,
        {
          key, menuItem: item._id, name: item.name, category: item.category, image: item.image || '',
          basePrice: item.price, customizable: item.customizable, customization: c,
          quantity: Math.min(MAX_QTY, quantity),
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((key, quantity) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.key !== key)
        : prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(MAX_QTY, quantity) } : l))
    );
  }, []);

  const removeItem = useCallback((key) => setLines((prev) => prev.filter((l) => l.key !== key)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(() => {
    const priced = lines.map((l) => ({ ...l, unitPrice: unitPrice(l, options) }));
    const units = priced.flatMap((l) => Array(l.quantity).fill({ price: l.unitPrice, category: l.category }));
    const subtotal = units.reduce((s, u) => s + u.price, 0);
    const { discount, promo } = estimateDiscount(promos, units);
    return {
      lines: priced,
      count: lines.reduce((s, l) => s + l.quantity, 0),
      subtotal,
      discount,
      promo, // the promotion the preview applied, if any
      total: Math.max(0, subtotal - discount),
      addItem, setQuantity, removeItem, clear,
    };
  }, [lines, options, promos, addItem, setQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);