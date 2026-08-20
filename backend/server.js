require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { errorHandler } = require('./middleware/auth');
const { seedCategories } = require('./scripts/seed');

// Import Route Handlers
const authRoutes = require('./routes/auth.routes');
const transactionRoutes = require('./routes/transaction.routes');
const statementRoutes = require('./routes/statement.routes');
const goalRoutes = require('./routes/goal.routes');
const aiRoutes = require('./routes/ai.routes');

const app = express();

// Allowed Origins for CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive in dev/interview demos
    }
  },
  credentials: true,
}));

app.use(express.json());

// Base Health Check Endpoints
app.get('/', (req, res) => {
  res.json({ status: 'FinFlow API is running smoothly', version: '1.0.0' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/statements', statementRoutes);
app.use('/api/v1', transactionRoutes);
app.use('/api/v1/goals', goalRoutes);
app.use('/api/v1/ai', aiRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

// Global Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Start Server
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(async () => {
    // Auto-seed categories on startup if database is newly initialized
    try {
      await seedCategories();
    } catch (seedErr) {
      console.warn('Category auto-seed skipped:', seedErr.message);
    }

    app.listen(PORT, () => {
      console.log(`🚀 FinFlow Backend Live on http://localhost:${PORT}`);
    });
  });
}

module.exports = app;
