import type { Fixture } from './types';

/** Double round robin (circle method): every club plays every other home and away. */
export function makeFixtures(clubIds: string[], year: number): Fixture[] {
  const ids = [...clubIds];
  if (ids.length % 2) ids.push('BYE');
  const n = ids.length, rounds = n - 1, half = n / 2;
  const firstLeg: Array<Array<[string, string]>> = [];
  const rot = [...ids];
  for (let r = 0; r < rounds; r++) {
    const pairs: Array<[string, string]> = [];
    for (let i = 0; i < half; i++) {
      const a = rot[i], b = rot[n - 1 - i];
      if (a === 'BYE' || b === 'BYE') continue;
      pairs.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    firstLeg.push(pairs);
    rot.splice(1, 0, rot.pop() as string);
  }
  const all = [...firstLeg, ...firstLeg.map((ps) => ps.map(([h, a]) => [a, h] as [string, string]))];
  const start = new Date(Date.UTC(year, 7, 8));
  while (start.getUTCDay() !== 6) start.setUTCDate(start.getUTCDate() + 1); // first Saturday from 8 August
  const out: Fixture[] = [];
  all.forEach((pairs, i) => {
    const d = new Date(start.getTime() + i * 7 * 86400000);
    const date = d.toISOString().slice(0, 10);
    pairs.forEach(([h, a]) => out.push({ id: `${year}-${i + 1}-${h}-${a}`, matchday: i + 1, date, homeId: h, awayId: a }));
  });
  return out;
}

export function formatDate(iso: string) {
  const d = new Date(iso + 'T12:00:00Z');
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
}
