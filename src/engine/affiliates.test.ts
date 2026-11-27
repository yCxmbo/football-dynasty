import { describe, expect, it } from 'vitest';
import { newGame, squadOf } from './game';
import { affiliateSummer, candidates, feederDevelopment, propose } from './affiliates';
import { loanDestinations, loanInVerdict, loanOut } from './loans';
import { askingPrice } from './transfers';
import { realWorld } from '../data/real';

describe('affiliate clubs', () => {
  it('a feeder takes your players on loan, develops them faster, and sells you youngsters cheaper', () => {
    const s = newGame({ seed: 61, userClubId: 'eng-arsenal', managerName: 'T', currency: 'EUR', world: realWorld(), source: 'real' });
    const f = candidates(s, 'feeder')[0];
    expect(f.reputation).toBeLessThan(s.clubs['eng-arsenal'].reputation);
    const young = Object.values(s.players).find((p) => p.clubId === f.id && p.age <= 21 && p.squad === 'First team')!;
    const before = young ? askingPrice(s, young) : 0;
    const bal = s.clubs['eng-arsenal'].balance;
    expect(propose(s, f.id, 'feeder')).toBeNull();
    expect(s.clubs['eng-arsenal'].balance).toBeLessThan(bal);
    if (young) expect(askingPrice(s, young)).toBeLessThan(before);
    const p = squadOf(s, 'eng-arsenal').filter((x) => x.squad === 'First team' && x.age <= 23).sort((a, b) => a.ability - b.ability)[0];
    expect(loanDestinations(s, p)[0].clubId).toBe(f.id);
    s.today = `${s.year}-08-20`;
    expect(loanOut(s, p.id, f.id)).toBeNull();
    expect(feederDevelopment(s, s.players[p.id])).toBeGreaterThan(1);
    expect(affiliateSummer(s).length).toBe(1);
  });
  it('a parent club lends its prospects and pays you', () => {
    const s = newGame({ seed: 61, userClubId: 'eng-brentford', managerName: 'T', currency: 'EUR', world: realWorld(), source: 'real' });
    const par = candidates(s, 'parent')[0];
    expect(par).toBeTruthy();
    const bal = s.clubs['eng-brentford'].balance;
    expect(propose(s, par.id, 'parent')).toBeNull();
    expect(s.clubs['eng-brentford'].balance).toBeGreaterThan(bal);
    expect(propose(s, candidates(s, 'parent')[0].id, 'parent')).toMatch(/already/);
    s.today = `${s.year}-08-20`;
    const prospect = Object.values(s.players).find((p) => p.clubId === par.id && p.age <= 21 && p.squad === 'First team')!;
    expect(loanInVerdict(s, prospect).ok).toBe(true);
  });
});
