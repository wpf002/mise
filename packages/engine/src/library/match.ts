import { LIBRARY, type Entry } from './index';

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Best-effort name → library entry for Fridge Snap results and free-text pantry input.
 * Exact label match wins, then id match, then a whole-word overlap on the label.
 */
export function matchEntry(name: string): Entry | undefined {
  const needle = normalize(name);
  if (!needle) return undefined;
  const byLabel = LIBRARY.find((entry) => normalize(entry.label) === needle);
  if (byLabel) return byLabel;
  const asId = needle.replace(/ /g, '-');
  const byId = LIBRARY.find((entry) => entry.id === asId);
  if (byId) return byId;
  const words = new Set(needle.split(' '));
  let best: Entry | undefined;
  let bestOverlap = 0;
  for (const entry of LIBRARY) {
    if (entry.category === 'style' || entry.category === 'cuisine' || entry.category === 'flavor' || entry.category === 'format') continue;
    const labelWords = normalize(entry.label).split(' ');
    const overlap = labelWords.filter((word) => words.has(word) || words.has(`${word}s`) || words.has(word.replace(/s$/, ''))).length;
    if (overlap > bestOverlap && overlap >= Math.ceil(labelWords.length / 2)) {
      best = entry;
      bestOverlap = overlap;
    }
  }
  return best;
}
