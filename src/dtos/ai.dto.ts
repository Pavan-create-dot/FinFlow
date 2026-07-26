import { z } from 'zod';

export const chatWithAISchema = z.object({
  message: z.string().min(1, 'Message is required'),
  history: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().min(1),
    })
  ).optional(),
});

export type ChatWithAIDto = z.infer<typeof chatWithAISchema>;
