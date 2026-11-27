import { useState } from 'react';
import { FD } from '../ds';
import { leagueScale, squadOf, youthScale } from '../engine/game';
import type { GameState, Squad as SquadName } from '../engine/types';
import { toCur } from '../store';
import { squadRow, type Screen } from './shared';
import { leagueLabel } from './comp-ui';
import { loanedOut } from '../engine/loans';
import SquadDynamics from './SquadDynamics';

export default function Squad({ g, go, update }: { g: GameState; go: (s: Screen, id?: string) => void; update: (fn: (d: GameState) => void) => void }) {
  const [tab, setTab] = useState<SquadName | 'Dynamics'>('First team');
  const all = squadOf(g, g.userClubId);
  const list = all.filter((p) => p.squad === (tab === 'Dynamics' ? 'First team' : tab));
  const wageBill = all.reduce((s, p) => s + p.wage, 0);
  const avgAge = list.reduce((s, p) => s + p.age, 0) / Math.max(1, list.length);
  const scale = tab === 'First team' ? leagueScale(g) : youthScale();
  return (
    <div>
      <div className="pg-head">
        <div>
          <h1 className="pg-title">Squad</h1>
          <p className="pg-sub">{list.length} players · average age {avgAge.toFixed(1)} · club wage bill <FD.Money amount={toCur(wageBill, g.currency)} currency={g.currency} perWeek /></p>
        </div>
        <div className="fd-seg" role="tablist" aria-label="Squad">
          {(['First team', 'U21', 'U18', 'Dynamics'] as Array<SquadName | 'Dynamics'>).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} className={'fd-seg__opt' + (tab === t ? ' is-on' : '')} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
      </div>
      {tab === 'Dynamics' ? <SquadDynamics g={g} go={go} update={update} /> : <>
      <p className="pg-h">Stars compared to: {tab === 'First team' ? leagueLabel(g, g.clubs[g.userClubId].league) : 'youth level'} · click a player for the full profile</p>
      <FD.SquadTable key={tab} players={list.map((p) => squadRow(p, g.currency, g.year))} currency={g.currency} scale={scale} onSelect={(p: { id: string }) => go('player', p.id)} />
      {tab === 'First team' && loanedOut(g).length > 0 && (
        <section className="pg-card" style={{ marginTop: 16 }}>
          <h2 className="pg-h">Out on loan</h2>
          <table className="fd-mini"><thead><tr><th>Player</th><th>Pos</th><th className="fd-num">Age</th><th>Club</th><th className="fd-num">Apps</th><th className="fd-num">Gls</th></tr></thead><tbody>
            {loanedOut(g).map((p) => (
              <tr key={p.id}>
                <td><button className="pg-link" style={{ textDecoration: 'none' }} onClick={() => go('player', p.id)}>{p.name}</button></td>
                <td className="fd-muted">{p.pos}</td><td className="fd-num">{p.age}</td>
                <td>{g.clubs[p.clubId]?.name}</td><td className="fd-num">{p.current.apps}</td><td className="fd-num">{p.current.goals}</td>
              </tr>
            ))}
          </tbody></table>
        </section>
      )}
      </>}
    </div>
  );
}
