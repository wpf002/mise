import { z } from 'zod';

const Env = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(4000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().url(),
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((s) =>
      s
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
    ),
  JWT_SECRET: z.string().min(48, 'JWT_SECRET must be at least 48 characters'),
  FLINT_BASE_URL: z.string().url().optional().or(z.literal('')),
  FLINT_API_KEY: z.string().optional(),
  FLINT_MODEL: z.string().optional(),
  MAX_UPLOAD_MB: z.coerce.number().positive().max(20).default(8),
});

export type Env = z.infer<typeof Env>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = Env.safeParse(source);
  if (!parsed.success) {
    console.error('Invalid environment:', z.flattenError(parsed.error).fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}
