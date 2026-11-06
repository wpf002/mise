import type { ChallengeConfig, TasteProfile } from '@mise/schema';
import { DEFAULT_CONFIG } from './challenge';
import { hash } from './rng';

const DAILY_CATEGORIES: ChallengeConfig['categories'] = ['protein', 'produce', 'cuisine', 'style', 'equipment'];
const DAILY_CHAOS = 0.25;

export function dayKey(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? '00';
  return `${pick('year')}-${pick('month')}-${pick('day')}`;
}

/** One seed per user per day: the same phone shows the same pick all day. */
export function dailySeed(userId: string, day: string): string {
  return hash(`daily:${userId}:${day}`).toString(16).padStart(16, '0').slice(0, 16);
}

const PROFILE_SKILL: Record<TasteProfile['skill'], ChallengeConfig['difficulty']> = {
  new: 'easy', home: 'easy', confident: 'standard', pro: 'master',
};

export function dailyConfig(profile: TasteProfile | null): ChallengeConfig {
  if (!profile) return { ...DEFAULT_CONFIG, categories: DAILY_CATEGORIES, chaos: DAILY_CHAOS };
  return {
    ...DEFAULT_CONFIG,
    categories: DAILY_CATEGORIES,
    chaos: DAILY_CHAOS,
    difficulty: PROFILE_SKILL[profile.skill],
    excludeAllergens: profile.allergens,
    diets: profile.diets,
    excludeEntryIds: profile.dislikedEntryIds,
    availableEquipmentIds: profile.equipmentIds.length ? profile.equipmentIds : null,
    pantryEntryIds: [...profile.favoriteProteins, ...profile.favoriteCuisines],
  };
}
