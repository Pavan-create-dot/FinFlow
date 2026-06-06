import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { register, login } from './controllers/authController';
import { uploadStatement, getStatements } from './controllers/statementController';
import { getTransactions, getAggregates, updateTransaction, getCategories } from './controllers/transactionController';
import { getFinancialInsights } from './controllers/aiController';
import { authenticateJWT } from './middlewares/auth';

const app = express();
app.use(helmet());

// Restrict CORS to the frontend origin only
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// Rate limiter for auth endpoints — max 20 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/', (req, res) => {
  res.json({ status: 'FinFlow API is healthy', version: '1.0.0' });
});

// Public Routes (rate-limited)
app.post('/api/v1/auth/register', authLimiter, register);
app.post('/api/v1/auth/login', authLimiter, login);

// Protected Routes
app.post('/api/v1/statements/upload', authenticateJWT, upload.single('statement'), uploadStatement);
app.get('/api/v1/statements', authenticateJWT, getStatements);
app.get('/api/v1/transactions', authenticateJWT, getTransactions);
app.patch('/api/v1/transactions/:id', authenticateJWT, updateTransaction);
app.get('/api/v1/categories', authenticateJWT, getCategories);
app.get('/api/v1/analytics/summary', authenticateJWT, getAggregates);
app.get('/api/v1/ai/insights', authenticateJWT, getFinancialInsights);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`FinFlow Backend Live on ${PORT}`));
