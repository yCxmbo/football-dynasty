import { useState } from 'react';
import { FD } from '../ds';
import { wantsOut } from '../engine/contracts';
import { TRAIT_TEXT, traitsOf } from '../engine/traits';
import { toCur } from '../store';
import { canLoanOut, loanDestinations, loanIn, loanInVerdict, loanOut, recall } from '../engine/loans';
import { badgeUrl } from './badge';
import { leagueScale, youthScale } from '../engine/game';
import { MAX_SCOUTING, knowledgeOf, windowOpen } from '../engine/transfers';
import type { GameState } from '../engine/types';
import { profileData, type Screen } from './shared';
import { nationName } from '../engine/nations';

export interface PlayerActions { promote: (id: string) => void; scout: (id: string) => void; shortlist: (id: string) => void; transferList: (id: string) => void }

export default function PlayerScreen({ g, id, go, act, update }: { g: GameState; id?: string; go: (s: Screen, id?: string) => void; act: PlayerActions; update: (fn: (d: GameState) => void) => void }) {
  const [loanOpen, setLoanOpen] = useState(false);
  const [note, setNote] = useState('');
  const p = id ? g.players[id] : undefined;
  if (!p) return <div className="pg-empty">This player has left the game. <button className="pg-link" onClick={() => go('squad')}>Back to squad</button></div>;
  const ours = p.loan?.from === g.userClubId; // out on loan from us
  const borrowed = !!p.loan && p.clubId === g.userClubId;
  const mine = p.clubId === g.userClubId;
  const youth = p.squad !== 'First team';
  const actions: JSX.Element[] = [];
  if (mine) {
    if (youth) actions.push(<FD.Button key="p" size="sm" icon="youth" onClick={() => act.promote(p.id)}>Promote to first team</FD.Button>);
    else if (!borrowed) {
      actions.push(<FD.Button key="c" size="sm" variant="secondary" icon="contract" onClick={() => go('contract', p.id)}>Offer new contract</FD.Button>);
      actions.push(<FD.Button key="t" size="sm" variant={g.transferListed.includes(p.id) ? 'primary' : 'secondary'} icon="transfers" onClick={() => act.transferList(p.id)}>{g.transferListed.includes(p.id) ? 'On transfer list' : 'Transfer list'}</FD.Button>);
    }
    if (!borrowed) actions.push(<FD.Button key="lo" size="sm" variant="secondary" icon="transfers" onClick={() => { setNote(canLoanOut(g, p) ?? ''); setLoanOpen((v) => !v); }}>Loan out</FD.Button>);
  } else if (ours) {
    actions.push(<FD.Button key="r" size="sm" variant="secondary" icon="transfers" onClick={() => { let e: string | null = null; update((d) => { e = recall(d, p.id); }); setTimeout(() => setNote(e ?? ''), 0); }}>Recall from loan</FD.Button>);
  } else {
    const k = knowledgeOf(g, p);
    const scouting = g.scouting.includes(p.id);
    if (k < 100) actions.push(<FD.Button key="s" size="sm" variant="secondary" icon="scouting" disabled={scouting || g.scouting.length >= MAX_SCOUTING} onClick={() => act.scout(p.id)}>{scouting ? 'Being scouted' : 'Scout'}</FD.Button>);
    actions.push(<FD.Button key="l" size="sm" variant="secondary" icon="star" onClick={() => act.shortlist(p.id)}>{g.shortlist.includes(p.id) ? 'Shortlisted' : 'Shortlist'}</FD.Button>);
    actions.push(<FD.Button key="o" size="sm" icon="transfers" disabled={!windowOpen(g)} onClick={() => go('offer', p.id)}>Make offer</FD.Button>);
    actions.push(<FD.Button key="li" size="sm" variant="secondary" icon="transfers" onClick={() => {
      const v = loanInVerdict(g, p);
      if (!v.ok) { setNote(v.reason); return; }
      if (window.confirm(`Take ${p.name} on loan from ${g.clubs[p.clubId].name} until the end of the season? You pay his wages.`)) update((d) => { loanIn(d, p.id); });
    }}>Ask to loan</FD.Button>);
  }
  const intl = p.intl;
  return (
    <div className="pg-stack" style={{ gap: 16 }}>
      <FD.PlayerProfile player={profileData(g, p, g.currency)} currency={g.currency} scale={youth ? youthScale() : leagueScale(g)} actions={actions} />
      {p.loan && (
        <p className="pg-card loan-note">{ours ? `On loan at ${g.clubs[p.clubId].name} until the summer · ${p.current.apps} apps, ${p.current.goals} goals this season` : `On loan from ${g.clubs[p.loan.from]?.name ?? 'another club'} until the summer`}</p>
      )}
      {(p.releaseClause || p.preContract || (mine && wantsOut(g, p))) && (
        <p className="pg-card loan-note">
          {p.releaseClause ? `Release clause: ${FD.formatMoney(toCur(p.releaseClause, g.currency), g.currency)}${mine ? ' (any club paying it in full can take him)' : ' (pay it in full, up front, and his club cannot refuse)'}. ` : ''}
          {p.preContract ? `Has agreed to join ${g.clubs[p.preContract]?.name} on a free in the summer. ` : ''}
          {!p.preContract && mine && wantsOut(g, p) ? 'In the last year of his contract and wants to move on: he won\'t renew.' : ''}
        </p>
      )}
      {note && <p className="fd-warn" role="status">{note}</p>}
      {loanOpen && mine && !borrowed && !canLoanOut(g, p) && (() => {
        const dest = loanDestinations(g, p);
        return (
          <section className="pg-card">
            <h2 className="pg-h">Clubs that would take {p.name} on loan</h2>
            {dest.length ? (
              <table className="fd-mini"><tbody>
                {dest.map((d) => (
                  <tr key={d.clubId}>
                    <td><span className="club-cell"><img className="club-badge" src={badgeUrl(g.clubs[d.clubId])} alt="" /><strong>{g.clubs[d.clubId].name}</strong></span></td>
                    <td className="fd-muted">{g.world.leagues.find((l) => l.id === g.clubs[d.clubId].league)?.name}</td>
                    <td className="fd-muted">{d.role}</td>
                    <td style={{ textAlign: 'right' }}><FD.Button size="sm" onClick={() => { update((s) => { loanOut(s, p.id, d.clubId); }); setLoanOpen(false); }}>Send on loan</FD.Button></td>
                  </tr>
                ))}
              </tbody></table>
            ) : <p className="hm-note">No club would play him regularly. Loans suit players who'd start at a smaller club.</p>}
          </section>
        );
      })()}
      <section className="pg-card intl-line">
        <h2 className="pg-h" style={{ margin: 0 }}>Personality</h2>
        {mine || ours || knowledgeOf(g, p) >= 50 ? (
          traitsOf(p).length ? traitsOf(p).map((t) => <span key={t} className={'trait ' + (TRAIT_TEXT[t].good ? 'trait--good' : 'trait--bad')} title={TRAIT_TEXT[t].effect}>{TRAIT_TEXT[t].label}<em>{TRAIT_TEXT[t].effect}</em></span>)
            : <span className="fd-muted">An even temperament: nothing stands out.</span>
        ) : <span className="fd-muted">Scout him to learn his character.</span>}
      </section>
      {p.awards?.length ? (
        <section className="pg-card intl-line">
          <h2 className="pg-h" style={{ margin: 0 }}>Awards</h2>
          {p.awards.slice(0, 12).map((x, i) => <span key={i} className={'aw-chip' + (/^Golden/.test(x) ? ' aw-chip--gold' : '')}>{x}</span>)}
          {p.awards.length > 12 ? <span className="fd-muted">and {p.awards.length - 12} more</span> : null}
        </section>
      ) : null}
      <section className="pg-card intl-line">
        <h2 className="pg-h" style={{ margin: 0 }}>International · {nationName(p.nationality)}</h2>
        <span>{intl?.caps ? `${intl.caps} cap${intl.caps === 1 ? '' : 's'}, ${intl.goals} goal${intl.goals === 1 ? '' : 's'} at tournaments` : 'No tournament appearances yet'}</span>
        {intl?.titles.length ? <span className="intl-won">Won: {intl.titles.join(', ')}</span> : null}
      </section>
    </div>
  );
}
