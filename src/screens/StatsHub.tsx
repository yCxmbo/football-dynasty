import { useEffect, useMemo, useState } from 'react';
import { FD } from '../ds';
import { toCur } from '../store';
import { bestRoleOf } from '../engine/roles';
import { compareIds, onCompareChange, setCompare } from './compareStore';
import { attrRange, avgRating, leaders, METRICS, value, type Metric } from '../engine/stats';
import { knowledgeOf } from '../engine/transfers';
import { ATTRIBUTE_GROUPS } from '../engine/ratings';
import { nationName } from '../engine/nations';
import { seasonLabel, type GameState, type Player } from '../engine/types';
import type { Screen } from './shared';

const fmt = (p: Player, m: Metric) => (m === 'rating' ? avgRating(p).toFixed(2) : String(value(p, m)));

/** League leaders this season, and a side-by-side comparison of up to three players. */
export default function StatsHub({ g, go, initialView }: { g: GameState; go: (s: Screen, id?: string) => void; initialView?: 'compare' }) {
  const home = g.clubs[g.userClubId].league ?? 'all';
  const [scope, setScope] = useState(home);
  const [view, setView] = useState<'leaders' | 'compare'>(initialView ?? 'leaders');
  const leagues = g.world.leagues.slice().sort((a, b) => (a.country === g.clubs[g.userClubId].country ? -1 : 0) - (b.country === g.clubs[g.userClubId].country ? -1 : 0) || a.tier - b.tier);
  const link = (p: Player) => <button type="button" className="pg-link club-name" onClick={() => go('player', p.id)}>{p.clubId === g.userClubId ? <strong className="fd-gold">{p.name}</strong> : p.name}</button>;
  return (
    <div className="pg-stack">
      <div className="pg-head" style={{ marginBottom: 0 }}>
        <div><h1 className="pg-title">Stats</h1><p className="pg-sub">{seasonLabel(g.year)} · all competitions · your players in gold</p></div>
        <div className="fd-seg" role="tablist" aria-label="Stats view">
          {([['leaders', 'Leaders'], ['compare', 'Compare players']] as const).map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={view === k} className={'fd-seg__opt' + (view === k ? ' is-on' : '')} onClick={() => setView(k)}>{l}</button>)}
        </div>
      </div>
      {view === 'leaders' ? (
        <>
          <label className="tac-field" style={{ maxWidth: 360 }}><span className="fd-label">League</span>
            <select className="fd-input" value={scope} onChange={(e) => setScope(e.target.value)} aria-label="League">
              <option value="all">All leagues</option>
              {leagues.map((l) => <option key={l.id} value={l.id}>{l.name} · {g.world.countries.find((c) => c.id === l.country)?.name}</option>)}
            </select>
          </label>
          <div className="st-grid">
            {METRICS.map((m) => {
              const list = leaders(g, scope, m.id);
              return (
                <section key={m.id} className="pg-card">
                  <h2 className="pg-h">{m.label}</h2>
                  {list.length ? (
                    <table className="fd-mini"><thead><tr><th className="fd-num">#</th><th>Player</th><th>Club</th><th className="fd-num">Apps</th><th className="fd-num">{m.short}</th></tr></thead><tbody>
                      {list.map((p, i) => <tr key={p.id}><td className="fd-num fd-muted">{i + 1}</td><td>{link(p)}</td><td className="fd-muted">{g.clubs[p.clubId]?.short}</td><td className="fd-num">{p.current.apps}</td><td className="fd-num"><strong>{fmt(p, m.id)}</strong></td></tr>)}
                    </tbody></table>
                  ) : <p className="hm-note" style={{ margin: 0 }}>Nothing yet this season.</p>}
                </section>
              );
            })}
          </div>
        </>
      ) : <Compare g={g} link={link} />}
    </div>
  );
}

function PlayerPick({ g, value: id, onPick, label }: { g: GameState; value: string; onPick: (id: string) => void; label: string }) {
  const [q, setQ] = useState('');
  const matches = useMemo(() => {
    if (q.trim().length < 2) return [];
    const t = q.trim().toLowerCase();
    return Object.values(g.players).filter((p) => p.squad === 'First team' && p.name.toLowerCase().includes(t)).sort((a, b) => b.value - a.value).slice(0, 12);
  }, [g, q]);
  const p = g.players[id];
  return (
    <div className="sp-field">
      <span className="fd-label">{label}</span>
      <div className="fd-input"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={p ? p.name : 'Search a player'} aria-label={`${label}: search by name`} /></div>
      {matches.length ? (
        <div className="st-results" role="listbox" aria-label={`${label}: results`}>
          {matches.map((m) => <button key={m.id} type="button" role="option" aria-selected={m.id === id} className="st-result" onClick={() => { onPick(m.id); setQ(''); }}>{m.name} <span className="fd-muted">· {m.pos} · {g.clubs[m.clubId]?.short ?? 'Free'}</span></button>)}
        </div>
      ) : null}
    </div>
  );
}

