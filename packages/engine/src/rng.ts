/** cyrb53: fast 53-bit string hash. Deterministic across platforms. */
export function hash(input: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/** mulberry32: small seeded PRNG returning floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Each wheel gets its own stream derived from (seed, category, rerollCount),
 * so locking or rerolling one wheel never changes any other wheel.
 */
export function slotRng(seed: string, category: string, rerolls: number): () => number {
  return mulberry32(hash(`${seed}:${category}:${rerolls}`));
}

/**
 * Seed for casual play. Pass a CSPRNG: expo-crypto getRandomBytes on mobile,
 * node:crypto randomBytes on the server. Competitive seeds are minted server-side.
 */
export function newSeed(randomBytes: (n: number) => Uint8Array): string {
  return Array.from(randomBytes(8), (b) => b.toString(16).padStart(2, '0')).join('');
}
