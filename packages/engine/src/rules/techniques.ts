import { SAFETY, type SafetyClass } from '../safety';
import type { ClassProfile, Technique } from './types';

/** Style wheel → cooking technique. Styles without a hero technique leave it to the equipment. */
const STYLE_TECHNIQUE: Record<string, Technique> = {
  smashed: 'sear', braised: 'braise', seared: 'sear', roasted: 'roast', grilled: 'grill',
  'shallow-fried': 'shallow-fry', 'deep-fried': 'deep-fry', 'air-fried': 'air-fry', 'stir-fried': 'stir-fry',
  steamed: 'steam', poached: 'poach', baked: 'bake', broiled: 'broil', crudo: 'raw', charred: 'grill',
  'slow-cooked': 'slow', 'pressure-cooked': 'pressure', stuffed: 'bake', skewered: 'grill', breaded: 'shallow-fry',
  glazed: 'sear', smoked: 'smoke', confit: 'poach', blackened: 'sear', caramelized: 'sear', pressed: 'sear', 'one-pot': 'braise',
};

/** Equipment wheel → the technique that tool cooks with. Tools that only prep are absent. */
const EQUIPMENT_TECHNIQUE: Record<string, Technique> = {
  'cast-iron': 'sear', 'nonstick-skillet': 'sear', 'air-fryer': 'air-fry', 'sheet-pan': 'roast', 'dutch-oven': 'braise',
  'instant-pot': 'pressure', 'slow-cooker': 'slow', grill: 'grill', 'grill-pan': 'grill', wok: 'stir-fry', broiler: 'broil',
  saucepan: 'poach', stockpot: 'poach', 'toaster-oven': 'roast', smoker: 'smoke', 'deep-fryer': 'deep-fry',
};

const DEFAULT_VESSEL: Record<Technique, string> = {
  sear: '12-inch skillet', roast: 'rimmed sheet pan', grill: 'grill or grill pan', braise: '5-quart Dutch oven',
  'air-fry': 'air fryer', 'shallow-fry': '12-inch skillet', 'deep-fry': 'heavy pot with 3 inches of oil', 'stir-fry': 'wok or 12-inch skillet',
  steam: 'pot with a steamer basket', poach: '3-quart saucepan', bake: '9-by-13-inch baking dish', broil: 'broiler pan on the top rack',
  smoke: 'smoker', slow: '6-quart slow cooker', pressure: '6-quart pressure cooker', raw: 'sharp knife and a chilled plate',
};

const PREHEAT_MINUTES = 3;
const THIRD = 3;
const SLOW_HOURS_LOW = 4;
const PRESSURE_RELEASE_MINUTES = 10;

export interface TechniquePick { technique: Technique; vessel: string; equipmentId?: string }

export function pickTechnique(cls: ClassProfile, styleId: string | undefined, equipmentId: string | undefined, equipmentVessel: string | undefined): TechniquePick {
  const fromStyle = styleId ? STYLE_TECHNIQUE[styleId] : undefined;
  const fromEquipment = equipmentId ? EQUIPMENT_TECHNIQUE[equipmentId] : undefined;
  const supported = (technique: Technique | undefined): technique is Technique => technique !== undefined && cls.techniques.includes(technique);
  const technique = supported(fromStyle) ? fromStyle : supported(fromEquipment) ? fromEquipment : cls.fallback;
  if (fromEquipment === technique && equipmentVessel) return { technique, vessel: equipmentVessel, equipmentId };
  return { technique, vessel: DEFAULT_VESSEL[technique] };
}

export interface HeroStep { title: string; text: string; minutes: number }

function thermometer(safetyClass: SafetyClass): string {
  const rule = SAFETY[safetyClass];
  return rule.minTempF ? ` An instant-read thermometer in the thickest part should read ${rule.minTempF}°F.` : '';
}

