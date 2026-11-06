import { DAIRY, PLANT, defineCategory } from './types';

const flavor = defineCategory('flavor', {
  roles: [], allergens: [], diets: PLANT, safetyClass: 'none', skill: 1, centrality: 'supporting',
});

export const FLAVORS = flavor([
  { id: 'buttery', label: 'Buttery', emoji: '🧈', roles: ['fat'], allergens: ['milk'], diets: DAIRY },
  { id: 'crunchy', label: 'Crunchy', emoji: '🥨', roles: ['crunch'] },
  { id: 'smoky', label: 'Smoky', emoji: '💨', roles: ['umami'] },
  { id: 'spicy', label: 'Spicy', emoji: '🌶️', roles: ['heat'] },
  { id: 'tangy', label: 'Tangy', emoji: '🍋', roles: ['acid'] },
  { id: 'sweet-heat', label: 'Sweet Heat', emoji: '🍯', roles: ['sweet', 'heat'] },
  { id: 'umami-bomb', label: 'Umami Bomb', emoji: '💣', roles: ['umami'] },
  { id: 'herby', label: 'Herby', emoji: '🌿', roles: ['aromatic', 'fresh'] },
  { id: 'garlicky', label: 'Garlicky', emoji: '🧄', roles: ['aromatic'] },
  { id: 'citrusy', label: 'Citrusy', emoji: '🍊', roles: ['acid', 'fresh'] },
  { id: 'creamy', label: 'Creamy', emoji: '🥛', roles: ['fat'] },
  { id: 'char-kissed', label: 'Char-Kissed', emoji: '🔥', roles: ['umami'] },
  { id: 'nutty', label: 'Nutty', emoji: '🌰', roles: ['fat', 'crunch'], allergens: ['tree-nut'] },
  { id: 'sour', label: 'Sour', emoji: '🥒', roles: ['acid'] },
  { id: 'deeply-caramelized', label: 'Deeply Caramelized', emoji: '🍮', roles: ['sweet'] },
  { id: 'peppery', label: 'Peppery', emoji: '🫚', roles: ['heat', 'aromatic'] },
  { id: 'bright', label: 'Bright', emoji: '☀️', roles: ['acid', 'fresh'] },
  { id: 'rich', label: 'Rich', emoji: '🍫', roles: ['fat', 'umami'] },
  { id: 'cheesy', label: 'Cheesy', emoji: '🧀', roles: ['fat', 'umami'], allergens: ['milk'], diets: DAIRY },
  { id: 'funky', label: 'Funky', emoji: '🫙', roles: ['umami', 'acid'], skill: 2 },
  { id: 'floral', label: 'Floral', emoji: '🌸', roles: ['aromatic'], skill: 2 },
  { id: 'earthy', label: 'Earthy', emoji: '🍄', roles: ['umami'] },
  { id: 'fiery', label: 'Fiery', emoji: '🔥', roles: ['heat'], skill: 2 },
  { id: 'zesty', label: 'Zesty', emoji: '🍋', roles: ['acid', 'aromatic'] },
  { id: 'sticky', label: 'Sticky', emoji: '🍯', roles: ['sweet'] },
  { id: 'toasty', label: 'Toasty', emoji: '🍞', roles: ['crunch', 'aromatic'] },
]);
