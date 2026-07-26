import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { logger } from '../utils/logger';

export const register = async (req: Request, res: Response) => {
  try {
    const result = await AuthService.register(req.body);
    return res.status(201).json(result);
  } catch (error: any) {
    logger.error(error, 'Register Error');
    return res.status(400).json({ error: error.message || 'User already exists' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const result = await AuthService.login(req.body);
    return res.json(result);
  } catch (error: any) {
    logger.error(error, 'Login Error');
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
