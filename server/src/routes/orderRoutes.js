import { Router } from 'express';
import {
  createOrder, myOrders, getOrder, cancelOrder, submitPaymentProof, listOrders, updateOrder,
} from '../controllers/orderController.js';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/admin.js';


const router = Router();
router.use(protect);

router.post('/', createOrder);
router.get('/mine', myOrders); // before '/:id'
router.get('/', adminOnly, listOrders);
router.get('/:id', getOrder);
router.patch('/:id/cancel', cancelOrder);
router.patch('/:id/payment', submitPaymentProof);
router.patch('/:id', adminOnly, updateOrder);

export default router;