import { describe, expect, it } from 'vitest';
import { newGame } from './engine/game';
import { planBackups, type SlotMeta } from './saves';

describe('automatic backups', () => {
  it('one per new day (two kept) and one per season (one kept)', () => {
    const g = newGame({ seed: 1, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
    let list: SlotMeta[] = [];
    const step = (day: string, year = g.year) => {
      g.today = day; g.year = year;
      const { add, drop } = planBackups('c1', list, g);
      const d = new Set(drop.map((x) => x.key));
      list = [...add, ...list.filter((x) => !d.has(x.key))];
      return { add, drop };
    };
    expect(step('2025-08-02').add.map((x) => x.kind).sort()).toEqual(['day', 'season']);
    expect(step('2025-08-02').add.length).toBe(0); // same day: nothing new
    step('2025-08-03');
    const r = step('2025-08-04');
    expect(r.drop.map((x) => x.day)).toEqual(['2025-08-02']);
    expect(list.filter((x) => x.kind === 'day').map((x) => x.day).sort()).toEqual(['2025-08-03', '2025-08-04']);
    const s = step('2026-08-01', g.year + 1);
    expect(s.add.some((x) => x.kind === 'season')).toBe(true);
    expect(list.filter((x) => x.kind === 'season').length).toBe(1);
    expect(list.filter((x) => x.kind === 'manual').length).toBe(0);
  });
});
