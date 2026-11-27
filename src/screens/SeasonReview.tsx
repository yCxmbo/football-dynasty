import { useState } from 'react';
import { boardTarget, ordinal, seasonOver } from '../engine/game';
import { fanWord } from '../engine/fans';
import { confidenceWord } from '../engine/career';
import { buildReview, type SeasonReview as Review } from '../engine/seasonreview';
import type { GameState } from '../engine/types';
import type { Screen } from './shared';

/** The season in review: this season (so far, or just finished) and the archive of past ones. */
export default function SeasonReview({ g, go }: { g: GameState; go: (s: Screen, id?: string) => void }) {
  const live = buildReview(g, g.clubs[g.userClubId]?.league ? boardTarget(g, g.userClubId).text : undefined);
  const all: Array<{ r: Review; current: boolean }> = [...(live && live.course.length ? [{ r: live, current: true }] : []), ...(g.reviews ?? []).map((r) => ({ r, current: false }))];
  const [i, setI] = useState(0);
  if (!all.length) return <div className="pg-stack"><div className="pg-head"><div><h1 className="pg-title">Season review</h1><p className="pg-sub">Play a few league weeks and the review fills in.</p></div></div></div>;
  const { r, current } = all[Math.min(i, all.length - 1)];
  const over = current && seasonOver(g);
  const player = (id: string, name: string) => g.players[id] ? <button type="button" className="pg-link club-name" onClick={() => go('player', id)}><strong>{name}</strong></button> : <strong>{name}</strong>;
  return (
    <div className="pg-stack">
      <div className="pg-head" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="pg-title">{r.season} in review</h1>
          <p className="pg-sub">{r.club} · {r.league}{current && !over ? ' · so far' : ''}{r.target ? ` · the board wanted ${r.target}` : ''}</p>
        </div>
        {all.length > 1 ? (
          <select className="fd-input" value={i} aria-label="Season" onChange={(e) => setI(Number(e.target.value))} style={{ width: 'auto' }}>
            {all.map((x, k) => <option key={k} value={k}>{x.r.season}{x.current ? (seasonOver(g) ? ' (just finished)' : ' (so far)') : ''} · {x.r.club}</option>)}
          </select>
        ) : null}
      </div>
      <div className="hm-strip sr-strip">
        <div className="hm-stat"><span className="fd-label">{current && !over ? 'Position' : 'Finished'}</span><strong>{ordinal(r.pos)}</strong><span className="fd-muted">of {r.of}</span></div>
        <div className="hm-stat"><span className="fd-label">Points</span><strong>{r.pts}</strong><span className="fd-muted">{r.w} won · {r.d} drawn · {r.l} lost</span></div>
        <div className="hm-stat"><span className="fd-label">Goals</span><strong>{r.gf}–{r.ga}</strong><span className="fd-muted">difference {r.gf - r.ga > 0 ? '+' : ''}{r.gf - r.ga}</span></div>
        <div className="hm-stat"><span className="fd-label">Board</span><strong>{confidenceWord(r.board)}</strong><span className="fd-muted">confidence {r.board}/100</span></div>
        <div className="hm-stat"><span className="fd-label">Supporters</span><strong>{r.fans !== undefined ? fanWord(r.fans) : '—'}</strong><span className="fd-muted">{r.fans !== undefined ? `mood ${Math.round(r.fans)}/100` : 'not tracked then'}</span></div>
      </div>
      {r.course.length > 1 ? <Course course={r.course} of={r.of} /> : null}
      <div className="sr-grid">
        <List title="Top scorers" empty="No goals yet." rows={r.scorers.map((x) => [player(x.id, x.name), `${x.goals} in ${x.apps}`])} />
        <List title="Best performers" empty="Nobody has eight games yet." rows={r.best.map((x) => [player(x.id, x.name), `${x.rating.toFixed(2)} average · ${x.apps} apps`])} />
        <List title="Signings" empty="No new signings played three games." rows={r.signings.map((x) => [player(x.id, x.name), `${x.rating.toFixed(2)} average · ${x.apps} apps${x.goals ? ` · ${x.goals} goals` : ''}`])} />
        <List title="Young players" empty="No player aged 21 or under played five games." rows={r.youngsters.map((x) => [player(x.id, x.name), `${x.age} · ${x.apps} apps`])} />
        <List title="Cups" empty="No cup runs." rows={r.cups.map((c) => [<strong key={c.name}>{c.name}</strong>, c.result])} />
        <List title="Awards" empty={current ? 'Awards are announced when the season turns.' : 'No awards this season.'} rows={r.awards.map((a, k) => [<span key={k}>{a}</span>, ''])} />
      </div>
    </div>
  );
}

