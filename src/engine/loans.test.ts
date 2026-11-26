import { describe, expect, it } from 'vitest';
import { newGame, playMatchday, seasonOver, squadOf, startNewSeason } from './game';
import { loanDestinations, loanIn, loanInVerdict, loanOut, loanedOut, recall } from './loans';
import { wageBillOf } from './index';

const game = () => newGame({ seed: 31, userClubId: 'ash', managerName: 'T', currency: 'EUR' });

describe('loans', () => {
  it('a youngster goes out on loan to a club where he plays, then comes back in the summer', () => {
    const s = game();
    const kid = squadOf(s, 'ash').filter((p) => p.squad === 'U21').sort((a, b) => b.ability - a.ability)[0];
    const dest = loanDestinations(s, kid);
    expect(dest.length).toBeGreaterThan(0);
    for (const d of dest) expect(s.clubs[d.clubId].reputation).toBeLessThanOrEqual(s.clubs.ash.reputation);
    const billBefore = wageBillOf(s, 'ash');
    expect(loanOut(s, kid.id, dest[0].clubId)).toBeNull();
    expect(s.players[kid.id].clubId).toBe(dest[0].clubId);
    expect(wageBillOf(s, 'ash')).toBe(billBefore - kid.wage);
    expect(loanedOut(s).map((p) => p.id)).toEqual([kid.id]);
    while (!seasonOver(s)) playMatchday(s);
    expect(s.players[kid.id].current.apps).toBeGreaterThan(5);
    startNewSeason(s);
    const back = s.players[kid.id];
    if (back) { // he may have been released at 22 if never promoted
      expect(back.clubId).toBe('ash');
      expect(back.loan).toBeUndefined();
      expect(back.career[0].club).toContain('(loan)');
    }
  }, 120_000);

  it('loans need an open window, and can be recalled while one is open', () => {
    const s = game();
    const kid = squadOf(s, 'ash').filter((p) => p.squad === 'U21').find((p) => loanDestinations(s, p).length)!;
    const dest = loanDestinations(s, kid)[0];
    expect(loanOut(s, kid.id, dest.clubId)).toBeNull();
    expect(recall(s, kid.id)).toBeNull();
    expect(s.players[kid.id].clubId).toBe('ash');
    expect(s.players[kid.id].squad).toBe('U21');
    for (let i = 0; i < 14; i++) playMatchday(s); // the summer window has closed
    expect(loanOut(s, kid.id, dest.clubId)).toMatch(/window/);
  });

  it('other clubs lend fringe players who would play for you, not their stars', () => {
    const s = game();
    const other = Object.values(s.clubs).filter((c) => c.league === s.clubs.ash.league && c.id !== 'ash').sort((a, b) => b.reputation - a.reputation)[0];
    const ft = squadOf(s, other.id).filter((p) => p.squad === 'First team').sort((a, b) => b.ability - a.ability);
    expect(loanInVerdict(s, ft[0]).ok).toBe(false);
    const fringe = ft.slice(11).find((p) => loanInVerdict(s, p).ok);
    if (fringe) {
      expect(loanIn(s, fringe.id)).toBeNull();
      expect(s.players[fringe.id].clubId).toBe('ash');
      expect(s.players[fringe.id].loan?.from).toBe(other.id);
    }
  });
});
