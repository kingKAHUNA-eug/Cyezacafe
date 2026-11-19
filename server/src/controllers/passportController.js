import PassportEntry from '../models/PassportEntry.js';
import asyncHandler from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';

const METHOD_BADGES = [
  { id: 'espresso', label: 'Espresso Explorer', method: 'espresso' },
  { id: 'pour-over', label: 'Pour-Over Pro', method: 'pour-over' },
  { id: 'cold-brew', label: 'Cold Brew Cruiser', method: 'cold-brew' },
  { id: 'drip', label: 'Drip Devotee', method: 'drip' },
];

function buildBadges(entries) {
  const methods = new Set(entries.map((e) => e.brewMethod).filter(Boolean));
  const badges = METHOD_BADGES.map((b) => ({ id: b.id, label: b.label, earned: methods.has(b.method) }));
  badges.push({ id: 'bean-collector', label: 'Bean Collector (5 coffees)', earned: entries.length >= 5 });
  badges.push({
    id: 'regular',
    label: 'Regular (10 coffees)',
    earned: entries.reduce((s, e) => s + e.timesTried, 0) >= 10,
  });
  return badges;
}

export const getPassport = asyncHandler(async (req, res) => {
  const entries = await PassportEntry.find({ user: req.user._id }).sort({ lastTriedAt: -1 });
  res.json({
    entries,
    badges: buildBadges(entries),
    stats: {
      coffeesTried: entries.length,
      totalCups: entries.reduce((s, e) => s + e.timesTried, 0),
    },
  });
});

export const updateEntry = asyncHandler(async (req, res) => {
  const entry = await PassportEntry.findOne({ _id: req.params.id, user: req.user._id });
  if (!entry) throw new HttpError(404, 'Passport entry not found');

  const { rating, notes } = req.body;
  if (rating !== undefined) {
    const r = Number(rating);
    if (!Number.isInteger(r) || r < 1 || r > 5) throw new HttpError(400, 'Rating must be 1 to 5');
    entry.rating = r;
  }
  if (notes !== undefined) entry.notes = String(notes).slice(0, 300);
  await entry.save();
  res.json({ entry });
});