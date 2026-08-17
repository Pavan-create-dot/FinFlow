import 'dotenv/config';
import '../config/env';
import { Worker, Job } from 'bullmq';
import pdf from 'pdf-parse';
import fs from 'fs';
import { AIService } from '../services/aiService';
import { encrypt } from '../utils/encryption';
import { Statement } from '../models/Statement';
import { Category } from '../models/Category';
import { Transaction } from '../models/Transaction';
import { connectDB, disconnectDB } from '../lib/db';
import { logger } from '../utils/logger';

// Ensure DB is connected in worker process
connectDB();

interface PDFJobData {
  statementId: string;
  userId: string;
  filePath: string;
}

export const pdfWorker = new Worker(
  'pdf-processing',
  async (job: Job<PDFJobData>) => {
    const { statementId, userId, filePath } = job.data;

    try {
      await Statement.findByIdAndUpdate(statementId, { status: 'PROCESSING' });

      // 1. Extract raw text from PDF
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdf(dataBuffer);
      const rawText = pdfData.text;

      // 2. Delegate to AI Service for structured extraction
      const transactions = await AIService.extractTransactions(rawText);

      // Fetch all system categories to map them
      const categories = await Category.find();
      const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c._id]));

      // 3. Batch insert using Transaction.insertMany
      const docsToInsert = transactions.map(t => {
        const extractedCat = t.category?.toLowerCase() || '';
        const categoryId = categoryMap.get(extractedCat) || null;

        return {
          userId,
          statementId,
          date: new Date(t.date),
          amount: Number(t.amount),
          description: encrypt(t.description) as string,
          merchantName: t.merchantName ? (encrypt(t.merchantName) as string) : null,
          type: t.type,
          originalText: encrypt(t.description) as string,
          isSubscription: t.isSubscription || false,
          categoryId: categoryId,
        };
      });

      if (docsToInsert.length > 0) {
        await Transaction.insertMany(docsToInsert);
      }

      await Statement.findByIdAndUpdate(statementId, { status: 'COMPLETED' });

      // Cleanup: Delete the local file after processing
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

    } catch (error: any) {
      logger.error(error, `Worker failed at job ${job.id}`);
      try {
        await Statement.findByIdAndUpdate(statementId, {
          status: 'FAILED',
          errorMessage: encrypt(error.message) as string,
        });
      } catch (dbErr) {
        logger.error(dbErr, `Could not set statement status to FAILED`);
      }
      throw error;
    }
  },
  {
    connection: (process.env.REDIS_URL
      ? { url: process.env.REDIS_URL, maxRetriesPerRequest: null }
      : {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          maxRetriesPerRequest: null,
        }) as any,
  }
);

logger.info('PDF Processing Worker active and listening to Redis queue...');

const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down worker...`);
  await pdfWorker.close();
  await disconnectDB();
  logger.info('Worker disconnected from Redis and MongoDB.');
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
