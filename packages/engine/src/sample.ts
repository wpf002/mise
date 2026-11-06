import type { Challenge, Recipe } from '@mise/schema';
import { createChallenge, DEFAULT_CONFIG } from './challenge';
import { requiredSafetyNotes } from './validate';

export const SAMPLE_SEED = '5a3f9c1e2b7d4a60';

/** The ships-with-the-app challenge: beef, celery, buttery, toaster, 30 minutes. */
export function sampleChallenge(): Challenge {
  const config = {
    ...DEFAULT_CONFIG,
    categories: ['protein', 'produce', 'flavor', 'equipment'] as Challenge['config']['categories'],
    timeLimitMinutes: 30,
  };
  const base = createChallenge(config, SAMPLE_SEED, {}, new Date('2026-11-01T12:00:00Z'));
  return {
    ...base,
    slots: {
      protein: { entryId: 'ground-beef', locked: true, rerolls: 0 },
      produce: { entryId: 'celery', locked: true, rerolls: 0 },
      flavor: { entryId: 'buttery', locked: true, rerolls: 0 },
      equipment: { entryId: 'toaster', locked: true, rerolls: 0 },
    },
  };
}

export function sampleRecipe(): Recipe {
  const challenge = sampleChallenge();
  return {
    title: 'Brown Butter Beef Melts with Crispy Celery Slaw',
    concept: 'The toaster handles the bread. A skillet browns butter and beef. Celery stays raw and loud so the melt has something to push against.',
    servings: 2,
    totalMinutes: 30,
    ingredients: [
      { name: 'Ground beef', quantity: '12 oz', mandatory: true, entryId: 'ground-beef' },
      { name: 'Celery', quantity: '4 stalks, leaves saved', mandatory: true, entryId: 'celery' },
      { name: 'Butter', quantity: '4 tbsp', mandatory: true },
      { name: 'Sliced bread', quantity: '4 slices', mandatory: true },
      { name: 'Sharp cheddar', quantity: '4 slices', mandatory: true },
      { name: 'Lemon', quantity: '1', mandatory: true },
      { name: 'Dijon mustard', quantity: '1 tsp', mandatory: false },
      { name: 'Salt and black pepper', quantity: 'to taste', mandatory: true },
    ],
    steps: [
      { atMinute: 0, durationMinutes: 6, text: 'Slice celery paper-thin on a bias. Toss with lemon juice, a pinch of salt, and the celery leaves. Chill.' },
      { atMinute: 6, durationMinutes: 4, text: 'Melt butter in a skillet over medium until it foams, smells nutty, and turns the color of a hazelnut. Pour half into a small bowl.' },
      { atMinute: 10, durationMinutes: 8, text: 'Crank the heat. Add beef in one layer, season, and leave it alone until it crusts. Break up, cook through, and stir in the mustard.' },
      { atMinute: 18, durationMinutes: 4, text: 'Toast the bread in the toaster until deep golden.', equipmentId: 'toaster' },
      { atMinute: 22, durationMinutes: 4, text: 'Brush toast with the reserved brown butter. Pile on beef, top with cheddar, and tent with foil for a minute so the cheese slumps.' },
      { atMinute: 26, durationMinutes: 4, text: 'Drain the slaw and heap it on top. Close with the second slice or eat it open.' },
    ],
    equipmentNotes: ['The pop-up toaster only toasts. All cooking happens in a skillet.'],
    flavorNotes: 'Brown butter brings the "buttery" wheel without greasiness. Lemon on the celery keeps it from being heavy.',
    plating: 'Cut on the diagonal. Extra slaw on the side, a few celery leaves on top.',
    safetyNotes: requiredSafetyNotes(challenge),
    alternatives: [
      { title: 'Celery-Beef Smash Patties', pitch: 'Same beef, pressed thin on the skillet, slaw as the bun topper.' },
      { title: 'Buttery Beef and Celery Toast Soup', pitch: 'Brown butter beef simmered with celery, toast croutons on top.' },
    ],
    source: 'demo',
  };
}
