import { FD } from '../ds';
import { DIVISION, leagueTable } from '../engine/game';
import type { GameState } from '../engine/types';
import { seasonLabel } from '../engine/types';

export default function Table({ g }: { g: GameState }) {
  const rows = leagueTable(g);
  const scorers = Object.values(g.players).filter((p) => p.current.goals > 0).sort((a, b) => b.current.goals - a.current.goals || a.current.apps - b.current.apps).slice(0, 10);
  return (
    <div className="pg-grid2">
      <FD.LeagueTable title={`${DIVISION} · ${seasonLabel(g.year)}`} rows={rows} zones={{ champions: 1, championsLabel: 'Champions' }} />
      <section className="pg-card">
        <h2 className="pg-h">Top scorers</h2>
        {scorers.length ? (
          <table className="fd-mini">
            <thead><tr><th>Player</th><th>Club</th><th className="fd-num">Apps</th><th className="fd-num">Gls</th></tr></thead>
            <tbody>{scorers.map((p) => <tr key={p.id} className={p.clubId === g.userClubId ? 'fd-gold' : undefined}><td>{p.name}</td><td>{g.clubs[p.clubId].short}</td><td className="fd-num">{p.current.apps}</td><td className="fd-num"><strong>{p.current.goals}</strong></td></tr>)}</tbody>
          </table>) : <p className="hm-note">No goals yet this season.</p>}
      </section>
    </div>
  );
}
