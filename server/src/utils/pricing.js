import {
  SIZE_PRICES, MILK_SURCHARGE, SYRUPS, SYRUP_PUMP_PRICE, EXTRA_SHOT_PRICE,
  MAX_SYRUP_PUMPS, MAX_EXTRA_SHOTS,
} from '../config/pricing.js';

const clampInt = (v, min, max) => Math.min(max, Math.max(min, parseInt(v, 10) || 0));

// Never trust the client: rebuild the customization from allowed values only.
export function cleanCustomization(raw = {}, menuItem) {
  if (!menuItem.customizable) return {};
  const c = {
    size: Object.keys(SIZE_PRICES).includes(raw.size) ? raw.size : 'regular',
    notes: String(raw.notes || '').slice(0, 200),
  };
  if (menuItem.category === 'Coffee') {
    c.milk = Object.keys(MILK_SURCHARGE).includes(raw.milk) ? raw.milk : 'whole';
    c.syrup = SYRUPS.includes(raw.syrup) ? raw.syrup : '';
    c.syrupPumps = c.syrup ? clampInt(raw.syrupPumps || 1, 1, MAX_SYRUP_PUMPS) : 0;
    c.extraShots = clampInt(raw.extraShots, 0, MAX_EXTRA_SHOTS);
  }
  return c;
}

export function unitPrice(menuItem, c) {
  let price = menuItem.price;
  if (!menuItem.customizable) return price;
  price += SIZE_PRICES[c.size] || 0;
  if (menuItem.category === 'Coffee') {
    price += MILK_SURCHARGE[c.milk] || 0;
    price += (c.syrupPumps || 0) * SYRUP_PUMP_PRICE;
    price += (c.extraShots || 0) * EXTRA_SHOT_PRICE;
  }
  return price;
}

// units = [{ price, category }] — one entry per single item ordered.
export function promotionDiscount(promo, units) {
  const eligible = promo.categories?.length
    ? units.filter((u) => promo.categories.includes(u.category))
    : units;
  if (promo.type === 'bogo') {
    // Buy one, get one free: in every pair, the cheaper item is free.
    const sorted = eligible.map((u) => u.price).sort((a, b) => b - a);
    return sorted.reduce((sum, price, i) => (i % 2 === 1 ? sum + price : sum), 0);
  }
  if (promo.type === 'percent') {
    const total = eligible.reduce((s, u) => s + u.price, 0);
    return Math.floor((total * promo.value) / 100);
  }
  return 0;
}

// Auto-apply promos always count; code promos only when the code matches.
export function pickBestPromotion(promos, units, code = '') {
  const wanted = String(code || '').trim().toUpperCase();
  let best = null;
  for (const promo of promos) {
    if (!promo.autoApply && !(wanted && promo.code === wanted)) continue;
    const discount = promotionDiscount(promo, units);
    if (discount > 0 && (!best || discount > best.discount)) best = { promo, discount };
  }
  return best;
}