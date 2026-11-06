import type {
  Challenge,
  DetectedIngredient,
  Recipe,
  TasteProfile,
} from '@mise/schema';

/**
 * Mise talks to models only through this interface. The production adapter
 * wraps Flint; tests use a fake. Server-side only: never import from apps/mobile.
 */
export interface ChefModel {
  /** Recipe for a spun challenge. Output is validated against the Recipe schema + rule checks. */
  createRecipe(input: {
    challenge: Challenge;
    labels: Record<string, string>;
    profile?: TasteProfile;
    /** Validation messages from a failed attempt, fed back for one retry. */
    fixes?: string[];
  }): Promise<Recipe>;
  /** Fridge Snap: list what is visible. The user confirms the list before use. */
  detectIngredients(input: {
    imageBase64: string;
    mimeType: 'image/jpeg' | 'image/png';
  }): Promise<DetectedIngredient[]>;
}

export class ModelUnavailableError extends Error {
  constructor(message = 'AI chef is unavailable') {
    super(message);
    this.name = 'ModelUnavailableError';
  }
}

export { createFlintChef, createUnavailableChef, extractJson, type FlintOptions } from './flint';
