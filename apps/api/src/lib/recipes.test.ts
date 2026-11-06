import type { ChefModel } from '@mise/ai';
import { ModelUnavailableError } from '@mise/ai';
import { createChallenge, DEFAULT_CONFIG, sampleChallenge, sampleRecipe } from '@mise/engine';
import { describe, expect, it } from 'vitest';
import { generateRecipe } from './recipes';

const never = async () => {
  throw new Error('not used');
};

describe('generateRecipe', () => {
  it('returns the AI recipe when it validates', async () => {
    const chef: ChefModel = { createRecipe: async () => sampleRecipe(), detectIngredients: never, judge: never };
    const outcome = await generateRecipe(chef, sampleChallenge());
    expect(outcome.fallbackReason).toBe('none');
    expect(outcome.recipe.source).toBe('demo');
    expect(outcome.attempts).toBe(1);
  });

  it('retries once with issues, then falls back to rules', async () => {
    const challenge = createChallenge({ ...DEFAULT_CONFIG, timeLimitMinutes: 20 }, 'abc');
    const fixes: string[][] = [];
    const chef: ChefModel = {
      createRecipe: async ({ fixes: given }) => {
        fixes.push(given ?? []);
        return { ...sampleRecipe(), totalMinutes: 99, source: 'ai' };
      },
      detectIngredients: never,
      judge: never,
    };
    const outcome = await generateRecipe(chef, challenge);
    expect(fixes).toHaveLength(2);
    expect(fixes[1]?.some((fix) => fix.includes('limit'))).toBe(true);
    expect(outcome.fallbackReason).toBe('validation-failed');
    expect(outcome.recipe.source).toBe('rules');
  });

  it('falls back immediately when the model is unavailable', async () => {
    const chef: ChefModel = { createRecipe: async () => { throw new ModelUnavailableError(); }, detectIngredients: never, judge: never };
    const outcome = await generateRecipe(chef, sampleChallenge());
    expect(outcome.fallbackReason).toBe('ai-unavailable');
    expect(outcome.recipe.source).toBe('rules');
    expect(outcome.recipe.safetyNotes.join(' ')).toContain('160°F');
  });
});
