/* Talking to players: one-to-one chats (praise, criticism, a warning, his playing time, how he's feeling) and team
   meetings. How a player takes it depends on whether it's fair (his form), his character (determination,
   professionalism, temperament) and his standing; the squad's response to a meeting depends on recent results and
   on what you say. Each player can be spoken to once every two weeks, the squad once every two weeks. */
import { squadOf } from './index';
import { createRng } from './rng';
import { squadMoods } from './dynamics';
import { leagueTableOf } from './competitions';
import { dateOf } from './windows';
import { currentLeagueWeek } from './media';
import type { GameState, Morale, Player } from './types';

export type TalkTopic = 'praise' | 'criticise' | 'warn' | 'reassure' | 'promise' | 'mood';
export type Reaction = 'good' | 'neutral' | 'bad';
export interface TalkRecord { date: string; topic: TalkTopic; reaction: Reaction }

export const TALK_TOPICS: Array<{ id: TalkTopic; label: string; desc: string }> = [
  { id: 'praise', label: 'Praise his form', desc: 'Tell him he has been playing well. Works when it is true; empty praise means little.' },
  { id: 'criticise', label: 'Criticise his form', desc: 'Tell him he must do better. Determined, professional players respond; others sulk.' },
  { id: 'warn', label: 'Warn about discipline', desc: 'Tell him to cut out the cards. Players with a temper may take it badly.' },
  { id: 'reassure', label: 'Reassure him', desc: 'Tell him he is valued and his chance will come. Helps an unsettled player, if he believes you.' },
  { id: 'promise', label: 'Promise more football', desc: 'Lifts him now, but he expects to play in most of the next six weeks\' games. Break it and he will be unhappy.' },
  { id: 'mood', label: 'Ask how he is', desc: 'Find out what is on his mind. No risk.' },
];
export const MEETING_TOPICS: Array<{ id: MeetingTopic; label: string; desc: string }> = [
  { id: 'praise', label: 'Praise the squad', desc: 'After a good run, lifts the dressing room. After a bad one, it sounds hollow.' },
  { id: 'demand', label: 'Demand more', desc: 'After a poor run, a strong dressing room responds. After a good run, it grates.' },
  { id: 'calm', label: 'Take the pressure off', desc: 'Calms nerves. Safe, but rarely inspiring.' },
  { id: 'targets', label: 'Talk about the season', desc: 'Remind them what you are playing for. Works when you are on course.' },
];
export type MeetingTopic = 'praise' | 'demand' | 'calm' | 'targets';

const DAY = 86_400_000;
const days = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / DAY);
const up = (m: Morale): Morale => (m === 'low' ? 'ok' : 'high');
const down = (m: Morale): Morale => (m === 'high' ? 'ok' : 'low');
const rating = (p: Player) => (p.current.apps ? p.current.ratingSum / p.current.apps : 0);

/** Days until this player can be spoken to again (0: now). */
export function talkCooldown(s: GameState, playerId: string) {
  const last = s.talks?.[playerId];
  return last ? Math.max(0, 14 - days(last.date, dateOf(s))) : 0;
}
export function meetingCooldown(s: GameState) {
  return s.meeting ? Math.max(0, 14 - days(s.meeting.date, dateOf(s))) : 0;
}

/** Why a topic can't be raised with him now, or null. */
export function talkBlocked(s: GameState, p: Player, topic: TalkTopic): string | null {
  if (p.clubId !== s.userClubId) return 'Not your player.';
  const cd = talkCooldown(s, p.id);
  if (cd && topic !== 'mood') return `You spoke to him recently: wait ${cd} more ${cd === 1 ? 'day' : 'days'}.`;
  if ((topic === 'praise' || topic === 'criticise') && p.current.apps < 3) return 'He needs a few games this season first.';
  if (topic === 'warn' && p.yellowCards < 3) return 'His discipline has been fine (fewer than three bookings).';
  if (topic === 'promise' && (s.promises ?? []).some((x) => x.playerId === p.id)) return 'You have already promised him more football.';
  return null;
}

