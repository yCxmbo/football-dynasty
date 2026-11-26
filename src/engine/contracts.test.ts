import { describe, expect, it } from 'vitest';
import { realWorld } from '../data/real';
import { preContracts, triggerClauses, wantsOut } from './contracts';
import { createRng } from './rng';
import { expireContracts } from './transfers';
import { newGame, squadOf } from './game';
import { askingPrice, expectedRole, makeOffer, renewContract, wageDemand, type OfferTerms } from './transfers';
import type { GameState, Player } from './types';

const game = () => newGame({ seed: 141, userClubId: 'eng-everton', managerName: 'T', currency: 'EUR', world: realWorld(), source: 'real' });
const terms = (s: GameState, p: Player, fee: number): OfferTerms => ({ fee, upfront: 100, months: 0, appearanceFee: 0, goalBonus: 0, sellOn: 0, wage: Math.round(wageDemand(s, p) * 1.05), years: 3, signingBonus: 0, releaseClause: 0, agentFee: 0, role: expectedRole(s, p), contractType: 'full-time' });

describe('contracts', () => {
  it('Spanish clubs\' players have release clauses; paying one in full skips the selling club', () => {
    const s = game();
    const spanish = Object.values(s.players).filter((p) => s.clubs[p.clubId]?.country === 'esp' && p.squad === 'First team');
    expect(spanish.every((p) => p.releaseClause && p.releaseClause >= 10_000_000)).toBe(true);
    // a modest player at a small Spanish club: his clause is above the asking price, so the club would normally haggle
    const target = spanish.filter((p) => s.clubs[p.clubId].reputation < 60).sort((a, b) => a.releaseClause! - b.releaseClause!)[0];
    const club = s.clubs['eng-everton'];
    club.transferBudget = 500_000_000; club.wageBudget = 50_000_000;
    expect(askingPrice(s, target)).toBeLessThan(target.releaseClause!);
    const res = makeOffer(s, target.id, terms(s, target, target.releaseClause!));
    expect(res.status).toBe('accepted');
    expect(s.players[target.id].clubId).toBe('eng-everton');
  });

  it('a player far too good for the club, in his final year, often won\'t renew', () => {
    const s = game();
    const p = squadOf(s, 'eng-everton').filter((x) => x.squad === 'First team').sort((a, b) => b.ability - a.ability)[0];
    p.contractEnd = s.year; p.ability = 190; p.age = 26;
    let refused = 0;
    for (let y = 0; y < 20; y++) { s.year = 2025 + y; p.contractEnd = s.year; if (wantsOut(s, p)) refused++; }
    expect(refused).toBeGreaterThan(5);
    s.year = 2025; p.contractEnd = 2025;
    while (!wantsOut(s, p)) { s.year++; p.contractEnd = s.year; }
    expect(renewContract(s, p.id, p.wage * 3, 3)).toMatch(/won't sign/);
  });

  it('a bargain clause gets triggered; a pre-contract takes an expiring player away in the summer', () => {
    const s = game();
    const ft = squadOf(s, 'eng-everton').filter((x) => x.squad === 'First team').sort((a, b) => b.value - a.value);
    const star = ft[0];
    star.releaseClause = Math.round(star.value * 0.8);
    let moved;
    for (let i = 0; i < 100 && !moved; i++) moved = triggerClauses(s, createRng(i));
    expect(moved?.id).toBe(star.id);
    expect(s.players[star.id].clubId).not.toBe('eng-everton');
    expect(s.inbox[0].subject).toMatch(/release clause/);
    const leaving = ft[1];
    leaving.contractEnd = s.year;
    for (let i = 0; i < 200 && !leaving.preContract; i++) preContracts(s, createRng(1000 + i));
    const to = leaving.preContract!;
    expect(to).toBeTruthy();
    expect(renewContract(s, leaving.id, leaving.wage * 2, 3)).toMatch(/pre-contract/);
    expireContracts(s);
    expect(s.players[leaving.id].clubId).toBe(to);
  });
});
