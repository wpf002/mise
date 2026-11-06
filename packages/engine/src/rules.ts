import type { Challenge, Recipe } from '@mise/schema';
import { CATEGORY_LABEL, type Entry } from './library';
import { draftFromSlots } from './spin';
import { requiredSafetyNotes } from './validate';

const DEFAULT_MINUTES = 35;
const DEFAULT_SERVINGS = 2;
const PREP_SHARE = 0.3;
const MIN_PREP_MINUTES = 5;
const MIN_COOK_MINUTES = 8;
const HEAT_MINUTES = 3;
const FINISH_MINUTES = 4;

function heat(equipment: Entry | undefined): string {
  const capabilities = new Set(equipment?.capabilities ?? []);
  if (capabilities.has('sear') || capabilities.has('fry')) return `Heat the ${equipment?.label.toLowerCase()} over medium-high.`;
  if (capabilities.has('roast') || capabilities.has('bake')) return `Preheat the ${equipment?.label.toLowerCase()} to 425°F.`;
  if (capabilities.has('grill')) return `Heat the ${equipment?.label.toLowerCase()} until it is too hot to hold a hand over.`;
  if (capabilities.has('toast')) return 'Set the toaster to medium. It will handle bread, nothing else.';
  return 'Set up your main tool and a cutting board.';
}

/**
 * Deterministic no-AI plan. Readable, safe, and labeled 'rules' so the UI never
 * passes it off as the chef.
 */
export function rulesRecipe(challenge: Challenge): Recipe {
  const draft = draftFromSlots(challenge.slots);
  const { protein, produce, equipment, style, cuisine, wildcard, format, flavor } = draft;
  const hero = protein ?? produce;
  const minutes = challenge.config.timeLimitMinutes ?? DEFAULT_MINUTES;
  const prepMinutes = Math.max(MIN_PREP_MINUTES, Math.round(minutes * PREP_SHARE));
  const cookMinutes = Math.max(MIN_COOK_MINUTES, minutes - prepMinutes - HEAT_MINUTES - FINISH_MINUTES);

  const titleParts = [style?.label, hero?.label, format ? `${format.label}` : null].filter(Boolean);
  const title = titleParts.length ? titleParts.join(' ') : 'Basic Plan';

  const ingredients: Recipe['ingredients'] = [];
  const foodEntries = [protein, produce, wildcard].filter((entry): entry is Entry => Boolean(entry));
  for (const entry of foodEntries) {
    ingredients.push({ name: entry.label, quantity: entry.centrality === 'hero' ? '1 lb' : 'enough for 2', mandatory: true, entryId: entry.id });
  }
  ingredients.push({ name: 'Salt', quantity: 'to taste', mandatory: true });
  ingredients.push({ name: 'Neutral oil', quantity: '2 tbsp', mandatory: true });
  if (flavor) ingredients.push({ name: `Something ${flavor.label.toLowerCase()}`, quantity: 'a generous amount', mandatory: false, entryId: flavor.id });

  const steps: Recipe['steps'] = [
    { atMinute: 0, durationMinutes: prepMinutes, text: `Prep everything. Cut ${produce?.label.toLowerCase() ?? 'the produce'} into even pieces and season ${hero?.label.toLowerCase() ?? 'the main ingredient'} with salt.` },
    { atMinute: prepMinutes, durationMinutes: HEAT_MINUTES, text: heat(equipment), equipmentId: equipment?.id },
    { atMinute: prepMinutes + HEAT_MINUTES, durationMinutes: cookMinutes, text: `Cook ${hero?.label.toLowerCase() ?? 'the main ingredient'} ${style ? style.label.toLowerCase() : 'until done'}. Add ${produce?.label.toLowerCase() ?? 'the produce'} for the last third.`, equipmentId: equipment?.id },
    { atMinute: prepMinutes + HEAT_MINUTES + cookMinutes, durationMinutes: FINISH_MINUTES, text: `Finish with ${wildcard?.label.toLowerCase() ?? 'a squeeze of acid'} and serve ${format ? `as ${format.label.toLowerCase()}` : 'hot'}.` },
  ];
  const totalMinutes = prepMinutes + HEAT_MINUTES + cookMinutes + FINISH_MINUTES;

  return {
    title,
    concept: `A straightforward ${cuisine ? `${cuisine.label.toLowerCase()}-leaning ` : ''}plan built from your ${Object.keys(draft).map((key) => CATEGORY_LABEL[key as keyof typeof CATEGORY_LABEL].toLowerCase()).join(', ')} wheels.`,
    servings: DEFAULT_SERVINGS,
    totalMinutes,
    ingredients,
    steps,
    equipmentNotes: equipment ? [`Built for a ${equipment.label.toLowerCase()}.`] : [],
    flavorNotes: flavor ? `Lean ${flavor.label.toLowerCase()}. Taste before plating.` : 'Season in layers and taste before plating.',
    plating: 'Keep it simple. Hero in the middle, produce around it, finish on top.',
    safetyNotes: requiredSafetyNotes(challenge),
    alternatives: [],
    source: 'rules',
  };
}
