import { describe, expect, it } from 'vitest';
import { advanceDay, newGame } from './game';
import { addAssignment, assignments, judge, maxAssignments } from './network';

describe('scouting network', () => {
  it('assignments report weekly with players that fit the brief, partly scouted, and end on time', () => {
    const s = newGame({ seed: 41, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
    expect(addAssignment(s, { kind: 'brief', brief: { pos: 'LB', maxAge: 24 } }, 4)).toBeNull();
    const league = s.world.leagues[0].id;
    expect(addAssignment(s, { kind: 'league', target: league }, 4)).toBeNull();
    for (let i = 0; i < maxAssignments(s) - 2; i++) addAssignment(s, { kind: 'brief', brief: {} }, 4);
    expect(addAssignment(s, { kind: 'brief', brief: {} }, 4)).toMatch(/all out/);
    for (let d = 0; d < 30; d++) advanceDay(s);
    const n = assignments(s);
    const fromBrief = n.recs.filter((r) => r.assignmentId === 'as1').map((r) => s.players[r.playerId]);
    expect(fromBrief.length).toBeGreaterThan(0);
    for (const p of fromBrief) { expect(p.pos).toBe('LB'); expect(p.age).toBeLessThanOrEqual(24); expect(s.knowledge[p.id]).toBeGreaterThanOrEqual(55); }
    for (const r of n.recs.filter((x) => x.assignmentId === 'as2')) expect(s.clubs[s.players[r.playerId].clubId].league).toBe(league);
    expect(s.inbox.some((m) => m.category === 'scouting' && m.link?.screen === 'scouting')).toBe(true);
    for (let d = 0; d < 5; d++) advanceDay(s);
    expect(n.assignments.length).toBe(0);
  });
  it('grades: a much better player is an A', () => {
    const s = newGame({ seed: 41, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
    const best = Object.values(s.players).filter((p) => p.clubId !== 'ash' && p.squad === 'First team').sort((a, b) => b.ability - a.ability)[0];
    expect(judge(s, best).grade).toBe('A');
  });
});
