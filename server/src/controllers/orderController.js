import crypto from 'crypto';
import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import User from '../models/User.js';
import Promotion from '../models/Promotion.js';
import PassportEntry from '../models/PassportEntry.js';
import asyncHandler from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { CAFE } from '../config/cafe.js';
import { MAX_QTY, POINTS_PER_RWF, PUNCH_TARGET } from '../config/pricing.js';
import { cleanCustomization, unitPrice, pickBestPromotion } from '../utils/pricing.js';
import { isOpenAt } from '../utils/time.js';

const ORDER_TYPES = ['pickup', 'curbside', 'table'];
const PAYMENT_METHODS = ['cash', 'mtn', 'airtel', 'wallet'];
const FLOW = {
  pending: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const newOrderNumber = () =>
  `CY-${Date.now().toString(36).toUpperCase().slice(-4)}${crypto.randomInt(100, 1000)}`;

export const createOrder = asyncHandler(async (req, res) => {
  const {
    items, type = 'pickup', scheduledFor, tableNumber, curbsideInfo = '',
    paymentMethod = 'cash', useFreeDrink = false, promoCode = '', note = '',
  } = req.body;

  if (!Array.isArray(items) || items.length === 0) throw new HttpError(400, 'Your cart is empty');
  if (!ORDER_TYPES.includes(type)) throw new HttpError(400, 'Invalid order type');
  if (!PAYMENT_METHODS.includes(paymentMethod)) throw new HttpError(400, 'Invalid payment method');

  let table = null;
  if (type === 'table') {
    table = parseInt(tableNumber, 10);
    if (!table || table < 1 || table > CAFE.tables) throw new HttpError(400, 'Invalid table number');
  }

  // Scheduled pickup must be in the future and inside opening hours.
  let scheduleDate = null;
  if (scheduledFor) {
    scheduleDate = new Date(scheduledFor);
    if (Number.isNaN(scheduleDate.getTime())) throw new HttpError(400, 'Invalid pickup time');
    if (scheduleDate.getTime() < Date.now() + 5 * 60 * 1000) {
      throw new HttpError(400, 'Pickup time must be at least 5 minutes from now');
    }
    if (!isOpenAt(scheduleDate)) {
      throw new HttpError(400, `We are open ${CAFE.hours.label}. Choose a time within opening hours.`);
    }
  } else if (!isOpenAt(new Date())) {
    throw new HttpError(400, `We are closed right now (open ${CAFE.hours.label}). Schedule a pickup instead.`);
  }

  // Load menu items and price everything on the server.
  const ids = items.map((i) => i.menuItem);
  const menu = await MenuItem.find({ _id: { $in: ids } });
  const byId = new Map(menu.map((m) => [m._id.toString(), m]));

  const orderItems = [];
  const units = [];
  for (const line of items) {
    const menuItem = byId.get(String(line.menuItem));
    if (!menuItem) throw new HttpError(400, 'An item in your cart no longer exists');
    if (!menuItem.available) throw new HttpError(400, `${menuItem.name} is currently unavailable`);

    const quantity = parseInt(line.quantity, 10);
    if (!quantity || quantity < 1 || quantity > MAX_QTY) throw new HttpError(400, `Quantity must be 1 to ${MAX_QTY}`);

    const customization = cleanCustomization(line.customization, menuItem);
    const price = unitPrice(menuItem, customization);

    orderItems.push({
      menuItem: menuItem._id, name: menuItem.name, category: menuItem.category,
      unitPrice: price, quantity, customization,
    });
    for (let i = 0; i < quantity; i++) units.push({ price, category: menuItem.category });
  }

  const subtotal = units.reduce((s, u) => s + u.price, 0);

  // Promotion (e.g. the Buy One Get One Free opening offer)
  const livePromos = (await Promotion.find({ active: true })).filter((p) => p.isLive());
  const code = String(promoCode || '').trim().toUpperCase();
  if (code && !livePromos.some((p) => p.code === code)) {
    throw new HttpError(400, 'Invalid or expired promo code');
  }
  const best = pickBestPromotion(livePromos, units, code);
  const discount = best ? best.discount : 0;

  // Free drink from the punch card: cheapest coffee in the order.
  let freeDrinkDiscount = 0;
  if (useFreeDrink) {
    if (req.user.freeDrinks < 1) throw new HttpError(400, 'You have no free drinks to use');
    const coffeePrices = units.filter((u) => u.category === 'Coffee').map((u) => u.price);
    if (!coffeePrices.length) throw new HttpError(400, 'A free drink needs a Coffee item in your order');
    freeDrinkDiscount = Math.min(...coffeePrices);
  }

  const totalDiscount = Math.min(subtotal, discount + freeDrinkDiscount);
  const total = subtotal - totalDiscount;

  // Take wallet money and the free-drink credit atomically.
  const cond = { _id: req.user._id };
  const inc = {};
  if (paymentMethod === 'wallet' && total > 0) {
    cond.wallet = { $gte: total };
    inc.wallet = -total;
  }
  if (useFreeDrink) {
    cond.freeDrinks = { $gte: 1 };
    inc.freeDrinks = -1;
  }
  if (Object.keys(inc).length) {
    const updated = await User.findOneAndUpdate(cond, { $inc: inc });
    if (!updated) throw new HttpError(400, 'Not enough wallet balance or free drinks');
  }

  const order = await Order.create({
    orderNumber: newOrderNumber(),
    user: req.user._id,
    items: orderItems,
    subtotal,
    discount,
    freeDrinkDiscount,
    total,
    promotion: best ? best.promo.name : '',
    type,
    scheduledFor: scheduleDate,
    tableNumber: table,
    curbsideInfo: type === 'curbside' ? String(curbsideInfo).slice(0, 120) : '',
    note: String(note).slice(0, 300),
    paymentMethod,
    paymentStatus: paymentMethod === 'wallet' || total === 0 ? 'paid' : 'unpaid',
    usedFreeDrink: Boolean(useFreeDrink),
  });

  res.status(201).json({ order });
});

export const myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json({ orders });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name phone');
  if (!order) throw new HttpError(404, 'Order not found');
  const owner = order.user._id.equals(req.user._id);
  if (!owner && req.user.role !== 'admin') throw new HttpError(403, 'Not allowed');
  res.json({ order });
});

