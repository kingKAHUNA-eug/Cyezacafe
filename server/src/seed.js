import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';
import MenuItem from './models/MenuItem.js';
import Promotion from './models/Promotion.js';

// Prices are placeholders in RWF. Change them in the admin dashboard once it is built.
const MENU = [
  // Coffee
  { name: 'Espresso', category: 'Coffee', price: 1500, brewMethod: 'espresso', roast: 'dark', origin: 'Rwanda', description: 'A short, bold shot of freshly pulled espresso.' },
  { name: 'Americano', category: 'Coffee', price: 2000, brewMethod: 'espresso', roast: 'medium', origin: 'Rwanda', description: 'Espresso lengthened with hot water.' },
  { name: 'Cappuccino', category: 'Coffee', price: 2500, brewMethod: 'espresso', roast: 'medium', origin: 'Rwanda', description: 'Espresso with steamed milk and thick foam.', featured: true },
  { name: 'Latte', category: 'Coffee', price: 2800, brewMethod: 'espresso', roast: 'medium', origin: 'Rwanda', description: 'Smooth espresso with silky steamed milk.', featured: true },
  { name: 'Mocha', category: 'Coffee', price: 3000, brewMethod: 'espresso', roast: 'medium', origin: 'Rwanda', description: 'Espresso, chocolate and steamed milk.' },
  { name: 'Drip Coffee', category: 'Coffee', price: 2000, brewMethod: 'drip', roast: 'medium', origin: 'Rwanda', description: 'Classic filter coffee, brewed fresh all day.' },
  { name: 'Pour Over', category: 'Coffee', price: 3500, brewMethod: 'pour-over', roast: 'light', origin: 'Rwanda', description: 'Single-origin coffee brewed by hand, bright and clean.' },
  { name: 'Cold Brew', category: 'Coffee', price: 3000, brewMethod: 'cold-brew', roast: 'medium', origin: 'Rwanda', description: 'Steeped slowly for a smooth, low-acid finish.' },
  // Juices
  { name: 'Passion Fruit Juice', category: 'Juices', price: 2000, description: 'Fresh and tangy, made from real passion fruit.' },
  { name: 'Mango Juice', category: 'Juices', price: 2000, description: 'Sweet, thick and cold.' },
  { name: 'Avocado Juice', category: 'Juices', price: 2500, description: 'Creamy blended avocado, a Kigali favorite.' },
  { name: 'Mixed Fruit Juice', category: 'Juices', price: 2500, description: 'A blend of the day\'s freshest fruit.' },
  // Milkshakes
  { name: 'Vanilla Milkshake', category: 'Milkshakes', price: 3000, description: 'Classic and creamy.' },
  { name: 'Chocolate Milkshake', category: 'Milkshakes', price: 3200, description: 'Rich chocolate, thick and cold.' },
  { name: 'Strawberry Milkshake', category: 'Milkshakes', price: 3200, description: 'Blended with real strawberries.' },
  // Snacks
  { name: 'Butter Croissant', category: 'Snacks', price: 1500, description: 'Flaky, golden and baked fresh.' },
  { name: 'Chocolate Croissant', category: 'Snacks', price: 1800, description: 'Buttery pastry filled with dark chocolate.' },
  { name: 'Samosa', category: 'Snacks', price: 1000, description: 'Crispy and lightly spiced.' },
  { name: 'Muffin', category: 'Snacks', price: 1500, description: 'Soft and freshly baked.' },
];

async function run() {
  await connectDB();

  // Admin account
  const { ADMIN_NAME = 'Cyeza Admin', ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before seeding');
  }
  const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (existing) {
    console.log(`Admin already exists: ${ADMIN_EMAIL}`);
  } else {
    await User.create({ name: ADMIN_NAME, email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: 'admin' });
    console.log(`Admin created: ${ADMIN_EMAIL}`);
  }

  // Menu: only inserts missing items, never overwrites edits made in the dashboard
  let added = 0;
  for (const item of MENU) {
    if (await MenuItem.exists({ name: item.name })) continue;
    await MenuItem.create(item); // schema sets customizable from the category
    added += 1;
  }
  console.log(`Menu: ${added} item(s) added, ${MENU.length - added} already existed`);

  // Grand opening promo from the poster: Buy One, Get One Free
  const promo = await Promotion.updateOne(
    { name: 'Grand Opening: Buy One Get One Free' },
    {
      $setOnInsert: {
        description: 'Buy one, get one free to celebrate our opening!',
        type: 'bogo',
        categories: [],
        autoApply: true,
        active: true,
        startsAt: new Date('2026-11-05T05:00:00Z'), // 7 AM Kigali time
        endsAt: null, // set an end date in the admin dashboard
      },
    },
    { upsert: true }
  );
  console.log(promo.upsertedCount ? 'Promotion created: Grand Opening BOGO' : 'Promotion already exists');

  await mongoose.disconnect();
  console.log('Seed finished');
}

run().catch(async (err) => {
  console.error('Seed failed:', err.message);
  await mongoose.disconnect();
  process.exit(1);
});