import { Response } from 'express';
import { serializePrisma } from '../utils/serializer';
import { decrypt, encrypt } from '../utils/encryption';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

const decryptTransaction = (transaction: any) => ({
  ...transaction,
  description: decrypt(transaction.description) || '',
  merchantName: transaction.merchantName ? decrypt(transaction.merchantName) || null : null,
  originalText: decrypt(transaction.originalText) || '',
});

export const getTransactions = async (req: any, res: Response) => {
  const userId = req.user.id;
  const { categoryId, type, startDate, endDate, limit = 50, offset = 0, isSubscription, search, minAmount, maxAmount, sortOrder } = req.query;

  const categoryFilter = categoryId && categoryId !== 'ALL' && categoryId !== 'undefined' ? categoryId as string : undefined;
  const typeFilter = type && type !== 'ALL' && type !== 'undefined' ? type as string : undefined;
  const subscriptionFilter = isSubscription === 'true' ? true : isSubscription === 'false' ? false : undefined;

  let orderBy: any = { date: 'desc' };
  if (sortOrder === 'date-asc') orderBy = { date: 'asc' };
  if (sortOrder === 'amount-desc') orderBy = { amount: 'desc' };
  if (sortOrder === 'amount-asc') orderBy = { amount: 'asc' };

  try {
    let transactions = await prisma.transaction.findMany({
      where: {
        userId,
        categoryId: categoryFilter,
        type: typeFilter,
        isSubscription: subscriptionFilter,
        date: {
          gte: startDate ? new Date(startDate as string) : undefined,
          lte: endDate ? new Date(endDate as string) : undefined,
        },
        amount: {
          gte: minAmount ? BigInt(Number(minAmount) * 100) : undefined,
          lte: maxAmount ? BigInt(Number(maxAmount) * 100) : undefined,
        }
      },
      take: search ? undefined : Number(limit), // If searching, we fetch all and filter in memory since descriptions are encrypted
      skip: search ? undefined : Number(offset),
      orderBy,
      include: { category: true }
    });

    let decrypted = transactions.map(decryptTransaction);

    if (search) {
      const query = (search as string).toLowerCase();
      decrypted = decrypted.filter(t => 
        t.description.toLowerCase().includes(query) || 
        (t.merchantName && t.merchantName.toLowerCase().includes(query))
      );
      // Apply limit and offset after memory filter
      decrypted = decrypted.slice(Number(offset), Number(offset) + Number(limit));
    }

    return res.json(serializePrisma(decrypted));
  } catch (error) {
    logger.error(error, 'Fetch Transactions Error');
    return res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

export const getAggregates = async (req: any, res: Response) => {
  const userId = req.user.id;
  
  try {
    const aggregates = await prisma.transaction.groupBy({
      by: ['type'],
      where: { userId },
      _sum: { amount: true },
    });

    const totals = {
      totalSpend: 0,
      totalIncome: 0,
      savings: 0,
      budgetStatus: 'Healthy'
    };

    aggregates.forEach(agg => {
      if (agg.type === 'EXPENSE') totals.totalSpend = Number(agg._sum.amount || 0);
      if (agg.type === 'INCOME') totals.totalIncome = Number(agg._sum.amount || 0);
    });

    totals.savings = totals.totalIncome - totals.totalSpend;

    if (totals.totalSpend > totals.totalIncome) {
      totals.budgetStatus = totals.totalIncome === 0 ? 'No Income Recorded' : 'Over Budget';
    }

    const categoryAggs = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, type: 'EXPENSE' },
      _sum: { amount: true },
    });

    const categoryDetails = await prisma.category.findMany({
      where: { id: { in: categoryAggs.map(a => a.categoryId).filter(Boolean) as string[] } }
    });

    const categories = categoryAggs.map(agg => {
      const cat = categoryDetails.find(c => c.id === agg.categoryId);
      return {
        name: cat?.name || 'Uncategorized',
        value: Number(agg._sum.amount || 0),
        color: cat?.color || '#6366f1'
      };
    });

    // Tier 1: FinScore Calculation
    const budgets = await prisma.budget.findMany({ where: { userId } });
    let finScore = 75; // Base score
    
    // Savings Rate (Max +15)
    let savingsRate = 0;
    if (totals.totalIncome > 0) {
      savingsRate = (totals.savings / totals.totalIncome) * 100;
      if (savingsRate > 20) finScore += 15;
      else if (savingsRate > 10) finScore += 10;
      else if (savingsRate > 0) finScore += 5;
      else finScore -= 10;
    }

    // Budget Discipline (Max +10)
    if (budgets.length > 0) {
      finScore += 5; // Bonus for having budgets
      const exceeded = budgets.filter(b => false).length; // Need actual spent to calculate, simplifying for now
      if (totals.budgetStatus === 'Healthy') finScore += 5;
      else finScore -= 5;
    }

    finScore = Math.min(Math.max(finScore, 0), 100);

    // Tier 1: Basic Anomaly Detection (Mocked/Simplified logic based on recent high txs)
    const recentHighTxs = await prisma.transaction.findMany({
      where: { userId, type: 'EXPENSE', amount: { gte: 500000 } }, // > 5000 INR
      orderBy: { date: 'desc' },
      take: 3,
      include: { category: true }
    });
    
    const anomalies = recentHighTxs.map(t => {
      const dec = decryptTransaction(t);
      return `Unusual high transaction: \u20B9${Number(t.amount)/100} at ${dec.merchantName || 'Unknown Merchant'} (${t.category?.name || 'Uncategorized'})`;
    });

    // Month-over-month trend data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: sixMonthsAgo }
      },
      select: {
        amount: true,
        date: true
      }
    });

    // Group by month
    const monthlyTrendMap: { [key: string]: number } = {};
    // Initialize the last 6 months with 0
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleDateString('en-US', { month: 'short' }); // e.g. "Jan", "Feb"
      monthlyTrendMap[label] = 0;
    }

    monthlyTransactions.forEach(t => {
      const label = new Date(t.date).toLocaleDateString('en-US', { month: 'short' });
      if (monthlyTrendMap[label] !== undefined) {
        monthlyTrendMap[label] += Number(t.amount);
      }
    });

    const monthlyTrend = Object.keys(monthlyTrendMap).map(month => ({
      month,
      amount: monthlyTrendMap[month]
    }));

    return res.json(serializePrisma({ ...totals, categories, finScore: Math.round(finScore), anomalies, monthlyTrend }));
  } catch (error) {
    logger.error(error, 'Fetch Analytics Summary Error');
    return res.status(500).json({ error: 'Failed to fetch analytics summary' });
  }
};

