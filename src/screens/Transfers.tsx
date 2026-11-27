import { withSquadIndex } from '../engine/index';
import { useMemo, useState } from 'react';
import { FD } from '../ds';
import { leagueScale } from '../engine/game';
import { askingPrice, clubName, knowledgeOf, seenRange, toggleShortlist, windowLabel, windowOpen } from '../engine/transfers';
import { FREE_AGENT, type GameState, type Player } from '../engine/types';
import { fromCur, toCur } from '../store';
import type { Screen } from './shared';
import { nationName } from '../engine/nations';
import type { SearchFilters } from '../engine/search';

const POSITIONS = ['All', 'GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'AM', 'LW', 'RW', 'ST'];

export function WindowBanner({ g }: { g: GameState }) {
  const open = windowOpen(g);
  return <p className={open ? 'tr-window tr-window--open' : 'tr-window'} role="status"><FD.Icon name="transfers" size={16} /> {windowLabel(g)}</p>;
}

export function PlayerRow({ g, p, go, children }: { g: GameState; p: Player; go: (s: Screen, id?: string) => void; children?: React.ReactNode }) {
  const scale = leagueScale(g);
  const k = knowledgeOf(g, p);
  const ab = seenRange(p.ability, k), pot = seenRange(Math.max(p.potential, p.ability), k, p.ability);
  const star = (r: [number, number]) => [FD.starScore(r[0], scale), FD.starScore(r[1], scale)];
  return (
    <tr className="fx-click" onClick={() => go('player', p.id)}>
      <td><strong>{p.name}</strong>{g.shortlist.includes(p.id) ? <span className="fd-tag fd-tag--gold" style={{ marginLeft: 6 }}>Shortlist</span> : null}</td>
      <td className="fd-muted">{clubName(g, p.clubId)}</td>
      <td><span className="fd-pos">{p.pos}</span></td>
      <td className="fd-num">{p.age}</td>
      <td><FD.StarRating range={star(ab)} size={14} /></td>
      <td><FD.StarRating range={star(pot)} potential size={14} /></td>
      <td className="fd-num fd-muted">{k}%</td>
      <td className="fd-num">{p.clubId === FREE_AGENT ? <span className="fd-ok">Free</span> : <FD.Money amount={toCur(askingPrice(g, p), g.currency)} currency={g.currency} />}</td>
      <td className="fd-num" onClick={(e) => e.stopPropagation()}>{children}</td>
    </tr>
  );
}

export function PlayerTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="fd-table-wrap">
      <table className="fd-table">
        <thead><tr>{['Player', 'Club', 'Pos', 'Age', 'Ability', 'Potential', 'Known', 'Asking price', ''].map((c, i) => <th key={i} scope="col" className={i === 3 || i >= 6 ? 'fd-num' : undefined}><span className="fd-th">{c}</span></th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

const SORTS: Array<[SearchFilters['sort'], string]> = [['value', 'Market value'], ['stars', 'Ability (as known)'], ['price', 'Asking price'], ['age', 'Youngest'], ['contract', 'Contract ending'], ['name', 'Name']];
const DEFAULTS = (budget: number): SearchFilters => ({ pos: 'All', minAge: 15, maxAge: 40, maxPrice: budget, minStars: 0, league: 'all', nation: 'all', expiring: false, freeOnly: false, scouted: false, name: '', sort: 'value' });
let kept: SearchFilters | null = null; // the last search, kept while the game is open (Back returns to it)

/** Searches every player in the world. Ability filters and sorting use what your scouts know (the low end of
    the estimated range), so unscouted players' hidden ability never leaks. */
export function searchPlayers(g: GameState, f: SearchFilters, limit: number) {
  const scale = leagueScale(g);
  const knownStars = (p: Player) => FD.starScore(seenRange(p.ability, knowledgeOf(g, p))[0], scale);
  const priceCap = f.maxPrice >= 1e12 ? Infinity : fromCur(f.maxPrice, g.currency);
  const needle = f.name.trim().toLowerCase();
  return withSquadIndex(g, () => {
    const list = Object.values(g.players).filter((p) => {
      if (p.clubId === g.userClubId || p.squad !== 'First team' || p.id.startsWith('nt-')) return false;
      if (f.pos !== 'All' && p.pos !== f.pos) return false;
      if (p.age < f.minAge || p.age > f.maxAge) return false;
      if (f.freeOnly && p.clubId !== FREE_AGENT) return false;
      if (f.expiring && !(p.contractEnd <= g.year)) return false;
      if (f.nation !== 'all' && p.nationality !== f.nation) return false;
      if (f.league !== 'all' && g.clubs[p.clubId]?.league !== f.league) return false;
      if (f.scouted && knowledgeOf(g, p) < 100) return false;
      if (needle && !p.name.toLowerCase().includes(needle)) return false;
      if (f.minStars && knownStars(p) < f.minStars) return false;
      return askingPrice(g, p) <= priceCap;
    });
    const key: Record<SearchFilters['sort'], (p: Player) => number | string> = {
      value: (p) => -p.value, price: (p) => askingPrice(g, p), age: (p) => p.age, stars: (p) => -knownStars(p), contract: (p) => p.contractEnd, name: (p) => p.name,
    };
    const k = key[f.sort];
    return { total: list.length, rows: list.sort((a, b) => { const x = k(a), y = k(b); return typeof x === 'string' ? x.localeCompare(String(y)) : x - (y as number) || b.value - a.value; }).slice(0, limit) };
  });
}

export default function Transfers({ g, go, update }: { g: GameState; go: (s: Screen, id?: string) => void; update: (fn: (d: GameState) => void) => void }) {
  const [f, setF] = useState<SearchFilters>(() => kept ?? DEFAULTS(toCur(g.clubs[g.userClubId].transferBudget, g.currency)));
  const [limit, setLimit] = useState(40);
  const set = (c: Partial<SearchFilters>) => setF((o) => { const n = { ...o, ...c }; kept = n; setLimit(40); return n; });
  const results = useMemo(() => searchPlayers(g, f, limit), [g, f, limit]);
  const [saveName, setSaveName] = useState('');
  const leagues = g.world.leagues.slice().sort((a, b) => a.country.localeCompare(b.country) || a.tier - b.tier);
  const nations = useMemo(() => [...new Set(Object.values(g.players).filter((p) => p.squad === 'First team').map((p) => p.nationality))].sort((a, b) => nationName(a).localeCompare(nationName(b))), [g.players]);
  const club = g.clubs[g.userClubId];
  const open = windowOpen(g);
  const [view, setView] = useState<'market' | 'news'>('market');
  const seg = (
    <div className="fd-seg" role="tablist" aria-label="Transfers view">
      {([['market', 'Player search'], ['news', 'Transfer news']] as const).map(([k, l]) => (
        <button key={k} type="button" role="tab" aria-selected={view === k} className={'fd-seg__opt' + (view === k ? ' is-on' : '')} onClick={() => setView(k)}>{l}</button>
      ))}
    </div>
  );
  if (view === 'news') return (
    <div className="pg-stack">
      <div className="pg-head" style={{ marginBottom: 0 }}><div><h1 className="pg-title">Transfers</h1><p className="pg-sub">Rumours before each window, and every deal from 1M.</p></div>{seg}</div>
      <TransferNews g={g} go={go} />
    </div>
  );
  return (
    <div className="pg-stack">
      <div className="pg-head" style={{ marginBottom: 0 }}>
        <div><h1 className="pg-title">Transfers</h1><p className="pg-sub">Transfer budget <FD.Money amount={toCur(club.transferBudget, g.currency)} currency={g.currency} /> · Search every player in the world. Stars for other clubs' players are estimates until they're scouted.</p></div>
        <span className="pg-row">{seg}<FD.Button variant="secondary" icon="scouting" onClick={() => go('scouting')}>Shortlist and scouting</FD.Button></span>
      </div>
      <WindowBanner g={g} />
      <section className="tr-filters pg-card" aria-label="Search filters">
        <FD.Field label="Position"><FD.Select value={f.pos} options={POSITIONS} onChange={(v: string) => set({ pos: v })} label="Position" /></FD.Field>
        <FD.Field label="Age from"><FD.NumberInput value={f.minAge} min={15} max={40} onChange={(v: number) => set({ minAge: v })} label="Minimum age" /></FD.Field>
        <FD.Field label="to"><FD.NumberInput value={f.maxAge} min={15} max={40} onChange={(v: number) => set({ maxAge: v })} label="Maximum age" /></FD.Field>
        <FD.Field label="Max asking price"><FD.MoneyInput value={f.maxPrice} onChange={(v: number) => set({ maxPrice: v })} currency={g.currency} label="Maximum asking price" /></FD.Field>
        <FD.Field label="Ability at least">
          <select className="fd-input" value={f.minStars} aria-label="Minimum ability in stars" onChange={(e) => set({ minStars: Number(e.target.value) })}>
            {[0, 1, 2, 2.5, 3, 3.5, 4, 4.5].map((v) => <option key={v} value={v}>{v ? `${v} stars` : 'Any'}</option>)}
          </select>
        </FD.Field>
        <FD.Field label="League">
          <select className="fd-input" value={f.league} aria-label="League" onChange={(e) => set({ league: e.target.value })}>
            <option value="all">Any league</option>
            {leagues.map((l) => <option key={l.id} value={l.id}>{l.name} ({g.world.countries.find((x) => x.id === l.country)?.name ?? nationName(l.country)})</option>)}
          </select>
        </FD.Field>
        <FD.Field label="Nationality">
          <select className="fd-input" value={f.nation} aria-label="Nationality" onChange={(e) => set({ nation: e.target.value })}>
            <option value="all">Any</option>
            {nations.map((n) => <option key={n} value={n}>{nationName(n)}</option>)}
          </select>
        </FD.Field>
        <FD.Field label="Name"><div className="fd-input"><input value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="Search" aria-label="Player name" /></div></FD.Field>
        <FD.Field label="Sort by">
          <select className="fd-input" value={f.sort} aria-label="Sort by" onChange={(e) => set({ sort: e.target.value as SearchFilters['sort'] })}>
            {SORTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </FD.Field>
        <div className="tr-checks">
          <label className="tr-check"><input type="checkbox" checked={f.expiring} onChange={(e) => set({ expiring: e.target.checked })} /> Contract ends this season</label>
          <label className="tr-check"><input type="checkbox" checked={f.freeOnly} onChange={(e) => set({ freeOnly: e.target.checked })} /> Free agents only</label>
          <label className="tr-check"><input type="checkbox" checked={f.scouted} onChange={(e) => set({ scouted: e.target.checked })} /> Fully scouted only</label>
          <button type="button" className="pg-link" onClick={() => set(DEFAULTS(toCur(g.clubs[g.userClubId].transferBudget, g.currency)))}>Clear filters</button>
        </div>
      </section>
      <section className="tr-saved" aria-label="Saved searches">
        {(g.savedSearches ?? []).map((s) => (
          <span key={s.name} className="fd-chip tr-saved__chip">
            <button type="button" className="pg-link" onClick={() => set(s.filters)}>{s.name}</button>
            <button type="button" className="tr-saved__x" aria-label={`Delete saved search ${s.name}`} onClick={() => update((d) => { d.savedSearches = (d.savedSearches ?? []).filter((x) => x.name !== s.name); })}>×</button>
          </span>
        ))}
        <form className="tr-saved__form" onSubmit={(e) => { e.preventDefault(); const n = saveName.trim(); if (!n) return; update((d) => { d.savedSearches = [...(d.savedSearches ?? []).filter((x) => x.name !== n), { name: n, filters: f }].slice(-8); }); setSaveName(''); }}>
          <input className="fd-input" value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Name this search" aria-label="Name this search" maxLength={30} />
          <FD.Button size="sm" variant="secondary" type="submit" disabled={!saveName.trim()}>Save search</FD.Button>
        </form>
      </section>
      <p className="hm-note" style={{ margin: 0 }}>{results.total} {results.total === 1 ? 'player matches' : 'players match'}{results.total > results.rows.length ? `, showing ${results.rows.length}` : ''}.</p>
      {results.rows.length ? (
        <PlayerTable>
          {results.rows.map((p) => (
            <PlayerRow key={p.id} g={g} p={p} go={go}>
              <span className="pg-row" style={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                <FD.Button size="sm" variant="ghost" onClick={() => update((d) => toggleShortlist(d, p.id))}>{g.shortlist.includes(p.id) ? 'Unlist' : 'Shortlist'}</FD.Button>
                <FD.Button size="sm" variant="secondary" disabled={!open} onClick={() => go('offer', p.id)}>Offer</FD.Button>
              </span>
            </PlayerRow>
          ))}
        </PlayerTable>
      ) : <div className="pg-card pg-empty">No players match these filters.</div>}
      {results.total > results.rows.length ? <FD.Button variant="secondary" onClick={() => setLimit((n) => n + 60)}>Show more</FD.Button> : null}
    </div>
  );
}

const HEAT = ['', 'Early interest', 'Talks under way', 'Close to a deal'];

/** Rumours for the next window and the latest deals worldwide (yours highlighted). */
function TransferNews({ g, go }: { g: GameState; go: (s: Screen, id?: string) => void }) {
  const rumours = (g.rumours ?? []).slice().sort((a, b) => b.heat - a.heat || (g.clubs[b.toId]?.reputation ?? 0) - (g.clubs[a.toId]?.reputation ?? 0));
  const [local, setLocal] = useState(false);
  const league = g.clubs[g.userClubId].league;
  const inLeague = (id?: string) => !!id && g.clubs[id]?.league === league;
  // newest season first, then the biggest fees
  const deals = (g.records?.deals ?? []).filter((d) => !local || inLeague(d.fromId) || inLeague(d.toId))
    .slice().sort((a, b) => b.season.localeCompare(a.season) || b.fee - a.fee);
  const money = (n: number) => FD.formatMoney(toCur(n, g.currency), g.currency);
  const clubLink = (id: string | undefined, name: string) => (id && g.clubs[id] ? <button type="button" className="pg-link club-name" onClick={() => go('club', id)}>{id === g.userClubId ? <strong className="fd-gold">{name}</strong> : name}</button> : name);
  const playerLink = (id: string | undefined, name: string) => (id && g.players[id] ? <button type="button" className="pg-link club-name" onClick={() => go('player', id)}><strong>{name}</strong></button> : <strong>{name}</strong>);
  return (
    <>
      <section className="pg-card">
        <h2 className="pg-h">Rumours</h2>
        {rumours.length ? (
          <div className="mg-scroll"><table className="fd-mini"><thead><tr><th>Player</th><th>From</th><th>To</th><th>Window</th><th>Status</th></tr></thead><tbody>
            {rumours.map((r) => (
              <tr key={r.playerId + r.toId}>
                <td>{playerLink(r.playerId, r.name)}</td><td>{clubLink(r.fromId, g.clubs[r.fromId]?.name ?? '?')}</td><td>{clubLink(r.toId, g.clubs[r.toId]?.name ?? '?')}</td>
                <td className="fd-muted">{r.window}</td><td><span className={'heat heat--' + r.heat}>{HEAT[r.heat]}</span></td>
              </tr>
            ))}
          </tbody></table></div>
        ) : <p className="hm-note" style={{ margin: 0 }}>The rumour mill starts a few weeks before each window (before January, and late in the season for the summer).</p>}
      </section>
      <section className="pg-card">
        <div className="aw-head"><h2 className="pg-h" style={{ margin: 0 }}>Latest deals</h2>
          <label className="tr-check"><input type="checkbox" checked={local} onChange={(e) => setLocal(e.target.checked)} /> Your league only</label></div>
        {deals.length ? (
          <div className="mg-scroll"><table className="fd-mini"><thead><tr><th>Player</th><th>From</th><th>To</th><th>Season</th><th className="fd-num">Fee</th></tr></thead><tbody>
            {deals.slice(0, 50).map((d, i) => (
              <tr key={i}>
                <td>{playerLink(d.playerId, d.name)}{d.rumoured ? <span className="fd-muted"> · as rumoured</span> : null}</td>
                <td>{clubLink(d.fromId, d.from)}</td><td>{clubLink(d.toId, d.to)}</td><td className="fd-muted">{d.season}</td><td className="fd-num">{money(d.fee)}</td>
              </tr>
            ))}
          </tbody></table></div>
        ) : <p className="hm-note" style={{ margin: 0 }}>No deals yet. The big ones happen in the summer and in January.</p>}
      </section>
    </>
  );
}
