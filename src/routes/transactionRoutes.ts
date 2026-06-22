import { Router } from 'express';
import {
  getTransactions,
  updateTransaction,
  getCategories,
  getAggregates,
  createTransaction,
  getBudgets,
  upsertBudget,
  deleteBudget,
} from '../controllers/transactionController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.get('/transactions', authenticateJWT, getTransactions);
router.post('/transactions', authenticateJWT, createTransaction);
router.patch('/transactions/:id', authenticateJWT, updateTransaction);

router.get('/categories', authenticateJWT, getCategories);

router.get('/analytics/summary', authenticateJWT, getAggregates);

router.get('/budgets', authenticateJWT, getBudgets);
router.post('/budgets', authenticateJWT, upsertBudget);
router.delete('/budgets/:id', authenticateJWT, deleteBudget);

export default router;
