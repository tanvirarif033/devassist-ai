import { z } from 'zod';

export const agentRequestSchema = z.object({
  body: z.object({
    code: z.string().optional(),
    error: z.string().optional(),
    query: z.string().optional(),
    context: z.string().optional(),
    language: z.string().optional(),
  }),
});