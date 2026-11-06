import type { Challenge, TasteProfile } from '@mise/schema';

export const RECIPE_SYSTEM = `You are the chef inside Mise, a cooking game. You write one recipe for a spun challenge.
Rules:
- Use every spun ingredient. Hero ingredients (protein, produce) are mandatory and central.
- Equipment listed is the ONLY cooking equipment. A pop-up toaster can only toast bread.
- Stay inside the time limit if one is given. Steps carry atMinute and durationMinutes that fit totalMinutes.
- Never include an excluded allergen in any ingredient. Respect diets.
- Do not write safety temperatures; the app adds them.
- Write like a confident home cook. Short sentences. No filler.
Respond with JSON only, matching this shape exactly:
{"title":string,"concept":string,"servings":number,"totalMinutes":number,
"ingredients":[{"name":string,"quantity":string,"mandatory":boolean,"entryId":string|null}],
"steps":[{"atMinute":number,"durationMinutes":number,"text":string,"equipmentId":string|null}],
"equipmentNotes":[string],"flavorNotes":string,"plating":string,"safetyNotes":[],
"alternatives":[{"title":string,"pitch":string}],"source":"ai"}`;

export function recipeUser(challenge: Challenge, labels: Record<string, string>, profile?: TasteProfile, fixes?: string[]): string {
  const wheels = Object.entries(challenge.slots)
    .map(([category, slot]) => `- ${category}: ${labels[slot.entryId] ?? slot.entryId} (entryId ${slot.entryId})`)
    .join('\n');
  const config = challenge.config;
  const lines = [
    'Spun wheels:', wheels,
    `Difficulty: ${config.difficulty}. Mode: ${config.mode}.`,
    config.timeLimitMinutes ? `Time limit: ${config.timeLimitMinutes} minutes.` : 'No time limit.',
    config.excludeAllergens.length ? `Excluded allergens: ${config.excludeAllergens.join(', ')}.` : 'No allergen exclusions.',
    config.diets.length ? `Diets: ${config.diets.join(', ')}.` : '',
    profile ? `Cook: ${profile.skill}. Servings: ${profile.servings}. Likes: ${profile.favoriteCuisines.join(', ') || 'anything'}.` : 'Servings: 2.',
  ];
  if (fixes?.length) lines.push('Your previous attempt failed validation. Fix every one of these:', ...fixes.map((fix) => `- ${fix}`));
  return lines.filter(Boolean).join('\n');
}

export const DETECT_SYSTEM = `You identify food ingredients visible in a fridge or pantry photo.
Return JSON: {"ingredients":[{"name":string,"confidence":number}]}. Confidence is 0 to 1.
List only what is clearly food. Use short common names ("chicken thighs", "celery", "cheddar"). Max 25 items.`;

export const JUDGE_SYSTEM = `You judge a home-cooked dish for a cooking game. You are fair and specific.
Score five lines, each 0 to 20: flavor, creativity, technique, presentation, compliance.
Each line carries evidence: "seen-in-photo" only if a photo was given and shows it; "reported-by-you" for claims in the description;
"inferred-from-recipe" for things you deduce from the challenge; "not-verifiable" otherwise. Flavor is never "seen-in-photo".
Return JSON: {"lines":[{"category":string,"score":number,"max":20,"evidence":string,"note":string}],
"strengths":[string],"improvements":[string]}. Exactly five lines in that order.`;

export function judgeUser(challenge: Challenge, labels: Record<string, string>, dishName: string, description: string, notes?: string, hasPhoto = false): string {
  const wheels = Object.entries(challenge.slots).map(([category, slot]) => `${category}: ${labels[slot.entryId] ?? slot.entryId}`).join('; ');
  return [
    `Challenge wheels: ${wheels}.`,
    challenge.config.timeLimitMinutes ? `Time limit ${challenge.config.timeLimitMinutes} minutes.` : '',
    `Dish name: ${dishName}`,
    `Cook's description: ${description}`,
    notes ? `Notes: ${notes}` : '',
    hasPhoto ? 'A photo of the plated dish is attached.' : 'No photo was provided.',
  ].filter(Boolean).join('\n');
}