/** How he takes it: the reply and the reaction. Updates morale and remembers the talk. */
export function talkTo(s: GameState, playerId: string, topic: TalkTopic): { reaction: Reaction; text: string } {
  const p = s.players[playerId];
  const blocked = talkBlocked(s, p, topic);
  if (blocked) return { reaction: 'neutral', text: blocked };
  const today = dateOf(s);
  const rng = createRng((s.seed ^ (Date.parse(today) / DAY) ^ hash(playerId + topic)) >>> 0);
  const det = p.attributes.Determination ?? 10, prof = p.hidden.professionalism, temper = p.attributes.Aggression ?? 10;
  const r = rating(p);
  const mood = squadMoods(s).find((m) => m.id === p.id);
  const he = p.name.split(' ').slice(-1)[0];
  let reaction: Reaction = 'neutral', text = '';
  switch (topic) {
    case 'praise':
      if (r >= 7) { reaction = 'good'; text = `${he} is delighted: "Thanks, boss. I'll keep it going."`; }
      else if (r >= 6.6) { reaction = rng.chance(0.6) ? 'good' : 'neutral'; text = reaction === 'good' ? `${he} appreciates it.` : `${he} nods: he knows he can do more.`; }
      else { reaction = rng.chance(0.3) ? 'bad' : 'neutral'; text = reaction === 'bad' ? `${he} looks confused: he knows he hasn't played well, and the praise rings hollow.` : `${he} shrugs it off.`; }
      break;
    case 'criticise': {
      const fair = r < 6.7;
      const steel = (det + prof) / 2 + (fair ? 2 : -3);
      const c = Math.max(0.05, Math.min(0.9, (steel - 8) / 10));
      reaction = rng.chance(c) ? 'good' : rng.chance(0.5) ? 'neutral' : 'bad';
      text = reaction === 'good' ? `${he} takes it on board: "You're right. I'll show you."` : reaction === 'neutral' ? `${he} listens in silence.` : fair ? `${he} sulks: he doesn't take criticism well.` : `${he} is furious: he thinks he's been playing well and that you're picking on him.`;
      break;
    }
    case 'warn': {
      const c = Math.max(0.1, Math.min(0.85, 0.75 - (temper - 10) * 0.05 + (prof - 10) * 0.03));
      reaction = rng.chance(c) ? 'good' : rng.chance(0.5) ? 'neutral' : 'bad';
      text = reaction === 'good' ? `${he} accepts it: "I'll keep my head."` : reaction === 'neutral' ? `${he} says he will try.` : `${he} bristles: he thinks referees have it in for him.`;
      break;
    }
    case 'reassure': {
      const unsettled = !!mood && mood.score < 0;
      const c = unsettled ? (mood!.reasons.includes('Not playing enough') ? 0.45 : 0.65) : 0.5;
      reaction = rng.chance(c) ? 'good' : unsettled && rng.chance(0.3) ? 'bad' : 'neutral';
      text = reaction === 'good' ? `${he} feels better: "Good to know where I stand."` : reaction === 'bad' ? `${he} isn't convinced: he wants actions, not words.` : `${he} thanks you, but nothing much changes.`;
      break;
    }
    case 'promise':
      reaction = 'good';
      text = `${he} is pleased and will hold you to it: he expects at least three games in the next six weeks.`;
      (s.promises ??= []).push({ playerId, apps: p.current.apps, byWeek: currentLeagueWeek(s) + 6 });
      break;
    case 'mood':
      text = mood ? `${he} is ${mood.label.toLowerCase()}${mood.reasons.length ? ': ' + mood.reasons.join('; ').toLowerCase() : ''}.` : `${he} says he's fine.`;
      return { reaction: 'neutral', text };
  }
  if (reaction === 'good') p.morale = up(p.morale);
  if (reaction === 'bad') p.morale = down(p.morale);
  (s.talks ??= {})[playerId] = { date: today, topic, reaction };
  return { reaction, text };
}

