/**
 * Safe minimum internal temperatures (USDA FSIS chart). This table is the source
 * of truth for safety notes: the AI never supplies these numbers.
 * Re-verify against https://www.fsis.usda.gov before each release.
 */
export type SafetyClass =
  'ground-meat' | 'poultry' | 'fish' | 'whole-cut' | 'egg' | 'shellfish' | 'none';

export interface SafetyRule {
  minTempF?: number;
  restMinutes?: number;
  note: string;
}

export const SAFETY: Record<SafetyClass, SafetyRule> = {
  'ground-meat': {
    minTempF: 160,
    note: 'Cook ground beef, pork, lamb, and veal to 160°F. Check with a thermometer.',
  },
  poultry: { minTempF: 165, note: 'Cook all poultry, including ground poultry, to 165°F.' },
  fish: {
    minTempF: 145,
    note: 'Cook fish to 145°F or until the flesh is opaque and flakes with a fork.',
  },
  'whole-cut': {
    minTempF: 145,
    restMinutes: 3,
    note: 'Cook steaks, chops, and roasts to 145°F, then rest 3 minutes.',
  },
  egg: {
    minTempF: 160,
    note: 'Cook egg dishes to 160°F. Cook eggs until yolk and white are firm.',
  },
  shellfish: {
    note: 'Cook shrimp, lobster, and crab until the flesh is pearly and opaque. Discard clams, mussels, and oysters that do not open.',
  },
  none: { note: '' },
};

export const LEFTOVERS_REHEAT_F = 165;
