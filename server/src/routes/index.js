import { Router } from 'express';
import { getCafe } from '../controllers/cafeController.js';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import menuRoutes from './menuRoutes.js';
import orderRoutes from './orderRoutes.js';
import rewardRoutes from './rewardRoutes.js';
import passportRoutes from './passportRoutes.js';
import giftRoutes from './giftRoutes.js';
import subscriptionRoutes from './subscriptionRoutes.js';
import promotionRoutes from './promotionRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = Router();

router.get('/cafe', getCafe);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/menu', menuRoutes);
router.use('/orders', orderRoutes);
router.use('/rewards', rewardRoutes);
router.use('/passport', passportRoutes);
router.use('/gifts', giftRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/promotions', promotionRoutes);
router.use('/admin', adminRoutes);

export default router;