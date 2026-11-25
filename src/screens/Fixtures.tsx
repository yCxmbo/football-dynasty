import { FD } from '../ds';
import { formatDate } from '../engine/fixtures';
import type { GameState } from '../engine/types';
import { seasonLabel } from '../engine/types';
import type { Screen } from './shared';

export default function Fixtures({ g, go }: { g: GameState; go: (s: Screen, id?: string) => void }) {
  const mine = g.fixtures.filter((f) => f.homeId === g.userClubId || f.awayId === g.userClubId);
  return (
    <div>
      <div className="pg-head"><div><h1 className="pg-title">Fixtures</h1><p className="pg-sub">Premier Division {seasonLabel(g.year)} · click a result for the match report</p></div></div>
      <div className="fd-table-wrap">
        <table className="fd-table">
          <thead><tr>{['MD', 'Date', 'Opponent', 'Venue', 'Result'].map((c) => <th key={c} scope="col"><span className="fd-th">{c}</span></th>)}</tr></thead>
          <tbody>
            {mine.map((f) => {
              const home = f.homeId === g.userClubId;
              const opp = g.clubs[home ? f.awayId : f.homeId];
              const r = f.result;
              const us = r ? (home ? r.score[0] : r.score[1]) : 0, them = r ? (home ? r.score[1] : r.score[0]) : 0;
              const wdl = us > them ? 'W' : us < them ? 'L' : 'D';
              return (
                <tr key={f.id} className={(f.matchday === g.matchday ? 'fx-next ' : '') + (r ? 'fx-click' : '')} onClick={r ? () => go('match', f.id) : undefined}>
                  <td className="fd-muted">{f.matchday}</td>
                  <td>{formatDate(f.date)}</td>
                  <td><strong>{opp.name}</strong></td>
                  <td className="fd-muted">{home ? 'Home' : 'Away'}</td>
                  <td>{r ? <span className="fx-res"><span className={`fx-badge fx-badge--${wdl}`} aria-label={wdl === 'W' ? 'Win' : wdl === 'L' ? 'Defeat' : 'Draw'}>{wdl}</span>{us}–{them}</span>
                    : f.matchday === g.matchday ? <FD.Button size="sm" variant="ghost" onClick={() => go('home')}>Next match</FD.Button> : <span className="fd-muted">–</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
