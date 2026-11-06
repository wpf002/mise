import { createFlintChef, createUnavailableChef, type ChefModel } from '@mise/ai';
import fp from 'fastify-plugin';
import type { Env } from '../env';

declare module 'fastify' {
  interface FastifyInstance {
    chef: ChefModel;
  }
}

export const chefPlugin = fp(async (app, options: { env: Env; chef?: ChefModel }) => {
  const { env } = options;
  const chef = options.chef ?? (env.FLINT_BASE_URL && env.FLINT_API_KEY
    ? createFlintChef({ baseUrl: env.FLINT_BASE_URL, apiKey: env.FLINT_API_KEY, model: env.FLINT_MODEL })
    : createUnavailableChef());
  if (!options.chef && !(env.FLINT_BASE_URL && env.FLINT_API_KEY)) {
    app.log.warn('FLINT_BASE_URL/FLINT_API_KEY unset: recipes use the rules fallback, snap returns 503');
  }
  app.decorate('chef', chef);
});
