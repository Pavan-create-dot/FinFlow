import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import pdf from 'pdf-parse';
import fs from 'fs';
import { AIService } from '../services/aiService';
import { encrypt } from '../utils/encryption';

const prisma = new PrismaClient();

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
      await prisma.statement.update({
        where: { id: statementId },
        data: { status: 'PROCESSING' },
      });

      // 1. Extract raw text from PDF
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdf(dataBuffer);
      const rawText = pdfData.text;

      // 2. Delegate to AI Service for structured extraction
      const transactions = await AIService.extractTransactions(rawText);

      // Fetch all system categories to map them
      const categories = await prisma.category.findMany();
      const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));

      // 3. Batch insert using a transaction to ensure atomicity
      await prisma.$transaction(async (tx) => {
        for (const t of transactions) {
          const extractedCat = t.category?.toLowerCase() || '';
          const categoryId = categoryMap.get(extractedCat) || null;

          await tx.transaction.create({
            data: {
              userId,
              statementId,
              date: new Date(t.date),
              amount: BigInt(t.amount),
              description: encrypt(t.description) as string,
              merchantName: t.merchantName ? (encrypt(t.merchantName) as string) : null,
              type: t.type,
              originalText: encrypt(t.description) as string,
              isSubscription: t.isSubscription || false,
              categoryId: categoryId,
            },
          });
        }
      });

      await prisma.statement.update({
        where: { id: statementId },
        data: { status: 'COMPLETED' },
      });

      // Cleanup: Delete the local file after processing
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

    } catch (error: any) {
      console.error(`Worker failed at job ${job.id}:`, error);
      await prisma.statement.update({
        where: { id: statementId },
        data: { 
          status: 'FAILED',
          errorMessage: encrypt(error.message) as string 
        },
      });
      throw error;
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
  }
);

console.log('PDF Processing Worker active and listening to Redis queue...');
