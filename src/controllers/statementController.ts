import { Request, Response } from 'express';
import { Queue } from 'bullmq';
import { serializePrisma } from '../utils/serializer';
import { encrypt, decrypt } from '../utils/encryption';
import { prisma } from '../lib/prisma';
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

export const uploadStatement = async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { bankName } = req.body;
    const userId = req.user.id;

    // 1. Create DB record for the statement (with encrypted details)
    const encryptedFileName = encrypt(req.file.originalname) as string;
    const encryptedFileUrl = req.file.path ? encrypt(req.file.path) : null;

    const statement = await prisma.statement.create({
      data: {
        userId,
        fileName: encryptedFileName,
        fileUrl: encryptedFileUrl,
        bankName: bankName || 'Unknown Bank',
        status: 'PENDING',
      },
    });

    // 2. Add to BullMQ for processing
    try {
      const queue = getPdfQueue();
      await queue.add('process-pdf', {
        statementId: statement.id,
        userId: userId,
        filePath: req.file.path,
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
        data: { status: 'FAILED', errorMessage: 'Processing service temporarily unavailable' },
      });
      return res.status(503).json({
        error: 'PDF processing service is temporarily unavailable. Please try again later.',
        statementId: statement.id,
      });
    }

    return res.status(202).json({
      message: 'Statement uploaded and queued for processing',
      statementId: statement.id,
    });
  } catch (error) {
    logger.error(error, 'Upload Error');
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getStatements = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const statements = await prisma.statement.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const decryptedStatements = statements.map(s => ({
      ...s,
      fileName: decrypt(s.fileName) || '',
      fileUrl: s.fileUrl ? decrypt(s.fileUrl) || null : null,
      errorMessage: s.errorMessage ? decrypt(s.errorMessage) || null : null,
    }));

    return res.json(serializePrisma(decryptedStatements));
  } catch (error) {
    logger.error(error, 'Fetch Statements Error');
    return res.status(500).json({ error: 'Failed to fetch statements' });
  }
};
