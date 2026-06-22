import { Router } from 'express';
import { getFinancialInsights, chatWithAI } from '../controllers/aiController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.get('/insights', authenticateJWT, getFinancialInsights);
router.post('/chat', authenticateJWT, chatWithAI);

export default router;
