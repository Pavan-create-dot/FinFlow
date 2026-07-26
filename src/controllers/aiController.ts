import { Response } from 'express';
import { AIService } from '../services/aiService';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middlewares/auth';

export const getFinancialInsights = async (req: AuthRequest, res: Response) => {
  try {
    const insights = await AIService.getUserFinancialInsights(req.user!.id);
    return res.json(insights);
  } catch (error) {
    logger.error(error, 'Insights API Error');
    return res.status(500).json({ error: 'Failed to generate insights' });
  }
};

export const chatWithAI = async (req: AuthRequest, res: Response) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const data = await AIService.handleUserChat(req.user!.id, message, history);
    return res.json(data);
  } catch (error) {
    logger.error(error, 'AI Chat Controller Error');
    return res.status(500).json({ error: 'Failed to process AI chat message' });
  }
};
