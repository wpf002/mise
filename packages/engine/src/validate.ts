import { recipeIngredients, type Allergen, type Challenge, type Recipe } from '@mise/schema';
import { entryById, type Entry } from './library';
import { SAFETY, type SafetyClass } from './safety';
import { draftFromSlots } from './spin';

export interface ValidationIssue {
  code: 'allergen' | 'safety-note' | 'missing-hero';
  message: string;
}

/** Ingredient names that imply an allergen even when the model omits entryId. */
const ALLERGEN_KEYWORDS: Record<Allergen, string[]> = {
  milk: ['milk', 'butter', 'cheese', 'cream', 'yogurt', 'ghee', 'paneer'],
  egg: ['egg', 'mayo', 'aioli'],
  fish: ['anchov', 'salmon', 'tuna', 'cod', 'fish sauce', 'trout', 'halibut'],
  shellfish: ['shrimp', 'prawn', 'crab', 'lobster', 'clam', 'mussel', 'oyster', 'scallop'],
  'tree-nut': ['almond', 'walnut', 'pecan', 'cashew', 'pistachio', 'hazelnut'],
  peanut: ['peanut'],
  wheat: ['flour', 'bread', 'pasta', 'noodle', 'soy sauce', 'tortilla', 'bun', 'panko'],
  soy: ['soy', 'tofu', 'miso', 'edamame', 'tempeh'],
  sesame: ['sesame', 'tahini'],
};

export function ingredientAllergens(name: string, entry?: Entry): Allergen[] {
  if (entry) return entry.allergens;
  const lowered = name.toLowerCase();
  return (Object.keys(ALLERGEN_KEYWORDS) as Allergen[]).filter((allergen) =>
    ALLERGEN_KEYWORDS[allergen].some((keyword) => lowered.includes(keyword)),
  );
}

export function requiredSafetyNotes(challenge: Challenge): string[] {
  const classes = new Set<SafetyClass>();
  for (const entry of Object.values(draftFromSlots(challenge.slots))) {
    if (entry.safetyClass !== 'none') classes.add(entry.safetyClass);
  }
  return [...classes].map((safetyClass) => SAFETY[safetyClass].note);
}

export function validateRecipe(recipe: Recipe, challenge: Challenge): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const banned = new Set(challenge.config.excludeAllergens);

  const ingredients = recipeIngredients(recipe);
  for (const ingredient of ingredients) {
    const entry = ingredient.entryId ? entryById(ingredient.entryId) : undefined;
    const hit = ingredientAllergens(ingredient.name, entry).find((allergen) => banned.has(allergen));
    if (hit) issues.push({ code: 'allergen', message: `"${ingredient.name}" contains ${hit}, which is excluded.` });
  }

  for (const note of requiredSafetyNotes(challenge)) {
    if (!recipe.safetyNotes.includes(note)) {
      issues.push({ code: 'safety-note', message: `Missing safety note: ${note}` });
    }
  }

  const heroes = Object.values(draftFromSlots(challenge.slots)).filter((entry) => entry.centrality === 'hero');
  for (const hero of heroes) {
    const used = ingredients.some((ingredient) => ingredient.entryId === hero.id || ingredient.name.toLowerCase().includes(hero.label.toLowerCase().split(' ')[0] ?? ''));
    if (!used) issues.push({ code: 'missing-hero', message: `${hero.label} is the hero of this spin but is not in the recipe.` });
  }
  return issues;
}

/** Safety notes always come from the USDA table, never from the model. */
export function withSafetyNotes(recipe: Recipe, challenge: Challenge): Recipe {
  const required = requiredSafetyNotes(challenge);
  const extra = recipe.safetyNotes.filter((note) => !required.includes(note));
  return { ...recipe, safetyNotes: [...required, ...extra] };
}
