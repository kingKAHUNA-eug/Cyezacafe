import { Router } from 'express';
import { getPassport, updateEntry } from '../controllers/passportController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', getPassport);
router.patch('/:id', updateEntry);

export default router;