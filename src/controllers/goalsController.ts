import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

export const createGoal = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { name, targetAmount, currentAmount, deadline } = req.body;

    if (!name || !targetAmount) {
      return res.status(400).json({ error: 'Name and targetAmount are required' });
    }

    const goal = await prisma.savingsGoal.create({
      data: {
        userId,
        name,
        targetAmount: BigInt(Math.round(Number(targetAmount) * 100)),
        currentAmount: currentAmount ? BigInt(Math.round(Number(currentAmount) * 100)) : BigInt(0),
        deadline: deadline ? new Date(deadline) : null,
      }
    });

    return res.status(201).json({
      ...goal,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount),
    });
  } catch (error) {
    logger.error(error, 'Create Goal Error');
    return res.status(500).json({ error: 'Failed to create goal' });
  }
};

export const getGoals = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    
    const goals = await prisma.savingsGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const serializedGoals = goals.map((g: any) => ({
      ...g,
      targetAmount: Number(g.targetAmount),
      currentAmount: Number(g.currentAmount),
    }));

    return res.json(serializedGoals);
  } catch (error) {
    logger.error(error, 'Get Goals Error');
    return res.status(500).json({ error: 'Failed to fetch goals' });
  }
};

export const updateGoalProgress = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { currentAmount } = req.body;

    if (currentAmount === undefined) {
      return res.status(400).json({ error: 'currentAmount is required' });
    }

    // Verify ownership
    const existing = await prisma.savingsGoal.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const updated = await prisma.savingsGoal.update({
      where: { id },
      data: { currentAmount: BigInt(Math.round(Number(currentAmount) * 100)) }
    });

    return res.json({
      ...updated,
      targetAmount: Number(updated.targetAmount),
      currentAmount: Number(updated.currentAmount),
    });
  } catch (error) {
    logger.error(error, 'Update Goal Progress Error');
    return res.status(500).json({ error: 'Failed to update goal' });
  }
};

export const deleteGoal = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.savingsGoal.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    await prisma.savingsGoal.delete({
      where: { id }
    });

    return res.json({ success: true });
  } catch (error) {
    logger.error(error, 'Delete Goal Error');
    return res.status(500).json({ error: 'Failed to delete goal' });
  }
};
