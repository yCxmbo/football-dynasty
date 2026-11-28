import { useState } from 'react';
import { dataHub, type MatchLine, type SourceLine } from '../engine/datahub';
import type { GameState } from '../engine/types';
import type { Screen } from './shared';

const SRC: Record<string, string> = { open: 'Open play', counter: 'Counters', corner: 'Corners', 'free kick': 'Free kicks', penalty: 'Penalties' };
const sign = (n: number) => (n > 0 ? `+${n.toFixed(1)}` : n.toFixed(1));

/** Your season in numbers: xG match by match, finishing and keeping against xG, where chances come from, and how
    your players rate. */
export default function DataHub({ g, go }: { g: GameState; go: (s: Screen, id?: string) => void }) {
  const d = dataHub(g);
  const t = d.totals;
  if (!d.matches.length) return <div className="pg-stack"><div className="pg-head"><div><h1 className="pg-title">Data hub</h1><p className="pg-sub">Your analytics fill in once you've played a competitive match.</p></div></div></div>;
  return (
    <div className="pg-stack dh">
      <div className="pg-head" style={{ marginBottom: 0 }}><div><h1 className="pg-title">Data hub</h1><p className="pg-sub">{d.matches.length} competitive {d.matches.length === 1 ? 'match' : 'matches'} this season. xG (expected goals) is how many goals your chances were worth.</p></div></div>
      <div className="hm-strip">
        <div className="hm-stat"><span className="fd-label">Finishing</span><strong>{sign(t.gf - t.xgf)}</strong><span className="fd-muted">{t.gf} goals from {t.xgf.toFixed(1)} xG</span></div>
        <div className="hm-stat"><span className="fd-label">Keeping</span><strong>{sign(t.xga - t.ga)}</strong><span className="fd-muted">{t.ga} conceded from {t.xga.toFixed(1)} xG against</span></div>
        <div className="hm-stat"><span className="fd-label">Shots</span><strong>{t.shots}–{t.shotsA}</strong><span className="fd-muted">for and against</span></div>
        <div className="hm-stat"><span className="fd-label">Possession</span><strong>{t.poss}%</strong><span className="fd-muted">average</span></div>
        <div className="hm-stat"><span className="fd-label">Pass accuracy</span><strong>{t.pass}%</strong><span className="fd-muted">average</span></div>
      </div>
      <XgChart ms={d.matches} go={go} />
      <Sources rows={d.sources} />
      <section className="pg-card">
        <h2 className="pg-h">Your players</h2>
        <div className="fd-table-wrap"><table className="fd-table">
          <thead><tr>{['Player', 'Pos', 'Apps', 'Minutes', 'Average rating', 'Goals', 'Assists'].map((c, i) => <th key={c} scope="col" className={i >= 2 && i !== 4 ? 'fd-num' : undefined}><span className="fd-th">{c}</span></th>)}</tr></thead>
          <tbody>{d.players.map((p) => (
            <tr key={p.id} className="fx-click" onClick={() => go('player', p.id)}>
              <td><strong>{p.name}</strong></td><td><span className="fd-pos">{p.pos}</span></td><td className="fd-num">{p.apps}</td><td className="fd-num">{p.minutes}</td>
              <td><span className="dh-rating"><span className="dh-rating__bar" style={{ width: `${Math.max(0, Math.min(100, ((p.rating - 5.5) / 3) * 100))}%` }} /><span className="fd-num">{p.rating.toFixed(2)}</span></span></td>
              <td className="fd-num">{p.goals}</td><td className="fd-num">{p.assists}</td>
            </tr>
          ))}</tbody>
        </table></div>
      </section>
    </div>
  );
}

