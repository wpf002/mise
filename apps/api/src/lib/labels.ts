import { entryById } from '@mise/engine';
import type { Challenge } from '@mise/schema';

/** entryId → label for every slot, so prompts never see raw ids alone. */
export function challengeLabels(challenge: Challenge): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const slot of Object.values(challenge.slots)) {
    labels[slot.entryId] = entryById(slot.entryId)?.label ?? slot.entryId;
  }
  return labels;
}
