import { describe, expect, it } from 'vitest';
import { newGame, squadOf } from './game';
import { farewell, legendCandidates, legendRole, managerMaterial } from './legends';
import { hire, refreshPool, staffWage } from './staff';
import { addFormerPlayer, favouriteFor } from './managers';
import { fansOf } from './fans';
import { createRng } from './rng';

describe('legends', () => {
  it('a long-serving player retiring becomes a legend who can come back as staff', () => {
    const s = newGame({ seed: 5, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
    const p = squadOf(s, 'ash').find((x) => x.squad === 'First team')!;
    p.career = [{ season: '2024/25', club: s.clubs.ash.name, apps: 160, goals: 20, rating: 7 }];
    const bye = farewell(s, p)!;
    expect(bye.subject).toMatch(/legend/);
    expect(s.legends?.[0].name).toBe(p.name);
    expect(legendCandidates(s, staffWage).length).toBe(0); // not in the year he retired
    s.year++;
    refreshPool(s, createRng(3));
    const cand = s.staffPool![0];
    expect(cand.legend).toBe(true);
    expect(cand.role).toBe(legendRole(s.legends![0]).role);
    const mood = fansOf(s).mood;
    s.clubs.ash.balance = 1e9;
    expect(hire(s, cand.id)).toBeNull();
    expect(fansOf(s).mood).toBeGreaterThan(mood);
  });
  it('a respected veteran can move into management and be appointed', () => {
    const s = newGame({ seed: 5, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
    const p = Object.values(s.players).find((x) => x.clubId !== 'ash')!;
    p.attributes.Leadership = 18; p.career = [{ season: '2024/25', club: 'X', apps: 400, goals: 50, rating: 7 }];
    const mat = managerMaterial(p)!;
    expect(mat).toBeTruthy();
    const mgr = addFormerPlayer(s, p, 'Old Club', mat);
    expect(mgr.formerPlayer).toBe('Old Club');
    const club = Object.values(s.clubs).find((c) => c.reputation >= mat.rep - 5 && c.reputation <= mat.rep + 5)!;
    expect(favouriteFor(s, club.id)).toBeTruthy();
  });
});
