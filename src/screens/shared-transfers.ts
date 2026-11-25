import type { GameState } from '../engine/types';

export function bidsFor(g: GameState) {
  return g.bids.filter((b) => b.status === 'open').map((b) => ({ b, p: g.players[b.playerId] })).filter((x) => x.p && x.p.clubId === g.userClubId);
}
