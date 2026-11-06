import type { CategoryId } from '@mise/schema';
import { CUISINES } from './cuisines';
import { EQUIPMENT } from './equipment';
import { FLAVORS } from './flavors';
import { FORMATS } from './formats';
import { PRODUCE } from './produce';
import { PROTEINS } from './proteins';
import { STYLES } from './styles';
import type { Entry } from './types';
import { WILDCARDS } from './wildcards';

export type { Capability, Entry, Role } from './types';

export const LIBRARY_VERSION = '2026.11.1';

export const LIBRARY: Entry[] = [
  ...PROTEINS, ...PRODUCE, ...EQUIPMENT, ...STYLES, ...CUISINES, ...WILDCARDS, ...FORMATS, ...FLAVORS,
];

const BY_ID: ReadonlyMap<string, Entry> = new Map(LIBRARY.map((entry) => [entry.id, entry]));

export function entryById(id: string): Entry | undefined {
  return BY_ID.get(id);
}

export function entriesIn(category: CategoryId): Entry[] {
  return LIBRARY.filter((entry) => entry.category === category);
}

/** Categories whose entries are food, so allergen and diet filters apply. */
export const FOOD_CATEGORIES: ReadonlySet<CategoryId> = new Set<CategoryId>([
  'protein', 'produce', 'wildcard', 'format', 'flavor',
]);

export const CATEGORY_LABEL: Record<CategoryId, string> = {
  protein: 'Protein', produce: 'Produce', equipment: 'Equipment', style: 'Style',
  cuisine: 'Cuisine', wildcard: 'Wildcard', format: 'Format', flavor: 'Flavor',
};
