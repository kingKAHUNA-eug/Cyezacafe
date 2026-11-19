// All money values are whole Rwandan francs (RWF).
// Adjust these numbers to match the café's real prices.

export const SIZE_PRICES = { regular: 0, large: 700 };
export const MILK_SURCHARGE = { whole: 0, skim: 0, soy: 300, oat: 500, almond: 500 };
export const SYRUPS = ['vanilla', 'caramel', 'hazelnut', 'chocolate'];
export const SYRUP_PUMP_PRICE = 200;
export const EXTRA_SHOT_PRICE = 500;
export const MAX_SYRUP_PUMPS = 4;
export const MAX_EXTRA_SHOTS = 3;
export const MAX_QTY = 20;

// Loyalty
export const POINTS_PER_RWF = 100; // 1 point for every 100 RWF spent
export const PUNCH_TARGET = 10; // every 10th coffee is free
export const TIERS = [
  { name: 'Bronze', min: 0 },
  { name: 'Silver', min: 100000 },
  { name: 'Gold', min: 300000 },
];

// Coffee passes (monthly subscriptions)
export const SUBSCRIPTION_PLANS = {
  'starter-pass': {
    id: 'starter-pass',
    name: 'Starter Pass',
    description: '10 drip coffees, valid for 30 days',
    drinks: 10,
    days: 30,
    price: 18000,
  },
  'daily-pass': {
    id: 'daily-pass',
    name: 'Daily Drip Pass',
    description: '30 drip coffees, valid for 30 days',
    drinks: 30,
    days: 30,
    price: 48000,
  },
};

export const GIFT_LIMITS = { min: 1000, max: 200000 };