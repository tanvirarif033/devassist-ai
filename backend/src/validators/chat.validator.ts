import { z } from 'zod';

export const createChatSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(100),
    agentType: z.enum(['code_review', 'bug_fix', 'sql_generator']),
  }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    message: z.string().min(1).max(10000),
  }),
  params: z.object({
    id: z.string().uuid('Invalid chat ID'),
  }),
});