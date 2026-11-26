import { describe, expect, it } from 'vitest';
import { realWorld } from '../data/real';
import { applyChance, boardConfidence, career, currentSpell, makeOffers, moveTo, seasonVerdict } from './career';
import { boardTarget, newGame, playMatchday, squadOf } from './game';
import { createRng } from './rng';

const game = () => newGame({ seed: 4, userClubId: 'eng-everton', managerName: 'T', currency: 'GBP', world: realWorld(), source: 'real' });

describe('manager career', () => {
  it('starts with a first spell and the board\'s banked trust', () => {
    const s = game();
    const c = career(s);
    expect(c.spells.length).toBe(1);
    expect(c.spells[0].club).toBe('Merseyside Toffees');
    expect(boardConfidence(s, boardTarget(s, s.userClubId))).toBe(65);
  });

  it('a poor season gets you sacked; a strong one raises the board\'s trust', () => {
    const s = game();
    const target = boardTarget(s, s.userClubId);
    expect(seasonVerdict(s, target, { pos: 20, champion: false, promoted: false, relegated: true, trophies: 0 })).toBe(true);
    career(s).trust = 65;
    expect(seasonVerdict(s, target, { pos: 3, champion: false, promoted: false, relegated: false, trophies: 1 })).toBe(false);
    expect(career(s).trust).toBeGreaterThan(80);
  });

  it('a sacked manager always gets offers from smaller clubs', () => {
    const s = game();
    const offers = makeOffers(s, createRng(2), [], 'sacked');
    expect(offers.length).toBeGreaterThanOrEqual(3);
    for (const o of offers) expect(s.clubs[o.clubId].reputation).toBeLessThan(s.clubs[s.userClubId].reputation);
  });

  it('while sacked, nothing is played until you take a new job', () => {
    const s = game();
    career(s).sacked = true;
    const md = s.matchday;
    expect(playMatchday(s)).toBeUndefined();
    expect(s.matchday).toBe(md);
  });

  it('moving abroad switches club, closes the old spell, and gives the new club an academy', () => {
    const s = game();
    for (let i = 0; i < 6; i++) playMatchday(s);
    const before = currentSpell(s);
    moveTo(s, createRng(9), 'esp-sevilla', 'moved');
    const c = career(s);
    expect(s.userClubId).toBe('esp-sevilla');
    expect(s.world.userCountry).toBe('esp');
    expect(c.spells.length).toBe(2);
    expect(c.spells[0].left).toBe('moved');
    expect(c.spells[0].w + c.spells[0].d + c.spells[0].l).toBe(before.w + before.d + before.l);
    expect(c.trust).toBe(65);
    expect(s.lineup.every((id) => s.players[id]?.clubId === 'esp-sevilla')).toBe(true);
    expect(squadOf(s, 'esp-sevilla').filter((p) => p.squad !== 'First team').length).toBeGreaterThanOrEqual(18);
    for (let i = 0; i < 3; i++) playMatchday(s);
  });

  it('bigger clubs are harder to talk into hiring you', () => {
    const s = game();
    expect(applyChance(s, 'eng-mancity')).toBeLessThan(applyChance(s, 'eng-burnley'));
  });
});
