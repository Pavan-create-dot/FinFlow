import { z } from 'zod';

export const uploadStatementSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
});

export type UploadStatementDto = z.infer<typeof uploadStatementSchema>;
