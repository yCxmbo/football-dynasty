import { describe, expect, it } from 'vitest';
import { newGame, squadOf } from './game';
import { available, fitFor, pickLineup, slotsOf, type Formation } from './match';
import { realWorld } from '../data/real';

const total = (ids: string[], f: Formation, s: ReturnType<typeof newGame>) => ids.reduce((a, id, i) => a + s.players[id].ability * fitFor(s.players[id], slotsOf(f)[i]), 0);

describe('line-up picker', () => {
  it('puts players in their natural positions where it can', () => {
    const bad: string[] = [];
    for (let seed = 1; seed <= 12; seed++) {
      const s = newGame({ seed, userClubId: 'eng-arsenal', managerName: 'T', currency: 'EUR', world: realWorld(), source: 'real' });
      const slots = slotsOf('4-3-3');
      const xi = pickLineup(squadOf(s, 'eng-arsenal'), '4-3-3');
      const misplaced = xi.filter((id, i) => fitFor(s.players[id], slots[i]) < 0.9);
      if (misplaced.length) bad.push(`seed ${seed}: ` + xi.map((id, i) => `${slots[i]}:${s.players[id].name.split(' ').pop()}(${s.players[id].pos} ${s.players[id].ability} fit ${fitFor(s.players[id], slots[i]).toFixed(2)})`).filter((x) => /fit 0\.[0-8]/.test(x)).join(' '));
    }
    console.log(bad.join('\n'));
    expect(bad).toEqual([]);
  });
  it('leaves no improving swap, in every formation, for several clubs', () => {
    const s = newGame({ seed: 2, userClubId: 'eng-everton', managerName: 'T', currency: 'EUR', world: realWorld(), source: 'real' });
    for (const club of ['eng-arsenal', 'esp-realmadrid', 'ger-bayern', 'eng-everton'])
      for (const f of ['4-3-3', '4-2-3-1', '3-5-2', '5-4-1', '4-4-2 diamond'] as Formation[]) {
        const squad = squadOf(s, club).filter((p) => p.squad === 'First team' && available(p));
        const xi = pickLineup(squad, f);
        expect(new Set(xi).size, `${club} ${f}`).toBe(11);
        expect(xi.every(Boolean)).toBe(true);
        // no single swap (inside the eleven, or with a player left out) improves it
        const base = total(xi, f, s);
        for (let i = 0; i < 11; i++) {
          for (let j = i + 1; j < 11; j++) { const t2 = [...xi]; [t2[i], t2[j]] = [t2[j], t2[i]]; expect(total(t2, f, s), `${club} ${f} swap ${i}-${j}`).toBeLessThanOrEqual(base + 0.5); }
          for (const p of squad) if (!xi.includes(p.id)) { const t2 = [...xi]; t2[i] = p.id; expect(total(t2, f, s)).toBeLessThanOrEqual(base + 0.5); }
        }
      }
  });
});
