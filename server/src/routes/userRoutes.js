import { Router } from 'express';
import { updateProfile, getFavorites, toggleFavorite } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.patch('/me', updateProfile);
router.get('/favorites', getFavorites);
router.post('/favorites/:menuId', toggleFavorite);

export default router;