import User from '../models/User.js';
import MenuItem from '../models/MenuItem.js';
import asyncHandler from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  if (name !== undefined) {
    if (!String(name).trim()) throw new HttpError(400, 'Name cannot be empty');
    req.user.name = name;
  }
  if (phone !== undefined) req.user.phone = phone;
  await req.user.save();
  res.json({ user: req.user });
});

export const getFavorites = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('favorites');
  res.json({ favorites: user.favorites.filter((m) => m.available) });
});

// Adds the item if it is not a favorite yet, removes it if it is.
export const toggleFavorite = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.menuId);
  if (!item) throw new HttpError(404, 'Menu item not found');

  const has = req.user.favorites.some((id) => id.equals(item._id));
  await User.updateOne(
    { _id: req.user._id },
    has ? { $pull: { favorites: item._id } } : { $addToSet: { favorites: item._id } }
  );
  res.json({ favorited: !has });
});