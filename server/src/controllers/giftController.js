import crypto from 'crypto';
import Gift from '../models/Gift.js';
import MenuItem from '../models/MenuItem.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { GIFT_LIMITS } from '../config/pricing.js';

const newCode = () => {
  const h = () => crypto.randomBytes(2).toString('hex').toUpperCase();
  return `CYZ-${h()}-${h()}`;
};

export const createGift = asyncHandler(async (req, res) => {
  const { kind, menuItem, amount, recipientName, recipientEmail = '', recipientPhone = '', message = '', paymentMethod = 'momo' } = req.body;

  if (!['card', 'coffee'].includes(kind)) throw new HttpError(400, 'Gift kind must be "card" or "coffee"');
  if (!recipientName) throw new HttpError(400, 'Recipient name is required');
  if (!recipientEmail && !recipientPhone) throw new HttpError(400, 'Add the recipient email or phone number');

  let value;
  let itemName = '';
  let itemId = null;
  if (kind === 'coffee') {
    const item = await MenuItem.findById(menuItem);
    if (!item || !item.available) throw new HttpError(400, 'Pick an available menu item to gift');
    value = item.price;
    itemName = item.name;
    itemId = item._id;
  } else {
    value = parseInt(amount, 10);
    if (!value || value < GIFT_LIMITS.min || value > GIFT_LIMITS.max) {
      throw new HttpError(400, `Gift card amount must be ${GIFT_LIMITS.min} to ${GIFT_LIMITS.max} RWF`);
    }
  }

  // Wallet payments are taken immediately. Other methods wait for the admin to confirm payment.
  let status = 'pending_payment';
  if (paymentMethod === 'wallet') {
    const paid = await User.findOneAndUpdate({ _id: req.user._id, wallet: { $gte: value } }, { $inc: { wallet: -value } });
    if (!paid) throw new HttpError(400, 'Not enough wallet balance');
    status = 'active';
  }

  const gift = await Gift.create({
    code: newCode(), sender: req.user._id, kind, menuItem: itemId, itemName, amount: value,
    recipientName, recipientEmail, recipientPhone, message, status,
  });
  res.status(201).json({ gift });
});

export const myGifts = asyncHandler(async (req, res) => {
  const [sent, received] = await Promise.all([
    Gift.find({ sender: req.user._id }).sort({ createdAt: -1 }),
    Gift.find({ redeemedBy: req.user._id }).sort({ redeemedAt: -1 }),
  ]);
  res.json({ sent, received });
});

// The receiver enters the gift code; its value is added to their wallet.
export const redeemGift = asyncHandler(async (req, res) => {
  const code = String(req.body.code || '').trim().toUpperCase();
  if (!code) throw new HttpError(400, 'Enter your gift code');

  const gift = await Gift.findOneAndUpdate(
    { code, status: 'active' },
    { status: 'redeemed', redeemedBy: req.user._id, redeemedAt: new Date() },
    { new: true }
  );
  if (!gift) throw new HttpError(400, 'This gift code is invalid, unpaid or already used');

  const user = await User.findByIdAndUpdate(req.user._id, { $inc: { wallet: gift.amount } }, { new: true });
  res.json({ gift, wallet: user.wallet });
});

// ---- Admin ----

export const listAllGifts = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const gifts = await Gift.find(filter).sort({ createdAt: -1 }).limit(200).populate('sender', 'name phone');
  res.json({ gifts });
});

export const activateGift = asyncHandler(async (req, res) => {
  const gift = await Gift.findOneAndUpdate({ _id: req.params.id, status: 'pending_payment' }, { status: 'active' }, { new: true });
  if (!gift) throw new HttpError(400, 'Gift not found or already active');
  res.json({ gift });
});