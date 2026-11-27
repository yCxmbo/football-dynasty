import { describe, expect, it } from 'vitest';
import { newGame, squadOf } from './game';
import { addClause, agentDemand, bidTerms, buyBackFor, clauseLines, payAddOns, settleSale } from './deals';
import { completeDeal } from './market';
import { activateBuyBack, respondToBid, swapValue } from './transfers';
import type { GameState } from './types';

const game = () => newGame({ seed: 11, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
const other = (s: GameState) => Object.values(s.clubs).find((c) => c.id !== 'ash' && c.league)!;

describe('transfer deals', () => {
  it('a sell-on clause pays the holder when the player is sold on, once', () => {
    const s = game();
    const seller = other(s);
    const p = squadOf(s, seller.id)[0];
    addClause(s, { kind: 'sellOn', playerId: p.id, holderId: 'ash', pct: 20 });
    const bal = s.clubs.ash.balance;
    expect(settleSale(s, p.id, seller.id, 10_000_000)).toBe(2_000_000);
    expect(s.clubs.ash.balance).toBe(bal + 2_000_000);
    expect(s.inbox[0].subject).toContain('Sell-on');
    expect(settleSale(s, p.id, seller.id, 10_000_000)).toBe(0);
  });
  it('sales between computer clubs pay your sell-on share', () => {
    const s = game();
    const [a, b] = Object.values(s.clubs).filter((c) => c.id !== 'ash' && c.league);
    const p = squadOf(s, a.id)[0];
    addClause(s, { kind: 'sellOn', playerId: p.id, holderId: 'ash', pct: 10 });
    const bal = s.clubs.ash.balance;
    completeDeal(s, p, b.id, 5_000_000, '2025/26');
    expect(s.clubs.ash.balance).toBe(bal + 500_000);
  });
  it('add-ons are paid once, at 25 games and 15 goals, then end', () => {
    const s = game();
    const seller = other(s);
    const p = squadOf(s, 'ash')[0];
    addClause(s, { kind: 'addOn', playerId: p.id, payerId: 'ash', payeeId: seller.id, appFee: 100_000, goalBonus: 200_000, until: s.year });
    const bal = s.clubs.ash.balance;
    for (let i = 0; i < 24; i++) payAddOns(s, [{ playerId: p.id, goals: 0, minutes: 90 }]);
    expect(s.clubs.ash.balance).toBe(bal);
    expect(clauseLines(s, p.id)[0]).toContain('24 so far');
    payAddOns(s, [{ playerId: p.id, goals: 15, minutes: 90 }]);
    expect(s.clubs.ash.balance).toBe(bal - 300_000);
    expect(s.clauses!.length).toBe(0);
  });
  it('a bid with instalments pays part now and the rest later; a buy-back can be used', () => {
    const s = game();
    const buyer = other(s);
    const p = squadOf(s, 'ash').find((x) => x.squad === 'First team')!;
    s.bids.push({ id: 'bx', playerId: p.id, fromClubId: buyer.id, fee: 20_000_000, status: 'open', upfront: 60, buyBack: 30_000_000, sellOn: 15 });
    const bal = s.clubs.ash.balance;
    s.today = `${s.year}-08-20`; // window open
    respondToBid(s, 'bx', true);
    expect(s.players[p.id].clubId).toBe(buyer.id);
    expect(s.clubs.ash.balance).toBe(bal + 12_000_000);
    expect(s.installments.some((i) => i.toClubId === 'ash' && i.remaining === 8_000_000)).toBe(true);
    expect(buyBackFor(s, p.id)?.fee).toBe(30_000_000);
    s.clubs.ash.transferBudget = 50_000_000;
    expect(activateBuyBack(s, p.id)).toBeNull();
    expect(s.players[p.id].clubId).toBe('ash');
  });
  it('bid terms, agents and swaps are sensible', () => {
    const s = game();
    const p = squadOf(s, 'ash').find((x) => x.age <= 21)!;
    const t = bidTerms(s, 'b1', p, 30_000_000);
    expect([60, 70, 80, 100]).toContain(t.upfront);
    expect(agentDemand(p, 10_000_000)).toBeGreaterThanOrEqual(500_000);
    const star = squadOf(s, 'ash').sort((a, b) => b.ability - a.ability)[0];
    expect(swapValue(s, star.id, other(s).id)).toBeGreaterThan(0);
    expect(swapValue(s, 'nobody', other(s).id)).toBe(0);
  });
});
