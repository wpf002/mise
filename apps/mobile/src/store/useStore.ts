import { DEFAULT_CONFIG, rulesRecipe } from '@mise/engine';
import type { Challenge, ChallengeConfig, JudgeResult, Mode, Recipe, TasteProfile } from '@mise/schema';
import Storage from 'expo-sqlite/kv-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { RecipeOutcome } from '../api/client';
import { mintId } from '../lib/seed';

export type FallbackReason = RecipeOutcome['fallbackReason'] | 'offline';

export interface SavedRecipe {
  id: string;
  challenge: Challenge;
  recipe: Recipe;
  fallbackReason: FallbackReason;
  savedAt: string;
  rating: number | null;
  notes: string;
  photoUri: string | null;
  judge: JudgeResult | null;
}

export interface CurrentRun {
  challenge: Challenge;
  recipe: Recipe | null;
  fallbackReason: FallbackReason;
}

export interface ArenaRun {
  id: string;
  mode: Mode;
  challenge: Challenge;
  recipe: Recipe;
  /** Epoch ms. The timer is derived from these, never from ticks, so a locked phone can't drift it. */
  startedAt: number;
  durationMs: number;
  pausedAt: number | null;
  pausedTotalMs: number;
  strict: boolean;
}

export interface TodayPick {
  day: string;
  swap: 0 | 1;
  challenge: Challenge;
  recipe: Recipe;
  fallbackReason: FallbackReason;
}

interface State {
  deviceId: string;
  onboarded: boolean;
  profile: TasteProfile | null;
  config: ChallengeConfig;
  current: CurrentRun | null;
  today: TodayPick | null;
  arena: ArenaRun | null;
  history: SavedRecipe[];
  pantry: string[];

  setProfile: (profile: TasteProfile) => void;
  setConfig: (patch: Partial<ChallengeConfig>) => void;
  setCurrent: (run: CurrentRun | null) => void;
  setToday: (pick: TodayPick | null) => void;
  startArena: (run: Omit<ArenaRun, 'id' | 'pausedAt' | 'pausedTotalMs'>) => ArenaRun;
  pauseArena: () => void;
  resumeArena: () => void;
  endArena: () => void;
  saveRecipe: (entry: Omit<SavedRecipe, 'id' | 'savedAt'>) => SavedRecipe;
  updateSaved: (id: string, patch: Partial<SavedRecipe>) => void;
  removeSaved: (id: string) => void;
  setPantry: (ids: string[]) => void;
}

const MAX_HISTORY = 200;

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      deviceId: mintId(),
      onboarded: false,
      profile: null,
      config: DEFAULT_CONFIG,
      current: null,
      today: null,
      arena: null,
      history: [],
      pantry: [],

      setProfile: (profile) =>
        set({
          profile,
          onboarded: true,
          config: {
            ...get().config,
            excludeAllergens: profile.allergens,
            diets: profile.diets,
            excludeEntryIds: profile.dislikedEntryIds,
            availableEquipmentIds: profile.equipmentIds.length ? profile.equipmentIds : null,
            difficulty: profile.preferredDifficulty,
          },
        }),
      setConfig: (patch) => set({ config: { ...get().config, ...patch } }),
      setCurrent: (current) => set({ current }),
      setToday: (today) => set({ today }),
      startArena: (run) => {
        const arena: ArenaRun = { ...run, id: mintId(), pausedAt: null, pausedTotalMs: 0 };
        set({ arena });
        return arena;
      },
      pauseArena: () => {
        const arena = get().arena;
        if (!arena || arena.pausedAt !== null || arena.strict) return;
        set({ arena: { ...arena, pausedAt: Date.now() } });
      },
      resumeArena: () => {
        const arena = get().arena;
        if (!arena || arena.pausedAt === null) return;
        set({ arena: { ...arena, pausedAt: null, pausedTotalMs: arena.pausedTotalMs + (Date.now() - arena.pausedAt) } });
      },
      endArena: () => set({ arena: null }),
      saveRecipe: (entry) => {
        const saved: SavedRecipe = { ...entry, id: mintId(), savedAt: new Date().toISOString() };
        set({ history: [saved, ...get().history].slice(0, MAX_HISTORY) });
        return saved;
      },
      updateSaved: (id, patch) => set({ history: get().history.map((item) => (item.id === id ? { ...item, ...patch } : item)) }),
      removeSaved: (id) => set({ history: get().history.filter((item) => item.id !== id) }),
      setPantry: (pantry) => set({ pantry, config: { ...get().config, pantryEntryIds: pantry } }),
    }),
    {
      name: 'mise.v1',
      storage: createJSONStorage(() => Storage),
    },
  ),
);

/** Remaining ms on an arena run, from timestamps only. */
export function arenaRemainingMs(run: ArenaRun, now = Date.now()): number {
  const pausedNow = run.pausedAt !== null ? now - run.pausedAt : 0;
  const elapsed = now - run.startedAt - run.pausedTotalMs - pausedNow;
  return Math.max(0, run.durationMs - elapsed);
}

export function localFallback(challenge: Challenge): CurrentRun {
  return { challenge, recipe: rulesRecipe(challenge), fallbackReason: 'offline' };
}