function List({ title, rows, empty }: { title: string; rows: Array<[React.ReactNode, string]>; empty: string }) {
  return (
    <section className="pg-card">
      <h2 className="pg-h">{title}</h2>
      {rows.length ? <ul className="sr-list">{rows.map(([a, b], k) => <li key={k}><span>{a}</span><span className="fd-muted">{b}</span></li>)}</ul> : <p className="hm-note" style={{ margin: 0 }}>{empty}</p>}
    </section>
  );
}

/** League position week by week (1 at the top), with a table view. */
function Course({ course, of }: { course: number[]; of: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640, H = 200, L = 30, R = 34, T = 12, B = 24;
  const x = (k: number) => L + (k / Math.max(1, course.length - 1)) * (W - L - R);
  const y = (pos: number) => T + ((pos - 1) / Math.max(1, of - 1)) * (H - T - B);
  const ticks = [...new Set([1, Math.ceil(of / 2), of])];
  const pts = course.map((p, k) => `${x(k)},${y(p)}`).join(' ');
  const last = course.length - 1;
  const best = Math.min(...course), worst = Math.max(...course);
  return (
    <section className="pg-card">
      <h2 className="pg-h">League position, week by week</h2>
      <p className="hm-note" style={{ marginTop: 0 }}>Highest {ordinal(best)}, lowest {ordinal(worst)}.</p>
      <div className="sr-chart">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`League position over ${course.length} weeks: from ${ordinal(course[0])} to ${ordinal(course[last])}, best ${ordinal(best)}, worst ${ordinal(worst)}.`} onMouseLeave={() => setHover(null)}>
          {ticks.map((tk) => (
            <g key={tk}>
              <line x1={L} x2={W - R} y1={y(tk)} y2={y(tk)} className="sr-grid-line" />
              <text x={L - 8} y={y(tk) + 4} textAnchor="end" className="sr-axis">{tk}</text>
            </g>
          ))}
          <text x={L} y={H - 6} className="sr-axis">Week 1</text>
          <text x={W - R} y={H - 6} textAnchor="end" className="sr-axis">Week {course.length}</text>
          <polyline points={pts} className="sr-line" />
          <circle cx={x(last)} cy={y(course[last])} r={4} className="sr-dot" />
          <text x={x(last) + 8} y={y(course[last]) + 4} className="sr-end">{ordinal(course[last])}</text>
          {hover !== null ? <circle cx={x(hover)} cy={y(course[hover])} r={5} className="sr-dot" /> : null}
          {course.map((p, k) => <rect key={k} x={x(k) - (W - L - R) / course.length / 2} y={T - 6} width={(W - L - R) / Math.max(1, course.length)} height={H - T - B + 12} fill="transparent" onMouseEnter={() => setHover(k)} onFocus={() => setHover(k)}><title>{`Week ${k + 1}: ${ordinal(p)}`}</title></rect>)}
        </svg>
        {hover !== null ? <span className="sr-tip" style={{ left: `${(x(hover) / W) * 100}%` }}>Week {hover + 1}: <strong>{ordinal(course[hover])}</strong></span> : null}
      </div>
      <details className="sr-table"><summary>Show as a table</summary>
        <table className="fd-mini"><thead><tr><th>Week</th><th>Position</th></tr></thead><tbody>{course.map((p, k) => <tr key={k}><td>{k + 1}</td><td>{ordinal(p)}</td></tr>)}</tbody></table>
      </details>
    </section>
  );
}
