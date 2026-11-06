import { rulesRecipe } from '@mise/engine';
import type { Challenge } from '@mise/schema';
import { useMutation } from '@tanstack/react-query';
import { api, OfflineError } from '../api/client';
import { haptic } from '../lib/haptics';
import { useStore, type CurrentRun } from '../store/useStore';

/** Ask the chef; if the API can't be reached, build a basic plan on-device and say so. */
export async function fetchRecipe(challenge: Challenge): Promise<CurrentRun> {
  const profile = useStore.getState().profile ?? undefined;
  try {
    const outcome = await api.recipe(challenge, profile);
    return { challenge, recipe: outcome.recipe, fallbackReason: outcome.fallbackReason };
  } catch (error) {
    if (error instanceof OfflineError) return { challenge, recipe: rulesRecipe(challenge), fallbackReason: 'offline' };
    throw error;
  }
}

export function useRecipe() {
  const setCurrent = useStore((s) => s.setCurrent);
  return useMutation({
    mutationFn: fetchRecipe,
    onSuccess: (run) => {
      setCurrent(run);
      haptic.success();
    },
    onError: () => haptic.warn(),
  });
}
