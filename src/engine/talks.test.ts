import { describe, expect, it } from 'vitest';
import { advanceDay, newGame, squadOf, today } from './game';
import { meetingCooldown, talkBlocked, talkCooldown, talkTo, teamMeeting } from './talks';

const game = () => newGame({ seed: 12, userClubId: 'ash', managerName: 'T', currency: 'EUR' });

describe('player talks', () => {
  it('once a fortnight per player; asking how he is is always allowed and changes nothing', () => {
    const s = game();
    const p = squadOf(s, s.userClubId).find((x) => x.squad === 'First team')!;
    expect(talkBlocked(s, p, 'praise')).toMatch(/few games/);
    const before = p.morale;
    expect(talkTo(s, p.id, 'mood').text).toContain(p.name.split(' ').slice(-1)[0]);
    expect(p.morale).toBe(before);
    expect(talkCooldown(s, p.id)).toBe(0);
    const r = talkTo(s, p.id, 'reassure');
    expect(['good', 'neutral', 'bad']).toContain(r.reaction);
    expect(talkCooldown(s, p.id)).toBe(14);
    expect(talkBlocked(s, p, 'reassure')).toMatch(/recently/);
    expect(talkBlocked(s, p, 'mood')).toBeNull();
    for (let i = 0; i < 14; i++) advanceDay(s);
    expect(talkCooldown(s, p.id)).toBe(0);
  });
  it('a promise is recorded and can only be made once', () => {
    const s = game();
    const p = squadOf(s, s.userClubId).find((x) => x.squad === 'First team')!;
    p.morale = 'low';
    expect(talkTo(s, p.id, 'promise').reaction).toBe('good');
    expect(p.morale).toBe('ok');
    expect(s.promises?.some((x) => x.playerId === p.id)).toBe(true);
    for (let i = 0; i < 14; i++) advanceDay(s);
    expect(talkBlocked(s, s.players[p.id], 'promise')).toMatch(/already/);
  });
  it('fair praise is welcome; criticising a player in form goes worse than one out of form', () => {
    let good = 0, badFair = 0, badUnfair = 0;
    const run = (seed: number, avg: number, topic: 'praise' | 'criticise') => {
      const s = newGame({ seed, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
      const p = squadOf(s, s.userClubId).filter((x) => x.squad === 'First team')[seed % 11];
      p.current.apps = 5; p.current.ratingSum = 5 * avg;
      return talkTo(s, p.id, topic).reaction;
    };
    for (let seed = 1; seed <= 30; seed++) {
      if (run(seed, 7.4, 'praise') === 'good') good++;
      if (run(seed, 6.2, 'criticise') === 'bad') badFair++;
      if (run(seed, 7.4, 'criticise') === 'bad') badUnfair++;
    }
    expect(good).toBe(30);
    expect(badUnfair).toBeGreaterThan(badFair);
  });
});

describe('team meetings', () => {
  it('moves morale and then waits a fortnight', () => {
    const s = game();
    const r = teamMeeting(s, 'calm');
    expect(r.lifted + r.upset).toBeGreaterThanOrEqual(0);
    expect(meetingCooldown(s)).toBe(14);
    expect(teamMeeting(s, 'praise').text).toMatch(/recently/);
    expect(s.meeting?.date).toBe(today(s));
  });
});
