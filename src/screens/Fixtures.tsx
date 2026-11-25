import { FD } from '../ds';
import { COMPS } from '../engine/competitions';
import { formatDate } from '../engine/fixtures';
import type { GameState } from '../engine/types';
import { seasonLabel } from '../engine/types';
import type { Screen } from './shared';

export default function Fixtures({ g, go }: { g: GameState; go: (s: Screen, id?: string) => void }) {
  const mine = g.fixtures.filter((f) => f.homeId === g.userClubId || f.awayId === g.userClubId).sort((a, b) => a.matchday - b.matchday);
  const next = mine.find((f) => !f.result);
  return (
    <div>
      <div className="pg-head"><div><h1 className="pg-title">Fixtures</h1><p className="pg-sub">{seasonLabel(g.year)} · all competitions · cup ties appear once they're drawn · click a result for the match report</p></div></div>
      <div className="fd-table-wrap">
        <table className="fd-table">
          <thead><tr>{['Date', 'Competition', 'Round', 'Opponent', 'Venue', 'Result'].map((c) => <th key={c} scope="col"><span className="fd-th">{c}</span></th>)}</tr></thead>
          <tbody>
            {mine.map((f) => {
              const home = f.homeId === g.userClubId;
              const opp = g.clubs[home ? f.awayId : f.homeId];
              const r = f.result;
              const us = r ? (home ? r.score[0] : r.score[1]) : 0, them = r ? (home ? r.score[1] : r.score[0]) : 0;
              const wdl = r?.winnerId && us === them ? (r.winnerId === g.userClubId ? 'W' : 'L') : us > them ? 'W' : us < them ? 'L' : 'D';
              const pens = r?.pens ? ` (${home ? r.pens[0] : r.pens[1]}–${home ? r.pens[1] : r.pens[0]} pens)` : '';
              return (
                <tr key={f.id} className={(f === next ? 'fx-next ' : '') + (r ? 'fx-click' : '')} onClick={r ? () => go('match', f.id) : undefined}>
                  <td>{formatDate(f.date)}</td>
                  <td><span className={f.comp.startsWith('D') ? '' : 'fd-gold'}>{COMPS[f.comp].name}</span></td>
                  <td className="fd-muted">{f.round}</td>
                  <td><strong>{opp.name}</strong>{opp.country ? <span className="fd-muted"> · {opp.country}</span> : null}</td>
                  <td className="fd-muted">{f.neutral ? 'Neutral' : home ? 'Home' : 'Away'}</td>
                  <td>{r ? <span className="fx-res"><span className={`fx-badge fx-badge--${wdl}`} aria-label={wdl === 'W' ? 'Win' : wdl === 'L' ? 'Defeat' : 'Draw'}>{wdl}</span>{us}–{them}<span className="fd-muted" style={{ fontWeight: 400, fontFamily: 'var(--font-sans)', fontSize: 12 }}>{pens}</span></span>
                    : f === next ? <FD.Button size="sm" variant="ghost" onClick={() => go('home')}>Next match</FD.Button> : <span className="fd-muted">–</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
