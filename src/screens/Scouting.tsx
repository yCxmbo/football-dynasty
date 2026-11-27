import { useState } from 'react';
import { FD } from '../ds';
import { addAssignment, assignmentLabel, assignments, dismiss, endAssignment, maxAssignments, type Assignment } from '../engine/network';
import { nationName } from '../engine/nations';
import { formatDate } from '../engine/fixtures';
import { fromCur } from '../store';
import { startScouting } from '../engine/transfers';
import { bidsFor } from './shared-transfers';
import { scoutPerMatchday } from '../engine/staff';
import { MAX_SCOUTING, clubName, knowledgeOf, respondToBid, stopScouting, toggleShortlist, toggleTransferList, windowOpen } from '../engine/transfers';
import type { GameState } from '../engine/types';
import { toCur } from '../store';
import type { Screen } from './shared';
import { PlayerRow, PlayerTable, WindowBanner } from './Transfers';

export default function Scouting({ g, go, update }: { g: GameState; go: (s: Screen, id?: string) => void; update: (fn: (d: GameState) => void) => void }) {
  const scouting = g.scouting.map((id) => g.players[id]).filter(Boolean);
  const shortlist = g.shortlist.map((id) => g.players[id]).filter((p) => p && p.clubId !== g.userClubId);
  const listed = g.transferListed.map((id) => g.players[id]).filter((p) => p && p.clubId === g.userClubId);
  const bids = bidsFor(g);
  return (
    <div className="pg-stack">
      <div className="pg-head" style={{ marginBottom: 0 }}><div><h1 className="pg-title">Scouting</h1><p className="pg-sub">Your scouts can follow {MAX_SCOUTING} players at a time. Each matchday adds {scoutPerMatchday(g)}% knowledge (your chief scout is rated {g.staff?.scout?.rating ?? 10}/20); at 100% you get a full report.</p></div></div>
      <WindowBanner g={g} />
      <Network g={g} go={go} update={update} />
      <section>
        <h2 className="pg-h">Scouting now ({scouting.length}/{MAX_SCOUTING})</h2>
        {scouting.length ? <div className="pg-card sc-list">{scouting.map((p) => (
          <div key={p.id} className="sc-item">
            <button className="pg-link" onClick={() => go('player', p.id)}>{p.name}</button>
            <span className="fd-muted">{p.pos} · {p.age} · {clubName(g, p.clubId)}</span>
            <span className="fd-meter"><span className="fd-meter__bar fd-meter__bar--low" style={{ width: knowledgeOf(g, p) + '%' }} /></span>
            <span className="fd-muted">{knowledgeOf(g, p)}%</span>
            <FD.Button size="sm" variant="ghost" onClick={() => update((d) => stopScouting(d, p.id))}>Stop</FD.Button>
          </div>))}</div> : <div className="pg-card hm-note">Nobody is being scouted. Open a player from Transfers and choose “Scout”.</div>}
      </section>
      <section>
        <h2 className="pg-h">Shortlist</h2>
        {shortlist.length ? <PlayerTable>{shortlist.map((p) => (
          <PlayerRow key={p.id} g={g} p={p} go={go}>
            <span className="pg-row" style={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
              <FD.Button size="sm" variant="ghost" onClick={() => update((d) => toggleShortlist(d, p.id))}>Remove</FD.Button>
              <FD.Button size="sm" variant="secondary" disabled={!windowOpen(g)} onClick={() => go('offer', p.id)}>Offer</FD.Button>
            </span>
          </PlayerRow>))}</PlayerTable> : <div className="pg-card hm-note">Your shortlist is empty.</div>}
      </section>
      <section>
        <h2 className="pg-h">Bids for your players</h2>
        {bids.length ? <div className="pg-card sc-list">{bids.map(({ b, p }) => (
          <div key={b.id} className="sc-item">
            <button className="pg-link" onClick={() => go('player', p.id)}>{p.name}</button>
            <span className="fd-muted">{g.clubs[b.fromClubId].name} offer</span>
            <strong><FD.Money amount={toCur(b.fee, g.currency)} currency={g.currency} /></strong>
            <span className="fd-muted">value <FD.Money amount={toCur(p.value, g.currency)} currency={g.currency} /></span>
            <span className="pg-row"><FD.Button size="sm" variant="ghost" onClick={() => update((d) => respondToBid(d, b.id, false))}>Reject</FD.Button><FD.Button size="sm" onClick={() => update((d) => respondToBid(d, b.id, true))}>Accept</FD.Button></span>
          </div>))}</div> : <div className="pg-card hm-note">No open bids. Transfer-list players to attract offers.</div>}
      </section>
      <section>
        <h2 className="pg-h">Your transfer list</h2>
        {listed.length ? <div className="pg-card sc-list">{listed.map((p) => (
          <div key={p.id} className="sc-item">
            <button className="pg-link" onClick={() => go('player', p.id)}>{p.name}</button>
            <span className="fd-muted">{p.pos} · {p.age}</span>
            <span className="fd-muted">value <FD.Money amount={toCur(p.value, g.currency)} currency={g.currency} /></span>
            <FD.Button size="sm" variant="ghost" onClick={() => update((d) => toggleTransferList(d, p.id))}>Remove from list</FD.Button>
          </div>))}</div> : <div className="pg-card hm-note">No players listed. Use “Transfer list” on a player's profile.</div>}
      </section>
    </div>
  );
}

const POS = ['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'AM', 'LW', 'RW', 'ST'];
const GRADE_TEXT = { A: 'A · top target', B: 'B · worth a look', C: 'C · depth' } as const;

/** Scout assignments and the players they recommend. */
function Network({ g, go, update }: { g: GameState; go: (s: Screen, id?: string) => void; update: (fn: (d: GameState) => void) => void }) {
  const n = g.network ?? { assignments: [], recs: [], seq: 0 };
  const [kind, setKind] = useState<Assignment['kind']>('brief');
  const [target, setTarget] = useState('');
  const [pos, setPos] = useState('');
  const [maxAge, setMaxAge] = useState(23);
  const [maxPrice, setMaxPrice] = useState(() => toCur(g.clubs[g.userClubId].transferBudget, g.currency));
  const [weeks, setWeeks] = useState(8);
  const [msg, setMsg] = useState('');
  const cname = (c: string) => g.world.countries.find((x) => x.id === c)?.name ?? nationName(c);
  const countries = [...new Set(Object.values(g.clubs).filter((c) => c.league).map((c) => c.country))].sort((a, b) => cname(a).localeCompare(cname(b)));
  const leagues = g.world.leagues.slice().sort((a, b) => a.country.localeCompare(b.country) || a.tier - b.tier);
  const max = maxAssignments(g);
  const send = () => {
    const a = kind === 'brief' ? { kind, brief: { ...(pos ? { pos } : {}), maxAge, maxPrice: fromCur(maxPrice, g.currency) } } : { kind, target: target || (kind === 'country' ? countries[0] : leagues[0].id) };
    const err = addAssignment(structuredClone(g), a, weeks);
    if (err) { setMsg(err); return; }
    setMsg('');
    update((d) => { addAssignment(d, a, weeks); assignments(d); });
  };
  const recs = n.recs.filter((r) => g.players[r.playerId] && g.players[r.playerId].clubId !== g.userClubId);
  return (
    <section className="pg-card" aria-labelledby="net-h">
      <div className="talk__head"><h2 className="pg-h" id="net-h" style={{ margin: 0 }}>Scouting network</h2><span className="fd-muted talk__meta">{n.assignments.length} of {max} assignments · a better chief scout runs more and judges better</span></div>
      {n.assignments.length ? (
        <ul className="net-list">{n.assignments.map((a) => (
          <li key={a.id}><strong>{assignmentLabel(g, a, cname)}</strong><span className="fd-muted">until {formatDate(a.until)} · {a.found} recommended</span><FD.Button size="sm" variant="ghost" onClick={() => update((d) => endAssignment(d, a.id))}>Recall</FD.Button></li>
        ))}</ul>
      ) : <p className="hm-note" style={{ marginTop: 0 }}>No scouts on assignment. Send one below: each reports weekly with the players who stood out.</p>}
      {n.assignments.length < max ? (
        <div className="net-form">
          <FD.Field label="Assignment">
            <select className="fd-input" value={kind} aria-label="Assignment type" onChange={(e) => { setKind(e.target.value as Assignment['kind']); setTarget(''); }}>
              <option value="brief">A brief (position, age, price)</option><option value="country">A country</option><option value="league">A league</option>
            </select>
          </FD.Field>
          {kind === 'country' ? <FD.Field label="Country"><select className="fd-input" value={target} aria-label="Country" onChange={(e) => setTarget(e.target.value)}>{countries.map((c) => <option key={c} value={c}>{cname(c)}</option>)}</select></FD.Field> : null}
          {kind === 'league' ? <FD.Field label="League"><select className="fd-input" value={target} aria-label="League" onChange={(e) => setTarget(e.target.value)}>{leagues.map((l) => <option key={l.id} value={l.id}>{l.name} ({cname(l.country)})</option>)}</select></FD.Field> : null}
          {kind === 'brief' ? <>
            <FD.Field label="Position"><select className="fd-input" value={pos} aria-label="Position" onChange={(e) => setPos(e.target.value)}><option value="">Any</option>{POS.map((p) => <option key={p} value={p}>{p}</option>)}</select></FD.Field>
            <FD.Field label="Max age"><FD.NumberInput value={maxAge} min={16} max={40} onChange={setMaxAge} label="Maximum age" /></FD.Field>
            <FD.Field label="Max asking price"><FD.MoneyInput value={maxPrice} onChange={setMaxPrice} currency={g.currency} label="Maximum asking price" /></FD.Field>
          </> : null}
          <FD.Field label="For"><select className="fd-input" value={weeks} aria-label="Weeks" onChange={(e) => setWeeks(Number(e.target.value))}>{[4, 8, 12].map((w) => <option key={w} value={w}>{w} weeks</option>)}</select></FD.Field>
          <FD.Button icon="scouting" onClick={send}>Send a scout</FD.Button>
        </div>
      ) : null}
      {msg ? <p className="fd-warn" role="status">{msg}</p> : null}
      <h3 className="pg-h" style={{ marginTop: 14 }}>Recommendations</h3>
      {recs.length ? (
        <div className="fd-table-wrap"><table className="fd-table">
          <thead><tr>{['Player', 'Club', 'Pos', 'Age', 'Scout says', '', ''].map((c, i) => <th key={i} scope="col" className={i === 3 ? 'fd-num' : undefined}><span className="fd-th">{c}</span></th>)}</tr></thead>
          <tbody>{recs.map((r) => {
            const p = g.players[r.playerId];
            return (
              <tr key={r.playerId} className="fx-click" onClick={() => go('player', p.id)}>
                <td><strong>{p.name}</strong></td><td className="fd-muted">{g.clubs[p.clubId]?.name ?? 'Free agent'}</td><td><span className="fd-pos">{p.pos}</span></td><td className="fd-num">{p.age}</td>
                <td><span className={`net-grade net-grade--${r.grade}`}>{GRADE_TEXT[r.grade]}</span> <span className="fd-muted">{r.why}</span></td>
                <td className="fd-muted">{formatDate(r.date)}</td>
                <td onClick={(e) => e.stopPropagation()}><span className="pg-row" style={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                  <FD.Button size="sm" variant="ghost" onClick={() => update((d) => { if (!d.shortlist.includes(p.id)) d.shortlist.push(p.id); dismiss(d, p.id); })}>Shortlist</FD.Button>
                  <FD.Button size="sm" variant="ghost" onClick={() => update((d) => { startScouting(d, p.id); })}>Scout fully</FD.Button>
                  <FD.Button size="sm" variant="ghost" onClick={() => update((d) => dismiss(d, p.id))} aria-label={`Dismiss ${p.name}`}>×</FD.Button>
                </span></td>
              </tr>
            );
          })}</tbody>
        </table></div>
      ) : <p className="hm-note" style={{ margin: 0 }}>No recommendations yet. Scouts report once a week.</p>}
    </section>
  );
}
