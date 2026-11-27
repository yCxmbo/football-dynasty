import { useEffect, useRef, useState } from 'react';
import { analysisNotes, bySource } from '../engine/analysis';
import type { Instructions } from '../engine/instructions';
import type { MatchAnalysis as Data } from '../engine/types';

const H = 220, PAD = { l: 34, r: 52, t: 14, b: 24 };

/** Your match in numbers: an xG timeline, chances by source and the assistant's notes. */
export default function MatchAnalysis({ a, names, shorts, us, instr, live }: { a: Data; names: [string, string]; shorts: [string, string]; us: 0 | 1; instr?: Partial<Instructions>; live?: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  // drawn at the container's real width, so text stays readable on a phone
  const boxRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(640);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const last = a.xg.length - 1;
  const maxXg = Math.max(1, ...a.xg.map((x) => Math.max(x[0], x[1])));
  const yMax = Math.ceil(maxXg * 2) / 2;
  const x = (m: number) => PAD.l + (m / 90) * (W - PAD.l - PAD.r);
  const y = (v: number) => H - PAD.b - (v / yMax) * (H - PAD.t - PAD.b);
  // step line: xG builds up minute by minute
  const path = (side: 0 | 1) => a.xg.map((v, m) => `${m ? 'L' : 'M'}${x(m).toFixed(1)},${y(v[side]).toFixed(1)}`).join('');
  const cls = (side: 0 | 1) => (side === us ? 'ma-us' : 'ma-them');
  const goals = a.chances.filter((c) => c.goal);
  const end = a.xg[last] ?? [0, 0];
  const ticks = Array.from({ length: Math.floor(yMax / 0.5) + 1 }, (_, i) => i * 0.5);
  const onMove = (e: React.PointerEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const m = Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * 90);
    setHover(m < 0 || m > last ? null : m);
  };
  const hv = hover !== null ? a.xg[hover] : null;
  const goalsBy = (m: number, side: 0 | 1) => goals.filter((g) => g.side === side && g.m <= m).length;
  const ours = bySource(a, us), theirs = bySource(a, (1 - us) as 0 | 1);
  const notes = live ? [] : analysisNotes(a, us, instr);
  // end labels: keep them apart if the lines finish close together
  let ly = [y(end[0]), y(end[1])];
  if (Math.abs(ly[0] - ly[1]) < 14) { const mid = (ly[0] + ly[1]) / 2; ly = ly[0] <= ly[1] ? [mid - 7, mid + 7] : [mid + 7, mid - 7]; }
  return (
    <section className="pg-card ma" aria-label="Match analysis">
      <h2 className="pg-h">{live ? 'Analysis so far' : 'Match analysis'}</h2>
      <div className="ma-legend" aria-hidden="true">
        {([0, 1] as const).map((s) => <span key={s} className="ma-key"><span className={`ma-swatch ${cls(s)}`} />{names[s]}</span>)}
        <span className="ma-key"><span className="ma-dot" />Goal</span>
      </div>
      <div className="ma-chart" ref={boxRef}>
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Expected goals over the match: ${names[0]} ${end[0].toFixed(2)}, ${names[1]} ${end[1].toFixed(2)}`}
          onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line className="ma-grid" x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} />
              <text className="ma-axis" x={PAD.l - 6} y={y(t) + 4} textAnchor="end">{t.toFixed(1)}</text>
            </g>
          ))}
          <line className="ma-ht" x1={x(45)} x2={x(45)} y1={PAD.t} y2={H - PAD.b} />
          <text className="ma-axis" x={x(45)} y={H - 6} textAnchor="middle">HT</text>
          <text className="ma-axis" x={x(0)} y={H - 6} textAnchor="start">0′</text>
          <text className="ma-axis" x={x(90)} y={H - 6} textAnchor="end">90′</text>
          {([1, 0] as const).map((s) => <path key={s} className={`ma-line ${cls(s)}`} d={path(s)} />)}
          {goals.map((g, i) => {
            const v = a.xg[Math.min(g.m, last)] ?? [0, 0];
            return <circle key={i} className={`ma-goal ${cls(g.side)}`} cx={x(g.m)} cy={y(v[g.side])} r={5}><title>{`${g.m}′ ${g.player ?? ''} (${names[g.side]})`}</title></circle>;
          })}
          {([0, 1] as const).map((s) => <text key={s} className="ma-end" x={x(last) + 8} y={ly[s] + 4}>{end[s].toFixed(2)}</text>)}
          {hover !== null ? <line className="ma-cross" x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} /> : null}
        </svg>
        {hover !== null && hv ? (
          <div className="ma-tip" style={{ left: `${(x(hover) / W) * 100}%` }} role="status">
            <strong>{hover}′</strong>
            {([0, 1] as const).map((s) => <span key={s}><span className={`ma-swatch ${cls(s)}`} />{names[s]}: {hv[s].toFixed(2)} xG · {goalsBy(hover, s)} {goalsBy(hover, s) === 1 ? 'goal' : 'goals'}</span>)}
          </div>
        ) : null}
      </div>
      <div className="ma-grid2">
        <div>
          <h3 className="ma-sub">Shots by source</h3>
          <div className="mg-scroll"><table className="fd-mini"><thead><tr><th>Source</th><th className="fd-num" title={names[us]}>{shorts[us]}</th><th className="fd-num" title={names[1 - us]}>{shorts[1 - us]}</th></tr></thead><tbody>
            {ours.map((o, i) => (o.shots || theirs[i].shots ? (
              <tr key={o.src}><td>{o.label}</td><td className="fd-num">{o.shots}{o.goals ? ` (${o.goals} ${o.goals === 1 ? 'goal' : 'goals'})` : ''}</td><td className="fd-num">{theirs[i].shots}{theirs[i].goals ? ` (${theirs[i].goals} ${theirs[i].goals === 1 ? 'goal' : 'goals'})` : ''}</td></tr>
            ) : null))}
          </tbody></table></div>
        </div>
        {notes.length ? (
          <div>
            <h3 className="ma-sub">Assistant's notes</h3>
            <ul className="opp__advice">{notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
          </div>
        ) : null}
      </div>
      <details className="ma-table">
        <summary className="fd-label">xG as a table</summary>
        <table className="fd-mini"><thead><tr><th>Minute</th><th className="fd-num" title={names[0]}>{shorts[0]}</th><th className="fd-num" title={names[1]}>{shorts[1]}</th></tr></thead><tbody>
          {[15, 30, 45, 60, 75, 90].filter((m) => m <= last).map((m) => <tr key={m}><td>{m}′</td><td className="fd-num">{a.xg[m][0].toFixed(2)}</td><td className="fd-num">{a.xg[m][1].toFixed(2)}</td></tr>)}
        </tbody></table>
      </details>
    </section>
  );
}
