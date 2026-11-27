import { describe, expect, it } from 'vitest';
import { newGame, playMatchday, squadOf, startNewSeason, totalMatchdays } from './game';
import { currentWeek } from './competitions';
import { marketFee } from './market';
import { realWorld } from '../data/real';

const real = (seed: number) => newGame({ seed, userClubId: 'eng-everton', managerName: 'T', currency: 'EUR', world: realWorld(), source: 'real' });

describe('transfer market', () => {
  it('rumours before the summer, then big clubs sign players from smaller ones', () => {
    const s = real(31);
    const n = totalMatchdays(s);
    let rumoured = 0;
    for (let i = 0; i < n; i++) {
      playMatchday(s);
      if (!rumoured && currentWeek(s) > s.leagueWeeks - 4) rumoured = (s.rumours ?? []).filter((r) => r.window === 'Summer').length;
    }
    expect(rumoured).toBeGreaterThan(5);
    const before = Object.fromEntries(Object.values(s.players).map((p) => [p.id, p.clubId]));
    const logged = s.records?.deals?.length ?? 0;
    startNewSeason(s);
    const deals = (s.records!.deals ?? []).slice(0, (s.records!.deals ?? []).length - logged).filter((d) => d.season === '2026/27' && d.fromId && d.toId && d.playerId && before[d.playerId] === d.fromId);
    expect(deals.length).toBeGreaterThan(15);
    for (const d of deals) {
      expect(d.toId).not.toBe('eng-everton');
      expect(s.clubs[d.toId!].reputation).toBeGreaterThanOrEqual(s.clubs[d.fromId!].reputation);
      const p = s.players[d.playerId!];
      if (p) expect(p.clubId === d.toId || p.clubId === 'free' || before[p.id] !== d.fromId).toBe(true);
    }
    // rumours for the summer are used up (bar any about your players)
    expect((s.rumours ?? []).filter((r) => r.window === 'Summer' && r.fromId !== 'eng-everton')).toEqual([]);
    for (const id of ['eng-liverpool', 'esp-barcelona', 'ned-ajax']) if (s.clubs[id]) expect(squadOf(s, id).filter((p) => p.squad === 'First team').length).toBeGreaterThanOrEqual(18);
  }, 120_000);

  it('a rumour about one of your players becomes a bid once the window opens', () => {
    const s = real(32);
    const p = squadOf(s, 'eng-everton').filter((x) => x.squad === 'First team').sort((a, b) => b.ability - a.ability)[0];
    s.rumours = [{ playerId: p.id, name: p.name, fromId: 'eng-everton', toId: 'eng-arsenal', window: 'Summer', heat: 3 }];
    for (let i = 0; i < 6 && !s.bids.some((b) => b.playerId === p.id); i++) playMatchday(s);
    const bid = s.bids.find((b) => b.playerId === p.id)!;
    expect(bid.fromClubId).toBe('eng-arsenal');
    expect(s.rumours).toEqual([]);
    expect(s.inbox.some((m) => m.subject.startsWith(`Bid for ${p.name}`))).toBe(true);
  });

  it('a release clause caps the fee', () => {
    const s = real(33);
    const p = squadOf(s, 'eng-liverpool')[0];
    p.contractEnd = s.year + 3;
    p.releaseClause = Math.round(p.value * 0.5);
    expect(marketFee(s, p)).toBe(Math.round(p.releaseClause / 100_000) * 100_000);
  });
});
