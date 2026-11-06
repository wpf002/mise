import { ModelUnavailableError } from '@mise/ai';
import { matchEntry } from '@mise/engine';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const Body = z.object({
  imageBase64: z.string().min(1),
  mimeType: z.enum(['image/jpeg', 'image/png']),
});

export const snapRoutes: FastifyPluginAsync = async (app) => {
  /** Photo in, detected ingredients out. Nothing is stored. */
  app.post('/snap', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } }, bodyLimit: 12 * 1024 * 1024 }, async (request, reply) => {
    const body = Body.safeParse(request.body);
    if (!body.success) return reply.badRequest(z.prettifyError(body.error));
    try {
      const detected = await app.chef.detectIngredients(body.data);
      return {
        ingredients: detected.map((item) => ({ ...item, entryId: item.entryId ?? matchEntry(item.name)?.id ?? null })),
      };
    } catch (error) {
      if (error instanceof ModelUnavailableError) return reply.serviceUnavailable('Fridge Snap needs the AI chef, which is offline right now.');
      throw error;
    }
  });
};
