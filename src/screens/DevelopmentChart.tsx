import { useEffect, useRef, useState } from 'react';
import { groupAverages } from '../engine/training';
import type { Player } from '../engine/types';

const SERIES_BASE = [
  { k: 't' as const, label: 'Technical', cls: 'dv-1' },
  { k: 'm' as const, label: 'Mental', cls: 'dv-2' },
  { k: 'p' as const, label: 'Physical', cls: 'dv-3' },
];
const H = 190, PAD = { l: 30, r: 96, t: 12, b: 26 };

/** A player's visible attribute averages (1–20) season by season at your club, plus today. */
export default function DevelopmentChart({ p }: { p: Player }) {
  const SERIES = SERIES_BASE.map((s) => (s.k === 't' && p.pos === 'GK' ? { ...s, label: 'Goalkeeping' } : s));
  const points = [...(p.history ?? []), { season: 'Now', ...groupAverages(p) }];
  const boxRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(560);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const vals = points.flatMap((x) => [x.t, x.m, x.p]);
  const lo = Math.max(1, Math.floor(Math.min(...vals) - 1)), hi = Math.min(20, Math.ceil(Math.max(...vals) + 1));
  const n = points.length;
  const x = (i: number) => (n === 1 ? (PAD.l + W - PAD.r) / 2 : PAD.l + (i / (n - 1)) * (W - PAD.l - PAD.r));
  const y = (v: number) => H - PAD.b - ((v - lo) / Math.max(1, hi - lo)) * (H - PAD.t - PAD.b);
  const last = points[n - 1];
  // end labels kept apart
  const ends = SERIES.map((s) => ({ s, y: y(last[s.k]) })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 13) ends[i].y = ends[i - 1].y + 13;
  const ticks = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).filter((v) => (hi - lo > 6 ? v % 2 === 0 : true));
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    let best = 0;
    for (let i = 1; i < n; i++) if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
    setHover(best);
  };
  return (
    <section className="pg-card">
      <h2 className="pg-h">Development</h2>
      <div className="ma-legend" aria-hidden="true">{SERIES.map((s) => <span key={s.k} className="ma-key"><span className={`ma-swatch ${s.cls}`} />{s.label}</span>)}</div>
      <div className="ma-chart" ref={boxRef}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ height: H }} role="img" onPointerMove={onMove} onPointerLeave={() => setHover(null)}
          aria-label={`Attribute averages: ${SERIES.map((s) => `${s.label} ${last[s.k]}`).join(', ')}`}>
          {ticks.map((v) => (
            <g key={v}><line className="ma-grid" x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} /><text className="ma-axis" x={PAD.l - 6} y={y(v) + 4} textAnchor="end">{v}</text></g>
          ))}
          {points.map((pt, i) => (n <= 6 || i === 0 || i === n - 1 || i % 2 === 0 ? <text key={i} className="ma-axis" x={x(i)} y={H - 8} textAnchor="middle">{pt.season === 'Now' ? 'Now' : pt.season.slice(2)}</text> : null))}
          {SERIES.map((s) => (
            <g key={s.k}>
              {n > 1 ? <path className={`ma-line ${s.cls}`} d={points.map((pt, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(pt[s.k]).toFixed(1)}`).join('')} /> : null}
              {points.map((pt, i) => <circle key={i} className={`dv-dot ${s.cls}`} cx={x(i)} cy={y(pt[s.k])} r={4} />)}
            </g>
          ))}
          {ends.map(({ s, y: yy }) => <text key={s.k} className="ma-end" x={x(n - 1) + 9} y={yy + 4}>{s.label.slice(0, 4)}. {last[s.k].toFixed(1)}</text>)}
          {hover !== null ? <line className="ma-cross" x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} /> : null}
        </svg>
        {hover !== null ? (
          <div className="ma-tip" style={{ left: `${(x(hover) / W) * 100}%` }} role="status">
            <strong>{points[hover].season}</strong>
            {SERIES.map((s) => <span key={s.k}><span className={`ma-swatch ${s.cls}`} />{s.label}: {points[hover][s.k].toFixed(1)}</span>)}
          </div>
        ) : null}
      </div>
      {n === 1 ? <p className="hm-note" style={{ marginBottom: 0 }}>His history builds up season by season while he's at your club.</p> : null}
      <details className="ma-table">
        <summary className="fd-label">As a table</summary>
        <table className="fd-mini"><thead><tr><th>Season</th>{SERIES.map((s) => <th key={s.k} className="fd-num">{s.label}</th>)}</tr></thead><tbody>
          {points.map((pt) => <tr key={pt.season}><td>{pt.season}</td>{SERIES.map((s) => <td key={s.k} className="fd-num">{pt[s.k].toFixed(1)}</td>)}</tr>)}
        </tbody></table>
      </details>
    </section>
  );
}
