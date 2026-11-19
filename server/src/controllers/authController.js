import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import generateToken from '../utils/generateToken.js';
import { HttpError } from '../utils/httpError.js';

const validEmail = (e) => /^\S+@\S+\.\S+$/.test(e);

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone = '', password } = req.body;
  if (!name || !email || !password) throw new HttpError(400, 'Name, email and password are required');
  if (!validEmail(email)) throw new HttpError(400, 'Enter a valid email address');
  if (password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters');

  if (await User.findOne({ email: email.toLowerCase() })) {
    throw new HttpError(409, 'An account with this email already exists');
  }

  // Role is never read from the request: every public signup is a customer.
  const user = await User.create({ name, email, phone, password });
  res.status(201).json({ token: generateToken(user._id), user });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new HttpError(400, 'Email and password are required');

  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
  if (!user || !user.isActive || !(await user.matchPassword(password))) {
    throw new HttpError(401, 'Invalid email or password');
  }
  res.json({ token: generateToken(user._id), user });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});