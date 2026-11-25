import { FD } from '../ds';
import { available, slotsOf, type Formation } from '../engine/match';
import { bestLineup, squadOf } from '../engine/game';
import { EQUIVALENT } from '../engine/world';
import type { GameState, Player } from '../engine/types';

/** Saves made before wide-position equivalents existed still show LW→LM etc. as accomplished. */
const lite = (p: Player) => {
  const positions = { ...p.positions };
  for (const e of EQUIVALENT[p.pos] ?? []) positions[e] ??= 'accomplished';
  return { id: p.id, number: p.number, name: p.name, pos: p.pos, positions };
};

export default function Tactics({ g, onChange }: { g: GameState; onChange: (formation: Formation, lineup: string[]) => void }) {
  const ft = squadOf(g, g.userClubId).filter((p) => p.squad === 'First team');
  const xi = g.lineup.map((id) => g.players[id]).filter(Boolean);
  const bench = ft.filter((p) => !g.lineup.includes(p.id)).sort((a, b) => Number(available(b)) - Number(available(a)) || b.ability - a.ability);
  const unavailable = xi.filter((p) => !available(p));
  return (
    <div className="pg-stack">
      <div className="pg-head" style={{ marginBottom: 0 }}>
        <div><h1 className="pg-title">Tactics</h1><p className="pg-sub">Choose a formation and swap players by clicking one, then another. Players out of position perform worse.</p></div>
        <FD.Button variant="secondary" icon="sim" onClick={() => onChange(g.formation, bestLineup(g))}>Pick best XI</FD.Button>
      </div>
      {unavailable.length > 0 && <p className="fd-money--neg" role="alert">{unavailable.map((p) => p.name).join(', ')} {unavailable.length === 1 ? 'is' : 'are'} unavailable and will be replaced automatically. Pick a replacement or use Pick best XI.</p>}
      <FD.FormationBoard
        formation={g.formation}
        onFormationChange={(f: Formation) => onChange(f, bestLineup(g, f))}
        lineup={xi.map(lite)}
        bench={bench.map((p) => ({ ...lite(p), name: available(p) ? p.name : `${p.name} (${p.injuredFor ? 'injured' : 'suspended'})` }))}
        onChange={(l: Array<{ id: string }>) => onChange(g.formation, l.slice(0, slotsOf(g.formation).length).map((x) => x.id))}
      />
    </div>
  );
}
