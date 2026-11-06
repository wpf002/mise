import type { FastifyPluginAsync } from 'fastify';
import { LIBRARY_VERSION } from '@mise/engine';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', async () => ({ ok: true, libraryVersion: LIBRARY_VERSION }));
};
