import type { CategoryId, ChallengeConfig, Difficulty, SlotState } from '@mise/schema';
import { FOOD_CATEGORIES, LIBRARY, entryById, type Entry } from './library';
import { playability, type Draft } from './playability';
import { slotRng } from './rng';

export const MAX_DRAWS_PER_WHEEL = 20;
const PANTRY_WEIGHT = 3;
/** Below this chaos, equipment must be able to carry the style. Above it, anything goes. */
export const HARD_EQUIPMENT_CHAOS = 0.6;
const SKILL_CEILING: Record<Difficulty, number> = { easy: 1, standard: 2, master: 3 };

export type Slots = Partial<Record<CategoryId, SlotState>>;

export function skillCeiling(difficulty: Difficulty): number {
  return SKILL_CEILING[difficulty];
}

/** Entries that are allowed at all under this config. Allergens and diets gate food only. */
export function eligibleEntries(config: ChallengeConfig, category: CategoryId): Entry[] {
  const excluded = new Set(config.excludeEntryIds);
  const allergens = new Set(config.excludeAllergens);
  const available = config.availableEquipmentIds ? new Set(config.availableEquipmentIds) : null;
  return LIBRARY.filter((entry) => {
    if (entry.category !== category) return false;
    if (excluded.has(entry.id)) return false;
    if (category === 'equipment' && available && !available.has(entry.id)) return false;
    if (FOOD_CATEGORIES.has(category)) {
      if (entry.allergens.some((allergen) => allergens.has(allergen))) return false;
      if (!config.diets.every((diet) => entry.diets.includes(diet))) return false;
    }
    return true;
  });
}

function carries(equipment: Entry, style: Entry): boolean {
  if (!style.needs?.length) return true;
  const capabilities = new Set(equipment.capabilities ?? []);
  return style.needs.some((need) => capabilities.has(need));
}

/** Drop style/equipment candidates the other wheel can't work with. Falls back to all if that empties the wheel. */
function compatibleCandidates(draft: Draft, category: CategoryId, candidates: Entry[], chaos: number): Entry[] {
  if (chaos >= HARD_EQUIPMENT_CHAOS) return candidates;
  let kept = candidates;
  if (category === 'style' && draft.equipment) {
    const equipment = draft.equipment;
    kept = candidates.filter((style) => carries(equipment, style));
  }
  if (category === 'equipment' && draft.style) {
    const style = draft.style;
    kept = candidates.filter((equipment) => carries(equipment, style));
  }
  return kept.length ? kept : candidates;
}

function weightedPick(entries: Entry[], pantry: Set<string>, next: () => number): Entry {
  const weights = entries.map((entry) => (pantry.has(entry.id) ? PANTRY_WEIGHT : 1));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = next() * total;
  for (let index = 0; index < entries.length; index++) {
    roll -= weights[index] ?? 0;
    if (roll < 0) return entries[index] as Entry;
  }
  return entries[entries.length - 1] as Entry;
}

export class EmptyWheelError extends Error {
  constructor(public readonly category: CategoryId) {
    super(`No entries left for ${category} under the current filters`);
    this.name = 'EmptyWheelError';
  }
}

/**
 * Fill every wheel in config.categories. Locked slots are kept as-is; the rest are
 * drawn from their own seeded stream, up to MAX_DRAWS_PER_WHEEL times, until the
 * running draft clears the playability threshold set by chaos. If nothing clears
 * it, the best draw wins.
 */
export function spin(config: ChallengeConfig, seed: string, previous: Slots = {}): Slots {
  const pantry = new Set(config.pantryEntryIds);
  const maxSkill = skillCeiling(config.difficulty);
  const threshold = 1 - config.chaos;
  const draft: Draft = {};
  const slots: Slots = {};

  for (const category of config.categories) {
    const prior = previous[category];
    if (prior?.locked) {
      const entry = entryById(prior.entryId);
      if (!entry) throw new EmptyWheelError(category);
      draft[category] = entry;
      slots[category] = prior;
      continue;
    }
    const eligible = eligibleEntries(config, category);
    if (eligible.length === 0) throw new EmptyWheelError(category);
    const candidates = compatibleCandidates(draft, category, eligible, config.chaos);
    const rerolls = prior?.rerolls ?? 0;
    const next = slotRng(seed, category, rerolls);

    let best: Entry | null = null;
    let bestScore = -1;
    for (let draw = 0; draw < MAX_DRAWS_PER_WHEEL; draw++) {
      const candidate = weightedPick(candidates, pantry, next);
      const score = playability({ ...draft, [category]: candidate }, maxSkill);
      if (score > bestScore) {
        best = candidate;
        bestScore = score;
      }
      if (score >= threshold) break;
    }
    const chosen = best as Entry;
    draft[category] = chosen;
    slots[category] = { entryId: chosen.id, locked: false, rerolls };
  }
  return slots;
}

/** Reroll one wheel: bump its stream index, keep every other slot as-is (locked or not). */
export function reroll(config: ChallengeConfig, seed: string, slots: Slots, category: CategoryId): Slots {
  const target = slots[category];
  if (!target || target.locked) return slots;
  const pinned: Slots = {};
  for (const [key, slot] of Object.entries(slots) as Array<[CategoryId, SlotState]>) {
    pinned[key] = key === category ? { ...slot, rerolls: slot.rerolls + 1 } : { ...slot, locked: true };
  }
  const next = spin(config, seed, pinned);
  for (const key of Object.keys(next) as CategoryId[]) {
    const original = slots[key];
    if (key !== category && original && next[key]) next[key] = original;
  }
  return next;
}

export function toggleLock(slots: Slots, category: CategoryId): Slots {
  const slot = slots[category];
  if (!slot) return slots;
  return { ...slots, [category]: { ...slot, locked: !slot.locked } };
}

export function draftFromSlots(slots: Slots): Draft {
  const draft: Draft = {};
  for (const [category, slot] of Object.entries(slots) as Array<[CategoryId, SlotState]>) {
    const entry = entryById(slot.entryId);
    if (entry) draft[category] = entry;
  }
  return draft;
}