/** xG for and against, match by match: two lines with a legend, end labels, a hover crosshair and a table view. */
function XgChart({ ms, go }: { ms: MatchLine[]; go: (s: Screen, id?: string) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 720, H = 220, L = 34, R = 54, T = 14, B = 26;
  const max = Math.max(1, Math.ceil(Math.max(...ms.map((m) => Math.max(m.xgf, m.xga)))));
  const x = (i: number) => L + (ms.length === 1 ? (W - L - R) / 2 : (i / (ms.length - 1)) * (W - L - R));
  const y = (v: number) => T + (1 - v / max) * (H - T - B);
  const ticks = Array.from({ length: max + 1 }, (_, i) => i).filter((v) => max <= 4 || v % 2 === 0);
  const line = (f: (m: MatchLine) => number) => ms.map((m, i) => `${x(i)},${y(f(m))}`).join(' ');
  const last = ms.length - 1, h = hover !== null ? ms[hover] : null;
  return (
    <section className="pg-card">
      <h2 className="pg-h">xG for and against, match by match</h2>
      <div className="dh-legend"><span><i className="dh-key dh-key--for" />xG for</span><span><i className="dh-key dh-key--against" />xG against</span></div>
      <div className="sr-chart">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`xG for and against over ${ms.length} matches. Total for ${ms.reduce((a, m) => a + m.xgf, 0).toFixed(1)}, against ${ms.reduce((a, m) => a + m.xga, 0).toFixed(1)}.`} onMouseLeave={() => setHover(null)}>
          {ticks.map((v) => <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="sr-grid-line" /><text x={L - 8} y={y(v) + 4} textAnchor="end" className="sr-axis">{v}</text></g>)}
          <text x={L} y={H - 6} className="sr-axis">Match 1</text>
          <text x={W - R} y={H - 6} textAnchor="end" className="sr-axis">Match {ms.length}</text>
          {hover !== null ? <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} className="dh-cross" /> : null}
          <polyline points={line((m) => m.xga)} className="dh-line dh-line--against" />
          <polyline points={line((m) => m.xgf)} className="dh-line dh-line--for" />
          {[['for', (m: MatchLine) => m.xgf], ['against', (m: MatchLine) => m.xga]].map(([k, f]) => (
            <g key={k as string}>
              <circle cx={x(last)} cy={y((f as (m: MatchLine) => number)(ms[last]))} r={4} className={`dh-dot dh-dot--${k}`} />
              {hover !== null ? <circle cx={x(hover)} cy={y((f as (m: MatchLine) => number)(ms[hover]))} r={5} className={`dh-dot dh-dot--${k}`} /> : null}
            </g>
          ))}
          <text x={x(last) + 8} y={y(ms[last].xgf) + (ms[last].xgf >= ms[last].xga ? -2 : 12)} className="sr-end">{ms[last].xgf.toFixed(1)}</text>
          <text x={x(last) + 8} y={y(ms[last].xga) + (ms[last].xga > ms[last].xgf ? -2 : 12)} className="sr-end">{ms[last].xga.toFixed(1)}</text>
          {ms.map((m, i) => <rect key={m.id} x={x(i) - (W - L - R) / Math.max(1, ms.length) / 2} y={T} width={(W - L - R) / Math.max(1, ms.length)} height={H - T - B} fill="transparent" style={{ cursor: 'pointer' }} onMouseEnter={() => setHover(i)} onClick={() => go('match', m.id)}><title>{`${m.home ? 'v' : 'at'} ${m.opp}: ${m.gf}–${m.ga}, xG ${m.xgf}–${m.xga}`}</title></rect>)}
        </svg>
        {h ? <span className="sr-tip dh-tip" style={{ left: `${(x(hover!) / W) * 100}%` }}>{h.home ? 'v' : 'at'} {h.opp} · <strong>{h.gf}–{h.ga}</strong> · xG {h.xgf.toFixed(1)}–{h.xga.toFixed(1)}</span> : null}
      </div>
      <details className="sr-table"><summary>Show as a table</summary>
        <table className="fd-mini"><thead><tr><th>#</th><th>Opponent</th><th>Score</th><th>xG for</th><th>xG against</th></tr></thead>
          <tbody>{ms.map((m) => <tr key={m.id}><td>{m.n}</td><td>{m.home ? 'v' : 'at'} {m.opp}</td><td>{m.gf}–{m.ga}</td><td>{m.xgf.toFixed(2)}</td><td>{m.xga.toFixed(2)}</td></tr>)}</tbody></table>
      </details>
    </section>
  );
}

/** Chances by where they came from, for and against: paired horizontal bars, values at the tips. */
function Sources({ rows }: { rows: SourceLine[] }) {
  const [hover, setHover] = useState<string | null>(null);
  if (!rows.length) return null;
  const max = Math.max(1, ...rows.flatMap((r) => [r.chances, r.chancesA]));
  const bar = (v: number, goals: number, kind: 'for' | 'against', src: string) => (
    <div className="dh-bar" onMouseEnter={() => setHover(src + kind)} onMouseLeave={() => setHover(null)} title={`${SRC[src]}: ${v} chances, ${goals} goals ${kind === 'for' ? 'for you' : 'against you'}`}>
      <span className={`dh-bar__fill dh-bar__fill--${kind}${hover === src + kind ? ' is-hover' : ''}`} style={{ width: `${(v / max) * 100}%` }} />
      <span className="dh-bar__val">{v} <span className="fd-muted">({goals} {goals === 1 ? 'goal' : 'goals'})</span></span>
    </div>
  );
  return (
    <section className="pg-card">
      <h2 className="pg-h">Where the chances come from</h2>
      <div className="dh-legend"><span><i className="dh-key dh-key--for" />Your chances</span><span><i className="dh-key dh-key--against" />Chances against you</span></div>
      <div className="dh-sources">
        {rows.map((r) => (
          <div key={r.src} className="dh-src">
            <span className="dh-src__label">{SRC[r.src]}</span>
            <div className="dh-src__bars">{bar(r.chances, r.goals, 'for', r.src)}{bar(r.chancesA, r.goalsA, 'against', r.src)}</div>
          </div>
        ))}
      </div>
      <details className="sr-table"><summary>Show as a table</summary>
        <table className="fd-mini"><thead><tr><th>Source</th><th>Chances</th><th>Goals</th><th>Chances against</th><th>Goals against</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.src}><td>{SRC[r.src]}</td><td>{r.chances}</td><td>{r.goals}</td><td>{r.chancesA}</td><td>{r.goalsA}</td></tr>)}</tbody></table>
      </details>
    </section>
  );
}
