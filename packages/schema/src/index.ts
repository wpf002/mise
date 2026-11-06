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
  timeLimitMinutes: z.number().int().min(5).max(180).nullable(),
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
  quantity: z.string(),
  mandatory: z.boolean(),
  entryId: z.string().optional(),
});

export const RecipeStep = z.object({
  atMinute: z.number().int().nonnegative(),
  durationMinutes: z.number().int().positive(),
  text: z.string(),
  equipmentId: z.string().optional(),
});

/** Source tells the UI how to label a recipe. Never show 'demo' or 'rules' as live AI. */
export const RecipeSource = z.enum(['ai', 'rules', 'demo']);

export const Recipe = z.object({
  title: z.string(),
  concept: z.string(),
  servings: z.number().int().positive(),
  totalMinutes: z.number().int().positive(),
  ingredients: z.array(RecipeIngredient).min(1),
  steps: z.array(RecipeStep).min(1),
  equipmentNotes: z.array(z.string()),
  flavorNotes: z.string(),
  plating: z.string(),
  safetyNotes: z.array(z.string()),
  alternatives: z.array(z.object({ title: z.string(), pitch: z.string() })).max(3),
  source: RecipeSource,
});
export type Recipe = z.infer<typeof Recipe>;

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

/** Every judging line carries what the score is actually based on. */
export const Evidence = z.enum([
  'seen-in-photo',
  'reported-by-you',
  'inferred-from-recipe',
  'not-verifiable',
]);

export const JudgeLine = z.object({
  category: z.enum(['flavor', 'creativity', 'technique', 'presentation', 'compliance']),
  score: z.number().nonnegative(),
  max: z.number().positive(),
  evidence: Evidence,
  note: z.string(),
});

export const JudgeResult = z.object({
  lines: z.array(JudgeLine).length(5),
  total: z.number(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  estimate: z.literal(true),
});
export type JudgeResult = z.infer<typeof JudgeResult>;

/** Fridge Snap: what the vision model thinks it sees. User confirms before anything uses it. */
export const DetectedIngredient = z.object({
  name: z.string(),
  entryId: z.string().nullable(),
  confidence: z.number().min(0).max(1),
});
export type DetectedIngredient = z.infer<typeof DetectedIngredient>;
