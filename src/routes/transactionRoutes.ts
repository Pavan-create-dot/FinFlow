import { Router } from 'express';
import { getTransactions, updateTransaction, getCategories, getAggregates } from '../controllers/transactionController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.get('/transactions', authenticateJWT, getTransactions);
router.patch('/transactions/:id', authenticateJWT, updateTransaction);

router.get('/categories', authenticateJWT, getCategories);

router.get('/analytics/summary', authenticateJWT, getAggregates);

export default router;
