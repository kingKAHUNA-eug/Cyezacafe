// Client-side price preview. The server recalculates everything when the
// order is placed, so these numbers are only for showing the customer a total.

export function defaultCustomization(item) {
  if (!item.customizable) return {};
  if (item.category === 'Coffee') {
    return { size: 'regular', milk: 'whole', syrup: '', syrupPumps: 0, extraShots: 0, notes: '' };
  }
  return { size: 'regular', notes: '' };
}

export function unitPrice(line, options) {
  let price = line.basePrice;
  if (!line.customizable || !options) return price;
  const c = line.customization || {};
  price += options.sizes?.[c.size] || 0;
  if (line.category === 'Coffee') {
    price += options.milks?.[c.milk] || 0;
    price += (c.syrupPumps || 0) * options.syrupPumpPrice;
    price += (c.extraShots || 0) * options.extraShotPrice;
  }
  return price;
}

// Short text like "Large · Oat milk · Vanilla x2 · +1 shot"
export function describeCustomization(c = {}) {
  const parts = [];
  if (c.size && c.size !== 'regular') parts.push(c.size[0].toUpperCase() + c.size.slice(1));
  if (c.milk && c.milk !== 'whole') parts.push(`${c.milk[0].toUpperCase() + c.milk.slice(1)} milk`);
  if (c.syrup) parts.push(`${c.syrup[0].toUpperCase() + c.syrup.slice(1)} x${c.syrupPumps || 1}`);
  if (c.extraShots) parts.push(`+${c.extraShots} shot${c.extraShots > 1 ? 's' : ''}`);
  return parts.join(' · ');
}

function promoDiscount(promo, units) {
  const eligible = promo.categories?.length
    ? units.filter((u) => promo.categories.includes(u.category))
    : units;
  if (promo.type === 'bogo') {
    // In every pair of items the cheaper one is free
    const sorted = eligible.map((u) => u.price).sort((a, b) => b - a);
    return sorted.reduce((sum, p, i) => (i % 2 === 1 ? sum + p : sum), 0);
  }
  if (promo.type === 'percent') {
    const total = eligible.reduce((s, u) => s + u.price, 0);
    return Math.floor((total * promo.value) / 100);
  }
  return 0;
}

// units = [{ price, category }], one per single item. Only auto-applied promos are previewed.
export function estimateDiscount(promos, units) {
  let best = { discount: 0, promo: null };
  for (const promo of promos || []) {
    if (!promo.autoApply) continue;
    const discount = promoDiscount(promo, units);
    if (discount > best.discount) best = { discount, promo };
  }
  return best;
}