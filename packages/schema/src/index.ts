import { z } from 'zod';

/** The eight randomizer categories. Order is the default wheel order. */
export const CATEGORY_IDS = [
  'protein',
  'produce',
  'equipment',
  'style',
  'cuisine',
  'wildcard',
  'format',
  'flavor',
] as const;
export const CategoryId = z.enum(CATEGORY_IDS);
export type CategoryId = z.infer<typeof CategoryId>;

export const Allergen = z.enum([
  'milk',
  'egg',
  'fish',
  'shellfish',
  'tree-nut',
  'peanut',
  'wheat',
  'soy',
  'sesame',
]);
export type Allergen = z.infer<typeof Allergen>;

export const Diet = z.enum([
  'vegetarian',
  'vegan',
  'pescatarian',
  'gluten-free',
  'dairy-free',
  'halal',
  'kosher',
]);
export type Diet = z.infer<typeof Diet>;

export const Difficulty = z.enum(['easy', 'standard', 'master']);
export type Difficulty = z.infer<typeof Difficulty>;

export const Mode = z.enum([
  'free-play',
  'quickfire',
  'standard',
  'master',
  'mystery-basket',
  'head-to-head',
  'kitchen-chaos',
]);
export type Mode = z.infer<typeof Mode>;

export const SlotState = z.object({
  entryId: z.string(),
  locked: z.boolean(),
  rerolls: z.number().int().nonnegative(),
});
export type SlotState = z.infer<typeof SlotState>;

export const ChallengeConfig = z.object({
  categories: z.array(CategoryId).min(2).max(8),
  difficulty: Difficulty,
  chaos: z.number().min(0).max(1),
  mode: Mode,
  excludeAllergens: z.array(Allergen),
  diets: z.array(Diet),
  excludeEntryIds: z.array(z.string()),
  availableEquipmentIds: z.array(z.string()).nullable(),
  pantryEntryIds: z.array(z.string()),
});
export type ChallengeConfig = z.infer<typeof ChallengeConfig>;

export const Challenge = z.object({
  id: z.string(),
  seed: z.string(),
  libraryVersion: z.string(),
  config: ChallengeConfig,
  slots: z.partialRecord(CategoryId, SlotState),
  createdAt: z.string().datetime(),
});
export type Challenge = z.infer<typeof Challenge>;

export const RecipeIngredient = z.object({
  name: z.string(),
  /** Precise amount: "1 lb", "2 tbsp", "1 medium". */
  quantity: z.string(),
  /** How it is cut or readied: "cut into 1-inch cubes", "minced". */
  prep: z.string().optional(),
  mandatory: z.boolean(),
  entryId: z.string().optional(),
});
export type RecipeIngredient = z.infer<typeof RecipeIngredient>;

/** Ingredients grouped by component: "For the pork", "For the glaze", "To serve". */
export const IngredientGroup = z.object({
  title: z.string(),
  items: z.array(RecipeIngredient).min(1),
});
export type IngredientGroup = z.infer<typeof IngredientGroup>;

export const RecipeStep = z.object({
  /** Short imperative headline: "Sear the chicken". */
  title: z.string(),
  /** The full instruction: heat level, times, temperatures, and what done looks like. */
  text: z.string(),
  durationMinutes: z.number().int().positive(),
  equipmentId: z.string().optional(),
});
export type RecipeStep = z.infer<typeof RecipeStep>;

/** Source tells the UI how to label a recipe. Never show 'demo' or 'rules' as live AI. */
export const RecipeSource = z.enum(['ai', 'rules', 'demo']);

export const Recipe = z.object({
  title: z.string(),
  concept: z.string(),
  servings: z.number().int().positive(),
  prepMinutes: z.number().int().nonnegative(),
  cookMinutes: z.number().int().nonnegative(),
  totalMinutes: z.number().int().positive(),
  /** Every tool the cook needs, named specifically: "12-inch cast iron skillet", "instant-read thermometer". */
  equipment: z.array(z.string()),
  ingredientGroups: z.array(IngredientGroup).min(1),
  steps: z.array(RecipeStep).min(1),
  tips: z.array(z.string()),
  substitutions: z.array(z.string()),
  storage: z.string(),
  flavorNotes: z.string(),
  plating: z.string(),
  safetyNotes: z.array(z.string()),
  alternatives: z.array(z.object({ title: z.string(), pitch: z.string() })).max(3),
  source: RecipeSource,
});
export type Recipe = z.infer<typeof Recipe>;

/** Flat list across every group, for validation and shopping lists. */
export function recipeIngredients(recipe: Pick<Recipe, 'ingredientGroups'>): RecipeIngredient[] {
  return recipe.ingredientGroups.flatMap((group) => group.items);
}

export const TasteProfile = z.object({
  skill: z.enum(['new', 'home', 'confident', 'pro']),
  favoriteCuisines: z.array(z.string()),
  favoriteProteins: z.array(z.string()),
  dislikedEntryIds: z.array(z.string()),
  allergens: z.array(Allergen),
  diets: z.array(Diet),
  equipmentIds: z.array(z.string()),
  typicalMinutes: z.number().int().positive(),
  servings: z.number().int().positive(),
  preferredDifficulty: Difficulty,
});
export type TasteProfile = z.infer<typeof TasteProfile>;

/** Fridge Snap: what the vision model thinks it sees. User confirms before anything uses it. */
export const DetectedIngredient = z.object({
  name: z.string(),
  entryId: z.string().nullable(),
  confidence: z.number().min(0).max(1),
});
export type DetectedIngredient = z.infer<typeof DetectedIngredient>;
