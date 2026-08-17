import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction';
import { Category } from '../models/Category';
import { Budget } from '../models/Budget';
import { decrypt, encrypt } from '../utils/encryption';

const decryptTransaction = (transaction: any) => {
  const json = typeof transaction.toJSON === 'function' ? transaction.toJSON() : transaction;
  return {
    ...json,
    description: decrypt(json.description) || '',
    merchantName: json.merchantName ? decrypt(json.merchantName) || null : null,
    originalText: decrypt(json.originalText) || '',
  };
};

export class TransactionService {
  static async getTransactions(userId: string, query: any) {
    const { 
      categoryId, type, startDate, endDate, 
      limit = 50, offset = 0, isSubscription, 
      search, minAmount, maxAmount, sortOrder 
    } = query;

    const filter: any = { userId };

    if (categoryId && categoryId !== 'ALL' && categoryId !== 'undefined') {
      filter.categoryId = categoryId;
    }
    if (type && type !== 'ALL' && type !== 'undefined') {
      filter.type = type;
    }
    if (isSubscription === 'true') filter.isSubscription = true;
    if (isSubscription === 'false') filter.isSubscription = false;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) filter.date.$lte = new Date(endDate as string);
    }

    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = Number(minAmount) * 100;
      if (maxAmount) filter.amount.$lte = Number(maxAmount) * 100;
    }

    let sort: any = { date: -1 };
    if (sortOrder === 'date-asc') sort = { date: 1 };
    if (sortOrder === 'amount-desc') sort = { amount: -1 };
    if (sortOrder === 'amount-asc') sort = { amount: 1 };

    const transactions = await Transaction.find(filter)
      .sort(sort)
      .skip(search ? 0 : Number(offset))
      .limit(search ? 500 : Number(limit))
      .populate('categoryId');

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
    const userObjId = new mongoose.Types.ObjectId(userId);

    const aggregates = await Transaction.aggregate([
      { $match: { userId: userObjId } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } }
    ]);

    const totals = {
      totalSpend: 0,
      totalIncome: 0,
      savings: 0,
      budgetStatus: 'Healthy'
    };

    aggregates.forEach(agg => {
      if (agg._id === 'EXPENSE') totals.totalSpend = Number(agg.total || 0);
      if (agg._id === 'INCOME') totals.totalIncome = Number(agg.total || 0);
    });

    totals.savings = totals.totalIncome - totals.totalSpend;

    if (totals.totalSpend > totals.totalIncome) {
      totals.budgetStatus = totals.totalIncome === 0 ? 'No Income Recorded' : 'Over Budget';
    }

    const categoryAggs = await Transaction.aggregate([
      { $match: { userId: userObjId, type: 'EXPENSE' } },
      { $group: { _id: '$categoryId', total: { $sum: '$amount' } } }
    ]);

    const categoryIds = categoryAggs.map(a => a._id).filter(Boolean);
    const categoryDetails = await Category.find({ _id: { $in: categoryIds } });

    const categories = categoryAggs.map(agg => {
      const cat = categoryDetails.find(c => c._id.toString() === (agg._id ? agg._id.toString() : ''));
      return {
        name: cat?.name || 'Uncategorized',
        value: Number(agg.total || 0),
        color: cat?.color || '#6366f1'
      };
    });

    const budgets = await Budget.find({ userId });
    let finScore = 75;
    
    if (totals.totalIncome > 0) {
      const savingsRate = (totals.savings / totals.totalIncome) * 100;
      if (savingsRate > 20) finScore += 15;
      else if (savingsRate > 10) finScore += 10;
      else if (savingsRate > 0) finScore += 5;
      else finScore -= 10;
    } else if (totals.totalSpend > 0) {
      finScore -= 20;
    }

    if (budgets.length > 0) {
      finScore += 5;
      if (totals.budgetStatus === 'Healthy') finScore += 5;
      else finScore -= 5;
    }

    finScore = Math.min(Math.max(finScore, 0), 100);

    const recentHighTxs = await Transaction.find({
      userId,
      type: 'EXPENSE',
      amount: { $gte: 500000 }
    })
      .sort({ date: -1 })
      .limit(3)
      .populate('categoryId');
    
    const anomalies = recentHighTxs.map(t => {
      const dec = decryptTransaction(t);
      const catName = t.categoryId && typeof t.categoryId === 'object' && (t.categoryId as any).name 
        ? (t.categoryId as any).name 
        : 'Uncategorized';
      return `Unusual high transaction: \u20B9${Number(t.amount)/100} at ${dec.merchantName || 'Unknown Merchant'} (${catName})`;
    });

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyTransactions = await Transaction.find({
      userId,
      type: 'EXPENSE',
      date: { $gte: sixMonthsAgo }
    }).select('amount date');

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
    const tx = await Transaction.findOne({ _id: id, userId });

    if (!tx) {
      throw new Error('Transaction not found');
    }

    if (categoryId && categoryId !== 'null') {
      const category = await Category.findById(categoryId);
      if (!category) {
        throw new Error('Invalid category ID');
      }
    }

    tx.categoryId = categoryId === 'null' || !categoryId ? null : (categoryId as any);
    await tx.save();

    const updated = await Transaction.findById(id).populate('categoryId');
    return decryptTransaction(updated);
  }

  static async getCategories() {
    const categories = await Category.find().sort({ name: 1 });
    return categories.map(c => c.toJSON());
  }

  static async createTransaction(userId: string, body: any) {
    const { date, amount, description, type, categoryId, merchantName, isSubscription } = body;

    const tx = await Transaction.create({
      userId,
      date: new Date(date),
      amount: Number(amount),
      description: encrypt(description) as string,
      merchantName: merchantName ? (encrypt(merchantName) as string) : null,
      type,
      originalText: encrypt(description) as string,
      isSubscription: isSubscription || false,
      categoryId: categoryId || null,
    });

    const populated = await Transaction.findById(tx.id).populate('categoryId');
    return decryptTransaction(populated);
  }

  static async getBudgets(userId: string) {
    const budgets = await Budget.find({ userId }).populate('categoryId');

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const userObjId = new mongoose.Types.ObjectId(userId);
    const categorySpends = await Transaction.aggregate([
      {
        $match: {
          userId: userObjId,
          type: 'EXPENSE',
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: '$categoryId',
          total: { $sum: '$amount' }
        }
      }
    ]);

    const spendsMap = new Map(
      categorySpends.map((s) => [s._id ? s._id.toString() : '', Number(s.total || 0)])
    );

    return budgets.map((b) => {
      const json: any = b.toJSON();
      const catIdStr = json.categoryId ? json.categoryId.toString() : '';
      return {
        id: json.id || json._id?.toString(),
        categoryId: catIdStr,
        category: json.category,
        amount: Number(json.amount),
        spent: spendsMap.get(catIdStr) || 0,
      };
    });
  }

  static async upsertBudget(userId: string, categoryId: string, amount: number) {
    const budget = await Budget.findOneAndUpdate(
      { userId, categoryId },
      { userId, categoryId, amount: Number(amount) },
      { upsert: true, returnDocument: 'after' }
    ).populate('categoryId');

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const userObjId = new mongoose.Types.ObjectId(userId);
    const catObjId = new mongoose.Types.ObjectId(categoryId);

    const sumAgg = await Transaction.aggregate([
      {
        $match: {
          userId: userObjId,
          categoryId: catObjId,
          type: 'EXPENSE',
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const spentTotal = sumAgg.length > 0 ? Number(sumAgg[0].total || 0) : 0;
    const json: any = budget ? budget.toJSON() : {};

    return {
      id: json.id || json._id?.toString(),
      categoryId: json.categoryId,
      category: json.category,
      amount: Number(json.amount),
      spent: spentTotal,
    };
  }

  static async deleteBudget(userId: string, id: string) {
    const budget = await Budget.findOne({ _id: id, userId });

    if (!budget) {
      throw new Error('Budget not found');
    }

    await Budget.deleteOne({ _id: id, userId });
  }
}
