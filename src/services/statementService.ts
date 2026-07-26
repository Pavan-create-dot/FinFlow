import { Queue } from 'bullmq';
import { prisma } from '../lib/prisma';
import { encrypt, decrypt } from '../utils/encryption';
import { logger } from '../utils/logger';

let _pdfQueue: Queue | null = null;

function getPdfQueue(): Queue {
  if (!_pdfQueue) {
    const redisConnection = process.env.REDIS_URL
      ? { url: process.env.REDIS_URL, enableOfflineQueue: false, maxRetriesPerRequest: null }
      : {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          enableOfflineQueue: false,
          maxRetriesPerRequest: null,
        };

    _pdfQueue = new Queue('pdf-processing', {
      connection: redisConnection as any,
    });

    _pdfQueue.on('error', (err) => {
      logger.error(err, 'BullMQ Queue Redis connection error');
    });
  }
  return _pdfQueue;
}

export class StatementService {
  static async uploadStatement(userId: string, file: Express.Multer.File, bankName: string) {
    const encryptedFileName = encrypt(file.originalname) as string;
    const encryptedFileUrl = file.path ? encrypt(file.path) : null;

    const statement = await prisma.statement.create({
      data: {
        userId,
        fileName: encryptedFileName,
        fileUrl: encryptedFileUrl,
        bankName: bankName || 'Unknown Bank',
        status: 'PENDING',
      },
    });

    try {
      const queue = getPdfQueue();
      await queue.add('process-pdf', {
        statementId: statement.id,
        userId: userId,
        filePath: file.path,
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      });
    } catch (redisErr) {
      logger.error(redisErr, 'Redis unavailable - cannot queue PDF processing');
      await prisma.statement.update({
        where: { id: statement.id },
        data: { status: 'FAILED', errorMessage: encrypt('Processing service temporarily unavailable') },
      });
      throw new Error('REDIS_UNAVAILABLE');
    }

    return statement.id;
  }

  static async getStatements(userId: string) {
    const statements = await prisma.statement.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return statements.map(s => ({
      ...s,
      fileName: decrypt(s.fileName) || '',
      fileUrl: s.fileUrl ? decrypt(s.fileUrl) || null : null,
      errorMessage: s.errorMessage ? decrypt(s.errorMessage) || null : null,
    }));
  }

  static async deleteStatement(userId: string, id: string) {
    const statement = await prisma.statement.findUnique({ where: { id } });
    if (!statement || statement.userId !== userId) {
      throw new Error('Statement not found');
    }

    await prisma.transaction.deleteMany({
      where: { statementId: id }
    });

    await prisma.statement.delete({
      where: { id }
    });
  }
}
