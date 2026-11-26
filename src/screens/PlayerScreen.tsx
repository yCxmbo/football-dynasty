import { FD } from '../ds';
import { leagueScale, youthScale } from '../engine/game';
import { MAX_SCOUTING, knowledgeOf, windowOpen } from '../engine/transfers';
import type { GameState } from '../engine/types';
import { profileData, type Screen } from './shared';
import { nationName } from '../engine/nations';

export interface PlayerActions { promote: (id: string) => void; scout: (id: string) => void; shortlist: (id: string) => void; transferList: (id: string) => void }

export default function PlayerScreen({ g, id, go, act }: { g: GameState; id?: string; go: (s: Screen, id?: string) => void; act: PlayerActions }) {
  const p = id ? g.players[id] : undefined;
  if (!p) return <div className="pg-empty">This player has left the game. <button className="pg-link" onClick={() => go('squad')}>Back to squad</button></div>;
  const mine = p.clubId === g.userClubId;
  const youth = p.squad !== 'First team';
  const actions: JSX.Element[] = [];
  if (mine) {
    if (youth) actions.push(<FD.Button key="p" size="sm" icon="youth" onClick={() => act.promote(p.id)}>Promote to first team</FD.Button>);
    else {
      actions.push(<FD.Button key="c" size="sm" variant="secondary" icon="contract" onClick={() => go('contract', p.id)}>Offer new contract</FD.Button>);
      actions.push(<FD.Button key="t" size="sm" variant={g.transferListed.includes(p.id) ? 'primary' : 'secondary'} icon="transfers" onClick={() => act.transferList(p.id)}>{g.transferListed.includes(p.id) ? 'On transfer list' : 'Transfer list'}</FD.Button>);
    }
  } else {
    const k = knowledgeOf(g, p);
    const scouting = g.scouting.includes(p.id);
    if (k < 100) actions.push(<FD.Button key="s" size="sm" variant="secondary" icon="scouting" disabled={scouting || g.scouting.length >= MAX_SCOUTING} onClick={() => act.scout(p.id)}>{scouting ? 'Being scouted' : 'Scout'}</FD.Button>);
    actions.push(<FD.Button key="l" size="sm" variant="secondary" icon="star" onClick={() => act.shortlist(p.id)}>{g.shortlist.includes(p.id) ? 'Shortlisted' : 'Shortlist'}</FD.Button>);
    actions.push(<FD.Button key="o" size="sm" icon="transfers" disabled={!windowOpen(g)} onClick={() => go('offer', p.id)}>Make offer</FD.Button>);
  }
  const intl = p.intl;
  return (
    <div className="pg-stack" style={{ gap: 16 }}>
      <FD.PlayerProfile player={profileData(g, p, g.currency)} currency={g.currency} scale={youth ? youthScale() : leagueScale(g)} actions={actions} />
      <section className="pg-card intl-line">
        <h2 className="pg-h" style={{ margin: 0 }}>International · {nationName(p.nationality)}</h2>
        <span>{intl?.caps ? `${intl.caps} cap${intl.caps === 1 ? '' : 's'}, ${intl.goals} goal${intl.goals === 1 ? '' : 's'} at tournaments` : 'No tournament appearances yet'}</span>
        {intl?.titles.length ? <span className="intl-won">Won: {intl.titles.join(', ')}</span> : null}
      </section>
    </div>
  );
}
