/* Press conferences after some matches, and players asking to leave when they're unhappy and not playing.
   Both arrive in the inbox as a question with answers; each answer has a consequence. */
import { career } from './career';
import { squadOf } from './index';
import { createRng, type Rng } from './rng';
import type { Fixture, GameState, InboxMessage, Player } from './types';

export interface Choice {
  kind: 'press' | 'request';
  question: string;
  options: string[];
  playerId?: string;
  answered?: number;
}
export interface PlayerPromise { playerId: string; apps: number; byWeek: number }

function ask(s: GameState, m: Pick<InboxMessage, 'category' | 'from' | 'subject' | 'body'> & { playerId?: string; choice?: Choice; date?: string }) {
  s.inbox.unshift({ id: `m${s.nextId++}`, date: m.date ?? s.calendar[Math.min(s.matchday, s.calendar.length) - 1]?.date ?? '', unread: true, ...m });
  if (s.inbox.length > 80) s.inbox.length = 80;
}

const firstTeam = (s: GameState) => squadOf(s, s.userClubId).filter((p) => p.squad === 'First team');
const nudge = (p: Player, up: boolean) => { p.morale = up ? (p.morale === 'low' ? 'ok' : 'high') : (p.morale === 'high' ? 'ok' : 'low'); };

/** After your match: sometimes the press want a word (always after a heavy defeat or a big win). */
export function pressAfterMatch(s: GameState, rng: Rng, f: Fixture) {
  const r = f.result;
  if (!r) return;
  const home = f.homeId === s.userClubId;
  const gf = home ? r.score[0] : r.score[1], ga = home ? r.score[1] : r.score[0];
  const big = Math.abs(gf - ga) >= 3;
  if (!big && !rng.chance(0.18)) return;
  const opp = s.clubs[home ? f.awayId : f.homeId].name;
  const mine = home ? r.ratings.home : r.ratings.away;
  const star = mine.slice().sort((a, b) => b.rating - a.rating)[0];
  const starName = star ? s.players[star.playerId]?.name : undefined;
  if (gf < ga) {
    ask(s, { category: 'media', from: 'Press conference', subject: `Press: “Is the pressure getting to you?” (${gf}–${ga} v ${opp})`,
      body: [`After the ${gf}–${ga} defeat to ${opp}, a reporter asks whether the pressure is getting to you and the squad.`],
      choice: { kind: 'press', question: 'pressure', options: ['“I take full responsibility.”', '“The players let themselves down today.”', '“We’ll bounce back, I trust this group.”'] } });
  } else if (gf > ga) {
    ask(s, { category: 'media', from: 'Press conference', subject: `Press: “What made the difference?” (${gf}–${ga} v ${opp})`,
      body: [`After beating ${opp} ${gf}–${ga}, you're asked what made the difference.`], playerId: star?.playerId,
      choice: { kind: 'press', question: 'win', playerId: star?.playerId, options: [starName ? `“${starName} was outstanding.”` : '“One player stood out.”', '“The whole team was brilliant.”', '“We can play much better than that.”'] } });
  } else {
    ask(s, { category: 'media', from: 'Press conference', subject: `Press: “A fair result?” (${gf}–${ga} v ${opp})`,
      body: [`After the ${gf}–${ga} draw with ${opp}, you're asked whether it was a fair result.`],
      choice: { kind: 'press', question: 'draw', options: ['“We deserved to win.”', '“A fair point.”', '“Not good enough from us.”'] } });
  }
}

