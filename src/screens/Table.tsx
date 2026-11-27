import type React from 'react';
import { useState } from 'react';
import { FD } from '../ds';
import { compInfo, leagueTableOf, leaguesOf, tableOf } from '../engine/competitions';
import type { CompId, GameState } from '../engine/types';
import { seasonLabel } from '../engine/types';
import { badgeUrl } from './badge';
import { zonesFor } from './comp-ui';
import type { Screen } from './shared';

/** A club name that opens the club's page (without triggering the row's own click). */
function ClubName({ g, id, go }: { g: GameState; id: string; go: (s: Screen, id?: string) => void }) {
  return <button type="button" className="pg-link club-name" onClick={(e) => { e.stopPropagation(); go('club', id); }}>{g.clubs[id].name}</button>;
}

/** League tables render names as text: a click on a row opens that club. */
function clubFromRow(g: GameState, go: (s: Screen, id?: string) => void) {
  return (e: React.MouseEvent) => {
    const name = (e.target as HTMLElement).closest('tr')?.querySelector('.fd-league__club')?.textContent;
    const c = name ? Object.values(g.clubs).find((x) => x.name === name) : undefined;
    if (c) go('club', c.id);
  };
}

function Ties({ g, comp, go }: { g: GameState; comp: CompId; go: (s: Screen, id?: string) => void }) {
  const c = compInfo(g, comp);
  const rounds = (c.rounds ?? []).filter((r) => !r.startsWith('Group') && !r.startsWith('League phase'));
  const fx = g.fixtures.filter((f) => f.comp === comp && !f.round.startsWith('Group') && !f.round.startsWith('League phase'));
  const shown = rounds.filter((r) => fx.some((f) => f.round === r)).reverse();
  if (!shown.length) return <div className="pg-card pg-empty">No knockout ties drawn yet in the {c.name}.</div>;
  return (
    <div className="pg-stack" style={{ gap: 16 }}>
      {shown.map((r) => (
        <section key={r} className="pg-card">
          <h2 className="pg-h">{c.name} · {r}</h2>
          <table className="fd-mini cup-ties"><tbody>
            {fx.filter((f) => f.round === r).map((f) => {
              const res = f.result;
              const win = res?.winnerId;
              const mine = f.homeId === g.userClubId || f.awayId === g.userClubId;
              return (
                <tr key={f.id} className={mine ? 'fd-gold' : undefined} onClick={res && mine ? () => go('match', f.id) : undefined} style={res && mine ? { cursor: 'pointer' } : undefined}>
                  <td className="cup-home" style={{ fontWeight: win === f.homeId ? 700 : 400 }}><span className="club-cell club-cell--end"><ClubName g={g} id={f.homeId} go={go} /><img className="club-badge" src={badgeUrl(g.clubs[f.homeId])} alt="" /></span></td>
                  <td className="cup-score">{res ? `${res.score[0]}–${res.score[1]}` : 'v'}{res?.pens ? <span className="fd-muted"> ({res.pens[0]}–{res.pens[1]} p)</span> : null}</td>
                  <td style={{ fontWeight: win === f.awayId ? 700 : 400 }}><span className="club-cell"><img className="club-badge" src={badgeUrl(g.clubs[f.awayId])} alt="" /><ClubName g={g} id={f.awayId} go={go} /></span></td>
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
  const userClub = g.clubs[g.userClubId];
  const countries = g.world.countries.filter((c) => leaguesOf(g, c.id).length);
  const [country, setCountry] = useState(userClub.country);
  const [tab, setTab] = useState<string>(userClub.league ?? leaguesOf(g, country)[0]?.id ?? '');
  const comps = Object.values(g.comps);
  const local = comps.filter((c) => c.country === country && c.kind !== 'super').sort((a, b) => ['league', 'title', 'playoff', 'cup'].indexOf(a.kind) - ['league', 'title', 'playoff', 'cup'].indexOf(b.kind) || (a.tier ?? 0) - (b.tier ?? 0));
  const continental = comps.filter((c) => c.kind === 'continental').sort((a, b) => (a.rank ?? 1) - (b.rank ?? 1));
  const tabs = [...local, ...continental];
  const active = compInfo(g, tabs.some((t) => t.id === tab) ? tab : tabs[0]?.id ?? '');
  const scorers = (leagueId: string) => Object.values(g.players).filter((p) => p.current.goals > 0 && g.clubs[p.clubId]?.league === leagueId).sort((a, b) => b.current.goals - a.current.goals || a.current.apps - b.current.apps).slice(0, 10);
  let body: JSX.Element;
  if (active.kind === 'league') {
    const list = scorers(active.id);
    body = (
      <div className="pg-grid2">
        <div className="lt-click" onClick={clubFromRow(g, go)}><FD.LeagueTable title={`${active.name} · ${seasonLabel(g.year)}`} rows={leagueTableOf(g, active.id)} zones={zonesFor(g, active.id)} /></div>
        <section className="pg-card">
          <h2 className="pg-h">Top scorers (all competitions)</h2>
          {list.length ? (
            <table className="fd-mini">
              <thead><tr><th>Player</th><th>Club</th><th className="fd-num">Apps</th><th className="fd-num">Gls</th></tr></thead>
              <tbody>{list.map((p) => <tr key={p.id} className={p.clubId === g.userClubId ? 'fd-gold' : undefined}><td><button className="pg-link" onClick={() => go('player', p.id)}>{p.name}</button></td><td>{g.clubs[p.clubId].short}</td><td className="fd-num">{p.current.apps}</td><td className="fd-num"><strong>{p.current.goals}</strong></td></tr>)}</tbody>
            </table>) : <p className="hm-note">No goals yet this season.</p>}
        </section>
      </div>
    );
  } else if (active.kind === 'continental') {
    const groups = g.groups[active.id] ?? [];
    body = groups.length ? (
      <div className="pg-stack" style={{ gap: 16 }}>
        {active.size === 36 ? (
          <div className="lt-click" onClick={clubFromRow(g, go)}><FD.LeagueTable title={`${active.name} · League phase`} rows={tableOf(g, active.id, groups[0], 0)}
            zones={{ promotion: 8, promotionLabel: 'Round of 16', playoff: [9, 24], playoffLabel: 'Knockout play-off', relegation: 12, relegationLabel: 'Out' }} /></div>
        ) : (
          <div className="cc-groups lt-click" onClick={clubFromRow(g, go)}>
            {groups.map((grp, i) => <FD.LeagueTable key={i} compact title={`Group ${'ABCDEFGH'[i]}`} rows={tableOf(g, active.id, grp, i)} zones={{ promotion: 2, promotionLabel: 'Knockout stage' }} />)}
          </div>
        )}
        <Ties g={g} comp={active.id} go={go} />
      </div>
    ) : <div className="pg-card pg-empty">The {active.name} isn't being played this season (not enough qualified clubs).</div>;
  } else body = <Ties g={g} comp={active.id} go={go} />;
  return (
    <div className="pg-stack">
      <div className="pg-head" style={{ marginBottom: 0 }}>
        <div><h1 className="pg-title">Competitions</h1><p className="pg-sub">{g.world.name} · {countries.length} countries · {g.world.leagues.length} leagues</p></div>
        <FD.Field label="Country"><FD.Select value={country} label="Country" options={countries.map((c) => ({ value: c.id, label: c.name }))} onChange={(v: string) => { setCountry(v); setTab(leaguesOf(g, v)[0]?.id ?? ''); }} /></FD.Field>
      </div>
      <div className="fd-tabs comp-tabs" role="tablist" style={{ margin: 0 }}>
        {tabs.map((c) => <button key={c.id} type="button" role="tab" aria-selected={active.id === c.id} className={'fd-tab' + (active.id === c.id ? ' is-on' : '')} onClick={() => setTab(c.id)}>{c.kind === 'playoff' || c.kind === 'title' ? c.name : c.short}</button>)}
      </div>
      {body}
    </div>
  );
}
