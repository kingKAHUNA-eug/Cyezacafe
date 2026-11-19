import { Router } from 'express';
import {
  listPlans, buyPass, mySubscriptions, listSubscriptions, activatePass, redeemDrink,
} from '../controllers/subscriptionController.js';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/admin.js';

const router = Router();

router.get('/plans', listPlans);

router.use(protect);
router.post('/', buyPass);
router.get('/mine', mySubscriptions);

router.get('/', adminOnly, listSubscriptions);
router.patch('/:id/activate', adminOnly, activatePass);
router.post('/:id/redeem', adminOnly, redeemDrink);

export default router;