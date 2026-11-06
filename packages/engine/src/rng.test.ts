import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { hash, newSeed, slotRng } from './rng';
import { SAFETY } from './safety';
import { LIBRARY } from './library';

describe('rng', () => {
  it('is deterministic for the same seed, category, and reroll count', () => {
    const a = slotRng('abc', 'protein', 0);
    const b = slotRng('abc', 'protein', 0);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('rerolling one wheel leaves other wheels untouched', () => {
    const produceBefore = slotRng('abc', 'produce', 0)();
    slotRng('abc', 'protein', 1)();
    expect(slotRng('abc', 'produce', 0)()).toBe(produceBefore);
  });

  it('produces different streams per category', () => {
    expect(hash('abc:protein:0')).not.toBe(hash('abc:produce:0'));
  });

  it('mints 16-char hex seeds', () => {
    expect(newSeed((n) => new Uint8Array(randomBytes(n)))).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe('library invariants', () => {
  it('has unique ids', () => {
    const ids = LIBRARY.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('pop-up toaster can only toast', () => {
    expect(LIBRARY.find((e) => e.id === 'toaster')?.capabilities).toEqual(['toast']);
  });

  it('ground meat safety is 160F', () => {
    expect(SAFETY['ground-meat'].minTempF).toBe(160);
  });
});
