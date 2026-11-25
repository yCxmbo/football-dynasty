import { useMemo, useState } from 'react';
import { FD } from '../ds';
import { leagueScale } from '../engine/game';
import { askingPrice, clubName, knowledgeOf, seenRange, toggleShortlist, windowLabel, windowOpen } from '../engine/transfers';
import { FREE_AGENT, type GameState, type Player } from '../engine/types';
import { fromCur, toCur } from '../store';
import type { Screen } from './shared';

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

export default function Transfers({ g, go, update }: { g: GameState; go: (s: Screen, id?: string) => void; update: (fn: (d: GameState) => void) => void }) {
  const [pos, setPos] = useState('All');
  const [maxAge, setMaxAge] = useState(35);
  const [maxPrice, setMaxPrice] = useState(() => toCur(g.clubs[g.userClubId].transferBudget, g.currency));
  const [freeOnly, setFreeOnly] = useState(false);
  const [name, setName] = useState('');
  const results = useMemo(() => {
    const limit = fromCur(maxPrice, g.currency);
    return Object.values(g.players)
      .filter((p) => p.clubId !== g.userClubId && p.squad === 'First team')
      .filter((p) => (pos === 'All' || p.pos === pos) && p.age <= maxAge && (!freeOnly || p.clubId === FREE_AGENT))
      .filter((p) => !name || p.name.toLowerCase().includes(name.toLowerCase()))
      .filter((p) => askingPrice(g, p) <= limit)
      // sort by market value (public), not hidden ability, so unscouted players don't leak
      .sort((a, b) => b.value - a.value)
      .slice(0, 40);
  }, [g, pos, maxAge, maxPrice, freeOnly, name]);
  const club = g.clubs[g.userClubId];
  const open = windowOpen(g);
  return (
    <div className="pg-stack">
      <div className="pg-head" style={{ marginBottom: 0 }}>
        <div><h1 className="pg-title">Transfers</h1><p className="pg-sub">Transfer budget <FD.Money amount={toCur(club.transferBudget, g.currency)} currency={g.currency} /> · Sorted by market value. Stars for other clubs' players are estimates until they're scouted.</p></div>
        <FD.Button variant="secondary" icon="scouting" onClick={() => go('scouting')}>Shortlist and scouting</FD.Button>
      </div>
      <WindowBanner g={g} />
      <div className="tr-filters pg-card">
        <FD.Field label="Position"><FD.Select value={pos} options={POSITIONS} onChange={setPos} label="Position" /></FD.Field>
        <FD.Field label="Max age"><FD.NumberInput value={maxAge} min={16} max={40} onChange={setMaxAge} label="Maximum age" /></FD.Field>
        <FD.Field label="Max asking price"><FD.MoneyInput value={maxPrice} onChange={setMaxPrice} currency={g.currency} label="Maximum asking price" /></FD.Field>
        <FD.Field label="Name"><div className="fd-input"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Search" aria-label="Player name" /></div></FD.Field>
        <label className="tr-check"><input type="checkbox" checked={freeOnly} onChange={(e) => setFreeOnly(e.target.checked)} /> Free agents only</label>
      </div>
      {results.length ? (
        <PlayerTable>
          {results.map((p) => (
            <PlayerRow key={p.id} g={g} p={p} go={go}>
              <span className="pg-row" style={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                <FD.Button size="sm" variant="ghost" onClick={() => update((d) => toggleShortlist(d, p.id))}>{g.shortlist.includes(p.id) ? 'Unlist' : 'Shortlist'}</FD.Button>
                <FD.Button size="sm" variant="secondary" disabled={!open} onClick={() => go('offer', p.id)}>Offer</FD.Button>
              </span>
            </PlayerRow>
          ))}
        </PlayerTable>
      ) : <div className="pg-card pg-empty">No players match these filters.</div>}
    </div>
  );
}
