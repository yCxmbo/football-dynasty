import { FD } from '../ds';
import { bidsFor } from './shared-transfers';
import { MAX_SCOUTING, SCOUT_PER_MATCHDAY, clubName, knowledgeOf, respondToBid, stopScouting, toggleShortlist, toggleTransferList, windowOpen } from '../engine/transfers';
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
      <div className="pg-head" style={{ marginBottom: 0 }}><div><h1 className="pg-title">Scouting</h1><p className="pg-sub">Your scouts can follow {MAX_SCOUTING} players at a time. Each matchday adds {SCOUT_PER_MATCHDAY}% knowledge; at 100% you get a full report.</p></div></div>
      <WindowBanner g={g} />
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