function Compare({ g, link }: { g: GameState; link: (p: Player) => JSX.Element }) {
  const mine = Object.values(g.players).filter((p) => p.clubId === g.userClubId && p.squad === 'First team').sort((a, b) => b.value - a.value);
  const lead = leaders(g, g.clubs[g.userClubId].league ?? 'all', 'goals', 1)[0];
  const [ids, setIds] = useState<string[]>(() => compareIds().length ? compareIds() : [mine[0]?.id, lead && lead.id !== mine[0]?.id ? lead.id : mine[1]?.id].filter(Boolean) as string[]);
  useEffect(() => onCompareChange(() => setIds(compareIds())), []);
  const set = (k: number, id: string) => { const n = [...ids]; n[k] = id; setCompare(n.filter(Boolean)); setIds(n.filter(Boolean)); };
  const ps = ids.map((id) => g.players[id]).filter(Boolean);
  const gk = ps.some((p) => p.pos === 'GK');
  const groups = gk ? (['Goalkeeping', 'Mental', 'Physical'] as const) : (['Technical', 'Mental', 'Physical'] as const);
  const known = (p: Player) => p.clubId === g.userClubId || knowledgeOf(g, p) >= 100;
  const shown = (p: Player, attr: string) => {
    const v = p.attributes[attr] ?? 10, k = knowledgeOf(g, p);
    if (known(p)) return { text: String(v), v };
    const [lo, hi] = attrRange(v, k);
    return { text: lo === hi ? String(lo) : `${lo}–${hi}`, v: undefined };
  };
  const money = (v: number) => FD.formatMoney(toCur(v, g.currency), g.currency);
  // [label, text, number to compare (higher is better unless `low`), low]
  type Row = [string, (p: Player) => string, ((p: Player) => number | undefined)?, boolean?];
  const rows: Row[] = [
    ['Club', (p) => g.clubs[p.clubId]?.name ?? 'Free agent'], ['Position', (p) => p.pos], ['Age', (p) => String(p.age)], ['Nation', (p) => nationName(p.nationality)],
    ['Best role', (p) => (known(p) ? `${bestRoleOf(p).name} (${bestRoleOf(p).stars}★)` : 'Scout him to know')],
    ['Value', (p) => money(p.value), (p) => p.value], ['Wage', (p) => `${money(p.wage)}/wk`, (p) => p.wage, true], ['Contract until', (p) => `June ${p.contractEnd + 1}`],
    ['Apps', (p) => String(p.current.apps), (p) => p.current.apps], ['Goals', (p) => String(p.current.goals), (p) => p.current.goals], ['Assists', (p) => String(p.current.assists), (p) => p.current.assists],
    ['Average rating', (p) => (p.current.apps ? avgRating(p).toFixed(2) : '–'), (p) => (p.current.apps ? avgRating(p) : undefined)], ['Player of the match', (p) => String(p.current.potm ?? 0), (p) => p.current.potm ?? 0],
    ...(gk ? [['Clean sheets', (p: Player) => String(p.current.cleanSheets ?? 0), (p: Player) => p.current.cleanSheets ?? 0] as Row] : []),
  ];
  const best = (vals: Array<number | undefined>, low?: boolean) => {
    if (vals.length < 2 || vals.some((v) => v === undefined)) return -1;
    const n = vals as number[], b = low ? Math.min(...n) : Math.max(...n);
    return n.filter((v) => v === b).length === 1 ? n.indexOf(b) : -1;
  };
  const cell = (text: string, on: boolean, k: number) => <td key={k} className={on ? 'cmp-best' : undefined}>{text}{on ? <span className="cmp-mark" aria-label="best"> ▲</span> : null}</td>;
  return (
    <section className="pg-card">
      <div className="sp-grid" style={{ marginBottom: 12 }}>
        {[0, 1, 2].map((k) => <PlayerPick key={k} g={g} value={ids[k] ?? ''} onPick={(id) => set(k, id)} label={`Player ${'ABC'[k]}`} />)}
      </div>
      {ps.length ? (
        <div className="mg-scroll">
          <table className="fd-mini st-compare"><thead><tr><th />{ps.map((p) => <th key={p.id}>{link(p)} <button type="button" className="tr-saved__x" aria-label={`Remove ${p.name}`} onClick={() => { const n = ids.filter((x) => x !== p.id); setCompare(n); setIds(n); }}>×</button></th>)}</tr></thead><tbody>
            {rows.map(([label, f, num, low]) => { const b = num ? best(ps.map(num), low) : -1; return <tr key={label}><td className="fd-muted">{label}</td>{ps.map((p, k) => cell(f(p), b === k, k))}</tr>; })}
            {groups.map((grp) => [
              <tr key={grp}><td colSpan={ps.length + 1} className="pg-h" style={{ paddingTop: 12 }}>{grp}</td></tr>,
              ...(ATTRIBUTE_GROUPS[grp] as readonly string[]).map((attr) => {
                const xs = ps.map((p) => shown(p, attr)), b = best(xs.map((x) => x.v));
                return <tr key={attr}><td className="fd-muted">{attr}</td>{xs.map((x, k) => cell(x.text, b === k, k))}</tr>;
              }),
            ])}
          </tbody></table>
        </div>
      ) : <p className="hm-note">Pick players above, or use “Compare” on any player's page.</p>}
      <p className="hm-note" style={{ marginBottom: 0 }}>Up to three players. Attributes are exact for your players and fully scouted ones; otherwise your scouts give a range. The best value in a row is marked ▲ when all are known.</p>
    </section>
  );
}
