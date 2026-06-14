import './config/env';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import statementRoutes from './routes/statementRoutes';
import transactionRoutes from './routes/transactionRoutes';
import aiRoutes from './routes/aiRoutes';
import { errorHandler } from './middlewares/errorHandler';
import { notFoundHandler } from './middlewares/notFound';
import { logger } from './utils/logger';
import { prisma } from './lib/prisma';

const app = express();
app.use(helmet());

// Restrict CORS to the frontend origin only (stripping trailing slash if present)
const rawFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const frontendUrl = rawFrontendUrl.endsWith('/') ? rawFrontendUrl.slice(0, -1) : rawFrontendUrl;

app.use(cors({
  origin: frontendUrl,
  credentials: true,
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'FinFlow API is healthy', version: '1.0.0' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/statements', statementRoutes);
app.use('/api/v1', transactionRoutes);
app.use('/api/v1/ai', aiRoutes);

// 404 & Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
let server: any;

if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => logger.info(`FinFlow Backend Live on ${PORT}`));

  // Graceful Shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    
    // Close the server to stop accepting new requests
    server.close(async () => {
      logger.info('HTTP server closed.');
      
      try {
        await prisma.$disconnect();
        logger.info('Prisma disconnected.');
        process.exit(0);
      } catch (err) {
        logger.error(err, 'Error during graceful shutdown');
        process.exit(1);
      }
    });
    
    // Force close after 10s
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

export { app };
