import { prisma } from '../lib/prisma';
import { decrypt, encrypt } from '../utils/encryption';

const decryptTransaction = (transaction: any) => ({
  ...transaction,
  description: decrypt(transaction.description) || '',
  merchantName: transaction.merchantName ? decrypt(transaction.merchantName) || null : null,
  originalText: decrypt(transaction.originalText) || '',
});

export class TransactionService {
  static async getTransactions(userId: string, query: any) {
    const { 
      categoryId, type, startDate, endDate, 
      limit = 50, offset = 0, isSubscription, 
      search, minAmount, maxAmount, sortOrder 
    } = query;

    const categoryFilter = categoryId && categoryId !== 'ALL' && categoryId !== 'undefined' ? categoryId as string : undefined;
    const typeFilter = type && type !== 'ALL' && type !== 'undefined' ? type as string : undefined;
    const subscriptionFilter = isSubscription === 'true' ? true : isSubscription === 'false' ? false : undefined;

    let orderBy: any = { date: 'desc' };
    if (sortOrder === 'date-asc') orderBy = { date: 'asc' };
    if (sortOrder === 'amount-desc') orderBy = { amount: 'desc' };
    if (sortOrder === 'amount-asc') orderBy = { amount: 'asc' };

    const transactions = await prisma.transaction.findMany({
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
      // When searching, fetch a large page so in-memory filter has enough rows
      take: search ? 500 : Number(limit),
      skip: search ? 0 : Number(offset),
      orderBy,
      include: { category: true }
    });

    let decrypted = transactions.map(decryptTransaction);

    if (search) {
      const q = (search as string).toLowerCase();
      decrypted = decrypted.filter(t =>
        t.description.toLowerCase().includes(q) || 
        (t.merchantName && t.merchantName.toLowerCase().includes(q))
      );
      decrypted = decrypted.slice(Number(offset), Number(offset) + Number(limit));
    }

    return decrypted;
  }

  static async getAggregates(userId: string) {
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

    const budgets = await prisma.budget.findMany({ where: { userId } });
    let finScore = 75;
    
    if (totals.totalIncome > 0) {
      const savingsRate = (totals.savings / totals.totalIncome) * 100;
      if (savingsRate > 20) finScore += 15;
      else if (savingsRate > 10) finScore += 10;
      else if (savingsRate > 0) finScore += 5;
      else finScore -= 10;
    } else if (totals.totalSpend > 0) {
      // Has expenses but no income recorded — significant red flag
      finScore -= 20;
    }

    if (budgets.length > 0) {
      finScore += 5;
      if (totals.budgetStatus === 'Healthy') finScore += 5;
      else finScore -= 5;
    }

    finScore = Math.min(Math.max(finScore, 0), 100);

    const recentHighTxs = await prisma.transaction.findMany({
      where: { userId, type: 'EXPENSE', amount: { gte: 500000 } },
      orderBy: { date: 'desc' },
      take: 3,
      include: { category: true }
    });
    
    const anomalies = recentHighTxs.map(t => {
      const dec = decryptTransaction(t);
      return `Unusual high transaction: \u20B9${Number(t.amount)/100} at ${dec.merchantName || 'Unknown Merchant'} (${t.category?.name || 'Uncategorized'})`;
    });

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

    const monthlyTrendMap: { [key: string]: number } = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleDateString('en-US', { month: 'short' });
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

    return { ...totals, categories, finScore: Math.round(finScore), anomalies, monthlyTrend };
  }

  static async updateTransaction(userId: string, id: string, categoryId: string | null) {
    const tx = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!tx) {
      throw new Error('Transaction not found');
    }

    if (categoryId && categoryId !== 'null') {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        throw new Error('Invalid category ID');
      }
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: { categoryId: categoryId === 'null' || !categoryId ? null : categoryId },
      include: { category: true },
    });

    return decryptTransaction(updated);
  }

  static async getCategories() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  static async createTransaction(userId: string, body: any) {
    const { date, amount, description, type, categoryId, merchantName, isSubscription } = body;

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

    return decryptTransaction(tx);
  }

  static async getBudgets(userId: string) {
    const budgets = await prisma.budget.findMany({
      where: { userId },
      include: { category: true },
    });

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

    return budgets.map((b) => ({
      id: b.id,
      categoryId: b.categoryId,
      category: b.category,
      amount: Number(b.amount),
      spent: spendsMap.get(b.categoryId) || 0,
    }));
  }

  static async upsertBudget(userId: string, categoryId: string, amount: number) {
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

    return {
      id: budget.id,
      categoryId: budget.categoryId,
      category: budget.category,
      amount: Number(budget.amount),
      spent: Number(sumAgg._sum.amount || 0),
    };
  }

  static async deleteBudget(userId: string, id: string) {
    const budget = await prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!budget) {
      throw new Error('Budget not found');
    }

    await prisma.budget.delete({
      where: { id },
    });
  }
}
