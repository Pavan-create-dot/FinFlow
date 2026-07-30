import { z } from 'zod';

export const createGoalSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  targetAmount: z.number().positive('Target amount must be positive'),
  currentAmount: z.number().min(0, 'Current amount must be positive or zero').optional(),
  deadline: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).nullable().optional(),
});

export const updateGoalProgressSchema = z.object({
  currentAmount: z.number().min(0, 'Current amount must be positive or zero'),
  mode: z.enum(['add', 'set']).optional(),
});

export type CreateGoalDto = z.infer<typeof createGoalSchema>;
export type UpdateGoalProgressDto = z.infer<typeof updateGoalProgressSchema>;
