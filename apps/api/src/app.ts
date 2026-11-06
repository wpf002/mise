import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import multipart from '@fastify/multipart';
import jwt from '@fastify/jwt';
import type { ChefModel } from '@mise/ai';
import type { Env } from './env';
import type { Db } from './lib/db';
import { chefPlugin } from './plugins/chef';
import { dbPlugin } from './plugins/db';
import { challengeRoutes } from './routes/challenges';
import { healthRoutes } from './routes/health';
import { judgeRoutes } from './routes/judge';
import { recipeRoutes } from './routes/recipes';
import { snapRoutes } from './routes/snap';
import { todayRoutes } from './routes/today';

export interface AppOverrides {
  chef?: ChefModel;
  db?: Db;
}

export async function buildApp(env: Env, overrides: AppOverrides = {}) {
  const app = Fastify({
    logger:
      env.NODE_ENV === 'test'
        ? false
        : env.NODE_ENV === 'development'
          ? { transport: { target: 'pino-pretty' } }
          : { redact: ['req.headers.authorization', 'req.headers.cookie'] },
    bodyLimit: 1_048_576,
    trustProxy: true,
  });

  await app.register(helmet);
  await app.register(cors, { origin: env.CORS_ORIGINS.length ? env.CORS_ORIGINS : false });
  await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });
  await app.register(sensible);
  await app.register(jwt, { secret: env.JWT_SECRET, sign: { expiresIn: '15m' } });
  await app.register(multipart, {
    limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 1, fields: 10 },
  });

  await app.register(dbPlugin, { connectionString: env.DATABASE_URL, db: overrides.db });
  await app.register(chefPlugin, { env, chef: overrides.chef });

  await app.register(healthRoutes);
  await app.register(challengeRoutes);
  await app.register(recipeRoutes);
  await app.register(snapRoutes);
  await app.register(judgeRoutes);
  await app.register(todayRoutes);
  return app;
}
