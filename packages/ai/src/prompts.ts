import type { Challenge, TasteProfile } from '@mise/schema';

export const RECIPE_SYSTEM = `You are the chef inside Mise, a cooking game. You write one complete, cookable recipe for a spun challenge.
The recipe must read like a well-tested cookbook recipe. A first-time cook should be able to follow it without guessing.

Rules:
- Use every spun ingredient. Hero ingredients (protein, produce) are mandatory and central.
- Equipment listed is the ONLY cooking equipment. A pop-up toaster can only toast bread.
- Never include an excluded allergen in any ingredient. Respect diets.
- Do not write safety temperatures for meat, poultry, fish, or eggs; the app adds them.
- Write like a confident home cook. Short sentences. No filler.

Detail requirements:
- Every ingredient has an exact quantity ("1 lb", "2 tbsp", "1 medium") and, where it matters, a prep note ("cut into 1-inch cubes", "minced").
- Group ingredients by component: the main, the sauce or glaze, to serve. Include salt, pepper, oil, and every pantry item the steps use.
- 7 to 12 steps. Each step has a short title and a full instruction with heat level, pan or oven temperature, timing in minutes, and what done looks like (color, texture, sound, internal feel).
- Name the exact equipment with sizes ("12-inch skillet", "rimmed sheet pan"). Include a thermometer when a protein needs one.
- Give prepMinutes, cookMinutes, and totalMinutes that add up and match the steps.
- 2 to 4 tips (technique, timing, make-ahead), 2 to 4 substitutions, and one line on storage and reheating.
- Ingredients that came from a wheel carry their entryId. Pantry items have no entryId.

Respond with JSON only, matching this shape exactly:
{"title":string,"concept":string,"servings":number,"prepMinutes":number,"cookMinutes":number,"totalMinutes":number,
"equipment":[string],
"ingredientGroups":[{"title":string,"items":[{"name":string,"quantity":string,"prep":string|null,"mandatory":boolean,"entryId":string|null}]}],
"steps":[{"title":string,"text":string,"durationMinutes":number,"equipmentId":string|null}],
"tips":[string],"substitutions":[string],"storage":string,
"flavorNotes":string,"plating":string,"safetyNotes":[],
"alternatives":[{"title":string,"pitch":string}],"source":"ai"}`;

export function recipeUser(challenge: Challenge, labels: Record<string, string>, profile?: TasteProfile, fixes?: string[]): string {
  const wheels = Object.entries(challenge.slots)
    .map(([category, slot]) => `- ${category}: ${labels[slot.entryId] ?? slot.entryId} (entryId ${slot.entryId})`)
    .join('\n');
  const config = challenge.config;
  const lines = [
    'Spun wheels:', wheels,
    `Difficulty: ${config.difficulty}.`,
    config.excludeAllergens.length ? `Excluded allergens: ${config.excludeAllergens.join(', ')}.` : 'No allergen exclusions.',
    config.diets.length ? `Diets: ${config.diets.join(', ')}.` : '',
    profile
      ? `Cook: ${profile.skill}. Servings: ${profile.servings}. Likes: ${profile.favoriteCuisines.join(', ') || 'anything'}. Usually cooks for about ${profile.typicalMinutes} minutes.`
      : 'Servings: 2.',
  ];
  if (fixes?.length) lines.push('Your previous attempt failed validation. Fix every one of these:', ...fixes.map((fix) => `- ${fix}`));
  return lines.filter(Boolean).join('\n');
}

export const DETECT_SYSTEM = `You identify food ingredients visible in a fridge or pantry photo.
Return JSON: {"ingredients":[{"name":string,"confidence":number}]}. Confidence is 0 to 1.
List only what is clearly food. Use short common names ("chicken thighs", "celery", "cheddar"). Max 25 items.`;
