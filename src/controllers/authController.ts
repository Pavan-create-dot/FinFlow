import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateTokens } from '../middlewares/auth';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  const { email, password, firstName, lastName } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName
      }
    });

    // Never return the hashed password to the client
    const { passwordHash, ...safeUser } = user;
    const tokens = generateTokens({ id: user.id, email: user.email });
    return res.status(201).json({ user: safeUser, ...tokens });
  } catch (error) {
    return res.status(400).json({ error: 'User already exists' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Never return the hashed password to the client
    const { passwordHash, ...safeUser } = user;
    const tokens = generateTokens({ id: user.id, email: user.email });
    return res.json({ user: safeUser, ...tokens });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