/** Heat-up step for the vessel, before the hero goes in. */
export function heatStep(pick: TechniquePick, cls: ClassProfile): HeroStep | null {
  const { technique, vessel } = pick;
  switch (technique) {
    case 'sear':
    case 'shallow-fry':
      return { title: `Heat the ${vessel}`, text: technique === 'sear' ? `Set the ${vessel} over ${cls.searHeat} heat with 1 tablespoon oil. It is ready when the oil shimmers and the first wisp of smoke appears, about 2 minutes.` : `Pour 1/4 inch of oil into the ${vessel} and set it over medium-high. It is ready at 350°F, or when a pinch of flour sizzles on contact, about 4 minutes.`, minutes: technique === 'sear' ? 2 : 4 };
    case 'stir-fry':
      return { title: 'Get the wok smoking', text: `Set the ${vessel} over the highest heat, empty, until it just starts to smoke, about 3 minutes. Then add 2 tablespoons oil and swirl.`, minutes: 3 };
    case 'roast':
    case 'bake':
      return { title: `Heat the oven to ${cls.ovenTempF}°F`, text: `Set a rack in the middle and heat the oven to ${cls.ovenTempF}°F. Line the ${vessel} with parchment or brush it with oil.`, minutes: 10 };
    case 'grill':
      return { title: 'Set up a two-zone fire', text: `Heat the ${vessel} to 450 to 500°F with one side hot and the other side low. Scrape the grates clean and wipe them with an oiled paper towel.`, minutes: 10 };
    case 'air-fry':
      return { title: `Preheat the air fryer to ${cls.airFryTempF}°F`, text: `Run the ${vessel} empty at ${cls.airFryTempF}°F for ${PREHEAT_MINUTES} minutes so the food starts browning on contact.`, minutes: PREHEAT_MINUTES };
    case 'deep-fry':
      return { title: 'Heat the oil to 350°F', text: `Fill the ${vessel} and bring the oil to 350°F over medium-high, checking with a thermometer. Set a wire rack over a sheet pan beside it.`, minutes: 10 };
    case 'broil':
      return { title: 'Heat the broiler', text: `Set a rack 4 to 6 inches below the element and heat the broiler on high for 5 minutes. Set the food on the ${vessel}.`, minutes: 5 };
    case 'steam':
      return { title: 'Bring the water to a simmer', text: `Add 1 inch of water to the ${vessel}, cover, and bring to a steady simmer over medium-high.`, minutes: 5 };
    case 'poach':
      return { title: 'Bring the liquid to a bare simmer', text: `Fill the ${vessel} with enough salted water or stock to cover the food by an inch. Heat to 160 to 180°F: steam rising, a few lazy bubbles, never a boil.`, minutes: 8 };
    case 'braise':
      return { title: `Heat the ${vessel}`, text: `Set the ${vessel} over medium-high with 2 tablespoons oil until it shimmers, about 2 minutes.`, minutes: 2 };
    case 'smoke':
      return { title: 'Bring the smoker to 250°F', text: `Light the ${vessel} and stabilize it at 225 to 250°F with a mild wood like apple or oak. Add a water pan.`, minutes: 20 };
    case 'slow':
    case 'pressure':
    case 'raw':
      return null;
  }
}

export interface HeroContext { label: string; cls: ClassProfile; safetyClass: SafetyClass; crumble: boolean }

