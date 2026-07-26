import { Router } from 'express';
import {
  createGoal,
  getGoals,
  updateGoalProgress,
  deleteGoal,
} from '../controllers/goalsController';
import { authenticateJWT } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validateRequest';
import { createGoalSchema, updateGoalProgressSchema } from '../dtos/goal.dto';

const router = Router();

router.post('/', authenticateJWT, validateRequest(createGoalSchema), createGoal);
router.get('/', authenticateJWT, getGoals);
router.patch('/:id', authenticateJWT, validateRequest(updateGoalProgressSchema), updateGoalProgress);
router.delete('/:id', authenticateJWT, deleteGoal);

export default router;
