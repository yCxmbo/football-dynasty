/** Small seeded PRNG (mulberry32) so saves and tests are reproducible. */
export interface Rng {
  next(): number; // [0, 1)
  int(min: number, max: number): number; // inclusive
  pick<T>(list: readonly T[]): T;
  chance(p: number): boolean;
  normal(mean?: number, sd?: number): number;
  weighted<T>(items: readonly T[], weight: (t: T) => number): T;
  state(): number;
}

export function createRng(seed: number): Rng {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng: Rng = {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (list) => list[Math.floor(next() * list.length)],
    chance: (p) => next() < p,
    normal: (mean = 0, sd = 1) => {
      const u = 1 - next(), v = next();
      return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
    weighted: (items, weight) => {
      const total = items.reduce((a, t) => a + Math.max(0, weight(t)), 0);
      let r = next() * total;
      for (const t of items) { r -= Math.max(0, weight(t)); if (r <= 0) return t; }
      return items[items.length - 1];
    },
    state: () => s,
  };
  return rng;
}