export const updateTransaction = async (req: any, res: Response) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { categoryId } = req.body;

  try {
    // 1. Verify transaction exists and belongs to the user
    const tx = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // 2. Verify category exists if a categoryId is provided
    if (categoryId && categoryId !== 'null') {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        return res.status(400).json({ error: 'Invalid category ID' });
      }
    }

    // 3. Update transaction
    const updated = await prisma.transaction.update({
      where: { id },
      data: { categoryId: categoryId === 'null' || !categoryId ? null : categoryId },
      include: { category: true },
    });

    return res.json(serializePrisma(decryptTransaction(updated)));
  } catch (error) {
    logger.error(error, 'Update Transaction Error');
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getCategories = async (req: any, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    return res.json(categories);
  } catch (error) {
    logger.error(error, 'Fetch Categories Error');
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createTransaction = async (req: any, res: Response) => {
  const userId = req.user.id;
  const { date, amount, description, type, categoryId, merchantName, isSubscription } = req.body;

  if (!date || !amount || !description || !type) {
    return res.status(400).json({ error: 'Date, amount, description, and type are required' });
  }

  try {
    const tx = await prisma.transaction.create({
      data: {
        userId,
        date: new Date(date),
        amount: BigInt(amount),
        description: encrypt(description) as string,
        merchantName: merchantName ? (encrypt(merchantName) as string) : null,
        type,
        originalText: encrypt(description) as string,
        isSubscription: isSubscription || false,
        categoryId: categoryId || null,
      },
      include: { category: true },
    });

    return res.json(serializePrisma(decryptTransaction(tx)));
  } catch (error) {
    logger.error(error, 'Create Transaction Error');
    return res.status(500).json({ error: 'Failed to create transaction' });
  }
};

export const getBudgets = async (req: any, res: Response) => {
  const userId = req.user.id;
  try {
    const budgets = await prisma.budget.findMany({
      where: { userId },
      include: { category: true },
    });

    // Calculate current month's expenses for each budgeted category
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const categorySpends = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: startOfMonth },
      },
      _sum: { amount: true },
    });

    const spendsMap = new Map(
      categorySpends.map((s) => [s.categoryId, Number(s._sum.amount || 0)])
    );

    const result = budgets.map((b) => ({
      id: b.id,
      categoryId: b.categoryId,
      category: b.category,
      amount: Number(b.amount),
      spent: spendsMap.get(b.categoryId) || 0,
    }));

    return res.json(serializePrisma(result));
  } catch (error) {
    logger.error(error, 'Fetch Budgets Error');
    return res.status(500).json({ error: 'Failed to fetch budgets' });
  }
};

export const upsertBudget = async (req: any, res: Response) => {
  const userId = req.user.id;
  const { categoryId, amount } = req.body;

  if (!categoryId || amount === undefined) {
    return res.status(400).json({ error: 'Category ID and amount are required' });
  }

  try {
    const budget = await prisma.budget.upsert({
      where: {
        userId_categoryId: { userId, categoryId },
      },
      update: {
        amount: BigInt(amount),
      },
      create: {
        userId,
        categoryId,
        amount: BigInt(amount),
      },
      include: { category: true },
    });

    // Also get the current month spent value to return full details
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const sumAgg = await prisma.transaction.aggregate({
      where: {
        userId,
        categoryId,
        type: 'EXPENSE',
        date: { gte: startOfMonth },
      },
      _sum: { amount: true },
    });

    const result = {
      id: budget.id,
      categoryId: budget.categoryId,
      category: budget.category,
      amount: Number(budget.amount),
      spent: Number(sumAgg._sum.amount || 0),
    };

    return res.json(serializePrisma(result));
  } catch (error) {
    logger.error(error, 'Upsert Budget Error');
    return res.status(500).json({ error: 'Failed to save budget' });
  }
};

export const deleteBudget = async (req: any, res: Response) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const budget = await prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    await prisma.budget.delete({
      where: { id },
    });

    return res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    logger.error(error, 'Delete Budget Error');
    return res.status(500).json({ error: 'Failed to delete budget' });
  }
};
