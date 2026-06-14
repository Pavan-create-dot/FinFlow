import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_HOST: z.string().min(1).optional(),
  REDIS_PORT: z.string().regex(/^\d+$/).optional(),
  REDIS_URL: z.string().optional(),
  GEMINI_API_KEY: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  ENCRYPTION_SECRET: z.string().min(32),
  PORT: z.string().regex(/^\d+$/).optional().default('3000'),
  FRONTEND_URL: z.string().url().optional()
});

const _env = envSchema.safeParse(process.env);

if (!_env.success && process.env.NODE_ENV !== 'test') {
  console.error('❌ Invalid environment variables:\n', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
