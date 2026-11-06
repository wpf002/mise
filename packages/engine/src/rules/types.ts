/** A pantry ingredient the rules engine adds. `alt` is used when `name` hits an excluded allergen. */
export interface PantryItem {
  name: string;
  quantity: string;
  prep?: string;
  alt?: PantryItem;
}

export type Technique =
  | 'sear' | 'roast' | 'grill' | 'braise' | 'air-fry' | 'shallow-fry' | 'deep-fry' | 'stir-fry'
  | 'steam' | 'poach' | 'bake' | 'broil' | 'smoke' | 'slow' | 'pressure' | 'raw';

export type ProteinClass =
  | 'steak' | 'ground' | 'poultry' | 'wings' | 'whole-bird' | 'tough' | 'fish' | 'shellfish'
  | 'mussels' | 'eggs' | 'firm' | 'beans' | 'canned-fish' | 'bacon';

export interface ProteinProfile {
  quantity: string;
  prep: string;
  cls: ProteinClass;
  sub: string;
}

export interface ClassProfile {
  /** Minutes per side in a hot pan. */
  searPerSide: number;
  searHeat: 'medium' | 'medium-high' | 'high';
  ovenTempF: number;
  ovenMinutes: number;
  grillMinutes: number;
  braiseMinutes: number;
  airFryTempF: number;
  airFryMinutes: number;
  fryMinutes: number;
  simmerMinutes: number;
  /** What done looks like, in the cook's hands. */
  doneCue: string;
  restMinutes: number;
  techniques: Technique[];
  fallback: Technique;
  tips: string[];
  storage: string;
}

export type ProduceMethod = 'roast' | 'saute' | 'raw' | 'wilt' | 'char' | 'simmer' | 'steam';

export interface ProduceProfile {
  quantity: string;
  prep: string;
  method: ProduceMethod;
  minutes: number;
  doneCue: string;
  sub: string;
}

export interface CuisineProfile {
  fat: PantryItem;
  aromatics: PantryItem[];
  spice: PantryItem[];
  liquid: PantryItem;
  acid: PantryItem;
  garnish: PantryItem[];
}

export type Stage = 'marinade' | 'sauce' | 'finish' | 'crunch';

export interface FlavorProfile {
  item: PantryItem;
  stage: Stage;
  how: string;
}

export interface WildcardProfile {
  quantity: string;
  prep?: string;
  stage: Stage;
  how: string;
  sub: string;
}

export interface FormatProfile {
  base: PantryItem[];
  baseStep?: { title: string; text: string; minutes: number };
  /** True when the dish is served in liquid: the hero and produce simmer in the sauce. */
  brothy?: boolean;
  assembly: string;
  plating: string;
}

export interface EquipmentProfile {
  /** Named vessel with a size, used when the tool can perform the chosen technique. */
  vessel?: string;
  /** A job for tools that cannot cook the hero. */
  role?: { title: string; text: string; minutes: number; when: 'prep' | 'sauce' | 'assembly' };
}
