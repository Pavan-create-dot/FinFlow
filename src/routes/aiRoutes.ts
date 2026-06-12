import { Router } from 'express';
import { getFinancialInsights } from '../controllers/aiController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.get('/insights', authenticateJWT, getFinancialInsights);

export default router;
