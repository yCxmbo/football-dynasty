import { useState } from 'react';
import { FD } from '../ds';
import { TEAM_SLOTS, type AwardWinner } from '../engine/awards';
import { nationName } from '../engine/nations';
import { titleCounts } from '../engine/records';
import { ordinal } from '../engine/game';
import type { GameState } from '../engine/types';
import { toCur } from '../store';
import { badgeUrl } from './badge';
import type { Screen } from './shared';

function Table({ title, head, rows, empty }: { title: string; head: string[]; rows: Array<Array<string | number | JSX.Element>>; empty: string }) {
  return (
    <section className="pg-card">
      <h2 className="pg-h">{title}</h2>
      {rows.length ? (
        <table className="fd-mini"><thead><tr><th className="fd-num">#</th>{head.map((h, i) => <th key={h} className={i === head.length - 1 ? 'fd-num' : undefined}>{h}</th>)}</tr></thead><tbody>
          {rows.map((r, i) => <tr key={i}><td className="fd-num fd-muted">{i + 1}</td>{r.map((c, j) => <td key={j} className={j === r.length - 1 ? 'fd-num' : undefined}>{c}</td>)}</tr>)}
        </tbody></table>
      ) : <p className="hm-note">{empty}</p>}
    </section>
  );
}

export default function Records({ g, go }: { g: GameState; go: (s: Screen, id?: string) => void }) {
  const r = g.records;
  const cur = g.currency;
  const club = (id: string) => <button type="button" className="pg-link club-cell" onClick={() => go('club', id)}><img className="club-badge" src={badgeUrl(g.clubs[id])} alt="" />{g.clubs[id].name}</button>;
  const mine = (name: string) => (name === g.clubs[g.userClubId].name ? <strong className="fd-gold">{name}</strong> : name);
  const none = 'Records are kept from the end of your first season.';
  return (
    <div className="pg-stack" style={{ gap: 16 }}>
      <div>
        <h1 className="pg-title">World records</h1>
        <p className="hm-note" style={{ margin: 0 }}>All-time records across the game world since your career began. Retired players keep their place.</p>
      </div>
      <Awards g={g} />
      <div className="pg-grid2 rec-grid">
        <Table title="Most top-flight titles" head={['Club', 'Titles']} empty={none} rows={titleCounts(g, 'league').map((x) => [club(x.id), x.n])} />
        <Table title="Most continental titles" head={['Club', 'Titles']} empty="No continental titles yet." rows={titleCounts(g, 'continental').map((x) => [club(x.id), x.n])} />
        <Table title="All-time top scorers" head={['Player', 'Nation', 'Last club', 'Apps', 'Goals']} empty={none}
          rows={(r?.scorers ?? []).map((x) => [g.players[x.id] ? x.name : `${x.name} (retired)`, nationName(x.nation), x.club, x.apps, x.goals])} />
        <Table title="Most goals in a season" head={['Player', 'Club', 'Season', 'Goals']} empty={none}
          rows={(r?.seasons ?? []).map((x) => [x.name, mine(x.club), x.season, x.goals])} />
        <Table title="Most points by a champion" head={['Club', 'League', 'Season', 'Points']} empty={none}
          rows={(r?.points ?? []).map((x) => [mine(x.club), x.league, x.season, x.pts])} />
        <Table title="Derbies" head={['Derby', 'Head to head', 'Last', 'Played']} empty="No derbies played yet."
          rows={Object.entries(g.derbies ?? {}).sort((a, b) => (b[1].aWins + b[1].bWins + b[1].draws) - (a[1].aWins + a[1].bWins + a[1].draws)).slice(0, 20)
            .map(([name, d]) => [[d.a, d.b].includes(g.userClubId) ? <strong className="fd-gold">{name}</strong> : name, `${g.clubs[d.a]?.short ?? '?'} ${d.aWins} · ${d.draws} draws · ${d.bWins} ${g.clubs[d.b]?.short ?? '?'}`, d.last ?? '', d.aWins + d.bWins + d.draws])} />
        <Table title="Record transfers" head={['Player', 'From', 'To', 'Season', 'Fee']} empty="No big transfers yet (from 5M)."
          rows={(r?.transfers ?? []).map((x) => [x.name, mine(x.from), mine(x.to), x.season, FD.formatMoney(toCur(x.fee, cur), cur)])} />
      </div>
    </div>
  );
}

