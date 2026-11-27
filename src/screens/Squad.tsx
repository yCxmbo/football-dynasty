import { useState } from 'react';
import { FD } from '../ds';
import { leagueScale, squadOf, youthScale } from '../engine/game';
import type { GameState, Squad as SquadName } from '../engine/types';
import { toCur } from '../store';
import type { Screen } from './shared';
import { leagueLabel } from './comp-ui';
import { loanedOut } from '../engine/loans';
import SquadDynamics from './SquadDynamics';
import SquadTable from './SquadTable';
import { available } from '../engine/match';

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
      <SquadSummary g={g} list={list} scale={scale} youth={tab !== 'First team'} />
      <p className="pg-h">Stars compared to: {tab === 'First team' ? leagueLabel(g, g.clubs[g.userClubId].league) : 'youth level'} · click a player for the full profile · click a heading to sort</p>
      <SquadTable key={tab} g={g} players={list} scale={scale} youth={tab !== 'First team'} onSelect={(id) => go('player', id)} />
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

const DEPTH: Array<[string, string[]]> = [['Goalkeepers', ['GK']], ['Centre-backs', ['CB']], ['Full-backs', ['LB', 'RB']], ['Defensive mid', ['DM']], ['Central mid', ['CM']], ['Attacking mid', ['AM']], ['Wingers', ['LW', 'RW']], ['Strikers', ['ST']]];

/** Depth at each position (how many, and how good the best two are) and the squad's state at a glance. */
function SquadSummary({ g, list, scale, youth }: { g: GameState; list: import('../engine/types').Player[]; scale: { low: number; high: number }; youth: boolean }) {
  const out = list.filter((p) => !available(p)).length;
  const expiring = list.filter((p) => p.contractEnd <= g.year).length;
  const tired = list.filter((p) => (p.condition ?? 100) < 75).length;
  const unhappy = list.filter((p) => p.morale === 'low').length;
  return (
    <section className="sq-summary">
      <div className="sq-depth" aria-label="Depth by position">
        {DEPTH.map(([label, pos]) => {
          const ps = list.filter((p) => pos.includes(p.pos)).sort((a, b) => b.ability - a.ability);
          const thin = !youth && ps.length < (({ GK: 2, CB: 3, CM: 3, ST: 2 } as Record<string, number>)[pos[0]] ?? (pos.length > 1 ? 3 : 1));
          return (
            <div key={label} className={'sq-depth__cell' + (thin ? ' is-thin' : '')}>
              <span className="fd-label">{label}</span>
              <span className="sq-depth__n">{ps.length}{thin ? <span className="fd-tag fd-tag--warn">Thin</span> : null}</span>
              {ps[0] ? <FD.StarRating ability={ps[0].ability} scale={scale} youth={youth} size={11} /> : <span className="fd-muted">Nobody</span>}
              <span className="sq-depth__who">{ps.slice(0, 2).map((p) => p.name.split(' ').slice(-1)[0]).join(', ')}</span>
            </div>
          );
        })}
      </div>
      <div className="sq-facts">
        <span><strong>{out}</strong> unavailable</span>
        <span><strong>{tired}</strong> under 75% fit</span>
        <span><strong>{unhappy}</strong> unhappy</span>
        {!youth ? <span><strong>{expiring}</strong> contracts ending this season</span> : null}
      </div>
    </section>
  );
}
