import { Response } from 'express';
import { GoalService } from '../services/goalService';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middlewares/auth';

export const createGoal = async (req: AuthRequest, res: Response) => {
  try {
    const goal = await GoalService.createGoal(req.user!.id, req.body);
    return res.status(201).json(goal);
  } catch (error) {
    logger.error(error, 'Create Goal Error');
    return res.status(500).json({ error: 'Failed to create goal' });
  }
};

export const getGoals = async (req: AuthRequest, res: Response) => {
  try {
    const goals = await GoalService.getGoals(req.user!.id);
    return res.json(goals);
  } catch (error) {
    logger.error(error, 'Get Goals Error');
    return res.status(500).json({ error: 'Failed to fetch goals' });
  }
};

export const updateGoalProgress = async (req: AuthRequest, res: Response) => {
  try {
    const { currentAmount, mode } = req.body;
    const updated = await GoalService.updateGoalProgress(req.user!.id, req.params.id, currentAmount, mode);
    return res.json(updated);
  } catch (error: any) {
    logger.error(error, 'Update Goal Progress Error');
    if (error.message === 'Goal not found') {
      return res.status(404).json({ error: 'Goal not found' });
    }
    return res.status(500).json({ error: 'Failed to update goal' });
  }
};

export const deleteGoal = async (req: AuthRequest, res: Response) => {
  try {
    await GoalService.deleteGoal(req.user!.id, req.params.id);
    return res.json({ success: true });
  } catch (error: any) {
    logger.error(error, 'Delete Goal Error');
    if (error.message === 'Goal not found') {
      return res.status(404).json({ error: 'Goal not found' });
    }
    return res.status(500).json({ error: 'Failed to delete goal' });
  }
};