/** The main cook step(s) for the hero protein. */
export function heroSteps(pick: TechniquePick, hero: HeroContext): HeroStep[] {
  const { technique, vessel } = pick;
  const { label, cls, safetyClass, crumble } = hero;
  const name = label.toLowerCase();
  const done = `${cls.doneCue}.${thermometer(safetyClass)}`;
  const steps: HeroStep[] = [];
  switch (technique) {
    case 'sear':
      steps.push(crumble
        ? { title: `Brown the ${name}`, text: `Add the ${name} to the hot ${vessel} and press it into one flat layer. Leave it alone for ${cls.searPerSide} minutes until the underside is deeply browned. Break it into large crumbles, season with 1 teaspoon salt, and cook ${cls.searPerSide} more minutes, stirring now and then. ${done}`, minutes: cls.searPerSide * 2 }
        : { title: `Sear the ${name}`, text: `Lay the ${name} in the hot ${vessel} in a single layer with space between pieces. Do not move it for ${cls.searPerSide} minutes, until it releases easily and the underside is browned. Flip and cook ${cls.searPerSide} more minutes. ${done}`, minutes: cls.searPerSide * 2 });
      break;
    case 'shallow-fry':
      steps.push({ title: `Fry the ${name}`, text: `Dredge the ${name} in 1/2 cup flour or cornstarch seasoned with 1 teaspoon salt, shaking off the extra. Lay it in the hot oil away from you, in batches, and fry ${Math.ceil(cls.fryMinutes / 2)} minutes per side until deep golden and crisp. Drain on a wire rack. ${done}`, minutes: cls.fryMinutes + 2 });
      break;
    case 'deep-fry':
      steps.push({ title: `Fry the ${name}`, text: `Lower the ${name} into the oil in batches so the temperature stays near 350°F. Fry ${cls.fryMinutes} minutes, turning once, until deep golden and crisp. Lift to the rack and salt immediately. ${done}`, minutes: cls.fryMinutes + 3 });
      break;
    case 'stir-fry':
      steps.push({ title: `Flash-fry the ${name}`, text: `Add half the ${name} to the smoking wok in one layer. Leave it 1 minute to sear, then toss and cook ${cls.searPerSide - 1} more minutes until browned at the edges. Tip onto a plate and repeat with the rest. ${done}`, minutes: cls.searPerSide * 2 });
      break;
    case 'roast':
    case 'bake':
      steps.push({ title: `${technique === 'roast' ? 'Roast' : 'Bake'} the ${name}`, text: `Arrange the ${name} on the ${vessel} with space between pieces and drizzle with 1 tablespoon oil. ${technique === 'roast' ? 'Roast' : 'Bake'} on the middle rack ${cls.ovenMinutes} minutes, rotating the pan halfway. ${done}`, minutes: cls.ovenMinutes });
      break;
    case 'grill':
      steps.push({ title: `Grill the ${name}`, text: `Brush the ${name} with oil and set it over the hot side. Grill ${Math.ceil(cls.grillMinutes / 2)} minutes without moving it, until it releases and shows dark grill marks. Flip and cook ${Math.floor(cls.grillMinutes / 2)} more minutes, moving it to the cool side if it flares. ${done}`, minutes: cls.grillMinutes });
      break;
    case 'air-fry':
      steps.push({ title: `Air-fry the ${name}`, text: `Toss the ${name} with 1 tablespoon oil and arrange it in the basket in one layer. Cook at ${cls.airFryTempF}°F for ${cls.airFryMinutes} minutes, shaking the basket halfway. ${done}`, minutes: cls.airFryMinutes });
      break;
    case 'broil':
      steps.push({ title: `Broil the ${name}`, text: `Set the ${name} on the pan, brush with oil, and slide it under the broiler. Broil ${cls.searPerSide} minutes per side, watching constantly, until charred at the edges. ${done}`, minutes: cls.searPerSide * 2 });
      break;
    case 'steam':
      steps.push({ title: `Steam the ${name}`, text: `Set the ${name} in the basket in one layer, cover, and steam ${cls.simmerMinutes} minutes over the simmering water. ${done}`, minutes: cls.simmerMinutes });
      break;
    case 'poach':
      steps.push({ title: `Poach the ${name}`, text: `Slide the ${name} into the barely simmering liquid and hold it there ${cls.simmerMinutes} minutes, adjusting the heat so it never boils. Lift it out with a slotted spoon. ${done}`, minutes: cls.simmerMinutes });
      break;
    case 'braise':
      steps.push({ title: `Brown the ${name}`, text: `Brown the ${name} in the ${vessel} ${cls.searPerSide} minutes per side, in batches if needed, until deeply colored. Set it aside; the sauce gets built in the same pot.`, minutes: cls.searPerSide * 2 + 2 });
      steps.push({ title: `Braise the ${name}`, text: `Return the ${name} to the pot with the sauce. The liquid should come halfway up; add stock or water if it does not. Bring to a simmer. Cover, drop the heat to low, and braise ${cls.braiseMinutes} minutes, turning once. ${done}`, minutes: cls.braiseMinutes });
      break;
    case 'slow':
      steps.push({ title: `Slow-cook the ${name}`, text: `Put the ${name} in the ${vessel} with the sauce ingredients, cover, and cook on low for ${SLOW_HOURS_LOW} hours. ${done}`, minutes: SLOW_HOURS_LOW * 60 });
      break;
    case 'pressure':
      steps.push({ title: `Pressure-cook the ${name}`, text: `Use the sauté setting to brown the ${name} ${cls.searPerSide} minutes per side. Add the sauce liquid, lock the lid, and cook on high pressure ${Math.ceil(cls.braiseMinutes / THIRD)} minutes. Let the pressure release naturally for ${PRESSURE_RELEASE_MINUTES} minutes, then vent. ${done}`, minutes: cls.searPerSide * 2 + Math.ceil(cls.braiseMinutes / THIRD) + PRESSURE_RELEASE_MINUTES });
      break;
    case 'smoke':
      steps.push({ title: `Smoke the ${name}`, text: `Set the ${name} on the grate away from the heat and close the lid. Smoke ${cls.braiseMinutes} minutes, keeping the smoker at 225 to 250°F. ${done}`, minutes: cls.braiseMinutes });
      break;
    case 'raw':
      steps.push({ title: `Slice the ${name}`, text: `With the sharpest knife you have, slice the chilled ${name} across the grain into 1/4-inch pieces. Fan them on the cold plate, season with flaky salt, and spoon the sauce over 5 minutes before serving so the acid just firms the surface.`, minutes: 8 });
      break;
  }
  if (cls.restMinutes > 0 && technique !== 'raw' && technique !== 'slow' && technique !== 'braise') {
    steps.push({ title: `Rest the ${name}`, text: `Move the ${name} to a cutting board and leave it ${cls.restMinutes} minutes. The juices redistribute and the center finishes cooking. Slice it only after that.`, minutes: cls.restMinutes });
  }
  return steps;
}

