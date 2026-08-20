const express = require('express');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const AIService = require('../services/ai.service');
const { authenticateJWT } = require('../middleware/auth');
const { decrypt } = require('../services/encryption');

const router = express.Router();

// Generate financial insights based on user's spending data
router.get('/insights', authenticateJWT, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const transactions = await Transaction.find({ userId })
      .sort({ date: -1 })
      .limit(100)
      .select('amount description date type merchantName');

    if (transactions.length === 0) {
      return res.json({ message: 'Upload some statements first to get AI insights!' });
    }

    const serializedData = transactions.map(t => {
      const json = t.toJSON();
      return {
        ...json,
        description: decrypt(json.description) || '',
        merchantName: json.merchantName ? decrypt(json.merchantName) : null,
        amount: Number(json.amount) / 100,
      };
    });

    const insights = await AIService.generateInsights(serializedData);
    res.json(insights);
  } catch (error) {
    next(error);
  }
});

// Chat with FinAI Financial Advisor
router.post('/chat', authenticateJWT, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const transactions = await Transaction.find({ userId })
      .sort({ date: -1 })
      .limit(80)
      .populate('categoryId');

    const budgets = await Budget.find({ userId }).populate('categoryId');

    const decryptedTxs = transactions.map(t => {
      const json = t.toJSON();
      const catName = json.category ? json.category.name : 'Uncategorized';
      return {
        amount: Number(json.amount) / 100,
        description: decrypt(json.description) || '',
        merchantName: json.merchantName ? decrypt(json.merchantName) : null,
        type: json.type,
        date: new Date(json.date).toISOString().split('T')[0],
        category: catName,
      };
    });

    const budgetsSummary = budgets.map(b => {
      const json = b.toJSON();
      const catName = json.category ? json.category.name : 'Uncategorized';
      return {
        category: catName,
        limit: Number(json.amount) / 100,
      };
    });

    const financialContext = {
      budgets: budgetsSummary,
      recentTransactions: decryptedTxs,
    };

    const reply = await AIService.chat(message, history || [], financialContext);

    const suggestedPrompts = [
      'Where did I overspend this month?',
      'How much can I save yearly?',
      'Which subscriptions should I cancel?',
      'Can I afford a ₹50,000 laptop?',
    ];

    res.json({ reply, suggestedPrompts });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