function Awards({ g }: { g: GameState }) {
  const a = g.awards?.latest;
  const home = g.clubs[g.userClubId]?.league;
  const [pick, setPick] = useState<string | null>(null);
  if (!a) return (
    <section className="pg-card">
      <h2 className="pg-h">Awards</h2>
      <p className="hm-note">The Golden Ball, the Golden Boy and each top flight's awards are handed out at the end of the season.</p>
    </section>
  );
  const ours = (w?: AwardWinner) => w?.clubId === g.userClubId;
  const who = (w?: AwardWinner) => (w ? <span className={ours(w) ? 'fd-gold' : undefined}>{ours(w) ? <strong>{w.name}</strong> : w.name} <span className="fd-muted">· {w.club}</span></span> : <span className="fd-muted">—</span>);
  const league = a.leagues.find((l) => l.leagueId === (pick ?? home)) ?? a.leagues[0];
  return (
    <div className="pg-stack" style={{ gap: 16 }}>
      <div className="pg-grid2 rec-grid">
        <Table title={`Golden Ball ${a.season}`} head={['Player', 'Nation', 'Rating', 'Goals']} empty="Not awarded."
          rows={a.ball.map((w) => [who(w), nationName(w.nation), w.rating.toFixed(2), w.goals])} />
        <Table title="Golden Ball and Golden Boy winners" head={['Season', 'Golden Ball', 'Golden Boy']} empty="None yet."
          rows={(g.awards?.history ?? []).map((h) => [h.season, who(h.ball[0]), who(h.boy)])} />
      </div>
      {a.boy ? <p className="hm-note" style={{ margin: 0 }}>Golden Boy {a.season}: {who(a.boy)}, aged {a.boy.age}, average rating {a.boy.rating.toFixed(2)}.</p> : null}
      <Table title={`League awards ${a.season}`} head={['League', 'Player of the Season', 'Young Player', 'Manager', 'Top scorer']} empty="No top flights."
        rows={a.leagues.map((l) => [l.league, who(l.pots), who(l.young), l.manager ? (l.manager.you ? <strong className="fd-gold">{l.manager.name} · {l.manager.club}</strong> : <span>{l.manager.name.endsWith(' manager') ? l.manager.club : <>{l.manager.name} <span className="fd-muted">· {l.manager.club}</span></>} <span className="fd-muted">· {ordinal(l.manager.pos)}, expected {ordinal(l.manager.expected)}</span></span>) : '—', l.scorer ? <>{who(l.scorer)} <span className="fd-num">{l.scorer.goals}</span></> : '—'])} />
      {league ? (
        <section className="pg-card">
          <div className="aw-head">
            <h2 className="pg-h" style={{ margin: 0 }}>Team of the Season</h2>
            <select className="fd-input aw-select" value={league.leagueId} onChange={(e) => setPick(e.target.value)} aria-label="League">
              {a.leagues.map((l) => <option key={l.leagueId} value={l.leagueId}>{l.league}</option>)}
            </select>
          </div>
          <table className="fd-mini"><thead><tr><th>Pos</th><th>Player</th><th className="fd-num">Apps</th><th className="fd-num">Goals</th><th className="fd-num">Rating</th></tr></thead><tbody>
            {league.team.map((w, i) => <tr key={w.id}><td className="fd-muted">{TEAM_SLOTS[i] ?? w.pos}</td><td>{who(w)}</td><td className="fd-num">{w.apps}</td><td className="fd-num">{w.goals}</td><td className="fd-num">{w.rating.toFixed(2)}</td></tr>)}
          </tbody></table>
        </section>
      ) : null}
    </div>
  );
}
