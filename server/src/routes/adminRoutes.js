import { Router } from 'express';
import { dashboardStats, listCustomers, setCustomerActive } from '../controllers/adminController.js';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/admin.js';

const router = Router();
router.use(protect, adminOnly);

router.get('/stats', dashboardStats);
router.get('/customers', listCustomers);
router.patch('/customers/:id', setCustomerActive);

export default router;