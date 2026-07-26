import { z } from 'zod';

export const createTransactionSchema = z.object({
  date: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  amount: z.number().int().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['INCOME', 'EXPENSE']),
  categoryId: z.string().nullable().optional(),
  merchantName: z.string().nullable().optional(),
  isSubscription: z.boolean().optional(),
});

export const updateTransactionSchema = z.object({
  categoryId: z.string().nullable().optional(),
});

export const saveBudgetSchema = z.object({
  categoryId: z.string().min(1, 'Category ID is required'),
  amount: z.number().int().positive('Amount must be positive'),
});
export type CreateTransactionDto = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionDto = z.infer<typeof updateTransactionSchema>;
export type SaveBudgetDto = z.infer<typeof saveBudgetSchema>;