async function cancelAndRefund(order) {
  order.status = 'cancelled';
  const inc = {};
  if (order.paymentMethod === 'wallet' && order.paymentStatus === 'paid' && order.total > 0) {
    inc.wallet = order.total;
    order.paymentStatus = 'refunded';
  }
  if (order.usedFreeDrink) inc.freeDrinks = 1;
  if (Object.keys(inc).length) await User.updateOne({ _id: order.user }, { $inc: inc });
  await order.save();
}

// Customer can cancel only while the order is still pending.
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order || !order.user.equals(req.user._id)) throw new HttpError(404, 'Order not found');
  if (order.status !== 'pending') throw new HttpError(400, 'Order is already being prepared and cannot be cancelled');
  await cancelAndRefund(order);
  res.json({ order });
});

// Customer says they paid by MTN MoMo or Airtel Money and gives the transaction ID from the SMS.
// Staff still confirm it against their own mobile money messages before marking it paid.
export const submitPaymentProof = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order || !order.user.equals(req.user._id)) throw new HttpError(404, 'Order not found');
  if (!['mtn', 'airtel'].includes(order.paymentMethod)) throw new HttpError(400, 'This order is not paid by mobile money');
  if (order.status === 'cancelled') throw new HttpError(400, 'This order was cancelled');
  if (order.paymentStatus === 'paid') throw new HttpError(400, 'This order is already paid');

  const reference = String(req.body.reference || '').trim().toUpperCase();
  if (!/^[A-Z0-9._-]{4,30}$/.test(reference)) {
    throw new HttpError(400, 'Enter the transaction ID from your confirmation SMS (4 to 30 letters or numbers)');
  }
  // The same transaction ID cannot be used to "pay" for two different orders
  if (await Order.exists({ paymentRef: reference, _id: { $ne: order._id } })) {
    throw new HttpError(409, 'This transaction ID was already used for another order');
  }

  order.paymentRef = reference;
  order.paymentStatus = 'submitted';
  order.paymentSubmittedAt = new Date();
  await order.save();
  res.json({ order });
});

// Points, punch card progress and Bean Passport entries on completion.
async function rewardOrder(order) {
  if (order.rewarded) return;

  const points = Math.floor(order.total / POINTS_PER_RWF);
  const coffeeItems = order.items.filter((i) => i.category === 'Coffee');
  const coffeeCount = coffeeItems.reduce((s, i) => s + i.quantity, 0);

  const user = await User.findById(order.user);
  if (user) {
    user.points += points;
    user.totalSpent += order.total;
    user.punches += coffeeCount;
    while (user.punches >= PUNCH_TARGET) {
      user.punches -= PUNCH_TARGET;
      user.freeDrinks += 1;
    }
    await user.save();
  }

  if (coffeeItems.length) {
    const docs = await MenuItem.find({ _id: { $in: coffeeItems.map((i) => i.menuItem) } });
    const now = new Date();
    await Promise.all(
      docs.map((m) =>
        PassportEntry.updateOne(
          { user: order.user, menuItem: m._id },
          {
            $setOnInsert: { name: m.name, brewMethod: m.brewMethod, origin: m.origin, roast: m.roast, firstTriedAt: now },
            $set: { lastTriedAt: now },
            $inc: { timesTried: 1 },
          },
          { upsert: true }
        )
      )
    );
  }

  order.pointsEarned = points;
  order.rewarded = true;
}

// ---- Admin ----

export const listOrders = asyncHandler(async (req, res) => {
  const { status, type, date } = req.query;
  const filter = {};
  if (status) filter.status = { $in: String(status).split(',') };
  if (type) filter.type = type;
  if (date === 'today') {
    const { startOfKigaliDay } = await import('../utils/time.js');
    filter.createdAt = { $gte: startOfKigaliDay() };
  }
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(limit).populate('user', 'name phone');
  res.json({ orders });
});

export const updateOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new HttpError(404, 'Order not found');
  const { status, paymentStatus } = req.body;

  if (paymentStatus !== undefined) {
    if (!['unpaid', 'paid'].includes(paymentStatus)) throw new HttpError(400, 'Invalid payment status');
    if (order.paymentStatus === 'refunded') throw new HttpError(400, 'Order was refunded');
    order.paymentStatus = paymentStatus;
  }

  if (status !== undefined && status !== order.status) {
    if (!FLOW[order.status]?.includes(status)) {
      throw new HttpError(400, `Cannot move an order from ${order.status} to ${status}`);
    }
    if (status === 'cancelled') {
      await cancelAndRefund(order);
      return res.json({ order });
    }
    order.status = status;
    if (status === 'completed') {
            if (['unpaid', 'submitted'].includes(order.paymentStatus)) order.paymentStatus = 'paid'; // cash collected at pickup // cash/MoMo/card collected at pickup
      await rewardOrder(order);
    }
  }

  await order.save();
  res.json({ order });
});