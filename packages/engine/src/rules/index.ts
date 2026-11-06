import type { Allergen, Challenge, Diet, IngredientGroup, Recipe, RecipeIngredient, RecipeStep } from '@mise/schema';
import { type Entry } from '../library';
import { draftFromSlots } from '../spin';
import { ingredientAllergens, requiredSafetyNotes } from '../validate';
import { CUISINE, DEFAULT_CUISINE } from './cuisines';
import { EQUIPMENT } from './equipment';
import { FLAVOR } from './flavors';
import { DEFAULT_FORMAT, FORMAT } from './formats';
import { DEFAULT_PRODUCE, PRODUCE } from './produce';
import { CLASS, DEFAULT_PROTEIN, PROTEIN } from './proteins';
import { heatStep, heroSteps, pickTechnique, TECHNIQUE_TIP, type HeroStep } from './techniques';
import type { PantryItem, ProduceProfile, ProteinClass, ProteinProfile, Stage, Technique } from './types';
import { DEFAULT_WILDCARD, WILDCARD } from './wildcards';

export type { Technique } from './types';

const SERVINGS = 2;
const SAUCE_MINUTES = 6;
const CRUNCH_MINUTES = 4;
const ASSEMBLE_MINUTES = 5;
const PRODUCE_HERO_OVEN_F = 425;

const TECHNIQUE_PAST: Record<Technique, string> = {
  sear: 'seared', roast: 'roasted', grill: 'grilled', braise: 'braised', 'air-fry': 'air-fried', 'shallow-fry': 'pan-fried',
  'deep-fry': 'deep-fried', 'stir-fry': 'stir-fried', steam: 'steamed', poach: 'poached', bake: 'baked', broil: 'broiled',
  smoke: 'smoked', slow: 'slow-cooked', pressure: 'pressure-cooked', raw: 'sliced raw',
};

const PRODUCE_PAST: Record<ProduceProfile['method'], string> = { roast: 'roasted', saute: 'sautéed', raw: 'left raw and dressed', wilt: 'wilted', char: 'charred', simmer: 'simmered', steam: 'steamed' };

