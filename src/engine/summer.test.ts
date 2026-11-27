import { describe, expect, it } from 'vitest';
import { newGame, playMatchday, seasonOver, startNewSeason } from './game';
import { createLive, runToEnd, toResult } from './live';
import { takeJob } from './nationaljob';
import { beginSummer, recordSummerResult, summerStep, summerTournamentFor } from './summer';

describe('a live summer tournament', () => {
  it('pauses at each of your nation\'s matches, survives a reload, and feeds the season rollover', () => {
    const s = newGame({ seed: 71, userClubId: 'ash', managerName: 'T', currency: 'EUR', year: 2025 });
    takeJob(s, 'ENG');
    for (let guard = 0; !seasonOver(s) && !s.career?.sacked && guard < 400; guard++) playMatchday(s);
    expect(summerTournamentFor(s)).toBe('wc');
    beginSummer(s);
    let step = summerStep(s)!;
    const first = step.request!;
    expect(first.h === 'ENG' || first.a === 'ENG').toBe(true);
    expect((first.h === 'ENG' ? first.home : first.away).user).toBe(true);
    // play the first match, then "reload": the same next match comes back
    const lm = createLive(first.seed, first.home, first.away, first.venue, first.mods);
    runToEnd(lm);
    recordSummerResult(s, toResult(lm, first.h, first.a).result);
    const next = summerStep(s)!.request;
    const reloaded = JSON.parse(JSON.stringify(s));
    const again = summerStep(reloaded)!.request;
    expect(again?.h).toBe(next?.h); expect(again?.a).toBe(next?.a); expect(again?.stage).toBe(next?.stage);
    // play the rest
    let played = 1;
    for (step = summerStep(s)!; step.request; step = summerStep(s)!) {
      const r = step.request;
      const m = createLive(r.seed, r.home, r.away, r.venue, r.mods); runToEnd(m);
      recordSummerResult(s, toResult(m, r.h, r.a).result);
      played++;
    }
    expect(played).toBeGreaterThanOrEqual(3);
    const run = step.run!;
    const engMatches = run.tournament.matches.filter((m) => m.h === 'ENG' || m.a === 'ENG');
    expect(engMatches.length).toBe(played);
    expect(engMatches[0].s).toEqual(s.summer!.results[0].score);
    startNewSeason(s);
    expect(s.summer).toBeUndefined();
    const wc = s.internationals!.find((t) => t.name === 'FIFA World Cup 2026')!;
    expect(wc.winner).toBe(run.tournament.winner);
    expect(s.nationalJob!.w + s.nationalJob!.d + s.nationalJob!.l).toBe(played);
  }, 120_000);
});
