import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { SUBSCRIPTION_PLANS } from '../config/pricing.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export const listPlans = (_req, res) => {
  res.json({ plans: Object.values(SUBSCRIPTION_PLANS) });
};

export const buyPass = asyncHandler(async (req, res) => {
  const plan = SUBSCRIPTION_PLANS[req.body.plan];
  if (!plan) throw new HttpError(400, 'Unknown pass');
  const paymentMethod = req.body.paymentMethod || 'momo';

  const sub = {
    user: req.user._id, plan: plan.id, name: plan.name, price: plan.price,
    drinksTotal: plan.drinks, drinksRemaining: plan.drinks, days: plan.days, status: 'pending_payment',
  };

  if (paymentMethod === 'wallet') {
    const paid = await User.findOneAndUpdate({ _id: req.user._id, wallet: { $gte: plan.price } }, { $inc: { wallet: -plan.price } });
    if (!paid) throw new HttpError(400, 'Not enough wallet balance');
    sub.status = 'active';
    sub.startsAt = new Date();
    sub.expiresAt = new Date(Date.now() + plan.days * DAY_MS);
  }

  res.status(201).json({ subscription: await Subscription.create(sub) });
});

export const mySubscriptions = asyncHandler(async (req, res) => {
  const subscriptions = await Subscription.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ subscriptions });
});

// ---- Admin ----

export const listSubscriptions = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const subscriptions = await Subscription.find(filter).sort({ createdAt: -1 }).limit(200).populate('user', 'name phone email');
  res.json({ subscriptions });
});

// Staff confirms payment: the pass starts now.
export const activatePass = asyncHandler(async (req, res) => {
  const sub = await Subscription.findOne({ _id: req.params.id, status: 'pending_payment' });
  if (!sub) throw new HttpError(400, 'Pass not found or already active');
  sub.status = 'active';
  sub.startsAt = new Date();
  sub.expiresAt = new Date(Date.now() + sub.days * DAY_MS);
  await sub.save();
  res.json({ subscription: sub });
});

// Staff uses one drink from a customer's pass at the counter.
export const redeemDrink = asyncHandler(async (req, res) => {
  const sub = await Subscription.findOneAndUpdate(
    { _id: req.params.id, status: 'active', drinksRemaining: { $gt: 0 }, expiresAt: { $gt: new Date() } },
    { $inc: { drinksRemaining: -1 } },
    { new: true }
  );
  if (!sub) throw new HttpError(400, 'Pass is not active, has no drinks left, or has expired');
  if (sub.drinksRemaining === 0) {
    sub.status = 'expired';
    await sub.save();
  }
  res.json({ subscription: sub });
});