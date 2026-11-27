import { describe, expect, it } from 'vitest';
import { newGame, squadOf } from './game';
import { captainOf, setCaptain, setTaker, takersOf } from './leadership';
import { createLive, cornerChance, freeKickChance, penaltyChance, runToEnd, setPieceTaker, snap } from './live';
import type { Player } from './types';

const game = () => newGame({ seed: 111, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
const ft = (s: ReturnType<typeof game>) => squadOf(s, 'ash').filter((p) => p.squad === 'First team');

describe('captain', () => {
  it('defaults to the best leader; naming one lifts him and can upset others', () => {
    const s = game();
    const best = ft(s).slice().sort((a, b) => (b.attributes.Leadership ?? 0) - (a.attributes.Leadership ?? 0))[0];
    for (const p of ft(s)) p.captain = false;
    expect(captainOf(s, 'ash')!.attributes.Leadership).toBe(best.attributes.Leadership);
    best.captain = true; best.attributes.Leadership = 18;
    const kid = ft(s).find((p) => p.id !== best.id)!;
    kid.attributes.Leadership = 6;
    for (const p of ft(s)) p.morale = 'ok';
    const msg = setCaptain(s, kid.id);
    expect(captainOf(s, 'ash')!.id).toBe(kid.id);
    expect(kid.morale).toBe('high');
    expect(best.morale).toBe('low');
    expect(msg).toMatch(/hurt to lose the armband/);
    expect(msg).toMatch(/question the choice/);
  });
});

describe('set pieces', () => {
  it('better takers score more often', () => {
    const s = game();
    const p = snap(ft(s)[0]);
    const lo = { ...p, attrs: { ...p.attrs, Penalties: 5, Composure: 5, 'Free Kicks': 5, Corners: 5 } };
    const hi = { ...p, attrs: { ...p.attrs, Penalties: 20, Composure: 20, 'Free Kicks': 20, Corners: 20 } };
    expect(penaltyChance(hi)).toBeGreaterThan(penaltyChance(lo) + 0.2);
    expect(freeKickChance(hi)).toBeGreaterThan(freeKickChance(lo) * 2);
    expect(cornerChance(hi)).toBeGreaterThan(cornerChance(lo) * 1.5);
  });
  it('your chosen taker steps up when he plays; otherwise the best available does', () => {
    const s = game();
    const xi = ft(s).filter((p) => p.pos !== 'GK').slice(0, 10);
    const gk = ft(s).find((p) => p.pos === 'GK')!;
    const worst = xi.slice().sort((a, b) => (a.attributes.Penalties ?? 0) - (b.attributes.Penalties ?? 0))[0];
    setTaker(s, 'pen', worst.id);
    expect(takersOf(s).pen).toBe(worst.id);
    const side = (players: Player[]) => ({ xi: players, bench: [], formation: '4-3-3' as const, name: 'X', takers: takersOf(s) });
    const lm = createLive(1, side([gk, ...xi]), side([gk, ...xi].map((p) => ({ ...p, id: p.id + 'b' }))), 'Ground');
    expect(setPieceTaker(lm, lm.home, 'pen')!.id).toBe(worst.id);
    lm.home.xi = lm.home.xi.map((id) => (id === worst.id ? null : id));
    const auto = setPieceTaker(lm, lm.home, 'pen')!;
    expect(auto.id).not.toBe(worst.id);
    runToEnd(lm);
    expect(lm.done).toBe(true);
    setTaker(s, 'pen');
    expect(takersOf(s).pen).toBeUndefined();
  });
});
