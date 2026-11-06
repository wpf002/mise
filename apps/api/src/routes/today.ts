import { createChallenge, dailyConfig, dailySeed, dayKey } from '@mise/engine';
import { TasteProfile } from '@mise/schema';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { generateRecipe } from '../lib/recipes';

const Body = z.object({
  deviceId: z.string().min(8).max(64),
  timeZone: z.string().min(1),
  profile: TasteProfile.nullable(),
  /** "Not Feeling It" swaps once per day by bumping this to 1. */
  swap: z.number().int().min(0).max(1).default(0),
});

export const todayRoutes: FastifyPluginAsync = async (app) => {
  /** Deterministic per device per day. The phone caches the result; this is safe to call again. */
  app.post('/today', async (request, reply) => {
    const body = Body.safeParse(request.body);
    if (!body.success) return reply.badRequest(z.prettifyError(body.error));
    let day: string;
    try {
      day = dayKey(new Date(), body.data.timeZone);
    } catch {
      return reply.badRequest('Unknown time zone');
    }
    const seed = dailySeed(`${body.data.deviceId}:${body.data.swap}`, day);
    const challenge = createChallenge(dailyConfig(body.data.profile), seed);
    const outcome = await generateRecipe(app.chef, challenge, body.data.profile ?? undefined);
    return { day, challenge, ...outcome };
  });
};
