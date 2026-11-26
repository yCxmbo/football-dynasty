import { describe, expect, it } from 'vitest';
import { afterMatch, afterTournament, afterTransfer, unlock } from './achievements';
import { newGame, playMatchday, seasonOver, startNewSeason } from './game';

const game = () => newGame({ seed: 91, userClubId: 'ash', managerName: 'T', currency: 'EUR' });

describe('achievements', () => {
  it('unlock once, with the season, and arrive in the inbox', () => {
    const s = game();
    unlock(s, 'first-win');
    unlock(s, 'first-win');
    expect(Object.keys(s.achievements!)).toEqual(['first-win']);
    expect(s.inbox.filter((m) => m.subject === 'Achievement: Off the mark').length).toBe(1);
  });

  it('a season brings the results and trophy achievements that were earned', () => {
    const s = game();
    while (!seasonOver(s)) playMatchday(s);
    const won = s.manager.w;
    startNewSeason(s);
    if (won > 0) expect(s.achievements?.['first-win']).toBeTruthy();
    const titles = s.manager.trophies.length;
    if (titles > 0) expect(s.achievements?.['first-trophy']).toBeTruthy();
  }, 120_000);

  it('transfers and tournaments', () => {
    const s = game();
    afterTransfer(s, 60_000_000, false);
    afterTransfer(s, 10_000_000, true);
    afterTournament(s, 'FIFA World Cup 2030', 'Winners');
    expect(s.achievements?.['big-signing']).toBeTruthy();
    expect(s.achievements?.['big-sale']).toBeUndefined();
    expect(s.achievements?.['world-champion']).toBeTruthy();
    expect(s.achievements?.national).toBeTruthy();
    void afterMatch;
  });
});
