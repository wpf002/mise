import { describe, expect, it } from 'vitest';
import type { ChallengeConfig } from '@mise/schema';
import { DEFAULT_CONFIG, challengeLink, createChallenge, parseChallengeLink } from './challenge';
import { dailySeed, dayKey } from './daily';
import { entryById, LIBRARY } from './library';
import { rulesRecipe } from './rules';
import { sampleChallenge, sampleRecipe } from './sample';
import { eligibleEntries, reroll, spin, toggleLock } from './spin';
import { validateRecipe } from './validate';

const seeds = Array.from({ length: 2000 }, (_, index) => index.toString(16).padStart(16, '0'));
const ALL: ChallengeConfig = { ...DEFAULT_CONFIG, categories: ['protein', 'produce', 'equipment', 'style', 'cuisine', 'wildcard', 'format', 'flavor'] };

describe('spin', () => {
  it('is deterministic', () => {
    expect(spin(ALL, 'abc')).toEqual(spin(ALL, 'abc'));
  });

  it('never serves an excluded allergen across thousands of seeds', () => {
    const config: ChallengeConfig = { ...ALL, excludeAllergens: ['milk', 'shellfish', 'wheat'] };
    for (const seed of seeds) {
      for (const slot of Object.values(spin(config, seed))) {
        const entry = entryById(slot.entryId);
        expect(entry?.allergens).not.toContain('milk');
        expect(entry?.allergens).not.toContain('shellfish');
        expect(entry?.allergens).not.toContain('wheat');
      }
    }
  });

  it('respects vegan + gluten-free diets on food wheels', () => {
    const config: ChallengeConfig = { ...ALL, diets: ['vegan', 'gluten-free'] };
    for (const seed of seeds.slice(0, 500)) {
      const slots = spin(config, seed);
      for (const category of ['protein', 'produce', 'wildcard', 'format', 'flavor'] as const) {
        const entry = entryById(slots[category]!.entryId)!;
        expect(entry.diets).toContain('vegan');
        expect(entry.diets).toContain('gluten-free');
      }
    }
  });

  it('locked wheels never change on reroll', () => {
    for (const seed of seeds.slice(0, 300)) {
      const first = spin(ALL, seed);
      const locked = toggleLock(toggleLock(first, 'protein'), 'cuisine');
      const next = reroll(ALL, seed, locked, 'produce');
      expect(next.protein!.entryId).toBe(first.protein!.entryId);
      expect(next.cuisine!.entryId).toBe(first.cuisine!.entryId);
      expect(next.produce!.rerolls).toBe(1);
      for (const category of ALL.categories) {
        if (category !== 'produce') expect(next[category]!.entryId).toBe(first[category]!.entryId);
      }
    }
  });

  it('rerolling changes the wheel most of the time', () => {
    let changed = 0;
    for (const seed of seeds.slice(0, 200)) {
      const first = spin(ALL, seed);
      const next = reroll(ALL, seed, first, 'protein');
      if (next.protein!.entryId !== first.protein!.entryId) changed++;
    }
    expect(changed).toBeGreaterThan(180);
  });

  it('keeps the toaster from carrying a cooked style at low chaos', () => {
    const config: ChallengeConfig = { ...DEFAULT_CONFIG, chaos: 0, availableEquipmentIds: ['toaster'] };
    for (const seed of seeds.slice(0, 200)) {
      const slots = spin(config, seed);
      const style = entryById(slots.style!.entryId)!;
      expect(style.needs?.includes('toast') || !style.needs?.length).toBe(true);
    }
  });

  it('weights pantry items up', () => {
    const config: ChallengeConfig = { ...ALL, pantryEntryIds: ['salmon'] };
    const hits = seeds.filter((seed) => spin(config, seed).protein!.entryId === 'salmon').length;
    const baseline = seeds.filter((seed) => spin(ALL, seed).protein!.entryId === 'salmon').length;
    expect(hits).toBeGreaterThan(baseline * 2);
  });

  it('filters by available equipment', () => {
    expect(eligibleEntries({ ...ALL, availableEquipmentIds: ['wok'] }, 'equipment').map((entry) => entry.id)).toEqual(['wok']);
  });

  it('has enough entries per category', () => {
    for (const category of ALL.categories) {
      expect(LIBRARY.filter((entry) => entry.category === category).length).toBeGreaterThanOrEqual(26);
    }
  });
});

describe('challenge', () => {
  it('round-trips links', () => {
    const challenge = createChallenge(ALL, 'deadbeefcafef00d');
    expect(parseChallengeLink(challengeLink(challenge))).toEqual({ id: challenge.id, seed: challenge.seed });
    expect(parseChallengeLink('https://nope')).toBeNull();
  });
});

describe('validate', () => {
  it('passes the sample recipe', () => {
    expect(validateRecipe(sampleRecipe(), sampleChallenge())).toEqual([]);
  });

  it('passes the rules fallback for many seeds', () => {
    for (const seed of seeds.slice(0, 300)) {
      const challenge = createChallenge({ ...ALL, timeLimitMinutes: 30, excludeAllergens: ['peanut'] }, seed);
      expect(validateRecipe(rulesRecipe(challenge), challenge)).toEqual([]);
    }
  });

  it('uses "an" before vowel-led equipment in the rules fallback', () => {
    const challenge = seeds
      .map((seed) => createChallenge({ ...ALL, timeLimitMinutes: 30 }, seed))
      .find((candidate) => candidate.slots.equipment?.entryId === 'air-fryer');
    if (!challenge) throw new Error('no seed picked the air fryer');
    expect(rulesRecipe(challenge).equipmentNotes).toEqual(['Built for an air fryer.']);
  });

  it('flags allergens by keyword and time overruns', () => {
    const challenge = createChallenge({ ...ALL, timeLimitMinutes: 20, excludeAllergens: ['milk'] }, 'abc');
    const recipe = { ...rulesRecipe(challenge), totalMinutes: 45, ingredients: [{ name: 'Heavy cream', quantity: '1 cup', mandatory: true }] };
    const codes = validateRecipe(recipe, challenge).map((issue) => issue.code);
    expect(codes).toContain('allergen');
    expect(codes).toContain('time');
  });
});

describe('daily', () => {
  it('keys days by time zone', () => {
    expect(dayKey(new Date('2026-11-06T03:00:00Z'), 'America/Los_Angeles')).toBe('2026-11-05');
    expect(dayKey(new Date('2026-11-06T03:00:00Z'), 'UTC')).toBe('2026-11-06');
  });
  it('mints stable 16-char seeds', () => {
    expect(dailySeed('u1', '2026-11-06')).toMatch(/^[0-9a-f]{16}$/);
    expect(dailySeed('u1', '2026-11-06')).toBe(dailySeed('u1', '2026-11-06'));
  });
});
