import { ModelUnavailableError, type ChefModel } from '@mise/ai';
import { rulesRecipe, validateRecipe, withSafetyNotes, type ValidationIssue } from '@mise/engine';
import type { Challenge, Recipe, TasteProfile } from '@mise/schema';
import { challengeLabels } from './labels';

export const MAX_ATTEMPTS = 2;

export interface RecipeOutcome {
  recipe: Recipe;
  attempts: number;
  /** Why the last AI attempt was rejected, if the result fell back to rules. */
  issues: ValidationIssue[];
  fallbackReason: 'none' | 'ai-unavailable' | 'validation-failed';
}

/**
 * AI → validate → one retry with the issues fed back → rules fallback.
 * Safety notes always come from the engine table, never from the model.
 */
export async function generateRecipe(chef: ChefModel, challenge: Challenge, profile?: TasteProfile): Promise<RecipeOutcome> {
  const labels = challengeLabels(challenge);
  let issues: ValidationIssue[] = [];
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let candidate: Recipe;
    try {
      candidate = await chef.createRecipe({ challenge, labels, profile, fixes: issues.map((issue) => issue.message) });
    } catch (error) {
      if (error instanceof ModelUnavailableError) {
        return { recipe: rulesRecipe(challenge), attempts: attempt, issues: [], fallbackReason: 'ai-unavailable' };
      }
      issues = [{ code: 'safety-note', message: `Malformed recipe: ${(error as Error).message}` }];
      continue;
    }
    const recipe = withSafetyNotes(candidate, challenge);
    issues = validateRecipe(recipe, challenge);
    if (issues.length === 0) return { recipe, attempts: attempt, issues: [], fallbackReason: 'none' };
  }
  return { recipe: rulesRecipe(challenge), attempts: MAX_ATTEMPTS, issues, fallbackReason: 'validation-failed' };
}
