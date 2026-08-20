const express = require('express');
const SavingsGoal = require('../models/SavingsGoal');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();

// Create savings goal
router.post('/', authenticateJWT, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, targetAmount, currentAmount, deadline } = req.body;

    if (!name || !targetAmount) {
      return res.status(400).json({ error: 'Goal name and target amount are required' });
    }

    const goal = await SavingsGoal.create({
      userId,
      name,
      targetAmount: Math.round(Number(targetAmount) * 100),
      currentAmount: currentAmount ? Math.round(Number(currentAmount) * 100) : 0,
      deadline: deadline ? new Date(deadline) : null,
    });

    const json = goal.toJSON();
    res.status(201).json({
      ...json,
      targetAmount: Number(json.targetAmount),
      currentAmount: Number(json.currentAmount),
    });
  } catch (error) {
    next(error);
  }
});

// List savings goals
router.get('/', authenticateJWT, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const goals = await SavingsGoal.find({ userId }).sort({ createdAt: -1 });

    const formatted = goals.map(g => {
      const json = g.toJSON();
      return {
        ...json,
        targetAmount: Number(json.targetAmount),
        currentAmount: Number(json.currentAmount),
      };
    });

    res.json(formatted);
  } catch (error) {
    next(error);
  }
});

// Update goal progress
router.patch('/:id', authenticateJWT, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentAmount, mode = 'add' } = req.body;

    const goal = await SavingsGoal.findOne({ _id: req.params.id, userId });
    if (!goal) {
      return res.status(404).json({ error: 'Savings goal not found' });
    }

    const inputPaise = Math.round(Number(currentAmount) * 100);
    const rawAmount = mode === 'set' ? inputPaise : goal.currentAmount + inputPaise;
    goal.currentAmount = rawAmount > goal.targetAmount ? goal.targetAmount : Math.max(0, rawAmount);

    await goal.save();

    const json = goal.toJSON();
    res.json({
      ...json,
      targetAmount: Number(json.targetAmount),
      currentAmount: Number(json.currentAmount),
    });
  } catch (error) {
    next(error);
  }
});

// Delete savings goal
router.delete('/:id', authenticateJWT, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const goal = await SavingsGoal.findOne({ _id: req.params.id, userId });

    if (!goal) {
      return res.status(404).json({ error: 'Savings goal not found' });
    }

    await SavingsGoal.deleteOne({ _id: req.params.id, userId });
    res.json({ success: true, message: 'Savings goal deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
