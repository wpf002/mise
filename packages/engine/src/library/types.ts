import type { Allergen, CategoryId, Diet } from '@mise/schema';
import type { SafetyClass } from '../safety';

export type Role =
  | 'fat' | 'acid' | 'crunch' | 'aromatic' | 'binder' | 'sweet' | 'heat' | 'umami' | 'fresh' | 'starch';

export type Capability =
  | 'toast' | 'bake' | 'broil' | 'roast' | 'sear' | 'fry' | 'air-fry' | 'boil' | 'simmer' | 'braise'
  | 'grill' | 'smoke' | 'blend' | 'chop' | 'whip' | 'steam' | 'pressure' | 'slow' | 'microwave' | 'press';

export interface Entry {
  id: string;
  label: string;
  /** One glyph for the bowl. Rendered as text, never as UI chrome. */
  emoji: string;
  category: CategoryId;
  roles: Role[];
  allergens: Allergen[];
  /** Diets this entry is compatible with. Empty for non-food categories. */
  diets: Diet[];
  safetyClass: SafetyClass;
  /** Equipment: what the tool can actually do. */
  capabilities?: Capability[];
  /** Style: capabilities the style needs from some tool (any one satisfies it). */
  needs?: Capability[];
  skill: 1 | 2 | 3;
  centrality: 'hero' | 'supporting' | 'garnish';
}

export const ALL_DIETS: Diet[] = ['vegetarian', 'vegan', 'pescatarian', 'gluten-free', 'dairy-free', 'halal', 'kosher'];
/** Plant foods with no gluten or dairy. */
export const PLANT: Diet[] = ALL_DIETS;
/** Finned fish. */
export const FISH: Diet[] = ['pescatarian', 'gluten-free', 'dairy-free', 'halal', 'kosher'];
/** Shellfish: not kosher. */
export const SHELLFISH: Diet[] = ['pescatarian', 'gluten-free', 'dairy-free', 'halal'];
export const BEEF_LAMB: Diet[] = ['gluten-free', 'dairy-free', 'halal', 'kosher'];
export const POULTRY: Diet[] = ['gluten-free', 'dairy-free', 'halal', 'kosher'];
export const PORK: Diet[] = ['gluten-free', 'dairy-free'];
export const EGG: Diet[] = ['vegetarian', 'pescatarian', 'gluten-free', 'dairy-free', 'halal', 'kosher'];
export const DAIRY: Diet[] = ['vegetarian', 'pescatarian', 'gluten-free', 'halal', 'kosher'];
export const WHEAT_VEG: Diet[] = ['vegetarian', 'vegan', 'pescatarian', 'dairy-free', 'halal', 'kosher'];
export const NONE: Diet[] = [];

type Defaults = Pick<Entry, 'roles' | 'allergens' | 'diets' | 'safetyClass' | 'skill' | 'centrality'>;

export function defineCategory(category: CategoryId, defaults: Defaults) {
  return (entries: Array<Partial<Entry> & Pick<Entry, 'id' | 'label' | 'emoji'>>): Entry[] =>
    entries.map((entry) => ({ ...defaults, ...entry, category }));
}
