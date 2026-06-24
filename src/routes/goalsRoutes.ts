import { Router } from 'express';
import { createGoal, getGoals, updateGoalProgress, deleteGoal } from '../controllers/goalsController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.use(authenticateJWT);

router.post('/', createGoal);
router.get('/', getGoals);
router.patch('/:id/progress', updateGoalProgress);
router.delete('/:id', deleteGoal);

export default router;