/** Weekly: an unhappy regular who isn't playing asks to leave (once a season). Also checks promises. */
export function weeklyMood(s: GameState, rng: Rng, week: number) {
  const ft = firstTeam(s);
  const games = Math.max(...ft.map((p) => p.current.apps), 0);
  // promises of more games: kept or broken
  for (const pr of [...(s.promises ?? [])]) {
    const p = s.players[pr.playerId];
    if (!p || p.clubId !== s.userClubId) { s.promises = s.promises!.filter((x) => x !== pr); continue; }
    if (week < pr.byWeek) continue;
    s.promises = s.promises!.filter((x) => x !== pr);
    if (p.current.apps - pr.apps >= 3) {
      nudge(p, true);
      ask(s, { category: 'media', from: p.name, subject: `${p.name} is happy again`, body: [`You kept your promise: ${p.name} has been playing and is settled.`], playerId: p.id });
    } else {
      p.morale = 'low';
      if (!s.transferListed.includes(p.id)) s.transferListed.push(p.id);
      for (const q of ft.filter((x) => x.id !== p.id && rng.chance(0.15))) nudge(q, false);
      ask(s, { category: 'media', from: p.name, subject: `${p.name}: “You broke your promise”`, body: [`${p.name} hasn't played as promised. He has gone public, and the club has put him on the transfer list. Some of his team-mates side with him.`], playerId: p.id });
    }
  }
  if (games < 6) return;
  const asked = new Set((s.inbox ?? []).filter((m) => m.choice?.kind === 'request' && m.choice.question === 'leave').map((m) => m.choice!.playerId));
  const ranked = ft.slice().sort((a, b) => b.ability - a.ability);
  const unhappy = ranked.slice(0, 16).filter((p) => p.morale === 'low' && p.current.apps < games * 0.35 && !p.loan && !asked.has(p.id) && !s.transferListed.includes(p.id) && !(s.promises ?? []).some((x) => x.playerId === p.id));
  if (!unhappy.length || !rng.chance(0.35)) return;
  const p = unhappy[0];
  ask(s, { category: 'transfers', from: p.name, subject: `${p.name} asks to leave`, playerId: p.id,
    body: [`${p.name} has started only ${p.current.apps} of ${games} matches and wants to talk about his future. He feels he should be playing, or moving on.`],
    choice: { kind: 'request', question: 'leave', playerId: p.id, options: ['Promise him more games', 'Agree and put him on the transfer list', 'Tell him to fight for his place'] } });
}

/** Answers a press question or a player's request. Returns a line describing what happened. */
export function answer(s: GameState, messageId: string, option: number): string | null {
  const m = s.inbox.find((x) => x.id === messageId);
  const c = m?.choice;
  if (!m || !c || c.answered !== undefined || !c.options[option]) return null;
  c.answered = option;
  const ft = firstTeam(s);
  const rng = createRng((s.rngState ^ (s.nextId++ * 2246822519)) >>> 0);
  let outcome = '';
  if (c.kind === 'press') {
    if (c.question === 'pressure') {
      if (option === 0) { career(s).trust = Math.min(100, career(s).trust + 3); outcome = 'The board appreciates you taking responsibility.'; }
      if (option === 1) { for (const p of ft) if (rng.next() < 0.5) nudge(p, false); outcome = 'Some of the players took that personally. Morale has dipped.'; }
      if (option === 2) { for (const p of ft) if (p.morale === 'low') nudge(p, true); outcome = 'The squad appreciates your backing.'; }
    } else if (c.question === 'win') {
      const star = c.playerId ? s.players[c.playerId] : undefined;
      if (option === 0 && star) { star.morale = 'high'; outcome = `${star.name} is delighted with the praise.`; }
      if (option === 1) { for (const p of ft.slice(0, 11)) if (p.morale === 'low') nudge(p, true); outcome = 'The players enjoy the shared credit.'; }
      if (option === 2) { for (const p of ft) if (p.morale === 'high' && rng.next() < 0.4) nudge(p, false); career(s).trust = Math.min(100, career(s).trust + 1); outcome = 'Your standards impress the board; a few players feel undervalued.'; }
    } else {
      if (option === 0) { for (const p of ft) if (p.morale === 'low' && rng.next() < 0.5) nudge(p, true); outcome = 'The players like your belief in them.'; }
      if (option === 1) outcome = 'A measured answer. Nothing changes.';
      if (option === 2) { for (const p of ft) if (p.morale === 'high' && rng.next() < 0.3) nudge(p, false); outcome = 'The message is received. A few players are stung.'; }
    }
  } else if (c.question === 'leave' && c.playerId) {
    const p = s.players[c.playerId];
    if (p) {
      if (option === 0) { p.morale = 'ok'; (s.promises ??= []).push({ playerId: p.id, apps: p.current.apps, byWeek: currentLeagueWeek(s) + 6 }); outcome = `${p.name} accepts. He expects at least three games in the next six weeks.`; }
      if (option === 1) { p.morale = 'ok'; if (!s.transferListed.includes(p.id)) s.transferListed.push(p.id); outcome = `${p.name} is on the transfer list and grateful to you.`; }
      if (option === 2) { p.morale = 'low'; for (const q of ft.filter((x) => x.id !== p.id && rng.next() < 0.1)) nudge(q, false); outcome = `${p.name} is unhappy, and some team-mates have noticed.`; }
    }
  }
  m.body = [...m.body, `You answered: ${c.options[option]}`, outcome];
  return outcome;
}

function currentLeagueWeek(s: GameState) { return s.calendar[Math.min(s.matchday, s.calendar.length) - 1]?.week ?? 0; }
