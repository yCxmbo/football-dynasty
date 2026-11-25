import { FD } from '../ds';
import { leagueScale, youthScale } from '../engine/game';
import type { GameState } from '../engine/types';
import { profileData, type Screen } from './shared';

export default function PlayerScreen({ g, id, go, onPromote }: { g: GameState; id?: string; go: (s: Screen, id?: string) => void; onPromote: (id: string) => void }) {
  const p = id ? g.players[id] : undefined;
  if (!p) return <div className="pg-empty">This player is no longer at the club. <button className="pg-link" onClick={() => go('squad')}>Back to squad</button></div>;
  const mine = p.clubId === g.userClubId;
  const youth = p.squad !== 'First team';
  const actions = [<FD.Button key="b" size="sm" variant="secondary" onClick={() => go(youth ? 'youth' : 'squad')}>Back</FD.Button>];
  if (mine && youth) actions.push(<FD.Button key="p" size="sm" icon="youth" onClick={() => onPromote(p.id)}>Promote to first team</FD.Button>);
  return (
    <FD.PlayerProfile player={profileData(g, p, g.currency)} currency={g.currency} scale={youth ? youthScale() : leagueScale(g)} actions={actions} />
  );
}