function withArticle(word: string): string {
  return `${/^[aeiou]/i.test(word) ? 'an' : 'a'} ${word}`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Allergens a diet rules out, on top of the explicit exclusions. */
const DIET_ALLERGENS: Partial<Record<Diet, Allergen[]>> = {
  vegan: ['milk', 'egg', 'fish', 'shellfish'],
  vegetarian: ['fish', 'shellfish'],
  pescatarian: [],
  'dairy-free': ['milk'],
  'gluten-free': ['wheat'],
};

function bannedAllergens(challenge: Challenge): Set<Allergen> {
  const banned = new Set<Allergen>(challenge.config.excludeAllergens);
  for (const diet of challenge.config.diets) for (const allergen of DIET_ALLERGENS[diet] ?? []) banned.add(allergen);
  return banned;
}

/** Walk the alt chain until an item clears the banned allergens. Undefined drops it. */
function resolvePantry(item: PantryItem, banned: Set<Allergen>): PantryItem | undefined {
  const hit = ingredientAllergens(item.name).some((allergen) => banned.has(allergen));
  if (!hit) return item;
  return item.alt ? resolvePantry(item.alt, banned) : undefined;
}

function toIngredient(item: PantryItem, mandatory: boolean, entryId?: string): RecipeIngredient {
  const ingredient: RecipeIngredient = { name: item.name, quantity: item.quantity, mandatory };
  if (item.prep) ingredient.prep = item.prep;
  if (entryId) ingredient.entryId = entryId;
  return ingredient;
}

function lower(entry: Entry | undefined, fallback: string): string {
  return entry ? entry.label.toLowerCase() : fallback;
}

/**
 * The same pantry item can arrive from two wheels (fish sauce as wildcard and as the funky flavor).
 * Keep the first listing; if a later copy was a wheel pick, carry its mandatory flag and entryId onto it.
 */
/** Classes that get sliced before plating. Everything else is spooned or piled. */
const SLICEABLE_CLASSES: ReadonlySet<ProteinClass> = new Set(['steak', 'poultry', 'whole-bird', 'tough', 'fish', 'firm']);
const PILED_ASSEMBLY = 'Spoon the hero over the vegetables on warm plates. Spoon the sauce over and finish with the garnish.';

/** Rule copy says "the hero" for whichever ingredient leads the dish. Swap in its real name before the cook sees it. */
function fillHero(text: string, heroName: string): string {
  return text.replace(/\bthe hero\b/g, `the ${heroName}`).replace(/\bHero\b/g, capitalize(heroName)).replace(/\bhero\b/g, heroName);
}

/** Classes that take a salt ahead of time. Shellfish, eggs, mussels, beans, and bacon do not. */
const SALT_AHEAD_CLASSES: ReadonlySet<ProteinClass> = new Set(['steak', 'ground', 'poultry', 'wings', 'whole-bird', 'tough', 'fish', 'firm']);

function proteinPrepLine(name: string, profile: ProteinProfile, marinadeNames: string[]): string {
  const parts: string[] = [];
  if (profile.prep) parts.push(`Get the ${name} ${profile.prep}.`);
  const marinade = marinadeNames.length ? ` and the ${list(marinadeNames)}` : '';
  if (SALT_AHEAD_CLASSES.has(profile.cls)) parts.push(`Pat it dry and season all over with 1 teaspoon of the salt${marinade}. Leave it at room temperature while you prep the rest.`);
  else if (marinadeNames.length) parts.push(`Toss the ${name} with the ${list(marinadeNames)} and set aside.`);
  else if (!profile.prep) parts.push(`Get the ${name} ready at the stove.`);
  return parts.join(' ');
}

function dedupeIngredients(groups: IngredientGroup[]): void {
  const seen = new Map<string, RecipeIngredient>();
  for (const group of groups) {
    group.items = group.items.filter((item) => {
      const key = item.name.toLowerCase();
      const kept = seen.get(key);
      if (!kept) { seen.set(key, item); return true; }
      if (item.mandatory) { kept.mandatory = true; if (item.entryId) kept.entryId = item.entryId; }
      return false;
    });
  }
  for (let index = groups.length - 1; index >= 0; index -= 1) if (groups[index]?.items.length === 0) groups.splice(index, 1);
}

function list(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function step(title: string, text: string, minutes: number, equipmentId?: string): RecipeStep {
  const result: RecipeStep = { title, text, durationMinutes: Math.max(1, minutes) };
  if (equipmentId) result.equipmentId = equipmentId;
  return result;
}

function fromHero(hero: HeroStep, equipmentId?: string): RecipeStep {
  return step(hero.title, hero.text, hero.minutes, equipmentId);
}

function produceStep(name: string, profile: ProduceProfile, standalone: boolean): RecipeStep | null {
  const done = `It is done when ${profile.doneCue}.`;
  switch (profile.method) {
    case 'raw':
      return null;
    case 'roast':
      return step(`Roast the ${name}`, standalone ? `Heat the oven to ${PRODUCE_HERO_OVEN_F}°F. Toss the ${name} with 2 tablespoons oil and 3/4 teaspoon salt on a rimmed sheet pan and spread it out in one layer. Roast ${profile.minutes} minutes, flipping once halfway. ${done}` : `Toss the ${name} with 1 tablespoon oil and 1/2 teaspoon salt on a rimmed sheet pan in one layer. Roast at ${PRODUCE_HERO_OVEN_F}°F for ${profile.minutes} minutes, flipping once. ${done}`, profile.minutes);
    case 'saute':
      return step(`Sauté the ${name}`, `Heat 1 tablespoon oil in a skillet over medium-high until shimmering. Add the ${name} with a pinch of salt and cook, stirring every minute, ${profile.minutes} minutes. ${done}`, profile.minutes + 1);
    case 'wilt':
      return step(`Wilt the ${name}`, `Add the ${name} to the sauce a handful at a time, folding until each addition collapses, ${profile.minutes} minutes total. ${done}`, profile.minutes);
    case 'char':
      return step(`Char the ${name}`, `Set a dry skillet or grill pan over high heat until smoking. Add the ${name} in one layer and leave it ${Math.ceil(profile.minutes / 2)} minutes until blackened in spots, then turn and char ${Math.floor(profile.minutes / 2)} more minutes. ${done}`, profile.minutes + 2);
    case 'simmer':
      return step(`Simmer the ${name}`, `Add the ${name} to the sauce and simmer ${profile.minutes} minutes, stirring now and then. ${done}`, profile.minutes);
    case 'steam':
      return step(`Steam the ${name}`, `Steam the ${name} in a covered basket over 1 inch of simmering water ${profile.minutes} minutes. ${done}`, profile.minutes);
  }
}

/**
 * Deterministic, table-driven recipe. Exact quantities, grouped ingredients,
 * titled steps with heat, time, and doneness. Labeled 'rules' so the UI never
 * passes it off as the chef.
 */
export function rulesRecipe(challenge: Challenge): Recipe {
  const draft = draftFromSlots(challenge.slots);
  const { protein, produce, equipment, style, cuisine, wildcard, format, flavor } = draft;
  const banned = bannedAllergens(challenge);
  const resolve = (item: PantryItem) => resolvePantry(item, banned);

  const proteinProfile = protein ? PROTEIN[protein.id] ?? DEFAULT_PROTEIN : undefined;
  const cls = proteinProfile ? CLASS[proteinProfile.cls] : undefined;
  const produceProfile = produce ? PRODUCE[produce.id] ?? DEFAULT_PRODUCE : undefined;
  const cuisineProfile = cuisine ? CUISINE[cuisine.id] ?? DEFAULT_CUISINE : DEFAULT_CUISINE;
  const wildcardProfile = wildcard ? WILDCARD[wildcard.id] ?? DEFAULT_WILDCARD : undefined;
  const flavorProfile = flavor ? FLAVOR[flavor.id] : undefined;
  const formatProfile = format ? FORMAT[format.id] ?? DEFAULT_FORMAT : DEFAULT_FORMAT;
  const equipmentProfile = equipment ? EQUIPMENT[equipment.id] : undefined;

  const heroEntry = protein ?? produce;
  const heroName = lower(heroEntry, 'the main ingredient');
  const pick = cls ? pickTechnique(cls, style?.id, equipment?.id, equipmentProfile?.vessel) : undefined;

  // Ingredient groups
  const groups: IngredientGroup[] = [];
  const heroItems: RecipeIngredient[] = [];
  if (protein && proteinProfile) heroItems.push({ name: protein.label, quantity: proteinProfile.quantity, prep: proteinProfile.prep, mandatory: true, entryId: protein.id });
  if (produce && produceProfile) {
    const item: RecipeIngredient = { name: produce.label, quantity: produceProfile.quantity, mandatory: true, entryId: produce.id };
    if (produceProfile.prep) item.prep = produceProfile.prep;
    heroItems.push(item);
  }
  const marinadeItems: PantryItem[] = [];
  if (flavorProfile?.stage === 'marinade') marinadeItems.push(flavorProfile.item);
  heroItems.push({ name: 'Kosher salt', quantity: '1 1/2 tsp, divided', mandatory: true });
  heroItems.push({ name: 'Neutral oil', quantity: '3 tbsp, divided', mandatory: true });
  for (const item of marinadeItems) { const resolved = resolve(item); if (resolved) heroItems.push(toIngredient(resolved, false)); }
  groups.push({ title: `For the ${heroName}`, items: heroItems });

  const sauceItems: RecipeIngredient[] = [];
  const sauceSources: PantryItem[] = [cuisineProfile.fat, ...cuisineProfile.aromatics, ...cuisineProfile.spice, cuisineProfile.liquid, cuisineProfile.acid];
  for (const item of sauceSources) { const resolved = resolve(item); if (resolved) sauceItems.push(toIngredient(resolved, false)); }
  if (wildcard && wildcardProfile) {
    const item: RecipeIngredient = { name: wildcard.label, quantity: wildcardProfile.quantity, mandatory: true, entryId: wildcard.id };
    if (wildcardProfile.prep) item.prep = wildcardProfile.prep;
    sauceItems.push(item);
  }
  if (flavorProfile && flavorProfile.stage !== 'marinade') { const resolved = resolve(flavorProfile.item); if (resolved) sauceItems.push(toIngredient(resolved, false)); }
  sauceItems.push({ name: 'Black pepper', quantity: '1/2 tsp, freshly ground', mandatory: false });
  groups.push({ title: 'For the sauce', items: sauceItems });

  const serveItems: RecipeIngredient[] = [];
  for (const item of [...formatProfile.base, ...cuisineProfile.garnish]) { const resolved = resolve(item); if (resolved) serveItems.push(toIngredient(resolved, false)); }
  if (serveItems.length) groups.push({ title: 'To serve', items: serveItems });
  dedupeIngredients(groups);

  const resolvedNames = (items: PantryItem[]) => items.map(resolve).filter((item): item is PantryItem => Boolean(item)).map((item) => item.name.toLowerCase());
  const aromaticNames = list(resolvedNames(cuisineProfile.aromatics));
  const spiceNames = list(resolvedNames(cuisineProfile.spice));
  const liquidName = resolve(cuisineProfile.liquid)?.name.toLowerCase() ?? 'water';
  const acidName = resolve(cuisineProfile.acid)?.name.toLowerCase() ?? 'a squeeze of citrus';
  const fatName = resolve(cuisineProfile.fat)?.name.toLowerCase() ?? 'oil';
  const garnishNames = list(resolvedNames(cuisineProfile.garnish));

  // Steps
  const prepSteps: RecipeStep[] = [];
  const cookSteps: RecipeStep[] = [];

  const prepLines: string[] = [];
  if (protein && proteinProfile) prepLines.push(proteinPrepLine(protein.label.toLowerCase(), proteinProfile, resolvedNames(marinadeItems)));
  if (produce && produceProfile) prepLines.push(produceProfile.method === 'raw' ? `Get the ${produce.label.toLowerCase()} ${produceProfile.prep || 'cut into even pieces'}. Toss with a pinch of salt and 1 teaspoon of the ${acidName} and set aside.` : `Get the ${produce.label.toLowerCase()} ${produceProfile.prep || 'cut into even pieces'}.`);
  prepLines.push(`Prep the ${aromaticNames}. Measure the ${spiceNames} into one small bowl and the ${liquidName} into a cup so the sauce step moves fast.`);
  if (flavorProfile?.stage === 'marinade') prepLines.push(flavorProfile.how);
  if (wildcardProfile?.stage === 'marinade' && wildcard) prepLines.push(`${wildcard.label}: ${wildcardProfile.how}`);
  prepSteps.push(step('Mise en place', prepLines.join(' '), 12));

  if (equipmentProfile?.role?.when === 'prep' && equipment) prepSteps.push(step(equipmentProfile.role.title, equipmentProfile.role.text, equipmentProfile.role.minutes, equipment.id));
  if (formatProfile.baseStep) prepSteps.push(step(formatProfile.baseStep.title, formatProfile.baseStep.text, formatProfile.baseStep.minutes));

  const heroCook: RecipeStep[] = [];
  if (protein && proteinProfile && cls && pick) {
    const heat = heatStep(pick, cls);
    if (heat) heroCook.push(fromHero(heat, pick.equipmentId));
    const crumble = proteinProfile.cls === 'ground';
    for (const hero of heroSteps(pick, { label: protein.label, cls, safetyClass: protein.safetyClass, crumble })) heroCook.push(fromHero(hero, pick.equipmentId));
  }

  const sauceLines: string[] = [
    `Pour off all but 1 tablespoon of fat from the pan, or use a clean skillet over medium. Add the ${fatName} and the ${aromaticNames}. Cook, stirring, 1 to 2 minutes until soft and fragrant but not browned.`,
    `Add the ${spiceNames} and stir 30 seconds so the spices bloom in the fat.`,
    `Pour in the ${liquidName}, scraping up every browned bit from the bottom. Simmer 2 to 3 minutes until reduced by about a third${formatProfile.brothy ? ', then add the stock or coconut milk from the serving list and bring back to a simmer' : ''}.`,
  ];
  if (wildcard && wildcardProfile?.stage === 'sauce') sauceLines.push(`${wildcard.label}: ${wildcardProfile.how}`);
  if (flavorProfile?.stage === 'sauce') sauceLines.push(flavorProfile.how);
  sauceLines.push(`Off the heat, stir in the ${acidName} and the black pepper. Taste. It should be a little too salty and sharp on its own; the ${heroName} will balance it.`);
  const sauceStep = step('Build the sauce', sauceLines.join(' '), SAUCE_MINUTES);
  // Braises build the sauce in the pot between browning and the long cook; slow and pressure cooks need it first.
  const sauceFirst = pick?.technique === 'slow' || pick?.technique === 'pressure';
  const sauceMid = pick?.technique === 'braise';
  if (sauceFirst) cookSteps.push(sauceStep);
  if (sauceMid) {
    cookSteps.push(...heroCook.slice(0, 2), sauceStep, ...heroCook.slice(2));
  } else {
    cookSteps.push(...heroCook);
  }

  const produceCook = produce && produceProfile ? produceStep(produce.label.toLowerCase(), produceProfile, !protein) : null;
  const produceInSauce = produceProfile?.method === 'wilt' || produceProfile?.method === 'simmer';
  if (produceCook && !produceInSauce) cookSteps.push(produceCook);
  if (!sauceFirst && !sauceMid) cookSteps.push(sauceStep);

  if (produceCook && produceInSauce) cookSteps.push(produceCook);
  if (equipmentProfile?.role?.when === 'sauce' && equipment) cookSteps.push(step(equipmentProfile.role.title, equipmentProfile.role.text, equipmentProfile.role.minutes, equipment.id));

  const crunchLines: string[] = [];
  if (wildcard && wildcardProfile?.stage === 'crunch') crunchLines.push(`${wildcard.label}: ${wildcardProfile.how}`);
  if (flavorProfile?.stage === 'crunch') crunchLines.push(flavorProfile.how);
  if (crunchLines.length) cookSteps.push(step('Make the crunch', crunchLines.join(' '), CRUNCH_MINUTES));

  if (equipmentProfile?.role?.when === 'assembly' && equipment) cookSteps.push(step(equipmentProfile.role.title, equipmentProfile.role.text, equipmentProfile.role.minutes, equipment.id));
  const sliceable = proteinProfile ? SLICEABLE_CLASSES.has(proteinProfile.cls) : true;
  const assembleLines: string[] = [formatProfile === DEFAULT_FORMAT && !sliceable ? PILED_ASSEMBLY : formatProfile.assembly];
  if (wildcard && wildcardProfile?.stage === 'finish') assembleLines.push(`${wildcard.label}: ${wildcardProfile.how}`);
  if (flavorProfile?.stage === 'finish') assembleLines.push(flavorProfile.how);
  if (garnishNames) assembleLines.push(`Finish with the ${garnishNames}.`);
  cookSteps.push(step('Assemble and serve', assembleLines.join(' '), ASSEMBLE_MINUTES));

  const steps = [...prepSteps, ...cookSteps];
  const prepMinutes = prepSteps.reduce((sum, item) => sum + item.durationMinutes, 0);
  const cookMinutes = cookSteps.reduce((sum, item) => sum + item.durationMinutes, 0);

  // Gear
  const gear = new Set<string>(['Cutting board and chef\'s knife']);
  if (pick) gear.add(pick.vessel[0]?.toUpperCase() + pick.vessel.slice(1));
  if (equipment && !pick?.equipmentId) gear.add(equipment.label);
  if (produceCook && produceProfile?.method === 'roast') gear.add('Rimmed sheet pan');
  if (produceCook && (produceProfile?.method === 'saute' || produceProfile?.method === 'char')) gear.add('Skillet');
  gear.add('Small saucepan or skillet for the sauce');
  if (heroEntry && heroEntry.safetyClass !== 'none') gear.add('Instant-read thermometer');

  // Copy
  const titleParts = [cuisine?.label, style?.label, heroEntry?.label, format ? format.label : produce && protein ? `with ${produce.label}` : undefined].filter((part): part is string => Boolean(part));
  const heroHow = pick ? `${TECHNIQUE_PAST[pick.technique]} in ${withArticle(pick.vessel)}` : produceProfile ? PRODUCE_PAST[produceProfile.method] : 'cooked';
  const concept = `${capitalize(heroName)}, ${heroHow}, then ${withArticle(cuisine ? `${cuisine.label} pan sauce` : 'pan sauce')} built on ${aromaticNames} and ${liquidName}${wildcard ? `, with ${wildcard.label.toLowerCase()} as the twist` : ''}${format ? `. Served as ${format.label.toLowerCase()}.` : '.'}`;

  const tips = [...(cls?.tips ?? []), ...(pick ? [TECHNIQUE_TIP[pick.technique]] : []), 'Salt in stages and taste at every step. The sauce should be bolder than you think before it meets the starch.'];
  const substitutions = [
    ...(protein && proteinProfile ? [`No ${protein.label.toLowerCase()}? Use ${proteinProfile.sub}.`] : []),
    ...(produce && produceProfile ? [`No ${produce.label.toLowerCase()}? Use ${produceProfile.sub}.`] : []),
    ...(wildcard && wildcardProfile ? [`No ${wildcard.label.toLowerCase()}? Use ${wildcardProfile.sub}.`] : []),
    `Swap the ${liquidName} for water with a pinch more salt if that is what you have.`,
  ];

  const fill = (text: string) => fillHero(text, heroName);
  return {
    title: titleParts.join(' '),
    concept,
    servings: SERVINGS,
    prepMinutes,
    cookMinutes,
    totalMinutes: prepMinutes + cookMinutes,
    equipment: [...gear],
    ingredientGroups: groups,
    steps: steps.map((item) => ({ ...item, title: fill(item.title), text: fill(item.text) })),
    tips: tips.map(fill),
    substitutions: substitutions.map(fill),
    storage: cls?.storage ?? 'Keeps 3 days refrigerated in a sealed container. Reheat gently in a covered skillet with a splash of water.',
    flavorNotes: fill(flavor ? `Built to read ${flavor.label.toLowerCase()}: ${flavorProfile?.how ?? 'lean into it at every stage.'}` : `Salt, fat, acid, and the ${spiceNames} carry it. Finish with the ${acidName} and taste again.`),
    plating: fill(formatProfile.plating),
    safetyNotes: requiredSafetyNotes(challenge),
    alternatives: [],
    source: 'rules',
  };
}

export const STAGES: readonly Stage[] = ['marinade', 'sauce', 'finish', 'crunch'];
