import { FD } from '../ds';
import { nationName } from '../engine/nations';
import { titleCounts } from '../engine/records';
import type { GameState } from '../engine/types';
import { toCur } from '../store';
import { badgeUrl } from './badge';

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

export default function Records({ g }: { g: GameState }) {
  const r = g.records;
  const cur = g.currency;
  const club = (id: string) => <span className="club-cell"><img className="club-badge" src={badgeUrl(g.clubs[id])} alt="" />{g.clubs[id].name}</span>;
  const mine = (name: string) => (name === g.clubs[g.userClubId].name ? <strong className="fd-gold">{name}</strong> : name);
  const none = 'Records are kept from the end of your first season.';
  return (
    <div className="pg-stack" style={{ gap: 16 }}>
      <div>
        <h1 className="pg-title">World records</h1>
        <p className="hm-note" style={{ margin: 0 }}>All-time records across the game world since your career began. Retired players keep their place.</p>
      </div>
      <div className="pg-grid2 rec-grid">
        <Table title="Most top-flight titles" head={['Club', 'Titles']} empty={none} rows={titleCounts(g, 'league').map((x) => [club(x.id), x.n])} />
        <Table title="Most continental titles" head={['Club', 'Titles']} empty="No continental titles yet." rows={titleCounts(g, 'continental').map((x) => [club(x.id), x.n])} />
        <Table title="All-time top scorers" head={['Player', 'Nation', 'Last club', 'Apps', 'Goals']} empty={none}
          rows={(r?.scorers ?? []).map((x) => [g.players[x.id] ? x.name : `${x.name} (retired)`, nationName(x.nation), x.club, x.apps, x.goals])} />
        <Table title="Most goals in a season" head={['Player', 'Club', 'Season', 'Goals']} empty={none}
          rows={(r?.seasons ?? []).map((x) => [x.name, mine(x.club), x.season, x.goals])} />
        <Table title="Most points by a champion" head={['Club', 'League', 'Season', 'Points']} empty={none}
          rows={(r?.points ?? []).map((x) => [mine(x.club), x.league, x.season, x.pts])} />
        <Table title="Record transfers" head={['Player', 'From', 'To', 'Season', 'Fee']} empty="No big transfers yet (from 5M)."
          rows={(r?.transfers ?? []).map((x) => [x.name, mine(x.from), mine(x.to), x.season, FD.formatMoney(toCur(x.fee, cur), cur)])} />
      </div>
    </div>
  );
}
