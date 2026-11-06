import { ModelUnavailableError } from '@mise/ai';
import { Challenge } from '@mise/schema';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { challengeLabels } from '../lib/labels';

const Body = z.object({
  challenge: Challenge,
  dishName: z.string().min(1).max(120),
  description: z.string().min(1).max(2000),
  notes: z.string().max(2000).optional(),
  imageBase64: z.string().optional(),
});

export const judgeRoutes: FastifyPluginAsync = async (app) => {
  app.post('/judge', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } }, bodyLimit: 12 * 1024 * 1024 }, async (request, reply) => {
    const body = Body.safeParse(request.body);
    if (!body.success) return reply.badRequest(z.prettifyError(body.error));
    try {
      return await app.chef.judge({ ...body.data, labels: challengeLabels(body.data.challenge) });
    } catch (error) {
      if (error instanceof ModelUnavailableError) return reply.serviceUnavailable('Judging needs the AI chef, which is offline right now.');
      throw error;
    }
  });
};
