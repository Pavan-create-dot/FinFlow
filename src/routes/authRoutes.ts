import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { validateRequest } from '../middlewares/validateRequest';
import { registerSchema, loginSchema } from '../dtos/auth.dto';
import rateLimit from 'express-rate-limit';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, validateRequest(registerSchema), register);
router.post('/login', authLimiter, validateRequest(loginSchema), login);

export default router;
