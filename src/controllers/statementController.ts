import { Response } from 'express';
import { StatementService } from '../services/statementService';
import { serializePrisma } from '../utils/serializer';
import { logger } from '../utils/logger';

export const uploadStatement = async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { bankName } = req.body;
    const statementId = await StatementService.uploadStatement(req.user.id, req.file, bankName);

    return res.status(202).json({
      message: 'Statement uploaded and queued for processing',
      statementId,
    });
  } catch (error: any) {
    logger.error(error, 'Upload Error');
    if (error.message === 'REDIS_UNAVAILABLE') {
      return res.status(503).json({
        error: 'PDF processing service is temporarily unavailable. Please try again later.'
      });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getStatements = async (req: any, res: Response) => {
  try {
    const data = await StatementService.getStatements(req.user.id);
    return res.json(serializePrisma(data));
  } catch (error) {
    logger.error(error, 'Fetch Statements Error');
    return res.status(500).json({ error: 'Failed to fetch statements' });
  }
};

export const deleteStatement = async (req: any, res: Response) => {
  try {
    await StatementService.deleteStatement(req.user.id, req.params.id);
    return res.json({ message: 'Statement deleted successfully' });
  } catch (error: any) {
    logger.error(error, 'Delete Statement Error');
    if (error.message === 'Statement not found') {
      return res.status(404).json({ error: 'Statement not found' });
    }
    return res.status(500).json({ error: 'Failed to delete statement' });
  }
};
