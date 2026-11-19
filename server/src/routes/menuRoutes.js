import { Router } from 'express';
import {
  listMenu, listAllMenu, getMenuItem, createMenuItem, updateMenuItem, deleteMenuItem,
} from '../controllers/menuController.js';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/admin.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.get('/', listMenu);
router.get('/all', protect, adminOnly, listAllMenu); // must come before '/:id'
router.get('/:id', getMenuItem);

router.post('/', protect, adminOnly, upload.single('image'), createMenuItem);
router.put('/:id', protect, adminOnly, upload.single('image'), updateMenuItem);
router.delete('/:id', protect, adminOnly, deleteMenuItem);

export default router;