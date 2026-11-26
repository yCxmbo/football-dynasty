import { describe, expect, it } from 'vitest';
import { currentWeek } from './competitions';
import { newGame, playMatchday, squadOf, startNewSeason, totalMatchdays } from './game';
import { windows, askingPrice, expectedRole, makeOffer, renewContract, respondToBid, startScouting, toggleTransferList, wageDemand, windowOpen, type OfferTerms } from './transfers';
import { FREE_AGENT, type GameState, type Player } from './types';

const game = () => newGame({ seed: 21, userClubId: 'ash', managerName: 'Test', currency: 'EUR' });
const target = (s: GameState) => squadOf(s, 'bla').filter((p) => p.squad === 'First team').sort((a, b) => a.ability - b.ability)[5];
function terms(s: GameState, p: Player, over: Partial<OfferTerms> = {}): OfferTerms {
  return { fee: askingPrice(s, p), upfront: 100, months: 0, appearanceFee: 0, goalBonus: 0, sellOn: 0, wage: wageDemand(s, p), years: 3, signingBonus: 0, releaseClause: 0, agentFee: 0, role: expectedRole(s, p), contractType: 'full-time', ...over };
}
/** Plays on until the given league week (the calendar also holds cup midweeks). */
const playTo = (s: GameState, week: number) => { while (currentWeek(s) < week) playMatchday(s); };

describe('transfer windows', () => {
  it('summer window open at the start, closed mid-autumn, open in January', () => {
    const s = game();
    expect(windowOpen(s)).toBe(true);
    playTo(s, 6); expect(windowOpen(s)).toBe(false);
    playTo(s, windows(s).januaryFrom); expect(windowOpen(s)).toBe(true);
    playTo(s, windows(s).januaryTo + 1); expect(windowOpen(s)).toBe(false);
  });
  it('offers are refused while the window is closed', () => {
    const s = game(); playTo(s, 6);
    const p = target(s);
    expect(makeOffer(s, p.id, terms(s, p)).status).toBe('rejected');
    expect(s.players[p.id].clubId).toBe('bla');
  });
});

describe('buying', () => {
  it('a fair offer on asking price and wage demand completes the transfer and charges the budget', () => {
    const s = game();
    const p = target(s);
    const budget = s.clubs.ash.transferBudget;
    const t = terms(s, p);
    const r = makeOffer(s, p.id, t);
    expect(r.status).toBe('accepted');
    expect(s.players[p.id].clubId).toBe('ash');
    expect(s.clubs.ash.transferBudget).toBe(budget - t.fee);
    expect(s.players[p.id].wage).toBe(t.wage);
  });
  it('a low offer gets a counter, a very low one a rejection', () => {
    const s = game();
    const p = target(s);
    const ask = askingPrice(s, p);
    expect(makeOffer(s, p.id, terms(s, p, { fee: Math.round(ask * 0.8) })).status).toBe('counter');
    expect(makeOffer(s, p.id, terms(s, p, { fee: Math.round(ask * 0.3) })).status).toBe('rejected');
    expect(s.players[p.id].clubId).toBe('bla');
  });
  it('the player rejects a wage well below his demand', () => {
    const s = game();
    const p = target(s);
    const r = makeOffer(s, p.id, terms(s, p, { wage: Math.round(wageDemand(s, p) * 0.6) }));
    expect(r.status).toBe('rejected');
    expect(r.message).toMatch(/wants about/);
  });
  it('the board blocks deals over the transfer budget', () => {
    const s = game();
    s.clubs.ash.transferBudget = 1000;
    const p = target(s);
    expect(makeOffer(s, p.id, terms(s, p)).message).toMatch(/board refuses/);
  });
  it('installments are paid each matchday', () => {
    const s = game();
    const p = target(s);
    expect(makeOffer(s, p.id, terms(s, p, { fee: Math.round(askingPrice(s, p) * 1.1), upfront: 50, months: 6 })).status).toBe("accepted");
    expect(s.installments.length).toBe(1);
    const before = s.installments[0].remaining;
    playTo(s, 2);
    expect(s.installments[0]?.remaining ?? 0).toBeLessThan(before);
  });
});

describe('scouting', () => {
  it('knowledge rises each matchday until a full report arrives', () => {
    const s = game();
    const p = target(s);
    expect(startScouting(s, p.id)).toBeNull();
    playTo(s, 4); // three league weeks of scouting: 25% + 3 × 25%
    expect(s.knowledge[p.id]).toBe(100);
    expect(s.scouting).not.toContain(p.id);
    expect(s.inbox.some((m) => m.subject.startsWith('Full report'))).toBe(true);
  });
});

describe('selling', () => {
  it('transfer-listed players attract bids; accepting moves the player and pays the club', () => {
    const s = game();
    const mine = squadOf(s, 'ash').filter((p) => p.squad === 'First team').slice(0, 6);
    mine.forEach((p) => toggleTransferList(s, p.id));
    for (let i = 0; i < 6 && !s.bids.length; i++) playMatchday(s);
    expect(s.bids.length).toBeGreaterThan(0);
    const bid = s.bids[0];
    const balance = s.clubs.ash.balance;
    respondToBid(s, bid.id, true);
    expect(s.players[bid.playerId].clubId).toBe(bid.fromClubId);
    expect(s.clubs.ash.balance).toBe(balance + bid.fee);
  });
});

describe('contracts', () => {
  it('unrenewed contracts run out at season end; renewed ones stay', () => {
    const s = game();
    const ft = squadOf(s, 'ash').filter((p) => p.squad === 'First team');
    const [leaver, keeper] = ft;
    leaver.contractEnd = s.year; keeper.contractEnd = s.year;
    for (let i = 0, n = totalMatchdays(s); i < n; i++) playMatchday(s);
    expect(renewContract(s, keeper.id, Math.round(wageDemand(s, keeper, true) * 1.05), 3)).toBeNull();
    startNewSeason(s);
    expect(s.players[keeper.id]?.clubId).toBe('ash');
    const gone = s.players[leaver.id];
    expect(!gone || gone.clubId !== 'ash').toBe(true);
    if (gone) expect([FREE_AGENT, ...Object.keys(s.clubs)]).toContain(gone.clubId);
  });
});
