import Order from '../models/Order.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { startOfKigaliDay } from '../utils/time.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const notCancelled = { status: { $ne: 'cancelled' } };

export const dashboardStats = asyncHandler(async (_req, res) => {
  const todayStart = startOfKigaliDay();
  const weekStart = new Date(todayStart.getTime() - 6 * DAY_MS);
  const monthStart = new Date(todayStart.getTime() - 29 * DAY_MS);

  const [today, byStatus, openOrders, customers, topItems, daily] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: todayStart }, ...notCancelled } },
      { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: todayStart } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Order.countDocuments({ status: { $in: ['pending', 'preparing', 'ready'] } }),
    User.countDocuments({ role: 'customer' }),
    Order.aggregate([
      { $match: { createdAt: { $gte: monthStart }, ...notCancelled } },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', quantity: { $sum: '$items.quantity' } } },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: weekStart }, ...notCancelled } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+02:00' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  res.json({
    today: { orders: today[0]?.orders || 0, revenue: today[0]?.revenue || 0 },
    todayByStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
    openOrders,
    customers,
    topItems: topItems.map((t) => ({ name: t._id, quantity: t.quantity })),
    last7Days: daily.map((d) => ({ date: d._id, revenue: d.revenue, orders: d.orders })),
  });
});

export const listCustomers = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const filter = { role: 'customer' };
  if (req.query.q) {
    const rx = { $regex: String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const [customers, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ customers, total, page, pages: Math.ceil(total / limit) });
});

export const setCustomerActive = asyncHandler(async (req, res) => {
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'customer' },
    { isActive: Boolean(req.body.isActive) },
    { new: true }
  );
  if (!user) return res.status(404).json({ message: 'Customer not found' });
  res.json({ customer: user });
});