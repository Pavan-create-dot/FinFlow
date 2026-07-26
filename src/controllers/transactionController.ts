import { Response } from 'express';
import { TransactionService } from '../services/transactionService';
import { serializePrisma } from '../utils/serializer';
import { logger } from '../utils/logger';

export const getTransactions = async (req: any, res: Response) => {
  try {
    const data = await TransactionService.getTransactions(req.user.id, req.query);
    return res.json(serializePrisma(data));
  } catch (error) {
    logger.error(error, 'Fetch Transactions Error');
    return res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

export const getAggregates = async (req: any, res: Response) => {
  try {
    const data = await TransactionService.getAggregates(req.user.id);
    return res.json(serializePrisma(data));
  } catch (error) {
    logger.error(error, 'Fetch Analytics Summary Error');
    return res.status(500).json({ error: 'Failed to fetch analytics summary' });
  }
};

export const updateTransaction = async (req: any, res: Response) => {
  try {
    const data = await TransactionService.updateTransaction(req.user.id, req.params.id, req.body.categoryId);
    return res.json(serializePrisma(data));
  } catch (error: any) {
    logger.error(error, 'Update Transaction Error');
    if (error.message === 'Transaction not found') {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    if (error.message === 'Invalid category ID') {
      return res.status(400).json({ error: 'Invalid category ID' });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getCategories = async (req: any, res: Response) => {
  try {
    const data = await TransactionService.getCategories();
    return res.json(data);
  } catch (error) {
    logger.error(error, 'Fetch Categories Error');
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createTransaction = async (req: any, res: Response) => {
  try {
    const data = await TransactionService.createTransaction(req.user.id, req.body);
    return res.json(serializePrisma(data));
  } catch (error) {
    logger.error(error, 'Create Transaction Error');
    return res.status(500).json({ error: 'Failed to create transaction' });
  }
};

export const getBudgets = async (req: any, res: Response) => {
  try {
    const data = await TransactionService.getBudgets(req.user.id);
    return res.json(serializePrisma(data));
  } catch (error) {
    logger.error(error, 'Fetch Budgets Error');
    return res.status(500).json({ error: 'Failed to fetch budgets' });
  }
};

export const upsertBudget = async (req: any, res: Response) => {
  try {
    const data = await TransactionService.upsertBudget(req.user.id, req.body.categoryId, req.body.amount);
    return res.json(serializePrisma(data));
  } catch (error) {
    logger.error(error, 'Upsert Budget Error');
    return res.status(500).json({ error: 'Failed to save budget' });
  }
};

export const deleteBudget = async (req: any, res: Response) => {
  try {
    await TransactionService.deleteBudget(req.user.id, req.params.id);
    return res.json({ message: 'Budget deleted successfully' });
  } catch (error: any) {
    logger.error(error, 'Delete Budget Error');
    if (error.message === 'Budget not found') {
      return res.status(404).json({ error: 'Budget not found' });
    }
    return res.status(500).json({ error: 'Failed to delete budget' });
  }
};
