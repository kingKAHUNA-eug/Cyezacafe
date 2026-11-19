import Promotion from '../models/Promotion.js';
import asyncHandler from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';

const FIELDS = ['name', 'description', 'type', 'value', 'categories', 'autoApply', 'active', 'startsAt', 'endsAt'];

function pickBody(body) {
  const out = {};
  FIELDS.forEach((f) => {
    if (body[f] !== undefined) out[f] = body[f];
  });
  if (body.startsAt === '') out.startsAt = null;
  if (body.endsAt === '') out.endsAt = null;
  return out;
}

// Public: promos currently running. Codes are hidden.
export const activePromotions = asyncHandler(async (_req, res) => {
  const now = new Date();
  const promos = (await Promotion.find({ active: true })).filter((p) => p.isLive(now));
  res.json({
    promotions: promos.map((p) => ({
      id: p._id,
      name: p.name,
      description: p.description,
      type: p.type,
      value: p.value,
      categories: p.categories,
      autoApply: p.autoApply,
      endsAt: p.endsAt,
    })),
  });
});

export const listPromotions = asyncHandler(async (_req, res) => {
  res.json({ promotions: await Promotion.find().sort({ createdAt: -1 }) });
});

export const createPromotion = asyncHandler(async (req, res) => {
  const promo = new Promotion(pickBody(req.body));
  if (req.body.code) promo.code = req.body.code;
  await promo.save();
  res.status(201).json({ promotion: promo });
});

export const updatePromotion = asyncHandler(async (req, res) => {
  const promo = await Promotion.findById(req.params.id);
  if (!promo) throw new HttpError(404, 'Promotion not found');
  promo.set(pickBody(req.body));
  if (req.body.code !== undefined) promo.code = req.body.code || undefined;
  await promo.save();
  res.json({ promotion: promo });
});

export const deletePromotion = asyncHandler(async (req, res) => {
  const promo = await Promotion.findByIdAndDelete(req.params.id);
  if (!promo) throw new HttpError(404, 'Promotion not found');
  res.json({ message: 'Promotion deleted' });
});