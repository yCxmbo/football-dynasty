import { useMemo, useState } from 'react';
import { FD } from '../ds';
import { available } from '../engine/match';
import { ATTRIBUTE_GROUPS } from '../engine/ratings';
import { bestRoleOf } from '../engine/roles';
import type { GameState, Player } from '../engine/types';
import { toCur } from '../store';
import { seasonLabel } from '../engine/types';

const kept: Record<string, unknown> = {};
function useKept<T>(k: string, init: T): [T, (v: T | ((x: T) => T)) => void] {
  const [v, setV] = useState<T>(() => (k in kept ? (kept[k] as T) : init));
  return [v, (n) => setV((old) => { const x = typeof n === 'function' ? (n as (x: T) => T)(old) : n; kept[k] = x; return x; })];
}

export type SquadView = 'Overview' | 'Performance' | 'Contracts' | 'Attributes';
const POS_ORDER: Record<string, number> = { GK: 0, CB: 1, LB: 2, RB: 3, LWB: 4, RWB: 5, DM: 6, CM: 7, LM: 8, RM: 9, AM: 10, LW: 11, RW: 12, ST: 13 };
const GROUPS: Array<[string, string, (p: Player) => boolean]> = [
  ['all', 'All', () => true],
  ['gk', 'Goalkeepers', (p) => p.pos === 'GK'],
  ['def', 'Defenders', (p) => ['CB', 'LB', 'RB'].includes(p.pos)],
  ['mid', 'Midfielders', (p) => ['DM', 'CM', 'AM'].includes(p.pos)],
  ['att', 'Forwards', (p) => ['LW', 'RW', 'ST'].includes(p.pos)],
];

const avgOf = (p: Player, keys: readonly string[]) => keys.reduce((a, k) => a + (p.attributes[k] ?? 0), 0) / keys.length;
const rating = (p: Player) => (p.current.apps ? p.current.ratingSum / p.current.apps : 0);
const bestRole = (p: Player) => bestRoleOf(p);

interface Col { key: string; label: string; num?: boolean; title?: string; sort?: (p: Player) => number | string; cell: (p: Player) => React.ReactNode }

/** The squad as a sortable table, with views for the overview, the season's numbers, contracts and attributes,
    and filters by position and availability. */
