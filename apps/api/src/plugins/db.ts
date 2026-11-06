import fp from 'fastify-plugin';
import { createDb, type Db } from '../lib/db';

declare module 'fastify' {
  interface FastifyInstance {
    db: Db;
  }
}

export const dbPlugin = fp(async (app, options: { connectionString: string; db?: Db }) => {
  const db = options.db ?? createDb(options.connectionString);
  app.decorate('db', db);
  app.addHook('onClose', async () => {
    await db.$disconnect();
  });
});
