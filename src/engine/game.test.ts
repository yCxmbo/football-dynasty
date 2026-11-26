import { describe, expect, it } from 'vitest';
import { clubsInLeague, cupRoundNames, leagueTableOf } from './competitions';
import { newGame, playMatchday, promote, seasonOver, startNewSeason, squadOf, totalMatchdays } from './game';
import { abilityFromAttributes } from './ratings';
import { createRng } from './rng';
import { makeAttributes } from './world';
import { templateWorld } from './builtin';
import { validateWorld } from './worlddef';
import { realWorld } from '../data/real';

const game = (seed: number) => newGame({ seed, userClubId: 'ash', managerName: 'T', currency: 'EUR' });

describe('fixtures', () => {
  it('each league is a double round robin: every pair meets home and away once', () => {
    const s = game(1);
    for (const l of s.world.leagues) {
      const n = clubsInLeague(s, l.id).length;
      const f = s.fixtures.filter((x) => x.comp === l.id);
      expect(f.length, l.id).toBe(n * (n - 1));
      expect(new Set(f.map((x) => `${x.homeId}-${x.awayId}`)).size).toBe(n * (n - 1));
    }
  });
  it('no club plays twice in one calendar slot', () => {
    const s = game(2);
    for (let i = 0; i < 20; i++) {
      const clubs = s.fixtures.filter((x) => x.matchday === s.matchday).flatMap((x) => [x.homeId, x.awayId]);
      expect(new Set(clubs).size).toBe(clubs.length);
      playMatchday(s);
    }
  });
  it('the calendar is in date order', () => {
    const s = game(3);
    expect(s.calendar.map((x) => x.date)).toEqual([...s.calendar.map((x) => x.date)].sort());
  });
  it('cups with an awkward number of entrants start with a first round and byes', () => {
    expect(cupRoundNames(60)).toEqual(['First round', 'Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', 'Final']);
    expect(cupRoundNames(16)).toEqual(['Round of 16', 'Quarter-final', 'Semi-final', 'Final']);
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
    const a = game(42), b = game(42);
    for (let i = 0; i < 5; i++) { playMatchday(a); playMatchday(b); }
    expect(a.fixtures.filter((f) => f.result).map((f) => f.result!.score)).toEqual(b.fixtures.filter((f) => f.result).map((f) => f.result!.score));
  });

  it('plays a full season with consistent tables, every competition won, promotion and relegation', () => {
    const s = game(7);
    const n = totalMatchdays(s);
    for (let i = 0; i < n; i++) playMatchday(s);
    expect(seasonOver(s)).toBe(true);
    for (const l of s.world.leagues) {
      const t = leagueTableOf(s, l.id);
      expect(t.every((r) => r.p === 2 * (t.length - 1))).toBe(true);
      const fx = s.fixtures.filter((f) => f.comp === l.id);
      const goals = fx.reduce((g, f) => g + f.result!.score[0] + f.result!.score[1], 0);
      expect(t.reduce((g, r) => g + r.gf, 0)).toBe(goals);
      const draws = fx.filter((f) => f.result!.score[0] === f.result!.score[1]).length;
      expect(t.reduce((p, r) => p + r.pts, 0)).toBe((fx.length - draws) * 3 + draws * 2);
    }
    for (const c of Object.values(s.comps)) if (c.kind !== 'league') expect(s.cups[c.id]?.winner, c.id).toBeTruthy();
    expect(s.fixtures.filter((f) => f.ko).every((f) => f.result!.winnerId)).toBe(true);

    const top = leagueTableOf(s, 'eng1').slice(-3).map((r) => r.clubId);
    const up = leagueTableOf(s, 'eng2').slice(0, 2).map((r) => r.clubId);
    const po = s.cups['po-eng2']!.winner!;
    const year = s.year;
    startNewSeason(s);
    expect(s.year).toBe(year + 1);
    expect(s.matchday).toBe(1);
    for (const id of top) expect(s.clubs[id].league).toBe('eng2');
    for (const id of [...up, po]) expect(s.clubs[id].league).toBe('eng1');
    for (const l of s.world.leagues) expect(clubsInLeague(s, l.id).length).toBe(s.world.leagues.find((x) => x.id === l.id) && s.comps[l.id].size);
    expect(s.history['ash'].length).toBe(1);
    for (const c of Object.keys(s.clubs)) expect(squadOf(s, c).filter((p) => p.squad === 'First team').length).toBeGreaterThanOrEqual(18);
    expect(s.qualified.cc1.length).toBe(32);
  }, 120_000);

  it('promoting a youth player gives a professional contract', () => {
    const s = game(3);
    const y = squadOf(s, 'ash').find((p) => p.squad === 'U21')!;
    expect(y.contractType).toBe('youth');
    promote(s, y.id);
    expect(s.players[y.id].squad).toBe('First team');
    expect(s.players[y.id].contractType).toBe('full-time');
  });
});

