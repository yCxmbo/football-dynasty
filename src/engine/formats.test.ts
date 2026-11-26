import { describe, expect, it } from 'vitest';
import { realWorld } from '../data/real';
import { leagueTableOf, promotionsAndRelegations } from './competitions';
import { newGame, playMatchday, seasonOver, startNewSeason } from './game';

describe('league formats', () => {
  it('MLS and Liga MX crown the play-off winner, the MLS table winner takes the Supporters\' Shield, and Scotland splits after 33 rounds', () => {
    const s = newGame({ seed: 61, userClubId: 'usa-miami', managerName: 'T', currency: 'USD', world: realWorld(), source: 'real' });
    expect(s.comps['tp-usa1'].name).toBe('MLS Cup Playoffs');
    expect(s.comps['tp-mex1'].name).toBe('Liguilla');
    while (!seasonOver(s)) playMatchday(s);
    for (const lg of ['usa1', 'mex1']) {
      const fx = s.fixtures.filter((f) => f.comp === `tp-${lg}`);
      expect(fx.filter((f) => f.round === 'Quarter-final').length).toBe(4);
      expect(fx.filter((f) => f.round === 'Semi-final').length).toBe(2);
      expect(fx.filter((f) => f.round === 'Final').length).toBe(1);
      const top8 = leagueTableOf(s, lg).slice(0, 8).map((r) => r.clubId);
      // 1st hosts 8th; every tie is at the better seed's ground
      const qf = fx.filter((f) => f.round === 'Quarter-final');
      expect(qf[0].homeId).toBe(top8[0]); expect(qf[0].awayId).toBe(top8[7]);
      for (const f of fx) expect(top8.indexOf(f.homeId)).toBeLessThan(top8.indexOf(f.awayId));
      expect(s.cups[`tp-${lg}`].winner).toBeTruthy();
    }
    // Scottish split: 33 rounds, then five within each half; nobody changes half
    const sco = s.fixtures.filter((f) => f.comp === 'sco1');
    expect(sco.length).toBe((12 * 33) / 2 + 2 * 15);
    const t = leagueTableOf(s, 'sco1');
    expect(t.every((r) => r.p === 38)).toBe(true);
    const [top, bottom] = s.groups['split-sco1'];
    expect(t.slice(0, 6).map((r) => r.clubId).sort()).toEqual([...top].sort());
    for (const f of sco.filter((x) => Number(x.round.replace('Matchday ', '')) > 33)) expect(top.includes(f.homeId)).toBe(top.includes(f.awayId));
    expect(bottom.length).toBe(6);
    const mlsChamp = s.cups['tp-usa1'].winner!, shield = leagueTableOf(s, 'usa1')[0].clubId;
    const ligaChamp = s.cups['tp-mex1'].winner!;
    startNewSeason(s);
    expect(s.trophies[mlsChamp].some((t) => t.name === 'MLS Cup')).toBe(true);
    expect(s.trophies[shield].some((t) => t.name === 'Supporters\' Shield')).toBe(true);
    expect(s.trophies[ligaChamp].some((t) => t.name === 'Liga MX')).toBe(true);
    expect(s.history[mlsChamp][0].champion).toBe(s.clubs[mlsChamp].name);
  }, 120_000);

  it('reserve sides can\'t be promoted: the next club goes up instead', () => {
    const s = newGame({ seed: 62, userClubId: 'ned-ajax', managerName: 'T', currency: 'EUR', world: realWorld(), source: 'real' });
    for (const f of s.fixtures.filter((x) => x.comp === 'ned2')) {
      // Jong Ajax win everything, so they top the table
      f.result = { score: f.homeId === 'ned-jongajax' ? [5, 0] : f.awayId === 'ned-jongajax' ? [0, 5] : [1, 1], events: [], stats: {} as never, ratings: { home: [], away: [] } };
    }
    const t = leagueTableOf(s, 'ned2');
    expect(t[0].clubId).toBe('ned-jongajax');
    const { moves } = promotionsAndRelegations(s);
    expect(moves['ned-jongajax']).toBeUndefined();
    const up = Object.entries(moves).filter(([, m]) => m.to === 'ned1').map(([id]) => id);
    expect(up.length).toBe(2);
    for (const id of up) expect(s.clubs[id].reserve).toBeFalsy();
  });
});