/** Results in the last five competitive games: wins minus losses. */
function formScore(s: GameState) {
  const us = s.userClubId;
  const fx = s.fixtures.filter((f) => f.result && f.comp !== 'friendly' && (f.homeId === us || f.awayId === us)).sort((a, b) => a.matchday - b.matchday).slice(-5);
  let sc = 0;
  for (const f of fx) {
    const [h, a] = f.result!.score, home = f.homeId === us, gf = home ? h : a, ga = home ? a : h;
    const won = f.result!.winnerId ? f.result!.winnerId === us : gf > ga, lost = f.result!.winnerId ? f.result!.winnerId !== us : gf < ga;
    sc += won ? 1 : lost ? -1 : 0;
  }
  return { sc, n: fx.length };
}

/** A team meeting. Returns how it went and how many players it lifted or upset. */
export function teamMeeting(s: GameState, topic: MeetingTopic, target?: number): { reaction: Reaction; text: string; lifted: number; upset: number } {
  const cd = meetingCooldown(s);
  if (cd) return { reaction: 'neutral', text: `You held a meeting recently: wait ${cd} more ${cd === 1 ? 'day' : 'days'}.`, lifted: 0, upset: 0 };
  const today = dateOf(s);
  const rng = createRng((s.seed ^ (Date.parse(today) / DAY) ^ hash(topic)) >>> 0);
  const { sc, n } = formScore(s);
  const ft = squadOf(s, s.userClubId).filter((p) => p.squad === 'First team');
  const leaders = ft.slice().sort((a, b) => (b.attributes.Leadership ?? 10) - (a.attributes.Leadership ?? 10)).slice(0, 3);
  const strong = leaders.reduce((a, p) => a + (p.attributes.Leadership ?? 10), 0) / Math.max(1, leaders.length) >= 14;
  // chance each player responds well (else neutral, sometimes badly)
  let good = 0.35, bad = 0.08, line = '';
  if (topic === 'praise') {
    if (n >= 3 && sc >= 2) { good = 0.7; bad = 0.02; line = 'The players lap it up after a good run.'; }
    else if (sc <= -1) { good = 0.15; bad = 0.25; line = 'The praise sounds hollow after recent results.'; }
    else line = 'The squad appreciates the words.';
  } else if (topic === 'demand') {
    if (sc <= -1) { good = strong ? 0.6 : 0.4; bad = strong ? 0.08 : 0.2; line = strong ? 'The senior players back you, and the squad responds.' : 'Some respond; others feel got at.'; }
    else if (sc >= 2) { good = 0.15; bad = 0.35; line = 'After a good run, the squad feels it is unfair.'; }
    else { good = 0.35; bad = 0.15; line = 'The message lands with some of them.'; }
  } else if (topic === 'calm') { good = 0.35; bad = 0.03; line = 'The squad relaxes a little.'; }
  else {
    const pos = ourPosition(s, target);
    if (pos && pos.place <= pos.target) { good = 0.55; bad = 0.05; line = 'The squad believes in what you are building.'; }
    else if (pos) { good = 0.25; bad = 0.18; line = 'Talk of targets puts some players under pressure.'; }
    else line = 'The squad listens.';
  }
  let lifted = 0, upset = 0;
  for (const p of ft) {
    if (rng.chance(good)) { if (p.morale !== 'high') lifted++; p.morale = up(p.morale); }
    else if (rng.chance(bad)) { if (p.morale !== 'low') upset++; p.morale = down(p.morale); }
  }
  const reaction: Reaction = lifted >= upset * 2 + 2 ? 'good' : upset > lifted ? 'bad' : 'neutral';
  s.meeting = { date: today, topic, reaction };
  return { reaction, text: `${line} ${lifted} ${lifted === 1 ? 'player' : 'players'} lifted, ${upset} upset.`, lifted, upset };
}

/** Your league position and the board's target (lower is better), if known. */
function ourPosition(s: GameState, target?: number) {
  const league = s.clubs[s.userClubId].league;
  if (!league || !target) return undefined;
  const place = leagueTableOf(s, league).findIndex((r) => r.clubId === s.userClubId) + 1;
  return place ? { place, target } : undefined;
}

function hash(t: string) { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
