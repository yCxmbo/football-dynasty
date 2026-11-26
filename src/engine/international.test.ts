import { describe, expect, it } from 'vitest';
import { realWorld } from '../data/real';
import { newGame } from './game';
import { groupTable, nationRanking, playTournament, summerTournaments } from './international';
import { NATION } from './nations';
import { createRng } from './rng';

const world = () => newGame({ seed: 11, userClubId: 'eng-arsenal', managerName: 'T', currency: 'EUR', world: realWorld(), source: 'real' });

describe('international football', () => {
  it('schedules the World Cup in 2026, then the Euro and Copa América in 2028', () => {
    expect(summerTournaments(2025)).toEqual(['wc']);
    expect(summerTournaments(2026)).toEqual([]);
    expect(summerTournaments(2027)).toEqual(['euro', 'copa']);
    expect(summerTournaments(2029)).toEqual(['wc']);
  });

  it('every generated player has a known nationality, mostly from his club\'s country', () => {
    const s = world();
    const ps = Object.values(s.players);
    expect(ps.every((p) => NATION[p.nationality])).toBe(true);
    const spanish = ps.filter((p) => s.clubs[p.clubId]?.country === 'esp');
    expect(spanish.filter((p) => p.nationality === 'ESP').length / spanish.length).toBeGreaterThan(0.4);
  });

  it('the strongest nations are the ones with the best real players', () => {
    const s = world();
    const top = nationRanking(s, createRng(1)).slice(0, 8).map((q) => q.code);
    for (const c of ['ESP', 'FRA', 'ENG']) expect(top).toContain(c);
  });

  it('plays a 48-team World Cup: 12 groups, a round of 32 and a champion', () => {
    const s = world();
    const { tournament: t, userPlayers } = playTournament(s, createRng(3), 'wc', 2026);
    expect(t.teams.length).toBe(48);
    expect(new Set(t.teams).size).toBe(48);
    expect(t.hosts).toEqual(['USA', 'MEX', 'CAN']);
    for (const h of t.hosts) expect(t.teams).toContain(h);
    expect(t.groups.length).toBe(12);
    expect(t.matches.filter((m) => m.stage === 'Group').length).toBe(72);
    expect(t.matches.filter((m) => m.stage !== 'Group').length).toBe(31);
    expect(t.teams.filter((c) => NATION[c].confed === 'UEFA').length).toBeGreaterThanOrEqual(16);
    for (let g = 0; g < 12; g++) expect(groupTable(t, g).every((r) => r.p === 3)).toBe(true);
    expect(t.winner && t.runnerUp && t.winner !== t.runnerUp).toBeTruthy();
    expect(t.topScorer!.goals).toBeGreaterThan(2);
    expect(userPlayers.length).toBeGreaterThan(5); // Arsenal send plenty of internationals
    const saka = Object.values(s.players).find((p) => p.name === 'Bukayo Saka')!;
    expect(saka.intl?.caps).toBeGreaterThanOrEqual(3);
  });

  it('plays the Euro with 24 European teams and the Copa América with 16', () => {
    const s = world();
    const euro = playTournament(s, createRng(4), 'euro', 2028).tournament;
    expect(euro.teams.length).toBe(24);
    expect(euro.teams.every((c) => NATION[c].confed === 'UEFA')).toBe(true);
    expect(euro.matches.length).toBe(36 + 15);
    const copa = playTournament(s, createRng(5), 'copa', 2028).tournament;
    expect(copa.teams.length).toBe(16);
    expect(copa.teams.filter((c) => NATION[c].confed === 'CONMEBOL').length).toBe(10);
    expect(copa.matches.length).toBe(24 + 7);
  });
});
