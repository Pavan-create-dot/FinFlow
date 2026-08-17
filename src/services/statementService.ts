import { Queue } from 'bullmq';
import { Statement } from '../models/Statement';
import { Transaction } from '../models/Transaction';
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

    const statement = await Statement.create({
      userId,
      fileName: encryptedFileName,
      fileUrl: encryptedFileUrl,
      bankName: bankName || 'Unknown Bank',
      status: 'PENDING',
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
      await Statement.findByIdAndUpdate(statement.id, {
        status: 'FAILED',
        errorMessage: encrypt('Processing service temporarily unavailable'),
      });
      throw new Error('REDIS_UNAVAILABLE', { cause: redisErr });
    }

    return statement.id;
  }

  static async getStatements(userId: string) {
    const statements = await Statement.find({ userId }).sort({ createdAt: -1 });

    return statements.map(s => {
      const json = s.toJSON();
      return {
        ...json,
        fileName: decrypt(json.fileName) || '',
        fileUrl: json.fileUrl ? decrypt(json.fileUrl) || null : null,
        errorMessage: json.errorMessage ? decrypt(json.errorMessage) || null : null,
      };
    });
  }

  static async deleteStatement(userId: string, id: string) {
    const statement = await Statement.findOne({ _id: id, userId });
    if (!statement) {
      throw new Error('Statement not found');
    }

    await Transaction.deleteMany({ statementId: id });
    await Statement.deleteOne({ _id: id });
  }
}
