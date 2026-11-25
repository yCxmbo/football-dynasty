import { describe, expect, it } from 'vitest';
import { clubsIn, divisionTable, makeCalendar } from './competitions';
import { newGame, playMatchday, promote, seasonOver, startNewSeason, squadOf, totalMatchdays } from './game';
import { abilityFromAttributes } from './ratings';
import { createRng } from './rng';
import { makeAttributes } from './world';

describe('fixtures', () => {
  it('each division is a double round robin: every pair meets home and away once', () => {
    const s = newGame({ seed: 1, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
    for (const d of ['D1', 'D2', 'D3'] as const) {
      const f = s.fixtures.filter((x) => x.comp === d);
      expect(f.length).toBe(12 * 11);
      expect(new Set(f.map((x) => `${x.homeId}-${x.awayId}`)).size).toBe(132);
    }
  });
  it('no club plays twice in one calendar slot', () => {
    const s = newGame({ seed: 2, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
    for (let i = 0; i < totalMatchdays(s); i++) {
      const clubs = s.fixtures.filter((x) => x.matchday === s.matchday).flatMap((x) => [x.homeId, x.awayId]);
      expect(new Set(clubs).size).toBe(clubs.length);
      playMatchday(s);
    }
  });
  it('the calendar has every competition in date order', () => {
    const cal = makeCalendar(2026);
    expect(cal.map((x) => x.date)).toEqual([...cal.map((x) => x.date)].sort());
    const comps = new Set(cal.flatMap((x) => x.entries.map((e) => e.comp)));
    expect([...comps].sort()).toEqual(['CC', 'D1', 'D2', 'D3', 'LC', 'NC', 'PO2', 'PO3', 'SC']);
  });
});

describe('ratings', () => {
  it('generated attributes land near the target ability', () => {
    const rng = createRng(1);
    for (const target of [60, 100, 140, 180]) {
      const ca = abilityFromAttributes(makeAttributes(rng, 'ST', target), 'ST');
      expect(Math.abs(ca - target)).toBeLessThan(12);
    }
  });
});

describe('season', () => {
  it('is deterministic for a seed', () => {
    const a = newGame({ seed: 42, userClubId: 'ash', managerName: 'Test', currency: 'EUR' });
    const b = newGame({ seed: 42, userClubId: 'ash', managerName: 'Test', currency: 'EUR' });
    for (let i = 0; i < 5; i++) { playMatchday(a); playMatchday(b); }
    expect(a.fixtures.filter((f) => f.result).map((f) => f.result!.score)).toEqual(b.fixtures.filter((f) => f.result).map((f) => f.result!.score));
  });

  it('plays a full season with consistent tables, cups with winners, promotion and relegation', () => {
    const s = newGame({ seed: 7, userClubId: 'ash', managerName: 'Test', currency: 'EUR' });
    const n = totalMatchdays(s);
    for (let i = 0; i < n; i++) playMatchday(s);
    expect(seasonOver(s)).toBe(true);
    for (const d of [1, 2, 3]) {
      const t = divisionTable(s, d);
      expect(t.every((r) => r.p === 22)).toBe(true);
      const fx = s.fixtures.filter((f) => f.comp === `D${d}`);
      const goals = fx.reduce((g, f) => g + f.result!.score[0] + f.result!.score[1], 0);
      expect(t.reduce((g, r) => g + r.gf, 0)).toBe(goals);
      const draws = fx.filter((f) => f.result!.score[0] === f.result!.score[1]).length;
      expect(t.reduce((p, r) => p + r.pts, 0)).toBe((fx.length - draws) * 3 + draws * 2);
    }
    for (const c of ['NC', 'LC', 'CC', 'SC', 'PO2', 'PO3'] as const) expect(s.cups[c]?.winner, c).toBeTruthy();
    expect(s.fixtures.filter((f) => f.comp === 'NC').length).toBe(4 + 16 + 8 + 4 + 2 + 1);
    expect(s.fixtures.filter((f) => f.comp === 'CC').length).toBe(4 * 12 + 4 + 2 + 1);
    expect(s.fixtures.filter((f) => f.ko).every((f) => f.result!.winnerId)).toBe(true);

    const d1Bottom = divisionTable(s, 1).slice(-3).map((r) => r.clubId);
    const d2Top = divisionTable(s, 2).slice(0, 2).map((r) => r.clubId);
    const po2 = s.cups.PO2!.winner!;
    startNewSeason(s);
    expect(s.year).toBe(2027);
    expect(s.matchday).toBe(1);
    for (const id of d1Bottom) expect(s.clubs[id].division).toBe(2);
    for (const id of [...d2Top, po2]) expect(s.clubs[id].division).toBe(1);
    for (const d of [1, 2, 3]) expect(clubsIn(s, d).length).toBe(12);
    expect(s.history['ash'][0].season).toBe('2026/27');
    expect(Object.values(s.trophies).flat().filter((t) => t.seasons.includes('2026/27')).length).toBeGreaterThanOrEqual(7);
    for (const c of Object.keys(s.clubs)) expect(squadOf(s, c).filter((p) => p.squad === 'First team').length).toBeGreaterThanOrEqual(22);
    expect(s.qualified.cc.length).toBe(4);
  });

  it('promoting a youth player gives a professional contract', () => {
    const s = newGame({ seed: 3, userClubId: 'ash', managerName: 'Test', currency: 'EUR' });
    const y = squadOf(s, 'ash').find((p) => p.squad === 'U21')!;
    expect(y.contractType).toBe('youth');
    promote(s, y.id);
    expect(s.players[y.id].squad).toBe('First team');
    expect(s.players[y.id].contractType).toBe('full-time');
  });
});
