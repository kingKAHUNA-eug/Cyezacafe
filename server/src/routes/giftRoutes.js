import { Router } from 'express';
import {
  createGift, myGifts, redeemGift, listAllGifts, activateGift,
} from '../controllers/giftController.js';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/admin.js';

const router = Router();
router.use(protect);

router.post('/', createGift);
router.get('/mine', myGifts);
router.post('/redeem', redeemGift);

router.get('/', adminOnly, listAllGifts);
router.patch('/:id/activate', adminOnly, activateGift);

export default router;