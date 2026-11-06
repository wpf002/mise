import { NONE, defineCategory } from './types';

const equipment = defineCategory('equipment', {
  roles: [], allergens: [], diets: NONE, safetyClass: 'none', skill: 1, centrality: 'supporting',
});

/** The pop-up toaster can only toast, so it never carries a dish alone. */
export const EQUIPMENT = equipment([
  { id: 'toaster', label: 'Pop-Up Toaster', emoji: '🍞', capabilities: ['toast'] },
  { id: 'cast-iron', label: 'Cast Iron Skillet', emoji: '🍳', capabilities: ['sear', 'fry', 'bake', 'roast'] },
  { id: 'nonstick-skillet', label: 'Nonstick Skillet', emoji: '🍳', capabilities: ['sear', 'fry'] },
  { id: 'air-fryer', label: 'Air Fryer', emoji: '🌀', capabilities: ['air-fry', 'roast', 'bake'] },
  { id: 'sheet-pan', label: 'Sheet Pan', emoji: '🟫', capabilities: ['roast', 'bake', 'broil'] },
  { id: 'dutch-oven', label: 'Dutch Oven', emoji: '🫕', capabilities: ['braise', 'simmer', 'bake', 'sear', 'fry'] },
  { id: 'instant-pot', label: 'Pressure Cooker', emoji: '⏲️', capabilities: ['pressure', 'simmer', 'sear', 'steam', 'slow'] },
  { id: 'slow-cooker', label: 'Slow Cooker', emoji: '🍲', capabilities: ['slow', 'braise'] },
  { id: 'grill', label: 'Outdoor Grill', emoji: '🔥', capabilities: ['grill', 'sear', 'smoke'] },
  { id: 'grill-pan', label: 'Grill Pan', emoji: '🍳', capabilities: ['grill', 'sear'] },
  { id: 'wok', label: 'Wok', emoji: '🥘', capabilities: ['fry', 'sear', 'steam', 'boil'], skill: 2 },
  { id: 'blender', label: 'Blender', emoji: '🥤', capabilities: ['blend'] },
  { id: 'immersion-blender', label: 'Immersion Blender', emoji: '🪄', capabilities: ['blend', 'whip'] },
  { id: 'food-processor', label: 'Food Processor', emoji: '⚙️', capabilities: ['blend', 'chop'] },
  { id: 'stand-mixer', label: 'Stand Mixer', emoji: '🥣', capabilities: ['whip'], skill: 2 },
  { id: 'microwave', label: 'Microwave', emoji: '📻', capabilities: ['microwave', 'steam'] },
  { id: 'broiler', label: 'Oven Broiler', emoji: '♨️', capabilities: ['broil', 'roast', 'bake'] },
  { id: 'rice-cooker', label: 'Rice Cooker', emoji: '🍚', capabilities: ['steam', 'simmer'] },
  { id: 'saucepan', label: 'Saucepan', emoji: '🥛', capabilities: ['boil', 'simmer'] },
  { id: 'stockpot', label: 'Stockpot', emoji: '🍲', capabilities: ['boil', 'simmer', 'braise'] },
  { id: 'mortar-pestle', label: 'Mortar and Pestle', emoji: '🪨', capabilities: ['chop'], skill: 2 },
  { id: 'box-grater', label: 'Box Grater', emoji: '🧀', capabilities: ['chop'] },
  { id: 'mandoline', label: 'Mandoline', emoji: '🔪', capabilities: ['chop'], skill: 2 },
  { id: 'waffle-iron', label: 'Waffle Iron', emoji: '🧇', capabilities: ['press', 'toast'], skill: 2 },
  { id: 'toaster-oven', label: 'Toaster Oven', emoji: '📦', capabilities: ['toast', 'bake', 'roast', 'broil'] },
  { id: 'panini-press', label: 'Panini Press', emoji: '🥪', capabilities: ['press', 'grill', 'toast'] },
  { id: 'smoker', label: 'Smoker', emoji: '💨', capabilities: ['smoke', 'slow'], skill: 3 },
  { id: 'sous-vide', label: 'Sous Vide', emoji: '🌡️', capabilities: ['simmer'], skill: 3 },
  { id: 'deep-fryer', label: 'Deep Fryer', emoji: '🍟', capabilities: ['fry'], skill: 2 },
  { id: 'kettle', label: 'Electric Kettle', emoji: '🫖', capabilities: ['boil'] },
]);
