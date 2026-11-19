import asyncHandler from '../utils/asyncHandler.js';
import { PUNCH_TARGET, POINTS_PER_RWF, TIERS } from '../config/pricing.js';

export const getRewards = asyncHandler(async (req, res) => {
  const u = req.user;
  const tier = [...TIERS].reverse().find((t) => u.totalSpent >= t.min) || TIERS[0];
  const next = TIERS.find((t) => t.min > u.totalSpent) || null;

  res.json({
    name: u.name,
    points: u.points,
    punches: u.punches,
    punchTarget: PUNCH_TARGET,
    freeDrinks: u.freeDrinks,
    wallet: u.wallet,
    totalSpent: u.totalSpent,
    tier: tier.name,
    nextTier: next ? { name: next.name, remaining: next.min - u.totalSpent } : null,
    rwfPerPoint: POINTS_PER_RWF,
  });
});