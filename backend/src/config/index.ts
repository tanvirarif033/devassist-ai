import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRE: z.string().default('7d'),
  OPENROUTER_API_KEY: z.string(),
  OPENROUTER_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error('❌ Invalid environment variables:', env.error.format());
  process.exit(1);
}

export const config = {
  env: env.data.NODE_ENV,
  port: parseInt(env.data.PORT),
  databaseUrl: env.data.DATABASE_URL,
  jwt: {
    secret: env.data.JWT_SECRET,
    expire: env.data.JWT_EXPIRE,
  },
  openRouter: {
    apiKey: env.data.OPENROUTER_API_KEY,
    baseUrl: env.data.OPENROUTER_BASE_URL,
  },
  rateLimit: {
    windowMs: parseInt(env.data.RATE_LIMIT_WINDOW_MS),
    max: parseInt(env.data.RATE_LIMIT_MAX_REQUESTS),
  },
};

export type Config = typeof config;