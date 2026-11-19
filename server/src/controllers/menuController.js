import MenuItem from '../models/MenuItem.js';
import asyncHandler from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const FIELDS = [
  'name', 'description', 'category', 'price', 'available', 'featured',
  'customizable', 'brewMethod', 'origin', 'roast',
];

function pickBody(body) {
  const out = {};
  FIELDS.forEach((f) => {
    if (body[f] !== undefined) out[f] = body[f];
  });
  if (body.tags !== undefined) {
    out.tags = Array.isArray(body.tags)
      ? body.tags
      : String(body.tags).split(',').map((t) => t.trim()).filter(Boolean);
  }
  return out;
}

function buildFilter(query, onlyAvailable) {
  const filter = {};
  if (onlyAvailable) filter.available = true;
  if (query.category) filter.category = query.category;
  if (query.featured === 'true') filter.featured = true;
  if (query.q) filter.name = { $regex: escapeRegex(String(query.q)), $options: 'i' };
  return filter;
}

export const listMenu = asyncHandler(async (req, res) => {
  const items = await MenuItem.find(buildFilter(req.query, true)).sort({ category: 1, name: 1 });
  res.json({ items });
});

// Admin: includes unavailable items too.
export const listAllMenu = asyncHandler(async (req, res) => {
  const items = await MenuItem.find(buildFilter(req.query, false)).sort({ category: 1, name: 1 });
  res.json({ items });
});

export const getMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item) throw new HttpError(404, 'Menu item not found');
  res.json({ item });
});

export const createMenuItem = asyncHandler(async (req, res) => {
  const data = pickBody(req.body);
  if (req.file) data.image = `/uploads/${req.file.filename}`;
  const item = await MenuItem.create(data);
  res.status(201).json({ item });
});

export const updateMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item) throw new HttpError(404, 'Menu item not found');
  item.set(pickBody(req.body));
  if (req.file) item.image = `/uploads/${req.file.filename}`;
  await item.save();
  res.json({ item });
});

export const deleteMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findByIdAndDelete(req.params.id);
  if (!item) throw new HttpError(404, 'Menu item not found');
  res.json({ message: 'Menu item deleted' });
});