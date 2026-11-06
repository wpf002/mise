import { Challenge, TasteProfile } from '@mise/schema';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { generateRecipe } from '../lib/recipes';

const Body = z.object({ challenge: Challenge, profile: TasteProfile.optional() });

export const recipeRoutes: FastifyPluginAsync = async (app) => {
  app.post('/recipes', { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, async (request, reply) => {
    const body = Body.safeParse(request.body);
    if (!body.success) return reply.badRequest(z.prettifyError(body.error));
    const outcome = await generateRecipe(app.chef, body.data.challenge, body.data.profile);
    if (outcome.fallbackReason !== 'none') {
      request.log.info({ reason: outcome.fallbackReason, issues: outcome.issues }, 'recipe fell back to rules');
    }
    return outcome;
  });
};
