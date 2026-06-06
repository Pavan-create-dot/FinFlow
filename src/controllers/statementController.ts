import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';
import { serializePrisma } from '../utils/serializer';
import { encrypt, decrypt } from '../utils/encryption';

const prisma = new PrismaClient();
const pdfQueue = new Queue('pdf-processing', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

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

    // 2. Add to BullMQ for processing (use raw local path so the worker can read the file)
    await pdfQueue.add('process-pdf', {
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

    return res.status(202).json({
      message: 'Statement uploaded and queued for processing',
      statementId: statement.id,
    });
  } catch (error) {
    console.error('Upload Error:', error);
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
    console.error('Fetch Statements Error:', error);
    return res.status(500).json({ error: 'Failed to fetch statements' });
  }
};
