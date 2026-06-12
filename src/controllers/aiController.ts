import { Response } from 'express';
import { AIService } from '../services/aiService';
import { decrypt } from '../utils/encryption';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

export const getFinancialInsights = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    // Fetch last 100 transactions for context
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 100,
      select: {
        amount: true,
        description: true,
        date: true,
        type: true,
        merchantName: true,
      }
    });

    if (transactions.length === 0) {
      return res.json({ message: "Upload some statements first to get AI insights!" });
    }

    // Convert BigInt to Number for JSON
    const serializedData = transactions.map(t => ({
      ...t,
      description: decrypt(t.description) || '',
      merchantName: t.merchantName ? decrypt(t.merchantName) || null : null,
      amount: Number(t.amount) / 100 // Convert paise to currency
    }));

    const insights = await AIService.generateInsights(serializedData);
    return res.json(insights);
  } catch (error) {
    logger.error(error, 'Insights API Error');
    return res.status(500).json({ error: 'Failed to generate insights' });
  }
};
