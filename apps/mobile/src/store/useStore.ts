import { DEFAULT_CONFIG, rulesRecipe } from '@mise/engine';
import type { Challenge, ChallengeConfig, Recipe, TasteProfile } from '@mise/schema';
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
}

export interface CurrentRun {
  challenge: Challenge;
  recipe: Recipe | null;
  fallbackReason: FallbackReason;
}

/** The recipe open in Cook Mode. */
export interface CookRun {
  id: string;
  challenge: Challenge;
  recipe: Recipe;
  fallbackReason: FallbackReason;
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
  cook: CookRun | null;
  history: SavedRecipe[];
  pantry: string[];

  setProfile: (profile: TasteProfile) => void;
  setConfig: (patch: Partial<ChallengeConfig>) => void;
  setCurrent: (run: CurrentRun | null) => void;
  setToday: (pick: TodayPick | null) => void;
  startCook: (run: Omit<CookRun, 'id'>) => CookRun;
  endCook: () => void;
  saveRecipe: (entry: Omit<SavedRecipe, 'id' | 'savedAt'>) => SavedRecipe;
  updateSaved: (id: string, patch: Partial<SavedRecipe>) => void;
  removeSaved: (id: string) => void;
  setPantry: (ids: string[]) => void;
}

/** Bump when a persisted shape changes. v2: grouped recipes, no timer or judge. */
const STORE_VERSION = 2;
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
      cook: null,
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
      startCook: (run) => {
        const cook: CookRun = { ...run, id: mintId() };
        set({ cook });
        return cook;
      },
      endCook: () => set({ cook: null }),
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
      version: STORE_VERSION,
      storage: createJSONStorage(() => Storage),
      /** Recipes persisted before STORE_VERSION use the old flat shape. Drop them; settings and profile survive. */
      migrate: (persisted, version) => {
        const state = persisted as Partial<State>;
        if (version < STORE_VERSION) return { ...state, today: null, history: [], current: null, cook: null };
        return state;
      },
    },
  ),
);

export function localFallback(challenge: Challenge): CurrentRun {
  return { challenge, recipe: rulesRecipe(challenge), fallbackReason: 'offline' };
}
