import { Challenge as ChallengeSchema, type Challenge, type ChallengeConfig } from '@mise/schema';
import { LIBRARY_VERSION } from './library';
import { hash } from './rng';
import { spin, type Slots } from './spin';

export const CHALLENGE_LINK_SCHEME = 'mise://c/';

/** The three levels a cook picks on Spin. Each pins a skill ceiling and how weird the draw may get. */
export const LEVELS: ReadonlyArray<{ label: string; difficulty: ChallengeConfig['difficulty']; chaos: number }> = [
  { label: 'Easy', difficulty: 'easy', chaos: 0.2 },
  { label: 'Medium', difficulty: 'standard', chaos: 0.45 },
  { label: 'Hard', difficulty: 'master', chaos: 0.8 },
];

const DEFAULT_LEVEL = LEVELS[1]!;

export const DEFAULT_CONFIG: ChallengeConfig = {
  categories: ['protein', 'produce', 'equipment', 'style'],
  difficulty: DEFAULT_LEVEL.difficulty,
  chaos: DEFAULT_LEVEL.chaos,
  mode: 'free-play',
  excludeAllergens: [],
  diets: [],
  excludeEntryIds: [],
  availableEquipmentIds: null,
  pantryEntryIds: [],
};

/** Challenge ids derive from seed + config so the same spin always links to the same id. */
export function challengeId(seed: string, config: ChallengeConfig): string {
  return hash(`${seed}:${JSON.stringify(config)}`).toString(36);
}

export function createChallenge(config: ChallengeConfig, seed: string, previous: Slots = {}, now = new Date()): Challenge {
  const slots = spin(config, seed, previous);
  return ChallengeSchema.parse({
    id: challengeId(seed, config),
    seed,
    libraryVersion: LIBRARY_VERSION,
    config,
    slots,
    createdAt: now.toISOString(),
  });
}

export function challengeLink(challenge: Pick<Challenge, 'id' | 'seed'>): string {
  return `${CHALLENGE_LINK_SCHEME}${challenge.id}?s=${challenge.seed}`;
}

export function parseChallengeLink(link: string): { id: string; seed: string } | null {
  if (!link.startsWith(CHALLENGE_LINK_SCHEME)) return null;
  const rest = link.slice(CHALLENGE_LINK_SCHEME.length);
  const [id, query = ''] = rest.split('?');
  const seed = new URLSearchParams(query).get('s');
  if (!id || !seed) return null;
  return { id, seed };
}
