import { FD } from '../ds';
import { available, slotsOf, type Formation } from '../engine/match';
import { bestLineup, recoveryPerDay, squadOf, userLineup } from '../engine/game';
import { EQUIVALENT } from '../engine/world';
import type { GameState, Player } from '../engine/types';

/** Saves made before wide-position equivalents existed still show LW→LM etc. as accomplished. */
const lite = (p: Player) => {
  const positions = { ...p.positions };
  for (const e of EQUIVALENT[p.pos] ?? []) positions[e] ??= 'accomplished';
  return { id: p.id, number: p.number, name: p.name, pos: p.pos, positions };
};
const cond = (p: Player) => Math.round(p.condition ?? 100);

function FitnessRow({ g, p, slot, rotated }: { g: GameState; p: Player; slot?: string; rotated?: boolean }) {
  const c = cond(p);
  const daysTo100 = c >= 100 ? 0 : Math.ceil((100 - c) / recoveryPerDay(g, p));
  return (
    <tr>
      <td>{slot ? <span className="fd-pos">{slot}</span> : null}</td>
      <td><strong>{p.name}</strong>{rotated ? <span className="fd-tag fd-tag--warn" style={{ marginLeft: 6 }}>Rested next match</span> : null}{!available(p) ? <span className="fd-tag fd-tag--loss" style={{ marginLeft: 6 }}>{p.injuredFor ? 'Injured' : 'Suspended'}</span> : null}</td>
      <td style={{ width: 180 }}><span className="sub-cond"><span className="fd-meter"><span className={`fd-meter__bar fd-meter__bar--${c >= 75 ? 'low' : c >= 60 ? 'medium' : 'high'}`} style={{ width: c + '%' }} /></span><span className={c < 60 ? 'fd-money--neg' : c < 75 ? 'fd-warn' : 'fd-muted'}>{c}%</span></span></td>
      <td className="fd-num fd-muted">{daysTo100 ? `${daysTo100} ${daysTo100 === 1 ? 'day' : 'days'} to full` : 'Fresh'}</td>
    </tr>
  );
}

export default function Tactics({ g, onChange, onAutoRotate, liveNote }: { g: GameState; onChange: (formation: Formation, lineup: string[]) => void; onAutoRotate: (on: boolean) => void; liveNote?: boolean }) {
  const ft = squadOf(g, g.userClubId).filter((p) => p.squad === 'First team');
  const xi = g.lineup.map((id) => g.players[id]).filter(Boolean);
  const bench = ft.filter((p) => !g.lineup.includes(p.id)).sort((a, b) => Number(available(b)) - Number(available(a)) || b.ability - a.ability);
  const unavailable = xi.filter((p) => !available(p));
  const next = new Set(userLineup(g));
  const slots = slotsOf(g.formation);
  const rotateOn = g.autoRotate !== false;
  const tired = xi.filter((p) => cond(p) < 70);
  return (
    <div className="pg-stack">
      <div className="pg-head" style={{ marginBottom: 0 }}>
        <div><h1 className="pg-title">Tactics</h1><p className="pg-sub">Choose a formation and swap players by clicking one, then another. Players out of position or tired perform worse.</p></div>
        <FD.Button variant="secondary" icon="sim" onClick={() => onChange(g.formation, bestLineup(g))}>Pick best XI</FD.Button>
      </div>
      {liveNote && <p className="tr-window" role="status">A match is in progress. Changes here apply from the next match; make substitutions from the match screen.</p>}
      {unavailable.length > 0 && <p className="fd-money--neg" role="alert">{unavailable.map((p) => p.name).join(', ')} {unavailable.length === 1 ? 'is' : 'are'} unavailable and will be replaced automatically. Pick a replacement or use Pick best XI.</p>}
      <FD.FormationBoard
        formation={g.formation}
        onFormationChange={(f: Formation) => onChange(f, bestLineup(g, f))}
        lineup={xi.map(lite)}
        bench={bench.map((p) => ({ ...lite(p), name: !available(p) ? `${p.name} (${p.injuredFor ? 'injured' : 'suspended'})` : `${p.name} · ${cond(p)}%` }))}
        onChange={(l: Array<{ id: string }>) => onChange(g.formation, l.slice(0, slots.length).map((x) => x.id))}
      />
      <section className="pg-card">
        <div className="pg-row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <h2 className="pg-h" style={{ margin: 0 }}>Fitness</h2>
            <p className="hm-note">Players tire during matches and recover a few points a day ({tired.length ? `${tired.length} of your starters ${tired.length === 1 ? 'is' : 'are'} under 70%` : 'your starters are fit'}). Tired players play worse and get injured more.</p>
          </div>
          <label className="tr-check"><input type="checkbox" checked={rotateOn} onChange={(e) => onAutoRotate(e.target.checked)} /> Rotate tired players (under 70%) automatically</label>
        </div>
        <table className="fd-mini fit-table">
          <tbody>
            {xi.map((p, i) => <FitnessRow key={p.id} g={g} p={p} slot={slots[i]} rotated={rotateOn && !next.has(p.id)} />)}
            <tr><td colSpan={4} className="pg-h" style={{ paddingTop: 12 }}>Substitutes</td></tr>
            {bench.map((p) => <FitnessRow key={p.id} g={g} p={p} />)}
          </tbody>
        </table>
      </section>
    </div>
  );
}
