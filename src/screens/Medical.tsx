import { FD } from '../ds';
import { formatDate } from '../engine/fixtures';
import { canRush, medicalReport, RELAPSE_CHANCE, returnDate, riskWord, rushBack } from '../engine/medical';
import { staffRating } from '../engine/staff';
import type { GameState } from '../engine/types';
import type { Screen } from './shared';

/** The medical centre: who is out and until when, injury risk across the squad with the physio's advice, and
    the season's injuries. */
export default function Medical({ g, go, update }: { g: GameState; go: (s: Screen, id?: string) => void; update: (fn: (d: GameState) => void) => void }) {
  const r = medicalReport(g);
  const physio = g.staff?.physio, fitness = g.staff?.fitness;
  const high = r.fit.filter((x) => x.risk >= 60).length;
  const name = (id: string, n: string) => <button type="button" className="pg-link club-name" onClick={() => go('player', id)}><strong>{n}</strong></button>;
  return (
    <div className="pg-stack">
      <div className="pg-head" style={{ marginBottom: 0 }}>
        <div><h1 className="pg-title">Medical centre</h1><p className="pg-sub">{r.injured.length} injured · {high} at high risk · head physio {physio ? `${physio.name} (${staffRating(g, 'physio')}/20)` : 'none: hire one on the Staff screen'}{fitness ? ` · fitness coach ${fitness.name} (${staffRating(g, 'fitness')}/20)` : ''}</p></div>
      </div>
      <section className="pg-card">
        <h2 className="pg-h">Injured</h2>
        {r.injured.length ? (
          <div className="fd-table-wrap"><table className="fd-table">
            <thead><tr><th scope="col"><span className="fd-th">Player</span></th><th scope="col"><span className="fd-th">Injury</span></th><th scope="col" className="fd-num"><span className="fd-th">Out</span></th><th scope="col"><span className="fd-th">Back around</span></th><th scope="col"><span className="fd-th">Rush back</span></th></tr></thead>
            <tbody>{r.injured.map((p) => {
              const back = returnDate(g, p);
              return (
                <tr key={p.id}>
                  <td>{name(p.id, p.name)} <span className="fd-pos">{p.pos}</span></td>
                  <td>{p.injury?.type ?? 'Injury'}{p.injury?.rushed ? <span className="fd-tag fd-tag--warn" style={{ marginLeft: 6 }}>Rushed</span> : null}</td>
                  <td className="fd-num">{p.injuredFor} {p.injuredFor === 1 ? 'match' : 'matches'}</td>
                  <td>{back ? formatDate(back) : '—'}</td>
                  <td>{canRush(p) ? <FD.Button size="sm" variant="secondary" onClick={() => { if (window.confirm(`Rush ${p.name} back? He'll be out ${Math.ceil(p.injuredFor / 2)} instead of ${p.injuredFor}, but has about a ${Math.round(RELAPSE_CHANCE * 100)}% chance in each of his first two games of breaking down again, for longer.`)) update((d) => rushBack(d, p.id)); }}>Rush back</FD.Button> : <span className="fd-muted">{p.injury?.rushed ? 'Already rushed' : 'Back soon'}</span>}</td>
                </tr>
              );
            })}</tbody>
          </table></div>
        ) : <p className="hm-note">Nobody is injured.</p>}
      </section>
      <section className="pg-card">
        <h2 className="pg-h">Injury risk</h2>
        <p className="hm-note" style={{ marginTop: 0 }}>From how injury-prone he is, how tired, his age and natural fitness, your fitness coach and training facilities. Rested, fresh players get hurt less.</p>
        <div className="fd-table-wrap"><table className="fd-table">
          <thead><tr><th scope="col"><span className="fd-th">Player</span></th><th scope="col"><span className="fd-th">Risk</span></th><th scope="col" className="fd-num"><span className="fd-th">Fitness</span></th><th scope="col"><span className="fd-th">Physio's advice</span></th></tr></thead>
          <tbody>{r.fit.map(({ p, risk, advice }) => (
            <tr key={p.id}>
              <td>{name(p.id, p.name)} <span className="fd-pos">{p.pos}</span></td>
              <td><span className="sub-cond"><span className="fd-meter"><span className={`fd-meter__bar fd-meter__bar--${risk >= 60 ? 'high' : risk >= 38 ? 'medium' : 'low'}`} style={{ width: risk + '%' }} /></span><span className={risk >= 60 ? 'fd-money--neg' : risk >= 38 ? 'fd-warn' : 'fd-muted'}>{riskWord(risk)}</span></span></td>
              <td className="fd-num">{Math.round(p.condition ?? 100)}%</td>
              <td className={advice ? '' : 'fd-muted'}>{advice ?? 'Fine to play'}</td>
            </tr>
          ))}</tbody>
        </table></div>
      </section>
      <section className="pg-card">
        <h2 className="pg-h">This season's injuries</h2>
        {r.log.length ? (
          <ul className="med-log">{r.log.map((l, i) => <li key={i}><span className="fd-muted">{formatDate(l.date)}</span> {name(l.playerId, l.name)} · {l.type} · out {l.out} {l.out === 1 ? 'match' : 'matches'} <span className="fd-muted">({l.cause === 'training' ? 'in training' : l.cause === 'relapse' ? 'relapse' : 'in a match'})</span></li>)}</ul>
        ) : <p className="hm-note">No injuries yet this season.</p>}
      </section>
    </div>
  );
}
