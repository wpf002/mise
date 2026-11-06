import type { Challenge, Recipe } from '@mise/schema';
import { createChallenge, DEFAULT_CONFIG } from './challenge';
import { requiredSafetyNotes } from './validate';

export const SAMPLE_SEED = '5a3f9c1e2b7d4a60';

/** The ships-with-the-app challenge: beef, celery, buttery, toaster. */
export function sampleChallenge(): Challenge {
  const config = {
    ...DEFAULT_CONFIG,
    categories: ['protein', 'produce', 'flavor', 'equipment'] as Challenge['config']['categories'],
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
    prepMinutes: 10,
    cookMinutes: 20,
    totalMinutes: 30,
    equipment: ['Cutting board and chef\'s knife', '12-inch skillet', 'Pop-up toaster', 'Small bowl', 'Instant-read thermometer'],
    ingredientGroups: [
      {
        title: 'For the beef',
        items: [
          { name: 'Ground beef', quantity: '12 oz', prep: '80/20, at room temperature 15 minutes', mandatory: true, entryId: 'ground-beef' },
          { name: 'Butter', quantity: '4 tbsp', prep: 'cut into 4 pieces', mandatory: true },
          { name: 'Dijon mustard', quantity: '1 tsp', mandatory: false },
          { name: 'Kosher salt', quantity: '3/4 tsp', mandatory: true },
          { name: 'Black pepper', quantity: '1/2 tsp, freshly ground', mandatory: true },
        ],
      },
      {
        title: 'For the celery slaw',
        items: [
          { name: 'Celery', quantity: '4 stalks', prep: 'sliced paper-thin on a bias, leaves saved', mandatory: true, entryId: 'celery' },
          { name: 'Lemon', quantity: '1', prep: 'juiced, about 3 tbsp', mandatory: true },
          { name: 'Kosher salt', quantity: '1/4 tsp', mandatory: true },
        ],
      },
      {
        title: 'To serve',
        items: [
          { name: 'Sliced bread', quantity: '4 slices', prep: 'sourdough or rye, 1/2 inch thick', mandatory: true },
          { name: 'Sharp cheddar', quantity: '4 slices', mandatory: true },
        ],
      },
    ],
    steps: [
      { title: 'Make the slaw', text: 'Toss the sliced celery and leaves with the lemon juice and 1/4 teaspoon salt in a bowl. Refrigerate while you cook. The acid softens the celery just enough and keeps it crisp.', durationMinutes: 6 },
      { title: 'Brown the butter', text: 'Melt the butter in the 12-inch skillet over medium heat. It will foam, then quiet down, then the milk solids on the bottom turn the color of a hazelnut and it smells nutty, about 4 minutes. Pour half into a small bowl and leave the rest in the pan.', durationMinutes: 4 },
      { title: 'Crust the beef', text: 'Raise the heat to medium-high. Add the beef in one flat layer, season with 3/4 teaspoon salt and the pepper, and do not touch it for 3 minutes so the underside crusts. Break it into large crumbles and cook 4 more minutes, until no pink remains and an instant-read thermometer reads 160°F. Stir in the mustard off the heat.', durationMinutes: 8 },
      { title: 'Toast the bread', text: 'Toast the bread in the toaster until deep golden, 2 cycles if your toaster runs light. Toast while the beef finishes so both are hot at once.', durationMinutes: 4, equipmentId: 'toaster' },
      { title: 'Build the melts', text: 'Brush each slice of toast with the reserved brown butter. Pile the beef on two slices, lay 2 slices of cheddar on each, and tent with foil for 1 minute so the cheese slumps over the meat.', durationMinutes: 4 },
      { title: 'Top and serve', text: 'Drain the slaw and heap it on top of the cheese. Close with the second slice or eat it open-faced. Cut on the diagonal.', durationMinutes: 4 },
    ],
    tips: [
      'Brown butter goes from nutty to burnt in about 20 seconds. Pull the pan the moment it smells like toasted nuts.',
      'Leave the beef alone for the first 3 minutes. Stirring early steams it gray instead of browning it.',
    ],
    substitutions: [
      'No celery? Use thinly sliced fennel or cucumber, dressed the same way.',
      'No cheddar? Any good melting cheese works: gruyère, provolone, or Monterey Jack.',
      'No bread? Pile the beef and slaw over a baked potato.',
    ],
    storage: 'Beef keeps 3 days refrigerated. Store the slaw separately and assemble fresh. Toast does not keep.',
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
