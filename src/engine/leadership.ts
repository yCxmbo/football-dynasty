/* The captain and set-piece takers. A strong captain lifts the side (more so when it's behind); naming a weak
   or very young one, or stripping a respected leader of the armband, upsets the dressing room. Takers decide
   who steps up for penalties, free kicks and corners; the best available player takes them otherwise. */
import { squadOf } from './index';
import type { SetPieceTakers } from './live';
import type { GameState, Player } from './types';

const firstTeam = (s: GameState, clubId: string) => squadOf(s, clubId).filter((p) => p.squad === 'First team');
const lead = (p: Player) => p.attributes.Leadership ?? 10;

/** A club's captain: the player wearing the armband, else its best leader. */
export function captainOf(s: GameState, clubId: string): Player | undefined {
  const ft = firstTeam(s, clubId);
  return ft.find((p) => p.captain) ?? ft.slice().sort((a, b) => lead(b) - lead(a) || b.age - a.age)[0];
}

const down = (m: Player['morale']): Player['morale'] => (m === 'high' ? 'ok' : 'low');

/** Gives the armband to a player. Returns what the dressing room made of it. */
export function setCaptain(s: GameState, playerId: string): string {
  const p = s.players[playerId];
  if (!p || p.clubId !== s.userClubId) return '';
  const old = firstTeam(s, s.userClubId).find((x) => x.captain);
  if (old?.id === p.id) return `${p.name} is already captain.`;
  for (const x of firstTeam(s, s.userClubId)) x.captain = false;
  p.captain = true;
  p.morale = 'high';
  const notes = [`${p.name} is the new captain.`];
  if (old && lead(old) >= 14) { old.morale = 'low'; notes.push(`${old.name} is hurt to lose the armband.`); }
  else if (old) notes.push(`${old.name} takes it well.`);
  if (lead(p) < 12 || p.age < 22) {
    const seniors = firstTeam(s, s.userClubId).filter((x) => x.id !== p.id && x.id !== old?.id && x.age >= 28).sort((a, b) => b.value - a.value).slice(0, 2);
    for (const x of seniors) x.morale = down(x.morale);
    if (seniors.length) notes.push(`Senior players question the choice: ${seniors.map((x) => x.name).join(' and ')} are unhappy.`);
  }
  return notes.join(' ');
}

/** Picks (or clears, with no player) your taker for a set piece. */
export function setTaker(s: GameState, kind: keyof SetPieceTakers, playerId?: string) {
  const t = (s.setPieces ??= {});
  if (playerId && s.players[playerId]?.clubId === s.userClubId) t[kind] = playerId; else delete t[kind];
}

/** Your takers, dropping any who have left. */
export function takersOf(s: GameState): SetPieceTakers {
  const t = { ...(s.setPieces ?? {}) };
  for (const k of Object.keys(t) as Array<keyof SetPieceTakers>) if (s.players[t[k]!]?.clubId !== s.userClubId) delete t[k];
  return t;
}