describe('worlds', () => {
  it('the real world database is valid and keeps its named players', () => {
    const w = realWorld();
    const v = validateWorld(w);
    expect(v.errors).toEqual([]);
    expect(w.leagues.length).toBe(21);
    expect(new Set(w.leagues.map((l) => l.country)).size).toBe(15);
    expect(new Set(w.players!.map((p) => p.name)).size).toBe(w.players!.length);
    const s = newGame({ seed: 5, userClubId: 'eng-liverpool', managerName: 'T', currency: 'GBP', world: w, source: 'real' });
    expect(squadOf(s, 'eng-liverpool').some((p) => p.name === 'Mohamed Salah')).toBe(true);
    const yamal = Object.values(s.players).find((p) => p.name === 'Lamine Yamal')!;
    expect(yamal.potential).toBeGreaterThan(yamal.ability + 10); // potential given as overall is converted
    expect(s.comps.ucl.size).toBe(36);
    expect(s.comps.uel.size).toBe(36);
    // league phase: eight matches each against eight different opponents, at most one per matchday, home and away balanced
    for (const comp of ['ucl', 'uel']) {
      const fx = s.fixtures.filter((f) => f.comp === comp);
      expect(fx.length).toBe(144);
      for (const id of s.qualified[comp]) {
        const mine = fx.filter((f) => f.homeId === id || f.awayId === id);
        expect(mine.length).toBe(8);
        expect(new Set(mine.map((f) => (f.homeId === id ? f.awayId : f.homeId))).size).toBe(8);
        expect(new Set(mine.map((f) => f.round)).size).toBe(8);
        const home = mine.filter((f) => f.homeId === id).length;
        expect(home).toBeGreaterThanOrEqual(3); expect(home).toBeLessThanOrEqual(5);
      }
      const sameCountry = fx.filter((f) => s.clubs[f.homeId].country === s.clubs[f.awayId].country).length;
      expect(sameCountry).toBeLessThan(10);
    }
  });
  it('a real-world season crowns a winner in every competition, and only real cups are played', () => {
    const s = newGame({ seed: 9, userClubId: 'mex-america', managerName: 'T', currency: 'USD', world: realWorld(), source: 'real' });
    expect(s.comps['sc-sco']).toBeUndefined();
    expect(s.comps['sc-bel']).toBeUndefined();
    expect(s.comps['sc-usa']).toBeUndefined();
    expect(s.comps['sc-mex'].name).toBe('Campeón de Campeones');
    expect(Object.values(s.comps).some((c) => c.kind === 'cup' && c.country === 'mex')).toBe(false);
    const n = totalMatchdays(s);
    for (let i = 0; i < n; i++) playMatchday(s);
    for (const c of Object.values(s.comps)) if (c.kind !== 'league') expect(s.cups[c.id]?.winner, c.id).toBeTruthy();
    // the league phase sent eight to the round of 16 and sixteen to the play-off
    expect(s.fixtures.filter((f) => f.comp === 'ucl' && f.round === 'Knockout play-off').length).toBe(8);
    expect(s.fixtures.filter((f) => f.comp === 'ucl' && f.round === 'Round of 16').length).toBe(8);
    expect(Object.values(s.cups.ucl.exits).filter((x) => x === 'League phase').length).toBe(12);
    const down = leagueTableOf(s, 'esp1').slice(-3).map((r) => r.clubId);
    const up = leagueTableOf(s, 'ger2').slice(0, 2).map((r) => r.clubId);
    startNewSeason(s);
    expect(s.comps['sc-mex'].name).toBe('Campeón de Campeones');
    for (const id of down) expect(s.clubs[id].league).toBe('esp2');
    for (const id of up) expect(s.clubs[id].league).toBe('ger1');
    expect(clubsInLeague(s, 'esp1').length).toBe(20);
    expect(clubsInLeague(s, 'esp2').length).toBe(22);
  }, 120_000);
  it('generated players and staff never take a real player\'s name', () => {
    const w = realWorld();
    const real = new Set(w.players!.map((p) => p.name));
    const s = newGame({ seed: 12, userClubId: 'eng-newcastle', managerName: 'T', currency: 'EUR', world: w, source: 'real' });
    const generated = Object.values(s.players).filter((p) => p.filler || p.squad !== 'First team');
    expect(generated.length).toBeGreaterThan(1000);
    expect(generated.filter((p) => real.has(p.name))).toEqual([]);
    expect((s.staffPool ?? []).filter((m) => real.has(m.name))).toEqual([]);
  });
  it('the template validates and starts a game', () => {
    const w = templateWorld();
    expect(validateWorld(w).ok).toBe(true);
    const s = newGame({ seed: 1, userClubId: w.clubs.find((c) => c.league)!.id, managerName: 'T', currency: 'EUR', world: w, source: 'import' });
    for (let i = 0; i < 6; i++) playMatchday(s);
    expect(s.fixtures.some((f) => f.result)).toBe(true);
  });
  it('rejects files with unbalanced promotion and relegation', () => {
    const w = structuredClone(templateWorld());
    w.leagues[0].relegate = 1; w.leagues[1].promote = 2;
    const v = validateWorld(w);
    expect(v.ok).toBe(false);
    expect(v.errors.join(' ')).toMatch(/must match|top league/);
  });
});
