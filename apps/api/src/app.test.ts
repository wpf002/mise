import { ModelUnavailableError, type ChefModel } from '@mise/ai';
import { sampleChallenge, sampleRecipe } from '@mise/engine';
import { describe, expect, it } from 'vitest';
import { buildApp } from './app';
import type { Db } from './lib/db';

const env = {
  NODE_ENV: 'test' as const, PORT: 0, HOST: '127.0.0.1', DATABASE_URL: 'postgresql://x', CORS_ORIGINS: [],
  JWT_SECRET: 'x'.repeat(48), FLINT_BASE_URL: '', FLINT_API_KEY: undefined, FLINT_MODEL: undefined, MAX_UPLOAD_MB: 8,
};

function fakeDb() {
  const rows = new Map<string, Record<string, unknown>>();
  return {
    challenge: {
      upsert: async ({ where, create }: { where: { id: string }; create: Record<string, unknown> }) => {
        rows.set(where.id, { ...create, createdAt: new Date() });
        return rows.get(where.id);
      },
      findUnique: async ({ where }: { where: { id: string } }) => rows.get(where.id) ?? null,
    },
    $disconnect: async () => undefined,
  } as unknown as Db;
}

const fail = async () => { throw new ModelUnavailableError(); };

describe('api', () => {
  it('spins, saves, and reads back a challenge', async () => {
    const app = await buildApp(env, { db: fakeDb(), chef: { createRecipe: fail, detectIngredients: fail } });
    const created = await app.inject({ method: 'POST', url: '/challenges', payload: { config: sampleChallenge().config } });
    expect(created.statusCode).toBe(201);
    const challenge = created.json();
    expect(Object.keys(challenge.slots)).toHaveLength(4);
    const read = await app.inject({ method: 'GET', url: `/challenges/${challenge.id}` });
    expect(read.statusCode).toBe(200);
    expect(read.json().seed).toBe(challenge.seed);
    await app.close();
  });

  it('serves a rules recipe when the chef is down and 503s snap', async () => {
    const app = await buildApp(env, { db: fakeDb(), chef: { createRecipe: fail, detectIngredients: fail } });
    const recipe = await app.inject({ method: 'POST', url: '/recipes', payload: { challenge: sampleChallenge() } });
    expect(recipe.statusCode).toBe(200);
    expect(recipe.json().recipe.source).toBe('rules');
    const snap = await app.inject({ method: 'POST', url: '/snap', payload: { imageBase64: 'AA==', mimeType: 'image/jpeg' } });
    expect(snap.statusCode).toBe(503);
    await app.close();
  });

  it('returns the AI recipe when it validates', async () => {
    const chef: ChefModel = { createRecipe: async () => sampleRecipe(), detectIngredients: fail };
    const app = await buildApp(env, { db: fakeDb(), chef });
    const recipe = await app.inject({ method: 'POST', url: '/recipes', payload: { challenge: sampleChallenge() } });
    expect(recipe.json().recipe.title).toContain('Brown Butter');
    await app.close();
  });

  it('rejects bad bodies', async () => {
    const app = await buildApp(env, { db: fakeDb(), chef: { createRecipe: fail, detectIngredients: fail } });
    const bad = await app.inject({ method: 'POST', url: '/challenges', payload: { config: { categories: ['protein'] } } });
    expect(bad.statusCode).toBe(400);
    await app.close();
  });
});
