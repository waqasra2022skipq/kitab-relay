import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  DATABASE_URL: z.string().url(),
  WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
});

export type Environment = z.infer<typeof envSchema>;

export function validateEnvironment(env: Record<string, unknown>): Environment {
  return envSchema.parse(env);
}