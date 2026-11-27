import { useMemo, useState } from 'react';
import { attrRange, avgRating, leaders, METRICS, value, type Metric } from '../engine/stats';
import { knowledgeOf } from '../engine/transfers';
import { ATTRIBUTE_GROUPS } from '../engine/ratings';
import { nationName } from '../engine/nations';
import { seasonLabel, type GameState, type Player } from '../engine/types';
import type { Screen } from './shared';

const fmt = (p: Player, m: Metric) => (m === 'rating' ? avgRating(p).toFixed(2) : String(value(p, m)));

/** League leaders this season, and a side-by-side comparison of any two players. */
export default function StatsHub({ g, go }: { g: GameState; go: (s: Screen, id?: string) => void }) {
  const home = g.clubs[g.userClubId].league ?? 'all';
  const [scope, setScope] = useState(home);
  const [view, setView] = useState<'leaders' | 'compare'>('leaders');
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
  const [a, setA] = useState(mine[0]?.id ?? '');
  const [b, setB] = useState(lead && lead.id !== mine[0]?.id ? lead.id : mine[1]?.id ?? '');
  const A = g.players[a], B = g.players[b];
  const groups = A?.pos === 'GK' || B?.pos === 'GK' ? (['Goalkeeping', 'Mental', 'Physical'] as const) : (['Technical', 'Mental', 'Physical'] as const);
  const shown = (p: Player | undefined, attr: string) => {
    if (!p) return { text: '–', v: undefined as number | undefined };
    const v = p.attributes[attr] ?? 10, k = knowledgeOf(g, p);
    if (k >= 100) return { text: String(v), v };
    const [lo, hi] = attrRange(v, k);
    return { text: lo === hi ? String(lo) : `${lo}–${hi}`, v: undefined };
  };
  const rows: Array<[string, (p: Player) => string]> = [
    ['Club', (p) => g.clubs[p.clubId]?.name ?? 'Free agent'], ['Position', (p) => p.pos], ['Age', (p) => String(p.age)], ['Nation', (p) => nationName(p.nationality)],
    ['Apps', (p) => String(p.current.apps)], ['Goals', (p) => String(p.current.goals)], ['Assists', (p) => String(p.current.assists)],
    ['Average rating', (p) => (p.current.apps ? avgRating(p).toFixed(2) : '–')], ['Player of the match', (p) => String(p.current.potm ?? 0)],
    ...(A?.pos === 'GK' || B?.pos === 'GK' ? [['Clean sheets', (p: Player) => String(p.current.cleanSheets ?? 0)] as [string, (p: Player) => string]] : []),
  ];
  return (
    <section className="pg-card">
      <div className="sp-grid" style={{ marginBottom: 12 }}>
        <PlayerPick g={g} value={a} onPick={setA} label="Player A" />
        <PlayerPick g={g} value={b} onPick={setB} label="Player B" />
      </div>
      <div className="mg-scroll">
        <table className="fd-mini st-compare"><thead><tr><th />{[A, B].map((p, i) => <th key={i}>{p ? link(p) : '—'}</th>)}</tr></thead><tbody>
          {rows.map(([label, f]) => <tr key={label}><td className="fd-muted">{label}</td><td>{A ? f(A) : '–'}</td><td>{B ? f(B) : '–'}</td></tr>)}
          {groups.map((grp) => [
            <tr key={grp}><td colSpan={3} className="pg-h" style={{ paddingTop: 12 }}>{grp}</td></tr>,
            ...(ATTRIBUTE_GROUPS[grp] as readonly string[]).map((attr) => {
              const x = shown(A, attr), y = shown(B, attr);
              const better = x.v !== undefined && y.v !== undefined ? (x.v > y.v ? 0 : y.v > x.v ? 1 : -1) : -1;
              return <tr key={attr}><td className="fd-muted">{attr}</td><td className={better === 0 ? 'pred-up' : undefined}>{x.text}</td><td className={better === 1 ? 'pred-up' : undefined}>{y.text}</td></tr>;
            }),
          ])}
        </tbody></table>
      </div>
      <p className="hm-note" style={{ marginBottom: 0 }}>Attributes are exact for your players and fully scouted ones; otherwise your scouts give a range. The better value is highlighted when both are known.</p>
    </section>
  );
}
