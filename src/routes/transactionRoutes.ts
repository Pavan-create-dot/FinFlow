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
import { validateRequest } from '../middlewares/validateRequest';
import { 
  createTransactionSchema, 
  updateTransactionSchema, 
  saveBudgetSchema 
} from '../dtos/transaction.dto';

const router = Router();

router.get('/transactions', authenticateJWT, getTransactions);
router.post('/transactions', authenticateJWT, validateRequest(createTransactionSchema), createTransaction);
router.patch('/transactions/:id', authenticateJWT, validateRequest(updateTransactionSchema), updateTransaction);

router.get('/categories', authenticateJWT, getCategories);

router.get('/analytics/summary', authenticateJWT, getAggregates);

router.get('/budgets', authenticateJWT, getBudgets);
router.post('/budgets', authenticateJWT, validateRequest(saveBudgetSchema), upsertBudget);
router.delete('/budgets/:id', authenticateJWT, deleteBudget);

export default router;
