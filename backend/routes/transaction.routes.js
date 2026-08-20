const express = require('express');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Budget = require('../models/Budget');
const { authenticateJWT } = require('../middleware/auth');
const { encrypt, decrypt } = require('../services/encryption');

const router = express.Router();

const decryptTransaction = (transaction) => {
  const json = typeof transaction.toJSON === 'function' ? transaction.toJSON() : transaction;
  return {
    ...json,
    description: decrypt(json.description) || '',
    merchantName: json.merchantName ? decrypt(json.merchantName) : null,
    originalText: decrypt(json.originalText) || '',
  };
};

// ----------------------------------------------------
// TRANSACTIONS
// ----------------------------------------------------

// Get filtered & sorted transactions
router.get('/transactions', authenticateJWT, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      categoryId, type, startDate, endDate,
      limit = 50, offset = 0, isSubscription,
      search, minAmount, maxAmount, sortOrder
    } = req.query;

    const filter = { userId };

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
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = Number(minAmount) * 100;
      if (maxAmount) filter.amount.$lte = Number(maxAmount) * 100;
    }

    let sort = { date: -1 };
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
      const q = search.toLowerCase();
      decrypted = decrypted.filter(t =>
        t.description.toLowerCase().includes(q) ||
        (t.merchantName && t.merchantName.toLowerCase().includes(q))
      );
      decrypted = decrypted.slice(Number(offset), Number(offset) + Number(limit));
    }

    res.json(decrypted);
  } catch (error) {
    next(error);
  }
});

// Create manual transaction
router.post('/transactions', authenticateJWT, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { date, amount, description, type, categoryId, merchantName, isSubscription } = req.body;

    if (!amount || !description || !type) {
      return res.status(400).json({ error: 'Amount, description, and type are required' });
    }

    const tx = await Transaction.create({
      userId,
      date: new Date(date || Date.now()),
      amount: Number(amount),
      description: encrypt(description),
      merchantName: merchantName ? encrypt(merchantName) : null,
      type,
      originalText: encrypt(description),
      isSubscription: Boolean(isSubscription),
      categoryId: categoryId || null,
    });

    const populated = await Transaction.findById(tx.id).populate('categoryId');
    res.status(201).json(decryptTransaction(populated));
  } catch (error) {
    next(error);
  }
});

// Update transaction category
router.patch('/transactions/:id', authenticateJWT, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { categoryId } = req.body;

    const tx = await Transaction.findOne({ _id: req.params.id, userId });
    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (categoryId && categoryId !== 'null') {
      const cat = await Category.findById(categoryId);
      if (!cat) {
        return res.status(400).json({ error: 'Invalid category' });
      }
    }

    tx.categoryId = categoryId === 'null' || !categoryId ? null : categoryId;
    await tx.save();

    const updated = await Transaction.findById(req.params.id).populate('categoryId');
    res.json(decryptTransaction(updated));
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// CATEGORIES
// ----------------------------------------------------
router.get('/categories', authenticateJWT, async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories.map(c => c.toJSON()));
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// ANALYTICS SUMMARY
// ----------------------------------------------------
router.get('/analytics/summary', authenticateJWT, async (req, res, next) => {
  try {
    const userId = req.user.id;
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
        name: cat ? cat.name : 'Uncategorized',
        value: Number(agg.total || 0),
        color: cat ? cat.color : '#6366f1'
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
      const catName = t.categoryId && t.categoryId.name ? t.categoryId.name : 'Uncategorized';
      return `Unusual high transaction: ₹${Number(t.amount) / 100} at ${dec.merchantName || 'Unknown Merchant'} (${catName})`;
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

    const monthlyTrendMap = {};
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

    res.json({ ...totals, categories, finScore: Math.round(finScore), anomalies, monthlyTrend });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// BUDGETS
// ----------------------------------------------------
router.get('/budgets', authenticateJWT, async (req, res, next) => {
  try {
    const userId = req.user.id;
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
      categorySpends.map(s => [s._id ? s._id.toString() : '', Number(s.total || 0)])
    );

    const data = budgets.map(b => {
      const json = b.toJSON();
      const catIdStr = json.categoryId ? json.categoryId.toString() : '';
      return {
        id: json.id || json._id.toString(),
        categoryId: catIdStr,
        category: json.category,
        amount: Number(json.amount),
        spent: spendsMap.get(catIdStr) || 0,
      };
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post('/budgets', authenticateJWT, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { categoryId, amount } = req.body;

    if (!categoryId || !amount) {
      return res.status(400).json({ error: 'Category and budget amount are required' });
    }

    const budget = await Budget.findOneAndUpdate(
      { userId, categoryId },
      { userId, categoryId, amount: Number(amount) },
      { upsert: true, returnDocument: 'after' }
    ).populate('categoryId');

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const sumAgg = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          categoryId: new mongoose.Types.ObjectId(categoryId),
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
    const json = budget ? budget.toJSON() : {};

    res.json({
      id: json.id || json._id.toString(),
      categoryId: json.categoryId,
      category: json.category,
      amount: Number(json.amount),
      spent: spentTotal,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/budgets/:id', authenticateJWT, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const budget = await Budget.findOne({ _id: req.params.id, userId });
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    await Budget.deleteOne({ _id: req.params.id, userId });
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