export default function SquadTable({ g, players, scale, youth, onSelect }: { g: GameState; players: Player[]; scale: { low: number; high: number }; youth?: boolean; onSelect: (id: string) => void }) {
  // remembered while the game is open, so Back from a player returns to the same view
  const [view, setView] = useKept<SquadView>('view', 'Overview');
  const [group, setGroup] = useKept('group', 'all');
  const [onlyFit, setOnlyFit] = useKept('fit', false);
  const [q, setQ] = useState('');
  const [sort, setSort] = useKept<{ key: string; dir: 1 | -1 }>('sort', { key: 'pos', dir: 1 });
  const cur = g.currency;
  const xi = new Set(g.lineup);
  const listed = new Set(g.transferListed);
  const money = (v: number) => <FD.Money amount={toCur(v, cur)} currency={cur} />;

  const base: Col[] = [
    { key: 'num', label: '#', num: true, sort: (p) => p.number, cell: (p) => <span className="fd-muted">{p.number}</span> },
    { key: 'name', label: 'Player', sort: (p) => p.name, cell: (p) => (
      <span className="sq-name">
        <strong>{p.name}</strong>
        {p.captain ? <span className="sq-c" title="Captain">C</span> : null}
        {!youth && xi.has(p.id) ? <span className="sq-xi" title="In your starting eleven">XI</span> : null}
        {p.injuredFor > 0 ? <span className="fd-tag fd-tag--loss" title={`Out for ${p.injuredFor} matches`}>Inj {p.injuredFor}</span> : null}
        {p.suspendedFor > 0 ? <span className="fd-tag fd-tag--loss">Sus {p.suspendedFor}</span> : null}
        {p.loan ? <span className="fd-tag">Loan</span> : null}
        {listed.has(p.id) ? <span className="fd-tag fd-tag--warn">Listed</span> : null}
        {!youth && p.contractEnd <= g.year ? <span className="fd-tag fd-tag--warn" title="Contract ends this season">Expiring</span> : null}
      </span>) },
    { key: 'pos', label: 'Pos', sort: (p) => POS_ORDER[p.pos] ?? 99, cell: (p) => {
      const others = Object.entries(p.positions).filter(([k, v]) => k !== p.pos && (v === 'natural' || v === 'accomplished')).map(([k]) => k);
      return <span className="sq-pos"><span className="fd-pos">{p.pos}</span>{others.length ? <span className="fd-muted sq-pos__alt">{others.slice(0, 3).join(' ')}</span> : null}</span>;
    } },
    { key: 'age', label: 'Age', num: true, sort: (p) => p.age, cell: (p) => p.age },
  ];
  const cond = (p: Player) => Math.round(p.condition ?? 100);
  const views: Record<SquadView, Col[]> = {
    Overview: [
      { key: 'ca', label: 'Ability', sort: (p) => p.ability, cell: (p) => <FD.StarRating ability={p.ability} scale={scale} youth={youth} size={13} /> },
      { key: 'pa', label: 'Potential', sort: (p) => p.potential, cell: (p) => <FD.StarRating ability={p.potential} scale={scale} youth={youth} potential size={13} /> },
      { key: 'cond', label: 'Fitness', title: 'Match fitness', sort: (p) => cond(p), cell: (p) => (
        <span className="sub-cond"><span className="fd-meter"><span className={`fd-meter__bar fd-meter__bar--${cond(p) >= 75 ? 'low' : cond(p) >= 60 ? 'medium' : 'high'}`} style={{ width: cond(p) + '%' }} /></span><span className="fd-muted">{cond(p)}%</span></span>) },
      { key: 'morale', label: 'Morale', sort: (p) => ({ high: 2, ok: 1, low: 0 })[p.morale], cell: (p) => <span className={`sq-morale sq-morale--${p.morale}`}><FD.Icon name={p.morale === 'high' ? 'morale' : p.morale === 'ok' ? 'morale-ok' : 'morale-low'} size={14} /> {p.morale === 'high' ? 'Good' : p.morale === 'ok' ? 'Okay' : 'Low'}</span> },
      { key: 'apps', label: 'Apps', num: true, sort: (p) => p.current.apps, cell: (p) => p.current.apps },
      { key: 'rat', label: 'Av rat', num: true, title: 'Average match rating this season', sort: (p) => rating(p), cell: (p) => (p.current.apps ? rating(p).toFixed(2) : '—') },
      { key: 'value', label: 'Value', num: true, sort: (p) => p.value, cell: (p) => money(p.value) },
    ],
    Performance: [
      { key: 'apps', label: 'Apps', num: true, sort: (p) => p.current.apps, cell: (p) => p.current.apps },
      { key: 'gls', label: 'Gls', num: true, sort: (p) => p.current.goals, cell: (p) => p.current.goals },
      { key: 'ast', label: 'Ast', num: true, sort: (p) => p.current.assists, cell: (p) => p.current.assists },
      { key: 'ga', label: 'G+A / game', num: true, sort: (p) => (p.current.apps ? (p.current.goals + p.current.assists) / p.current.apps : 0), cell: (p) => (p.current.apps ? ((p.current.goals + p.current.assists) / p.current.apps).toFixed(2) : '—') },
      { key: 'cs', label: 'Clean sh', num: true, sort: (p) => p.current.cleanSheets ?? 0, cell: (p) => (p.pos === 'GK' || p.current.cleanSheets ? p.current.cleanSheets ?? 0 : '—') },
      { key: 'potm', label: 'PoM', num: true, title: 'Player of the match awards', sort: (p) => p.current.potm ?? 0, cell: (p) => p.current.potm ?? 0 },
      { key: 'rat', label: 'Av rat', num: true, sort: (p) => rating(p), cell: (p) => (p.current.apps ? <span className={rating(p) >= 7.2 ? 'sq-good' : rating(p) < 6.4 ? 'fd-money--neg' : ''}>{rating(p).toFixed(2)}</span> : '—') },
      { key: 'yc', label: 'Yel', num: true, title: 'Yellow cards', sort: (p) => p.yellowCards, cell: (p) => p.yellowCards },
      { key: 'dev', label: 'Progress', num: true, title: 'Change in ability since the start of the season', sort: (p) => p.ability - (p.caStart ?? p.ability), cell: (p) => {
        const d = p.ability - (p.caStart ?? p.ability);
        return d ? <span className={d > 0 ? 'sq-good' : 'fd-money--neg'}>{d > 0 ? '▲' : '▼'} {Math.abs(d)}</span> : <span className="fd-muted">–</span>;
      } },
    ],
    Contracts: [
      { key: 'wage', label: 'Wage / wk', num: true, sort: (p) => p.wage, cell: (p) => money(p.wage) },
      { key: 'end', label: 'Expires', num: true, sort: (p) => p.contractEnd, cell: (p) => <span className={p.contractEnd <= g.year ? 'fd-warn' : ''}>{seasonLabel(p.contractEnd)}</span> },
      { key: 'type', label: 'Type', sort: (p) => p.contractType, cell: (p) => (p.loan ? 'Loan' : p.contractType === 'youth' ? 'Youth' : 'Full-time') },
      { key: 'value', label: 'Value', num: true, sort: (p) => p.value, cell: (p) => money(p.value) },
      { key: 'rc', label: 'Release clause', num: true, sort: (p) => p.releaseClause ?? 0, cell: (p) => (p.releaseClause ? money(p.releaseClause) : <span className="fd-muted">None</span>) },
      { key: 'joined', label: 'Joined', num: true, sort: (p) => p.joined ?? 0, cell: (p) => (p.joined ? seasonLabel(p.joined) : '—') },
      { key: 'nat', label: 'Nat', sort: (p) => p.nationality, cell: (p) => <span className="fd-muted">{p.nationality}</span> },
    ],
    Attributes: [
      { key: 'tec', label: 'Technical', num: true, sort: (p) => avgOf(p, p.pos === 'GK' ? ATTRIBUTE_GROUPS.Goalkeeping : ATTRIBUTE_GROUPS.Technical), cell: (p) => <Bar v={avgOf(p, p.pos === 'GK' ? ATTRIBUTE_GROUPS.Goalkeeping : ATTRIBUTE_GROUPS.Technical)} /> },
      { key: 'men', label: 'Mental', num: true, sort: (p) => avgOf(p, ATTRIBUTE_GROUPS.Mental), cell: (p) => <Bar v={avgOf(p, ATTRIBUTE_GROUPS.Mental)} /> },
      { key: 'phy', label: 'Physical', num: true, sort: (p) => avgOf(p, ATTRIBUTE_GROUPS.Physical), cell: (p) => <Bar v={avgOf(p, ATTRIBUTE_GROUPS.Physical)} /> },
      { key: 'pace', label: 'Pace', num: true, sort: (p) => p.attributes.Pace ?? 0, cell: (p) => <Att v={p.attributes.Pace} /> },
      { key: 'det', label: 'Determ', num: true, title: 'Determination', sort: (p) => p.attributes.Determination ?? 0, cell: (p) => <Att v={p.attributes.Determination} /> },
      { key: 'lead', label: 'Leader', num: true, title: 'Leadership', sort: (p) => p.attributes.Leadership ?? 0, cell: (p) => <Att v={p.attributes.Leadership} /> },
      { key: 'role', label: 'Best role', sort: (p) => bestRole(p).name, cell: (p) => { const r = bestRole(p); return <span>{r.name} <FD.StarRating value={r.stars} size={11} /></span>; } },
    ],
  };
  const cols = [...base, ...views[view]];
  const fil = GROUPS.find((x) => x[0] === group)![2];
  const rows = useMemo(() => {
    const col = cols.find((c) => c.key === sort.key) ?? base[2];
    const needle = q.trim().toLowerCase();
    return players.filter((p) => fil(p) && (!onlyFit || available(p)) && (!needle || p.name.toLowerCase().includes(needle)))
      .sort((a, b) => {
        const x = col.sort!(a), y = col.sort!(b);
        const c = typeof x === 'string' ? x.localeCompare(String(y)) : (x as number) - (y as number);
        return c * sort.dir || (POS_ORDER[a.pos] - POS_ORDER[b.pos]) || b.ability - a.ability;
      });
  }, [players, group, onlyFit, q, sort, view]); // eslint-disable-line react-hooks/exhaustive-deps
  const toggle = (k: string, num?: boolean) => setSort((s) => (s.key === k ? { key: k, dir: (s.dir * -1) as 1 | -1 } : { key: k, dir: num || k === 'ca' || k === 'pa' || k === 'morale' || k === 'cond' ? -1 : 1 }));

  return (
    <div className="sq">
      <div className="sq-bar">
        <div className="fd-seg" role="tablist" aria-label="Table view">
          {(Object.keys(views) as SquadView[]).map((v) => <button key={v} type="button" role="tab" aria-selected={view === v} className={'fd-seg__opt' + (view === v ? ' is-on' : '')} onClick={() => setView(v)}>{v}</button>)}
        </div>
        <div className="fd-chips" aria-label="Filter by position">
          {GROUPS.map(([k, l, f]) => <button key={k} type="button" className={'fd-chip' + (group === k ? ' is-on' : '')} aria-pressed={group === k} onClick={() => setGroup(k)}>{l}<span className="fd-chip__n">{players.filter(f).length}</span></button>)}
        </div>
        <label className="tr-check"><input type="checkbox" checked={onlyFit} onChange={(e) => setOnlyFit(e.target.checked)} /> Available only</label>
        <input className="fd-input sq-search" type="search" placeholder="Find a player" aria-label="Find a player" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="fd-table-wrap">
        <table className="fd-table sq-table">
          <thead><tr>
            {cols.map((c) => {
              const on = sort.key === c.key;
              return (
                <th key={c.key} scope="col" className={c.num ? 'fd-num' : undefined} aria-sort={on ? (sort.dir > 0 ? 'ascending' : 'descending') : 'none'} title={c.title}>
                  <button type="button" className={'fd-th' + (on ? ' is-on' : '')} onClick={() => toggle(c.key, c.num)}>{c.label}{on ? (sort.dir > 0 ? ' ▲' : ' ▼') : ''}</button>
                </th>
              );
            })}
          </tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className={'sq-row' + (!available(p) ? ' is-out' : '')} onClick={() => onSelect(p.id)} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onSelect(p.id); }}>
                {cols.map((c) => <td key={c.key} className={c.num ? 'fd-num' : undefined}>{c.cell(p)}</td>)}
              </tr>
            ))}
            {!rows.length ? <tr><td colSpan={cols.length} className="fd-muted" style={{ padding: 12 }}>No players match.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const tone = (v: number) => (v >= 15 ? 'sq-att--hi' : v >= 11 ? 'sq-att--mid' : 'sq-att--lo');
function Att({ v = 0 }: { v?: number }) { return <span className={`sq-att ${tone(v)}`}>{v}</span>; }
function Bar({ v }: { v: number }) {
  return <span className="sq-bar-cell"><span className="fd-meter"><span className={`fd-meter__bar sq-attbar ${tone(v)}`} style={{ width: (v / 20) * 100 + '%' }} /></span><span className="fd-num">{v.toFixed(1)}</span></span>;
}
