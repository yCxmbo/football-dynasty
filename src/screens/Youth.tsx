import { useState } from 'react';
import { FD } from '../ds';
import { AUTO_SIGN, MAX_REGIONS, MAX_SIGN, regionFee, setRegions, togglePick, verdict } from '../engine/youth';
import { nationName } from '../engine/nations';
import { toCur } from '../store';
import { squadOf, youthScale } from '../engine/game';
import type { GameState } from '../engine/types';
import type { Screen } from './shared';

export default function Youth({ g, go, onPromote, update }: { g: GameState; go: (s: Screen, id?: string) => void; onPromote: (id: string) => void; update: (fn: (d: GameState) => void) => void }) {
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
      <Intake g={g} update={update} />
      <FD.YouthAcademy squads={squads} scale={youthScale()} intake={{ date: 'Start of next season', outlook: g.youth ? `${g.youth.picked.length || AUTO_SIGN} chosen of ${g.youth.candidates.length} candidates` : 'Candidates presented about six weeks before the season ends' }} onPromote={(p: { id: string }) => onPromote(p.id)} />
      <p className="hm-note">Tip: click a name in the Squad screen (U21 or U18 tab) for the full profile. <button className="pg-link" onClick={() => go('squad')}>Open squad</button></p>
    </div>
  );
}

/** Next season's candidates (choose who to sign) and youth scouting regions. */
function Intake({ g, update }: { g: GameState; update: (fn: (d: GameState) => void) => void }) {
  const [msg, setMsg] = useState('');
  const y = g.youth;
  const regions = g.youthRegions ?? [];
  const nations = [...new Set(Object.values(g.players).filter((p) => p.squad === 'First team').map((p) => p.nationality))].sort((a, b) => nationName(a).localeCompare(nationName(b)));
  const fee = regionFee(g);
  return (
    <section className="pg-card" aria-labelledby="intake-h">
      <div className="talk__head"><h2 className="pg-h" id="intake-h" style={{ margin: 0 }}>Youth recruitment</h2>
        <span className="fd-muted talk__meta">{y ? `${y.picked.length}/${MAX_SIGN} chosen` : 'Candidates arrive about six weeks before the season ends'}</span></div>
      <div className="yi-regions">
        <span className="fd-label">Youth scouting abroad</span>
        {[0, 1].slice(0, MAX_REGIONS).map((k) => (
          <select key={k} className="fd-input" value={regions[k] ?? ''} aria-label={`Youth scouting region ${k + 1}`} onChange={(e) => { const n = [...regions]; n[k] = e.target.value; update((d) => setRegions(d, n.filter(Boolean))); }}>
            <option value="">{k === 0 ? 'None' : 'No second region'}</option>
            {nations.filter((c) => c === regions[k] || !regions.includes(c)).map((c) => <option key={c} value={c}>{nationName(c)}</option>)}
          </select>
        ))}
        <span className="hm-note" style={{ margin: 0 }}>Each region costs {FD.formatMoney(toCur(fee, g.currency), g.currency)} a year and brings better prospects from there into your intake.</span>
      </div>
      {y ? (
        <>
          <ul className="yi-comments">{y.comments.map((c, i) => <li key={i}>“{c}”</li>)}</ul>
          <div className="fd-table-wrap"><table className="fd-table">
            <thead><tr>{['', 'Candidate', 'Pos', 'Age', 'Nation', 'Head of youth says'].map((c, i) => <th key={i} scope="col"><span className="fd-th">{c}</span></th>)}</tr></thead>
            <tbody>{y.candidates.map((p) => {
              const on = y.picked.includes(p.id);
              return (
                <tr key={p.id} className={on ? 'is-selected' : undefined}>
                  <td><input type="checkbox" checked={on} aria-label={`Sign ${p.name}`} onChange={() => { const e = togglePick(structuredClone(g), p.id); if (e) { setMsg(e); return; } setMsg(''); update((d) => { togglePick(d, p.id); }); }} /></td>
                  <td><strong>{p.name}</strong></td><td><span className="fd-pos">{p.pos}</span></td><td>{p.age}</td><td className="fd-muted">{nationName(p.nationality)}</td>
                  <td><span className={`net-grade net-grade--${p.potential >= 145 ? 'A' : p.potential >= 115 ? 'B' : 'C'}`}>{verdict(p)}</span></td>
                </tr>
              );
            })}</tbody>
          </table></div>
          {msg ? <p className="fd-warn" role="status">{msg}</p> : null}
          <p className="hm-note" style={{ marginBottom: 0 }}>Tick up to {MAX_SIGN}. They join the U18s when the season turns; if you tick nobody, the best {AUTO_SIGN} are signed for you.</p>
        </>
      ) : null}
    </section>
  );
}
