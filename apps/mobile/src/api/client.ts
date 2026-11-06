import { Challenge, DetectedIngredient, JudgeResult, Recipe, type TasteProfile } from '@mise/schema';
import { z } from 'zod';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');
const RECIPE_TIMEOUT_MS = 60_000;
const DEFAULT_TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export class OfflineError extends Error {
  constructor() {
    super('Could not reach the Mise API');
    this.name = 'OfflineError';
  }
}

async function post<T>(path: string, body: unknown, schema: z.ZodType<T>, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new OfflineError();
  }
  const json = (await response.json().catch(() => ({}))) as { message?: string };
  if (!response.ok) throw new ApiError(response.status, json.message ?? `Request failed (${response.status})`);
  return schema.parse(json);
}

const ValidationIssue = z.object({ code: z.string(), message: z.string() });
export const RecipeOutcome = z.object({
  recipe: Recipe,
  attempts: z.number(),
  issues: z.array(ValidationIssue),
  fallbackReason: z.enum(['none', 'ai-unavailable', 'validation-failed']),
});
export type RecipeOutcome = z.infer<typeof RecipeOutcome>;

export const api = {
  recipe: (challenge: Challenge, profile?: TasteProfile) =>
    post('/recipes', { challenge, profile }, RecipeOutcome, RECIPE_TIMEOUT_MS),

  snap: (imageBase64: string, mimeType: 'image/jpeg' | 'image/png') =>
    post('/snap', { imageBase64, mimeType }, z.object({ ingredients: z.array(DetectedIngredient) }), RECIPE_TIMEOUT_MS),

  judge: (input: { challenge: Challenge; dishName: string; description: string; notes?: string; imageBase64?: string }) =>
    post('/judge', input, JudgeResult, RECIPE_TIMEOUT_MS),

  today: (deviceId: string, timeZone: string, profile: TasteProfile | null, swap: 0 | 1) =>
    post('/today', { deviceId, timeZone, profile, swap }, RecipeOutcome.extend({ day: z.string(), challenge: Challenge }), RECIPE_TIMEOUT_MS),

  getChallenge: async (id: string): Promise<Challenge | null> => {
    try {
      const response = await fetch(`${API_URL}/challenges/${id}`, { signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS) });
      if (!response.ok) return null;
      return Challenge.parse(await response.json());
    } catch {
      return null;
    }
  },

  saveChallenge: async (challenge: Challenge) => {
    try {
      await fetch(`${API_URL}/challenges/${challenge.id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(challenge),
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      });
    } catch {
      // Sharing a link is best-effort; the seed is in the link so the receiver can re-spin locally.
    }
  },
};
