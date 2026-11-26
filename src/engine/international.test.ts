import { describe, expect, it } from 'vitest';
import { realWorld } from '../data/real';
import { newGame } from './game';
import { applyTournament, groupTable, nationRanking, playTournament, summerTournaments } from './international';
import { NATION } from './nations';
import { candidates, jobOffers, managerReputation, takeJob, toggleSelection } from './nationaljob';
import { createRng } from './rng';

const world = () => newGame({ seed: 11, userClubId: 'eng-arsenal', managerName: 'T', currency: 'EUR', world: realWorld(), source: 'real' });

describe('international football', () => {
  it('schedules the World Cup in 2026, the Africa Cup of Nations and Asian Cup in 2027, the Euro and Copa América in 2028', () => {
    expect(summerTournaments(2025)).toEqual(['wc']);
    expect(summerTournaments(2027)).toEqual(['euro', 'copa']);
    expect(summerTournaments(2026)).toEqual(['afcon', 'asian']);
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
    const run = playTournament(s, createRng(3), 'wc', 2026);
    const { tournament: t, userPlayers } = run;
    applyTournament(s, run);
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
    const afcon = playTournament(s, createRng(6), 'afcon', 2027).tournament;
    expect(afcon.teams.length).toBe(24);
    expect(afcon.teams.every((c) => NATION[c].confed === 'CAF')).toBe(true);
    expect(afcon.hosts).toEqual(['KEN', 'UGA', 'TAN']);
    const asian = playTournament(s, createRng(7), 'asian', 2027).tournament;
    expect(asian.teams.length).toBe(24);
    expect(asian.teams.every((c) => NATION[c].confed === 'AFC')).toBe(true);
  });

  it('a club manager can take a national team job, pick the squad, and the tournament uses it', () => {
    const s = world();
    const ranking = nationRanking(s, createRng(1)).map((q) => q.code);
    const offers = jobOffers(s, ranking);
    expect(managerReputation(s)).toBeGreaterThan(50);
    expect(offers.length).toBeGreaterThan(0);
    expect(offers.every((o) => o.rank > 5)).toBe(true); // the very top nations want a proven winner
    takeJob(s, 'ENG');
    const job = s.nationalJob!;
    expect(job.squad.length).toBe(26);
    // swap the weakest outfield pick for a much lesser player: he goes to the tournament
    const outsider = candidates(s, 'ENG').filter((p) => p.pos !== 'GK' && !job.squad.includes(p.id))[30];
    toggleSelection(s, job.squad[job.squad.length - 1]);
    toggleSelection(s, outsider.id);
    expect(job.squad).toContain(outsider.id);
    job.formation = '3-5-2';
    const run = playTournament(s, createRng(8), 'wc', 2026);
    applyTournament(s, run);
    expect(run.userNation?.code).toBe('ENG');
    if (run.userNation!.reached !== 'Did not qualify') {
      expect(run.tournament.squads.ENG).toContain(outsider.id);
      expect(job.w + job.d + job.l).toBeGreaterThanOrEqual(3);
    }
    expect(job.tournaments.length).toBe(1);
  });
});
