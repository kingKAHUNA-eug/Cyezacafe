import { Router } from 'express';
import { getRewards } from '../controllers/rewardController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.get('/', protect, getRewards);

export default router;