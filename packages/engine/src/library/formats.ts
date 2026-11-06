import { PLANT, WHEAT_VEG, defineCategory } from './types';

const format = defineCategory('format', {
  roles: [], allergens: [], diets: PLANT, safetyClass: 'none', skill: 1, centrality: 'supporting',
});

export const FORMATS = format([
  { id: 'sandwich', label: 'Sandwich', emoji: '🥪', roles: ['starch'], allergens: ['wheat'], diets: WHEAT_VEG },
  { id: 'bowl', label: 'Bowl', emoji: '🥣' },
  { id: 'taco', label: 'Tacos', emoji: '🌮', roles: ['starch'] },
  { id: 'wrap', label: 'Wrap', emoji: '🌯', roles: ['starch'], allergens: ['wheat'], diets: WHEAT_VEG },
  { id: 'salad', label: 'Salad', emoji: '🥗', roles: ['fresh'] },
  { id: 'soup', label: 'Soup', emoji: '🍲' },
  { id: 'stew', label: 'Stew', emoji: '🍲', skill: 2 },
  { id: 'pasta', label: 'Pasta', emoji: '🍝', roles: ['starch'], allergens: ['wheat'], diets: WHEAT_VEG },
  { id: 'pizza', label: 'Pizza', emoji: '🍕', roles: ['starch'], allergens: ['wheat'], diets: WHEAT_VEG, skill: 2 },
  { id: 'flatbread', label: 'Flatbread', emoji: '🫓', roles: ['starch'], allergens: ['wheat'], diets: WHEAT_VEG },
  { id: 'fried-rice', label: 'Fried Rice', emoji: '🍚', roles: ['starch'] },
  { id: 'noodle-soup', label: 'Noodle Soup', emoji: '🍜', roles: ['starch'], allergens: ['wheat'], diets: WHEAT_VEG },
  { id: 'skewers', label: 'Skewers', emoji: '🍢' },
  { id: 'sliders', label: 'Sliders', emoji: '🍔', roles: ['starch'], allergens: ['wheat'], diets: WHEAT_VEG },
  { id: 'burger', label: 'Burger', emoji: '🍔', roles: ['starch'], allergens: ['wheat'], diets: WHEAT_VEG },
  { id: 'stuffed-vegetable', label: 'Stuffed Vegetable', emoji: '🫑', skill: 2 },
  { id: 'casserole', label: 'Casserole', emoji: '🥘' },
  { id: 'hand-pie', label: 'Hand Pies', emoji: '🥟', roles: ['starch'], allergens: ['wheat'], diets: WHEAT_VEG, skill: 2 },
  { id: 'dumplings', label: 'Dumplings', emoji: '🥟', roles: ['starch'], allergens: ['wheat'], diets: WHEAT_VEG, skill: 2 },
  { id: 'rice-plate', label: 'Rice Plate', emoji: '🍛', roles: ['starch'] },
  { id: 'sheet-pan-dinner', label: 'Sheet Pan Dinner', emoji: '🟫' },
  { id: 'toast', label: 'Loaded Toast', emoji: '🍞', roles: ['starch', 'crunch'], allergens: ['wheat'], diets: WHEAT_VEG },
  { id: 'lettuce-cups', label: 'Lettuce Cups', emoji: '🥬', roles: ['fresh', 'crunch'] },
  { id: 'quesadilla', label: 'Quesadilla', emoji: '🧀', roles: ['starch', 'fat'], allergens: ['milk', 'wheat'], diets: ['vegetarian', 'pescatarian', 'halal', 'kosher'] },
  { id: 'frittata', label: 'Frittata', emoji: '🍳', roles: ['binder'], allergens: ['egg'], diets: ['vegetarian', 'pescatarian', 'gluten-free', 'dairy-free', 'halal', 'kosher'] },
  { id: 'grain-salad', label: 'Grain Salad', emoji: '🌾', roles: ['starch', 'fresh'] },
  { id: 'hash', label: 'Hash', emoji: '🥔', roles: ['starch', 'crunch'] },
  { id: 'nachos', label: 'Nachos', emoji: '🧀', roles: ['starch', 'crunch'] },
  { id: 'curry', label: 'Curry', emoji: '🍛' },
  { id: 'smorgasbord', label: 'Snack Board', emoji: '🧀', roles: ['fresh'] },
]);