export const TECHNIQUE_TIP: Record<Technique, string> = {
  sear: 'If the pan smokes hard before the food goes in, pull it off the heat for 30 seconds. A scorched pan tastes bitter.',
  roast: 'Do not crowd the pan. Pieces touching each other steam instead of browning.',
  grill: 'Keep the lid closed between flips so the grill stays hot.',
  braise: 'The liquid should come halfway up, never over the top. A braise is not a boil.',
  'air-fry': 'Open the drawer and check 3 minutes early the first time. Models run hot or cold.',
  'shallow-fry': 'Fry in batches. Adding too much at once drops the oil temperature and the crust goes soggy.',
  'deep-fry': 'Let the oil return to 350°F between batches. A thermometer clipped to the pot makes this easy.',
  'stir-fry': 'Have every ingredient cut and within reach before the wok goes on. Nothing waits once it starts.',
  steam: 'Keep the water at a simmer, not a hard boil, so the food stays tender instead of waterlogged.',
  poach: 'If you see bubbles breaking the surface, the liquid is too hot. Pull it back.',
  bake: 'Rotate the dish halfway through. Most ovens have a hot corner.',
  broil: 'Never walk away from the broiler. Thirty seconds is the difference between charred and burnt.',
  smoke: 'Thin blue smoke is right. Thick white smoke makes food taste like an ashtray.',
  slow: 'Do not lift the lid. Each peek lets out 20 minutes of heat.',
  pressure: 'Never fill the pot more than two thirds. The liquid needs room to boil.',
  raw: 'Chill the plate and the protein. Cold slices clean and tastes brighter.',
};
