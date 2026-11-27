import { describe, expect, it } from 'vitest';
import { newGame, userLineup } from './game';
import { FORMATIONS, FORMATION_LAYOUT, slotsOf, type Formation } from './match';
import { bestRolesAll, defaultRoles, ROLE_BY_ID, rolesFor } from './roles';
import { reviewTactic } from './review';
import { INSTRUCTION_OPTIONS } from './instructions';

describe('tactics content', () => {
  it('every formation has a layout and a role for every slot', () => {
    for (const f of Object.keys(FORMATIONS) as Formation[]) {
      expect(FORMATION_LAYOUT[f]).toHaveLength(11);
      for (const s of slotsOf(f)) expect(rolesFor(s).length).toBeGreaterThan(0);
    }
    expect(Object.keys(FORMATIONS).length).toBeGreaterThanOrEqual(20);
  });
  it('seven mentality steps', () => {
    expect(INSTRUCTION_OPTIONS.find((o) => o.key === 'mentality')!.options.map((o) => o.value)).toEqual(['very defensive', 'defensive', 'cautious', 'balanced', 'positive', 'attacking', 'very attacking']);
  });
  it('pick best roles gives each player a role he suits at least as well as the default', () => {
    const s = newGame({ seed: 4, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
    const xi = userLineup(s).map((id) => s.players[id]);
    const best = bestRolesAll(s.formation, xi);
    const before = reviewTactic(s.formation, defaultRoles(s.formation), xi);
    const after = reviewTactic(s.formation, best, xi);
    expect(after.fit).toBeGreaterThanOrEqual(before.fit);
    best.forEach((r, i) => expect(ROLE_BY_ID[r.role].slots).toContain(slotsOf(s.formation)[i]));
    expect(after.balance.def + after.balance.mid + after.balance.att).toBe(100);
    expect(after.good.length + after.warn.length).toBeGreaterThan(0);
  });
});
