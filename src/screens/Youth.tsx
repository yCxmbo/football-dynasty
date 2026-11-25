import { FD } from '../ds';
import { squadOf, youthScale } from '../engine/game';
import type { GameState } from '../engine/types';
import type { Screen } from './shared';

export default function Youth({ g, go, onPromote }: { g: GameState; go: (s: Screen, id?: string) => void; onPromote: (id: string) => void }) {
  const mine = squadOf(g, g.userClubId);
  const ft = mine.filter((p) => p.squad === 'First team').map((p) => p.ability).sort((a, b) => a - b);
  const fringe = ft[Math.floor(ft.length * 0.25)] ?? 100; // a back-up first-teamer's level
  const row = (p: typeof mine[number]) => ({
    id: p.id, name: p.name, pos: p.pos, age: p.age, ability: p.ability, potential: p.potential, knowledge: 90,
    readiness: p.ability >= fringe - 5 ? 'ready' : p.ability >= fringe - 25 && p.potential >= fringe + 10 ? 'soon' : 'not',
  });
  const squads = { U21: mine.filter((p) => p.squad === 'U21').sort((a, b) => b.ability - a.ability).map(row), U18: mine.filter((p) => p.squad === 'U18').sort((a, b) => b.ability - a.ability).map(row) };
  return (
    <div className="pg-stack">
      <div className="pg-head" style={{ marginBottom: 0 }}>
        <div><h1 className="pg-title">Academy</h1><p className="pg-sub">Youth players (U18, U21, youth contracts) have silver stars. Promote them to the first team to sign a professional contract.</p></div>
      </div>
      <FD.YouthAcademy squads={squads} scale={youthScale()} intake={{ date: 'Start of next season', outlook: '3–5 new U18 players' }} onPromote={(p: { id: string }) => onPromote(p.id)} />
      <p className="hm-note">Tip: click a name in the Squad screen (U21 or U18 tab) for the full profile. <button className="pg-link" onClick={() => go('squad')}>Open squad</button></p>
    </div>
  );
}
