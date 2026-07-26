import { Router } from 'express';
import { getFinancialInsights, chatWithAI } from '../controllers/aiController';
import { authenticateJWT } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validateRequest';
import { chatWithAISchema } from '../dtos/ai.dto';

const router = Router();

router.get('/insights', authenticateJWT, getFinancialInsights);
router.post('/chat', authenticateJWT, validateRequest(chatWithAISchema), chatWithAI);

export default router;
