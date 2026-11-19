import { Router } from 'express';
import {
  activePromotions, listPromotions, createPromotion, updatePromotion, deletePromotion,
} from '../controllers/promotionController.js';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/admin.js';

const router = Router();

router.get('/active', activePromotions);

router.use(protect, adminOnly);
router.get('/', listPromotions);
router.post('/', createPromotion);
router.put('/:id', updatePromotion);
router.delete('/:id', deletePromotion);

export default router;