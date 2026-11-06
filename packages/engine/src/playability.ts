import type { CategoryId } from '@mise/schema';
import type { Entry, Role } from './library';

export type Draft = Partial<Record<CategoryId, Entry>>;

/** Roles a complete dish wants covered by at least one entry. */
const BALANCE_ROLES: Role[] = ['fat', 'acid', 'crunch', 'aromatic'];

const WEIGHT = { equipment: 0.5, balance: 0.3, skill: 0.2 } as const;

/** Can the chosen equipment carry the chosen style? Toaster-only can't braise. */
export function equipmentCarriesStyle(draft: Draft): number {
  const style = draft.style;
  const equipment = draft.equipment;
  if (!style?.needs?.length || !equipment) return 1;
  const capabilities = new Set(equipment.capabilities ?? []);
  return style.needs.some((need) => capabilities.has(need)) ? 1 : 0;
}

/** Share of balance roles covered across every chosen entry. */
export function roleBalance(draft: Draft): number {
  const roles = new Set<Role>();
  for (const entry of Object.values(draft)) {
    for (const role of entry.roles) roles.add(role);
  }
  const covered = BALANCE_ROLES.filter((role) => roles.has(role)).length;
  return covered / BALANCE_ROLES.length;
}

/** 1 when every entry fits the skill ceiling, falling off per step over it. */
export function skillFit(draft: Draft, maxSkill: number): number {
  const over = Object.values(draft).map((entry) => Math.max(0, entry.skill - maxSkill));
  const worst = Math.max(0, ...over);
  return Math.max(0, 1 - worst * 0.5);
}

/** 0..1. The Chaos slider sets how low a draft can score and still be served. */
export function playability(draft: Draft, maxSkill: number): number {
  return (
    WEIGHT.equipment * equipmentCarriesStyle(draft) +
    WEIGHT.balance * roleBalance(draft) +
    WEIGHT.skill * skillFit(draft, maxSkill)
  );
}
