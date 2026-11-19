import { HttpError } from '../utils/httpError.js';

export const adminOnly = (req, _res, next) => {
  if (req.user?.role !== 'admin') return next(new HttpError(403, 'Admin access only'));
  next();
};