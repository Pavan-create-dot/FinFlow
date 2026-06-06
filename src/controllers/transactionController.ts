import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { serializePrisma } from '../utils/serializer';

const prisma = new PrismaClient();

export const getTransactions = async (req: any, res: Response) => {
  const userId = req.user.id;
  const { categoryId, type, startDate, endDate, limit = 50, offset = 0 } = req.query;

  const categoryFilter = categoryId && categoryId !== 'ALL' && categoryId !== 'undefined' ? categoryId as string : undefined;
  const typeFilter = type && type !== 'ALL' && type !== 'undefined' ? type as string : undefined;

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        categoryId: categoryFilter,
        type: typeFilter,
        date: {
          gte: startDate ? new Date(startDate as string) : undefined,
          lte: endDate ? new Date(endDate as string) : undefined,
        }
      },
      take: Number(limit),
      skip: Number(offset),
      orderBy: { date: 'desc' },
      include: { category: true }
    });

    return res.json(serializePrisma(transactions));
  } catch (error) {
    console.error('Fetch Transactions Error:', error);
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

    // Fixed: correctly flag Over Budget even when income is zero
    if (totals.totalSpend > totals.totalIncome) {
      totals.budgetStatus = totals.totalIncome === 0 ? 'No Income Recorded' : 'Over Budget';
    }

    // Get category distribution
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

    return res.json(serializePrisma({ ...totals, categories }));
  } catch (error) {
    console.error('Fetch Analytics Summary Error:', error);
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

    return res.json(serializePrisma(updated));
  } catch (error) {
    console.error('Update Transaction Error:', error);
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
    console.error('Fetch Categories Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
