import { useState } from 'react';
import { FD } from '../ds';
import { COMPS, CUP_ROUNDS, divisionTable, tableOf } from '../engine/competitions';
import type { CompId, GameState } from '../engine/types';
import { seasonLabel } from '../engine/types';
import { zonesFor } from './comp-ui';
import type { Screen } from './shared';

const TABS: Array<[string, string]> = [['D1', 'Premier Division'], ['D2', 'Championship'], ['D3', 'League One'], ['NC', 'National Cup'], ['LC', 'League Cup'], ['CC', 'Continental Cup'], ['PO', 'Play-offs']];

function Ties({ g, comp, go }: { g: GameState; comp: CompId; go: (s: Screen, id?: string) => void }) {
  const rounds = (CUP_ROUNDS[comp] ?? []).filter((r) => r !== 'Group stage');
  const fx = g.fixtures.filter((f) => f.comp === comp && !f.round.startsWith('Group'));
  const shown = rounds.filter((r) => fx.some((f) => f.round === r)).reverse();
  if (!shown.length) return <div className="pg-card pg-empty">No ties drawn yet.</div>;
  return (
    <div className="pg-stack" style={{ gap: 16 }}>
      {shown.map((r) => (
        <section key={r} className="pg-card">
          <h2 className="pg-h">{COMPS[comp].name} · {r}</h2>
          <table className="fd-mini cup-ties"><tbody>
            {fx.filter((f) => f.round === r).map((f) => {
              const res = f.result;
              const win = res?.winnerId;
              const mine = f.homeId === g.userClubId || f.awayId === g.userClubId;
              return (
                <tr key={f.id} className={mine ? 'fd-gold' : undefined} onClick={res && mine ? () => go('match', f.id) : undefined} style={res && mine ? { cursor: 'pointer' } : undefined}>
                  <td className="cup-home" style={{ fontWeight: win === f.homeId ? 700 : 400 }}>{g.clubs[f.homeId].name}</td>
                  <td className="cup-score">{res ? `${res.score[0]}–${res.score[1]}` : 'v'}{res?.pens ? <span className="fd-muted"> ({res.pens[0]}–{res.pens[1]} p)</span> : null}</td>
                  <td style={{ fontWeight: win === f.awayId ? 700 : 400 }}>{g.clubs[f.awayId].name}</td>
                  <td className="fd-muted fd-num">{f.neutral ? 'Neutral venue' : ''}</td>
                </tr>
              );
            })}
          </tbody></table>
        </section>
      ))}
    </div>
  );
}

export default function Table({ g, go }: { g: GameState; go: (s: Screen, id?: string) => void }) {
  const userDiv = g.clubs[g.userClubId].division || 1;
  const [tab, setTab] = useState<string>(`D${userDiv}`);
  const scorers = (d: number) => Object.values(g.players).filter((p) => p.current.goals > 0 && g.clubs[p.clubId]?.division === d).sort((a, b) => b.current.goals - a.current.goals || a.current.apps - b.current.apps).slice(0, 10);
  let body: JSX.Element;
  if (tab.startsWith('D')) {
    const d = Number(tab[1]);
    const list = scorers(d);
    body = (
      <div className="pg-grid2">
        <FD.LeagueTable title={`${COMPS[tab as CompId].name} · ${seasonLabel(g.year)}`} rows={divisionTable(g, d)} zones={zonesFor(d)} />
        <section className="pg-card">
          <h2 className="pg-h">Top scorers (all competitions)</h2>
          {list.length ? (
            <table className="fd-mini">
              <thead><tr><th>Player</th><th>Club</th><th className="fd-num">Apps</th><th className="fd-num">Gls</th></tr></thead>
              <tbody>{list.map((p) => <tr key={p.id} className={p.clubId === g.userClubId ? 'fd-gold' : undefined}><td>{p.name}</td><td>{g.clubs[p.clubId].short}</td><td className="fd-num">{p.current.apps}</td><td className="fd-num"><strong>{p.current.goals}</strong></td></tr>)}</tbody>
            </table>) : <p className="hm-note">No goals yet this season.</p>}
        </section>
      </div>
    );
  } else if (tab === 'CC') {
    body = (
      <div className="pg-stack" style={{ gap: 16 }}>
        <div className="cc-groups">
          {g.ccGroups.map((grp, i) => <FD.LeagueTable key={i} compact title={`Group ${'ABCD'[i]}`} rows={tableOf(g, 'CC', grp, i)} zones={{ promotion: 2, promotionLabel: 'Quarter-finals' }} />)}
        </div>
        <Ties g={g} comp="CC" go={go} />
      </div>
    );
  } else if (tab === 'PO') {
    body = <div className="pg-stack" style={{ gap: 16 }}><Ties g={g} comp="PO2" go={go} /><Ties g={g} comp="PO3" go={go} /></div>;
  } else body = <Ties g={g} comp={tab as CompId} go={go} />;
  return (
    <div className="pg-stack">
      <div className="pg-head" style={{ marginBottom: 0 }}><div><h1 className="pg-title">Competitions</h1><p className="pg-sub">Three divisions with promotion and relegation, two domestic cups, the Super Cup and the Continental Cup.</p></div></div>
      <div className="fd-tabs" role="tablist" style={{ margin: 0 }}>
        {TABS.map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={tab === k} className={'fd-tab' + (tab === k ? ' is-on' : '')} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      {body}
    </div>
  );
}
