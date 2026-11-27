/* Press conferences before and after your matches: three questions chosen for the moment (the opponent, a derby,
   your form, a player in form, an injury, a transfer rumour, the result, the referee, a young debutant). Each
   answer moves something: the squad’s or one player’s morale, the supporters, the board. You can always send
   your assistant instead. */
import { squadOf } from './index';
import { createRng } from './rng';
import { fansOf } from './fans';
import { formatDate } from './fixtures';
import { dateOf } from './windows';
import type { Fixture, GameState, Morale, Player } from './types';

export interface PressEffect { team?: number; player?: number; fans?: number; board?: number; text: string }
export interface PressOption { text: string; effect: PressEffect }
export interface PressQuestion { id: string; text: string; playerId?: string; options: PressOption[] }
export interface PressConference { fixtureId: string; kind: 'pre' | 'post'; date: string; opp: string; questions: PressQuestion[]; answers: Array<number | null>; done?: boolean; skipped?: boolean }

const up = (m: Morale): Morale => (m === 'low' ? 'ok' : 'high');
const down = (m: Morale): Morale => (m === 'high' ? 'ok' : 'low');
const firstTeam = (s: GameState) => squadOf(s, s.userClubId).filter((p) => p.squad === 'First team');
const sur = (p: Player) => p.name.split(' ').slice(-1)[0];
function hash(t: string) { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

function recentForm(s: GameState) {
  const us = s.userClubId;
  return s.fixtures.filter((f) => f.result && f.comp !== 'friendly' && (f.homeId === us || f.awayId === us)).sort((a, b) => a.matchday - b.matchday).slice(-5).map((f) => {
    const [h, a] = f.result!.score, home = f.homeId === us, gf = home ? h : a, ga = home ? a : h;
    return f.result!.winnerId ? (f.result!.winnerId === us ? 'W' : 'L') : gf > ga ? 'W' : gf < ga ? 'L' : 'D';
  });
}
const avg = (p: Player) => (p.current.apps ? p.current.ratingSum / p.current.apps : 0);

/** The pre-match conference for your next fixture. `derby` is its name, if a derby; `oddsWin` your chance in %. */
export function preMatchConference(s: GameState, f: Fixture, derby: string | undefined, oddsWin: number): PressConference {
  const us = s.userClubId, opp = s.clubs[f.homeId === us ? f.awayId : f.homeId];
  const ft = firstTeam(s), form = recentForm(s);
  const qs: PressQuestion[] = [];
  if (derby) qs.push({ id: 'derby', text: `It’s the ${derby}. What does this one mean to you?`, options: [
    { text: '“Everything. The fans deserve a win and we’ll give everything for it.”', effect: { fans: 3, team: 0.3, text: 'The supporters love it; the players are fired up.' } },
    { text: '“It’s three points, like any other game.”', effect: { fans: -2, text: 'A calm answer, but the supporters wanted more passion.' } },
    { text: '“They’re the ones who should be nervous.”', effect: { fans: 2, team: 0.2, board: -1, text: 'A headline-grabber: the fans enjoy it, the board would rather you kept quiet.' } }] });
  else if (oddsWin >= 55) qs.push({ id: 'fav', text: `You’re clear favourites against ${opp.name}. Any danger of complacency?`, options: [
    { text: '“None. We respect every opponent.”', effect: { team: 0.15, text: 'A sensible message to the squad.' } },
    { text: '“We expect to win, and we’ll show why.”', effect: { fans: 2, team: 0.2, text: 'Confidence the fans share.' } },
    { text: '“If anyone takes this lightly, they won’t play.”', effect: { team: -0.15, board: 1, text: 'The board likes the standards; a few players feel the pressure.' } }] });
  else qs.push({ id: 'dog', text: `${opp.name} are favourites. Can you get something from this game?`, options: [
    { text: '“All the pressure is on them. We’ll enjoy it.”', effect: { team: 0.25, text: 'The players relax and look forward to it.' } },
    { text: '“A point would be a good result.”', effect: { fans: -1, text: 'Realistic, but the supporters hoped for more ambition.' } },
    { text: '“We’re going there to win.”', effect: { fans: 2, team: 0.1, text: 'Bold words the supporters like.' } }] });
  if (form.length >= 4 && form.slice(-3).filter((x) => x === 'L').length >= 2) qs.push({ id: 'job', text: 'Results have been poor. Is your job under threat?', options: [
    { text: '“I have full confidence in what we’re building.”', effect: { board: 1, fans: 1, text: 'Calm under pressure.' } },
    { text: '“I’m responsible. It’s on me to turn it around.”', effect: { board: 2, team: 0.1, text: 'The board respects you owning it.' } },
    { text: '“Some players need to look at themselves.”', effect: { team: -0.35, board: 1, text: 'The squad took that badly.' } }] });
  const inForm = ft.filter((p) => p.current.apps >= 4 && avg(p) >= 7.1).sort((a, b) => avg(b) - avg(a))[0];
  if (inForm) qs.push({ id: 'star', playerId: inForm.id, text: `${inForm.name} is in great form. What’s his secret?`, options: [
    { text: `“${sur(inForm)} is the best in the league in his position right now.”`, effect: { player: 1, text: `${sur(inForm)} is delighted.` } },
    { text: '“He’s working hard, like the whole squad.”', effect: { team: 0.15, text: 'Credit shared around the dressing room.' } },
    { text: '“He can do even better.”', effect: { player: -1, board: 1, text: `${sur(inForm)} wanted more praise than that.` } }] });
  const rumour = (s.rumours ?? []).find((r) => r.fromId === us && s.players[r.playerId]?.clubId === us);
  if (rumour) { const p = s.players[rumour.playerId]; qs.push({ id: 'rumour', playerId: p.id, text: `${s.clubs[rumour.toId]?.name} are said to want ${p.name}. Is he for sale?`, options: [
    { text: '“He’s not for sale. End of story.”', effect: { player: 1, fans: 2, text: `${sur(p)} feels wanted, and the supporters cheer.` } },
    { text: '“Every player has a price.”', effect: { player: -1, fans: -2, board: 1, text: `${sur(p)} is unsettled; the board likes the business sense.` } },
    { text: '“I don’t talk about other clubs’ interest.”', effect: { text: 'A straight bat. Nothing changes.' } }] }); }
  const hurt = ft.filter((p) => p.injuredFor > 0).sort((a, b) => b.ability - a.ability)[0];
  if (hurt && qs.length < 3) qs.push({ id: 'injury', playerId: hurt.id, text: `How big a blow is losing ${hurt.name}?`, options: [
    { text: '“Huge. He’s one of our most important players.”', effect: { player: 1, team: -0.1, text: `${sur(hurt)} appreciates it; the others notice.` } },
    { text: '“Others will step up. That’s what a squad is for.”', effect: { team: 0.2, text: 'The fringe players are encouraged.' } }] });
  if (qs.length < 3) qs.push({ id: 'aims', text: 'What are your aims for the rest of the season?', options: [
    { text: '“To meet the board’s target, and beat it if we can.”', effect: { board: 1, text: 'Exactly what the board wanted to hear.' } },
    { text: '“To win every game. Nothing less.”', effect: { fans: 2, board: -1, text: 'The supporters love it; the board worries about expectations.' } },
    { text: '“One game at a time.”', effect: { text: 'Nothing to report.' } }] });
  return { fixtureId: f.id, kind: 'pre', date: dateOf(s), opp: opp.name, questions: qs.slice(0, 3), answers: [null, null, null].slice(0, Math.min(3, qs.length)) };
}

/** The post-match conference after your match. */
export function postMatchConference(s: GameState, f: Fixture): PressConference | undefined {
  const r = f.result;
  if (!r) return undefined;
  const us = s.userClubId, home = f.homeId === us, opp = s.clubs[home ? f.awayId : f.homeId];
  const gf = home ? r.score[0] : r.score[1], ga = home ? r.score[1] : r.score[0];
  const won = r.winnerId ? r.winnerId === us : gf > ga, lost = r.winnerId ? r.winnerId !== us : gf < ga;
  const mine = home ? r.ratings.home : r.ratings.away;
  const qs: PressQuestion[] = [];
  if (lost) qs.push({ id: 'loss', text: `${gf}–${ga}. What went wrong?`, options: [
    { text: '“I take full responsibility.”', effect: { board: 2, text: 'The board appreciates you taking responsibility.' } },
    { text: '“The players let themselves down today.”', effect: { team: -0.4, board: 1, text: 'Some of the players took that personally.' } },
    { text: '“We’ll bounce back. I trust this group.”', effect: { team: 0.3, text: 'The squad appreciates your backing.' } }] });
  else if (won) qs.push({ id: 'win', text: `${gf}–${ga}. What made the difference?`, options: [
    { text: '“The whole team was brilliant.”', effect: { team: 0.3, text: 'The players enjoy the shared credit.' } },
    { text: '“The supporters carried us.”', effect: { fans: 3, text: 'The stands lap it up.' } },
    { text: '“We can play much better than that.”', effect: { team: -0.15, board: 1, text: 'Your standards impress the board; a few players feel undervalued.' } }] });
  else qs.push({ id: 'draw', text: `${gf}–${ga}. A fair result?`, options: [
    { text: '“We deserved to win.”', effect: { team: 0.2, text: 'The players like your belief in them.' } },
    { text: '“A fair point.”', effect: { text: 'A measured answer.' } },
    { text: '“Not good enough from us.”', effect: { team: -0.2, board: 1, text: 'The message is received. A few players are stung.' } }] });
  const best = mine.filter((x) => x.minutes >= 45).sort((a, b) => b.rating - a.rating)[0];
  const bp = best && s.players[best.playerId];
  if (bp && best.rating >= 7.3) qs.push({ id: 'motm', playerId: bp.id, text: `${bp.name} was outstanding. Your thoughts?`, options: [
    { text: `“${sur(bp)} was magnificent today.”`, effect: { player: 1, text: `${sur(bp)} is delighted with the praise.` } },
    { text: '“He did his job, like everyone.”', effect: { team: 0.1, player: -1, text: 'Credit shared; he hoped for a mention.' } }] });
  const red = r.events.some((e) => e.type === 'red' && e.side === (home ? 'home' : 'away'));
  const penAgainst = r.events.some((e) => e.type === 'penalty' && e.side === (home ? 'away' : 'home'));
  if (red || penAgainst) qs.push({ id: 'ref', text: `Do you have any complaints about the ${red ? 'red card' : 'penalty'}?`, options: [
    { text: '“It was a disgraceful decision.”', effect: { fans: 2, board: -2, text: 'The supporters agree; the board winces at the likely fine.' } },
    { text: '“I’ll need to see it again.”', effect: { text: 'Diplomatic.' } },
    { text: '“No complaints. We have to be better.”', effect: { board: 1, team: -0.1, text: 'The board appreciates the restraint.' } }] });
  const kid = mine.filter((x) => x.minutes > 0 && (s.players[x.playerId]?.age ?? 99) <= 19).map((x) => s.players[x.playerId]).find(Boolean);
  if (kid && qs.length < 3) qs.push({ id: 'kid', playerId: kid.id, text: `${kid.name} is only ${kid.age}. How far can he go?`, options: [
    { text: '“All the way. He has a huge future.”', effect: { player: 1, fans: 1, text: `${sur(kid)} grows an inch taller.` } },
    { text: '“Let’s not put pressure on him.”', effect: { text: 'Sensible.' } }] });
  return { fixtureId: f.id, kind: 'post', date: dateOf(s), opp: opp.name, questions: qs.slice(0, 3), answers: qs.slice(0, 3).map(() => null) };
}

/** Answers one question; returns what happened. */
export function answerPress(s: GameState, qIndex: number, option: number): string | null {
  const c = s.press;
  if (!c || c.done || c.answers[qIndex] !== null || !c.questions[qIndex]?.options[option]) return null;
  c.answers[qIndex] = option;
  const q = c.questions[qIndex], e = q.options[option].effect;
  const seed = hash(c.fixtureId + c.kind + qIndex + ':' + option);
  const rng = createRng(seed);
  if (e.team) for (const p of firstTeam(s)) if (rng.chance(Math.abs(e.team))) p.morale = e.team > 0 ? up(p.morale) : down(p.morale);
  if (e.player && q.playerId && s.players[q.playerId]) { const p = s.players[q.playerId]; p.morale = e.player > 0 ? (p.morale === 'low' ? 'ok' : 'high') : down(p.morale); }
  if (e.fans) { const f = fansOf(s); f.mood = Math.max(0, Math.min(100, f.mood + e.fans)); }
  if (e.board && s.career) s.career.trust = Math.max(0, Math.min(100, s.career.trust + e.board));
  if (c.answers.every((a) => a !== null)) c.done = true;
  return e.text;
}

/** Send your assistant instead: no effect on the squad, but the supporters and board like to hear from you. */
export function skipPress(s: GameState) {
  const c = s.press;
  if (!c || c.done) return;
  c.done = true; c.skipped = true;
  if (c.kind === 'pre') { const f = fansOf(s); f.mood = Math.max(0, f.mood - 0.5); }
}

/** A conference waiting for you (not yet faced). */
export const pendingPress = (s: GameState) => (s.press && !s.press.done ? s.press : undefined);
export const pressTitle = (c: PressConference) => `${c.kind === 'pre' ? 'Pre-match' : 'Post-match'} press conference · ${c.opp} · ${formatDate(c.date)}`;
