import { createChallenge, EmptyWheelError, newSeed } from '@mise/engine';
import { Challenge, ChallengeConfig, CategoryId, SlotState } from '@mise/schema';
import type { FastifyPluginAsync } from 'fastify';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';

const CreateBody = z.object({
  config: ChallengeConfig,
  seed: z.string().regex(/^[0-9a-f]{16}$/).optional(),
  previous: z.partialRecord(CategoryId, SlotState).optional(),
});

const SaveBody = Challenge;

export const challengeRoutes: FastifyPluginAsync = async (app) => {
  /** Spin on the server (competitive seeds are minted here) and persist for share links. */
  app.post('/challenges', async (request, reply) => {
    const body = CreateBody.safeParse(request.body);
    if (!body.success) return reply.badRequest(z.prettifyError(body.error));
    const seed = body.data.seed ?? newSeed((n) => new Uint8Array(randomBytes(n)));
    try {
      const challenge = createChallenge(body.data.config, seed, body.data.previous ?? {});
      await app.db.challenge.upsert({
        where: { id: challenge.id },
        create: { id: challenge.id, seed, libraryVersion: challenge.libraryVersion, config: challenge.config, slots: challenge.slots },
        update: { slots: challenge.slots },
      });
      return reply.code(201).send(challenge);
    } catch (error) {
      if (error instanceof EmptyWheelError) return reply.unprocessableEntity(error.message);
      throw error;
    }
  });

  /** Save a challenge spun on-device so its link resolves for friends. */
  app.put('/challenges/:id', async (request, reply) => {
    const body = SaveBody.safeParse(request.body);
    if (!body.success) return reply.badRequest(z.prettifyError(body.error));
    const { id } = request.params as { id: string };
    if (id !== body.data.id) return reply.badRequest('id mismatch');
    const challenge = body.data;
    await app.db.challenge.upsert({
      where: { id },
      create: { id, seed: challenge.seed, libraryVersion: challenge.libraryVersion, config: challenge.config, slots: challenge.slots },
      update: { slots: challenge.slots },
    });
    return challenge;
  });

  app.get('/challenges/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const row = await app.db.challenge.findUnique({ where: { id } });
    if (!row) return reply.notFound('Challenge not found');
    return Challenge.parse({
      id: row.id,
      seed: row.seed,
      libraryVersion: row.libraryVersion,
      config: row.config,
      slots: row.slots,
      createdAt: row.createdAt.toISOString(),
    });
  });
};
