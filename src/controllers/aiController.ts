import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AIService } from '../services/aiService';

const prisma = new PrismaClient();

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
      amount: Number(t.amount) / 100 // Convert paise to currency
    }));

    const insights = await AIService.generateInsights(serializedData);
    return res.json(insights);
  } catch (error) {
    console.error('Insights API Error:', error);
    return res.status(500).json({ error: 'Failed to generate insights' });
  }
};
