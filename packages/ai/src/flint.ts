import { DetectedIngredient, Recipe, type Challenge, type TasteProfile } from '@mise/schema';
import { z } from 'zod';
import { ModelUnavailableError, type ChefModel } from './index';
import { DETECT_SYSTEM, RECIPE_SYSTEM, recipeUser } from './prompts';

export interface FlintOptions {
  baseUrl: string;
  apiKey: string;
  model?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

const DEFAULT_MODEL = 'chef';
const DEFAULT_TIMEOUT_MS = 45_000;

const Completion = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string() }) })).min(1),
});

type Content = string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;

export function extractJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '');
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start < 0 || end < 0) throw new Error('Model returned no JSON object');
  return JSON.parse(trimmed.slice(start, end + 1));
}

/** OpenAI-compatible chat adapter for the Flint seam layer. Server-side only. */
export function createFlintChef(options: FlintOptions): ChefModel {
  const fetchImpl = options.fetchImpl ?? fetch;
  const model = options.model ?? DEFAULT_MODEL;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  async function chat(system: string, user: Content): Promise<unknown> {
    let response: Response;
    try {
      response = await fetchImpl(`${options.baseUrl.replace(/\/$/, '')}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${options.apiKey}` },
        body: JSON.stringify({
          model,
          temperature: 0.8,
          response_format: { type: 'json_object' },
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      throw new ModelUnavailableError(`Flint unreachable: ${(error as Error).message}`);
    }
    if (!response.ok) throw new ModelUnavailableError(`Flint responded ${response.status}`);
    const parsed = Completion.safeParse(await response.json());
    if (!parsed.success) throw new ModelUnavailableError('Flint returned an unexpected shape');
    return extractJson(parsed.data.choices[0]?.message.content ?? '');
  }

  return {
    async createRecipe({ challenge, labels, profile, fixes }) {
      const raw = extractRecipeShape(await chat(RECIPE_SYSTEM, recipeUser(challenge, labels, profile, fixes)));
      return Recipe.parse({ ...raw, source: 'ai' });
    },

    async detectIngredients({ imageBase64, mimeType }) {
      const raw = await chat(DETECT_SYSTEM, [
        { type: 'text', text: 'What food is in this photo?' },
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
      ]);
      const parsed = z.object({ ingredients: z.array(z.object({ name: z.string(), confidence: z.number().min(0).max(1) })) }).parse(raw);
      return parsed.ingredients.map((item) => DetectedIngredient.parse({ name: item.name, entryId: null, confidence: item.confidence }));
    },

  };
}

/** Models like to send null for optional ids; the schema wants them absent. */
function extractRecipeShape(raw: unknown): Record<string, unknown> {
  const record = (raw ?? {}) as Record<string, unknown>;
  const strip = (items: unknown, key: string) =>
    Array.isArray(items)
      ? items.map((item) => {
          const copy = { ...(item as Record<string, unknown>) };
          if (copy[key] === null) delete copy[key];
          return copy;
        })
      : items;
  const groups = Array.isArray(record.ingredientGroups)
    ? record.ingredientGroups.map((group) => {
        const copy = { ...(group as Record<string, unknown>) };
        copy.items = strip(strip(copy.items, 'entryId'), 'prep');
        return copy;
      })
    : record.ingredientGroups;
  return {
    ...record,
    ingredientGroups: groups,
    steps: strip(record.steps, 'equipmentId'),
    safetyNotes: Array.isArray(record.safetyNotes) ? record.safetyNotes : [],
    alternatives: Array.isArray(record.alternatives) ? record.alternatives.slice(0, 3) : [],
    equipment: Array.isArray(record.equipment) ? record.equipment : [],
    tips: Array.isArray(record.tips) ? record.tips : [],
    substitutions: Array.isArray(record.substitutions) ? record.substitutions : [],
    storage: typeof record.storage === 'string' ? record.storage : '',
  };
}

/** Used when FLINT_* env is unset. Every call fails fast so routes fall back to rules. */
export function createUnavailableChef(): ChefModel {
  const fail = async () => {
    throw new ModelUnavailableError();
  };
  return { createRecipe: fail, detectIngredients: fail };
}

export type { Challenge, TasteProfile };
