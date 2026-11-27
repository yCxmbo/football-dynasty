import { useState } from 'react';
import { FD } from '../ds';
import { affiliateFee, affiliatesOf, candidates, endAffiliation, MAX_FEEDERS, propose, type AffKind } from '../engine/affiliates';
import { loanedOut } from '../engine/loans';
import type { GameState } from '../engine/types';
import { toCur } from '../store';
import { badgeUrl } from './badge';
import type { Screen } from './shared';

/** Feeder and parent clubs: who you're partnered with, and who would sign up. */
export default function Affiliates({ g, go, update }: { g: GameState; go: (s: Screen, id?: string) => void; update: (fn: (d: GameState) => void) => void }) {
  const [msg, setMsg] = useState('');
  const cur = g.currency;
  const mine = affiliatesOf(g);
  const cname = (c: string) => g.world.countries.find((x) => x.id === c)?.name ?? c;
  const money = (v: number) => <FD.Money amount={toCur(v, cur)} currency={cur} />;
  const club = (id: string) => <button type="button" className="pg-link club-cell" onClick={() => go('club', id)}><img className="club-badge" src={badgeUrl(g.clubs[id])} alt="" /><strong>{g.clubs[id].name}</strong></button>;
  const ask = (id: string, kind: AffKind) => {
    const e = propose(structuredClone(g), id, kind);
    if (e) { setMsg(e); return; }
    setMsg('');
    update((d) => { propose(d, id, kind); });
  };
  const feeders = mine.filter((a) => a.kind === 'feeder').length, parent = mine.some((a) => a.kind === 'parent');
  const loanees = loanedOut(g).filter((p) => mine.some((a) => a.clubId === p.clubId));
  const list = (kind: AffKind) => candidates(g, kind).map((c) => (
    <tr key={c.id}>
      <td>{club(c.id)}</td>
      <td className="fd-muted">{g.world.leagues.find((l) => l.id === c.league)?.name} · {cname(c.country)}</td>
      <td className="fd-num">{kind === 'feeder' ? <>you pay {money(affiliateFee(g, c.id, kind))}</> : <>they pay {money(affiliateFee(g, c.id, kind))}</>} <span className="fd-muted">a year</span></td>
      <td style={{ textAlign: 'right' }}><FD.Button size="sm" variant="secondary" disabled={kind === 'feeder' ? feeders >= MAX_FEEDERS : parent} onClick={() => ask(c.id, kind)}>Propose</FD.Button></td>
    </tr>
  ));
  return (
    <div className="pg-stack">
      <div className="pg-head" style={{ marginBottom: 0 }}>
        <div><h1 className="pg-title">Affiliate clubs</h1><p className="pg-sub">Feeder clubs take your players on loan to develop them (faster than elsewhere), give you first call on their young players (20% off), and grow your name abroad; you pay them a yearly fee. A parent club lends you its prospects and pays you a yearly fee.</p></div>
      </div>
      {msg ? <p className="fd-warn" role="status">{msg}</p> : null}
      <section className="pg-card">
        <h2 className="pg-h">Your partners</h2>
        {mine.length ? (
          <table className="fd-mini"><tbody>{mine.map((a) => (
            <tr key={a.clubId}>
              <td>{club(a.clubId)}</td>
              <td><span className={`fd-tag ${a.kind === 'parent' ? 'fd-tag--gold' : ''}`}>{a.kind === 'feeder' ? 'Feeder club' : 'Parent club'}</span></td>
              <td className="fd-muted">since {a.since}/{String((a.since + 1) % 100).padStart(2, '0')} · {a.kind === 'feeder' ? 'you pay' : 'they pay'} {money(affiliateFee(g, a.clubId, a.kind))} a year</td>
              <td style={{ textAlign: 'right' }}><FD.Button size="sm" variant="ghost" onClick={() => { if (window.confirm(`End the partnership with ${g.clubs[a.clubId].name}?`)) update((d) => endAffiliation(d, a.clubId)); }}>End</FD.Button></td>
            </tr>
          ))}</tbody></table>
        ) : <p className="hm-note" style={{ margin: 0 }}>No affiliate clubs yet. Propose one below.</p>}
        {loanees.length ? <p className="hm-note" style={{ marginBottom: 0 }}>Developing at your partners: {loanees.map((p, i) => <span key={p.id}>{i ? ', ' : ''}<button type="button" className="pg-link club-name" onClick={() => go('player', p.id)}>{p.name}</button> ({g.clubs[p.clubId].short})</span>)}.</p> : null}
      </section>
      <section className="pg-card">
        <h2 className="pg-h">Possible feeder clubs ({feeders}/{MAX_FEEDERS})</h2>
        {candidates(g, 'feeder').length ? <table className="fd-mini"><tbody>{list('feeder')}</tbody></table> : <p className="hm-note" style={{ margin: 0 }}>No smaller clubs are looking for a partner.</p>}
      </section>
      <section className="pg-card">
        <h2 className="pg-h">Possible parent clubs ({parent ? 1 : 0}/1)</h2>
        {candidates(g, 'parent').length ? <table className="fd-mini"><tbody>{list('parent')}</tbody></table> : <p className="hm-note" style={{ margin: 0 }}>No bigger club wants a partner at your level. Clubs within reach are up to 35 reputation points above yours.</p>}
      </section>
    </div>
  );
}
