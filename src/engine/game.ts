import { formatDate } from './fixtures';
import { available, fitFor, pickLineup, slotsOf, type Formation, type MatchMods } from './match';
import { createLive, runToEnd, toResult, type LiveMatch } from './live';
import { POS_GROUP, abilityFromAttributes, clamp, POSITION_WEIGHTS } from './ratings';
import { createRng } from './rng';
import { makePlayer, makeWorld, valueFor, wageFor, SQUAD_TEMPLATE } from './world';
import type { Club, CompId, Currency, Fixture, GameState, InboxMessage, Player, SeasonRecord, Trophy } from './types';
import { FREE_AGENT, seasonLabel } from './types';
import { aiBids, expireContracts, payInstallments, scoutingTick, WINDOWS } from './transfers';
import { defaultTraining, developStep, effects, trainingWeek } from './training';
import { cupGate, emptyLedger, financeWeek, seasonFinances } from './finance';
import {
  COMPS, LEAGUE_WEEKS, advanceCups, cupResult, currentSlot, currentWeek, divisionName, divisionTable, initialQualifiers, makeCalendar,
  makeLeagueFixtures, promotionsAndRelegations, qualifiers, setupCups, setupPlayoffs, winnerOf, type TableRow,
} from './competitions';

export type { TableRow };
export const DIVISION = 'Premier Division';

export function newGame(opts: { seed: number; userClubId: string; managerName: string; currency: Currency; year?: number }): GameState {
  const year = opts.year ?? 2026;
  const rng = createRng(opts.seed);
  const { clubs, players, nextId } = makeWorld(rng, year);
  const state: GameState = {
    version: 2, seed: opts.seed, rngState: rng.state(), year, matchday: 1, userClubId: opts.userClubId, managerName: opts.managerName, currency: opts.currency,
    clubs, players, fixtures: [], calendar: makeCalendar(year), cups: {}, ccGroups: [], qualified: { cc: [], superCup: ['', ''] },
    inbox: [], history: {}, trophies: {}, lineup: [], formation: '4-3-3', nextId, autoRotate: true,
    manager: { since: year, w: 0, d: 0, l: 0, trophies: [] },
    knowledge: {}, scouting: [], shortlist: [], transferListed: [], bids: [], negotiations: {}, installments: [],
    training: defaultTraining(), ledger: emptyLedger(),
  };
  state.qualified = initialQualifiers(state);
  makeLeagueFixtures(state);
  setupCups(state, rng);
  state.rngState = rng.state();
  state.lineup = pickLineup(squadOf(state, opts.userClubId));
  for (const p of Object.values(players)) p.caStart = p.ability;
  state.ledger.balanceHistory.push(clubs[opts.userClubId].balance);
  const club = clubs[opts.userClubId];
  const target = boardTarget(state, opts.userClubId);
  addMessage(state, { category: 'board', from: 'The board', role: club.name, subject: `Welcome to ${club.name}`, body: [
    `Welcome, ${opts.managerName}. The board is delighted to have you at ${club.stadium}.`,
    `We play in the ${divisionName(club.division)}. Our expectation this season: ${target.text}.`,
    `Your transfer budget is ${Math.round(club.transferBudget / 1e5) / 10}M.`,
    ...(state.qualified.cc.includes(club.id) ? ['We are in the Continental Cup this season: a chance to test ourselves against the best clubs abroad.'] : []),
  ] });
  return state;
}

export function squadOf(state: GameState, clubId: string) { return Object.values(state.players).filter((p) => p.clubId === clubId); }
export function firstTeam(state: GameState, clubId: string) { return squadOf(state, clubId).filter((p) => p.squad === 'First team'); }

export function boardTarget(state: GameState, clubId: string) {
  const club = state.clubs[clubId];
  const d = club.division;
  const rank = Object.values(state.clubs).filter((c) => c.division === d).sort((a, b) => b.reputation - a.reputation).findIndex((c) => c.id === clubId) + 1;
  if (d === 1) {
    const pos = rank <= 2 ? 2 : rank <= 4 ? 4 : rank <= 8 ? 8 : 9;
    return { pos, text: pos <= 2 ? 'a top-two finish and a title challenge' : pos <= 4 ? 'a top-four finish and Continental Cup football' : pos <= 8 ? 'a top-half finish' : 'avoid relegation (finish 9th or higher)' };
  }
  const pos = rank <= 2 ? 2 : rank <= 5 ? 6 : rank <= 9 ? 9 : d === 3 ? 12 : 9;
  return { pos, text: pos <= 2 ? 'promotion (a top-two finish)' : pos <= 6 ? 'a play-off place (top six)' : d === 3 && pos === 12 ? 'build for the future (no relegation from League One)' : 'avoid relegation (finish 9th or higher)' };
}

function addMessage(state: GameState, m: Omit<InboxMessage, 'id' | 'date' | 'unread'> & { date?: string }) {
  const date = m.date ?? currentDate(state);
  state.inbox.unshift({ ...m, id: `m${state.nextId++}`, date, unread: true });
  if (state.inbox.length > 80) state.inbox.length = 80;
}

export function currentDate(state: GameState) {
  const slot = state.calendar[Math.min(state.matchday, state.calendar.length) - 1];
  return formatDate(slot.date);
}

export const totalMatchdays = (state: GameState) => state.calendar.length;
export const seasonOver = (state: GameState) => state.matchday > totalMatchdays(state);
const involves = (f: Fixture, id: string) => f.homeId === id || f.awayId === id;

export function userFixture(state: GameState, matchday = state.matchday) {
  return state.fixtures.find((f) => f.matchday === matchday && involves(f, state.userClubId));
}
/** Next fixture for the user's club from the current slot on. */
export function nextUserFixture(state: GameState) {
  return state.fixtures.filter((f) => !f.result && f.matchday >= state.matchday && involves(f, state.userClubId)).sort((a, b) => a.matchday - b.matchday)[0];
}
export const compName = (c: CompId) => COMPS[c].name;

/** The user's chosen XI with only unavailable or departed players replaced, slot by slot. This is what gets saved. */
export function repairLineup(state: GameState): string[] {
  const id = state.userClubId;
  const squad = squadOf(state, id);
  if (state.lineup.length !== 11) return pickLineup(squad, state.formation);
  const slots = slotsOf(state.formation);
  const ok = (x: string) => !!state.players[x] && state.players[x].clubId === id && state.players[x].squad === 'First team' && available(state.players[x]);
  const used = new Set(state.lineup.filter(ok));
  return state.lineup.map((pid, i) => {
    if (ok(pid)) return pid;
    const rep = squad.filter((x) => x.squad === 'First team' && available(x) && !used.has(x.id)).sort((a, b) => b.ability * fitFor(b, slots[i]) - a.ability * fitFor(a, slots[i]))[0];
    if (!rep) return pid;
    used.add(rep.id);
    return rep.id;
  });
}

/** The XI for the next match: the repaired lineup, with tired starters rested if rotation is on. Never saved. */
export function userLineup(state: GameState): string[] {
  const id = state.userClubId;
  const squad = squadOf(state, id);
  let ids = repairLineup(state);
  if (state.autoRotate !== false) {
    const slots = slotsOf(state.formation);
    const used = new Set(ids);
    ids = ids.map((pid, i) => {
      const p = state.players[pid];
      if (!p || (p.condition ?? 100) >= 70) return pid;
      const rep = squad.filter((x) => x.squad === 'First team' && available(x) && !used.has(x.id) && (x.condition ?? 100) >= 85)
        .sort((a, b) => b.ability * fitFor(b, slots[i]) - a.ability * fitFor(a, slots[i]))[0];
      if (rep && rep.ability * fitFor(rep, slots[i]) >= p.ability * fitFor(p, slots[i]) * 0.8) { used.delete(pid); used.add(rep.id); return rep.id; }
      return pid;
    });
  }
  return ids;
}

function xiFor(state: GameState, clubId: string): Player[] {
  if (clubId === state.userClubId) return userLineup(state).map((id) => state.players[id]);
  return pickLineup(squadOf(state, clubId)).map((id) => state.players[id]);
}

function benchFor(state: GameState, clubId: string, xi: Player[]) {
  const ids = new Set(xi.map((p) => p.id));
  return firstTeam(state, clubId).filter((p) => !ids.has(p.id) && available(p)).sort((a, b) => b.ability - a.ability).slice(0, clubId === state.userClubId ? 12 : 9);
}

function setupFor(state: GameState, f: Fixture) {
  const te = effects(state.training);
  const uh = f.homeId === state.userClubId, ua = f.awayId === state.userClubId;
  const hx = xiFor(state, f.homeId), ax = xiFor(state, f.awayId);
  const H = state.clubs[f.homeId], A = state.clubs[f.awayId];
  const mods: MatchMods = { homeBoost: uh ? te.matchBoost : 1, awayBoost: ua ? te.matchBoost : 1, homeInjury: uh ? te.injury : 1, awayInjury: ua ? te.injury : 1, neutral: f.neutral, knockout: f.ko };
  return {
    home: { xi: hx, bench: benchFor(state, f.homeId, hx), formation: (uh ? state.formation : '4-3-3') as Formation, name: H.name, user: uh },
    away: { xi: ax, bench: benchFor(state, f.awayId, ax), formation: (ua ? state.formation : '4-3-3') as Formation, name: A.name, user: ua },
    venue: H.stadium, mods,
  };
}

/** The user's match in the current slot, ready to be played live (does not change the game state). */
export function startUserMatch(state: GameState): LiveMatch | undefined {
  const f = userFixture(state);
  if (!f) return undefined;
  const s = setupFor(state, f);
  return createLive((state.rngState ^ (state.matchday * 7919) ^ 0x5bd1e995) >>> 0, s.home, s.away, s.venue, s.mods);
}

/** Condition regained per day off: natural fitness helps, age and hard training slow it. */
export function recoveryPerDay(state: GameState, p: Player) {
  const base = 5.5 + (p.attributes['Natural Fitness'] - 10) * 0.35 - Math.max(0, p.age - 30) * 0.3;
  const intensity = p.clubId === state.userClubId ? (state.training.intensity === 'high' ? -1.2 : state.training.intensity === 'low' ? 1.2 : 0) : 0;
  return Math.max(2.5, base + intensity);
}

/** Keeps full match detail only for the user's games so saves stay small. */
function slim(f: Fixture) {
  if (!f.result) return;
  f.result = { score: f.result.score, pens: f.result.pens, winnerId: f.result.winnerId, events: f.result.events.filter((e) => e.type === 'goal' || e.type === 'penalty' || e.type === 'red' || e.type === 'owngoal').map((e) => ({ ...e, text: '' })),
    stats: f.result.stats, ratings: { home: [], away: [] } };
}

/** Plays every fixture in the current calendar slot. Returns the user's fixture (with result), if any. */
/** Plays every fixture in the current calendar slot. Pass the user's live match to use its result (with their substitutions). */
export function playMatchday(state: GameState, live?: { fixtureId: string; lm: LiveMatch }): Fixture | undefined {
  if (seasonOver(state)) return undefined;
  const rng = createRng(state.rngState ^ (state.matchday * 7919));
  const md = state.matchday;
  const slot = currentSlot(state);
  const leagueWeek = slot.entries.some((e) => e.comp === 'D1');
  const te = effects(state.training);
  const homeIds = new Set<string>();
  const positions: Record<string, number> = {};
  for (const d of [1, 2, 3]) divisionTable(state, d).forEach((r, i) => { positions[r.clubId] = i + 1; });
  for (const f of state.fixtures.filter((x) => x.matchday === md && !x.result)) {
    const uh = f.homeId === state.userClubId, ua = f.awayId === state.userClubId;
    let lm: LiveMatch;
    if (live && live.fixtureId === f.id) lm = structuredClone(live.lm);
    else { const st = setupFor(state, f); lm = createLive(rng.int(0, 2 ** 31 - 1), st.home, st.away, st.venue, st.mods); }
    if (uh || ua) state.lineup = repairLineup(state);
    runToEnd(lm);
    const { result, conditions } = toResult(lm, f.homeId, f.awayId);
    f.result = result;
    if (f.ko) result.winnerId = winnerOf(f);
    for (const [id, c] of Object.entries(conditions)) if (state.players[id]) state.players[id].condition = c;
    applyResult(state, f, rng);
    if (f.comp.startsWith('D')) homeIds.add(f.homeId); else cupGate(state, f);
    if (!uh && !ua) slim(f);
  }
  const days = state.calendar[md] ? Math.round((Date.parse(state.calendar[md].date) - Date.parse(slot.date)) / 86400000) : 30;
  for (const p of Object.values(state.players)) {
    if (p.injuredFor > 0) p.injuredFor--;
    if (p.suspendedFor > 0) p.suspendedFor--;
    if ((p.condition ?? 100) < 100) p.condition = Math.min(100, Math.round((p.condition ?? 100) + days * recoveryPerDay(state, p)));
  }
  const cupNews = advanceCups(state, rng, slot);
  if (leagueWeek) {
    financeWeek(state, homeIds, positions);
    for (const msg of trainingWeek(rng, state, squadOf(state, state.userClubId))) addMessage(state, { category: 'training', from: 'Head coach', role: 'Training ground', subject: 'Training update', body: [msg] });
    if (slot.week % 4 === 0) {
      for (const p of Object.values(state.players)) {
        if (p.clubId === FREE_AGENT) continue;
        const mine = p.clubId === state.userClubId;
        developStep(rng, p, 0.12, mine ? te.development : 1, mine ? state.training.focus[p.id] : undefined);
      }
    }
    if (slot.week === LEAGUE_WEEKS) setupPlayoffs(state);
  }
  state.rngState = rng.state();
  state.matchday++;
  if (leagueWeek) {
    scoutingTick(state);
    payInstallments(state);
    aiBids(state, state.rngState ^ (state.matchday * 104729));
    const week = currentWeek(state);
    if (week === WINDOWS.januaryFrom && slot.week === WINDOWS.januaryFrom - 1) januaryReminder(state);
    if (slot.week === WINDOWS.summerUntil || slot.week === WINDOWS.januaryTo) state.negotiations = {};
  }
  const uf = state.fixtures.find((f) => f.matchday === md && involves(f, state.userClubId));
  if (uf) postMatchMessages(state, uf);
  for (const line of cupNews) if (line.includes(state.clubs[state.userClubId].name) || line.startsWith('Continental')) addMessage(state, { category: 'media', from: 'Football news', subject: line, body: [line] });
  if (seasonOver(state)) seasonEndMessage(state);
  return uf;
}

function applyResult(state: GameState, f: Fixture, rng: ReturnType<typeof createRng>) {
  const r = f.result!;
  for (const pr of [...r.ratings.home, ...r.ratings.away]) {
    const p = state.players[pr.playerId];
    if (!p) continue;
    p.current.apps++; p.current.goals += pr.goals; p.current.assists += pr.assists; p.current.ratingSum += pr.rating;
    if (pr.card === 'yellow') { p.yellowCards++; if (p.yellowCards % 5 === 0) p.suspendedFor = 2; }
    if (pr.card === 'red') p.suspendedFor = 2; // counts down once after this slot → misses 1
    if (pr.injured) p.injuredFor = 1 + rng.int(1, 4) + Math.round(p.hidden.injuryProneness / 8);
    if (pr.rating >= 7.5) p.morale = 'high'; else if (pr.rating < 6) p.morale = p.morale === 'high' ? 'ok' : 'low';
  }
}

function postMatchMessages(state: GameState, f: Fixture) {
  const r = f.result!;
  const userHome = f.homeId === state.userClubId;
  const us = state.clubs[state.userClubId], them = state.clubs[userHome ? f.awayId : f.homeId];
  const gf = userHome ? r.score[0] : r.score[1], ga = userHome ? r.score[1] : r.score[0];
  const won = f.ko ? r.winnerId === us.id : gf > ga;
  const word = f.ko ? (won ? 'win' : 'defeat') : gf > ga ? 'win' : gf < ga ? 'defeat' : 'draw';
  if (gf > ga) state.manager.w++; else if (gf === ga) state.manager.d++; else state.manager.l++;
  const comp = COMPS[f.comp];
  const pens = r.pens ? ` (${userHome ? r.pens[0] : r.pens[1]}\u2013${userHome ? r.pens[1] : r.pens[0]} on penalties)` : '';
  let line2: string;
  if (comp.kind === 'league') {
    const pos = divisionTable(state, us.division).findIndex((t) => t.clubId === us.id) + 1;
    line2 = `They are ${ordinal(pos)} in the ${comp.name} after ${divisionTable(state, us.division)[0].p} matches.`;
  } else if (f.round === 'Final') line2 = won ? `${us.name} win the ${comp.name}!` : `Heartbreak in the ${comp.name} final.`;
  else line2 = won ? `${us.name} are through in the ${comp.name}.` : `${us.name} are out of the ${comp.name} (${f.round.toLowerCase()}).`;
  addMessage(state, { category: 'media', from: `${us.name.split(' ')[0]} Gazette`, subject: `${word === 'win' ? 'Fans celebrate' : word === 'draw' ? 'Honours even in' : 'Frustration after'} ${gf}\u2013${ga}${pens} ${word} ${userHome || f.neutral ? 'against' : 'at'} ${them.name}`,
    body: [`${comp.name}, ${f.round}: ${us.name} ${gf > ga ? 'beat' : gf === ga ? 'drew with' : 'lost to'} ${them.name} ${gf}\u2013${ga}${pens}.`, line2] });
  const mine = userHome ? r.ratings.home : r.ratings.away;
  for (const pr of mine) {
    const p = state.players[pr.playerId];
    if (pr.injured && p.injuredFor > 0) addMessage(state, { category: 'medical', from: 'Medical team', role: 'Head physio', subject: `${p.name}: injured, out ${p.injuredFor} ${p.injuredFor === 1 ? 'match' : 'matches'}`, body: [`${p.name} was hurt against ${them.name} and should miss about ${p.injuredFor} ${p.injuredFor === 1 ? 'match' : 'matches'}.`] });
    if (p.suspendedFor > 0 && (pr.card === 'red' || p.yellowCards % 5 === 0)) addMessage(state, { category: 'match', from: 'League office', subject: `${p.name} suspended for the next match`, body: [pr.card === 'red' ? `${p.name} was sent off and is banned for one match.` : `${p.name} has reached ${p.yellowCards} yellow cards and is banned for one match.`] });
  }
}

function januaryReminder(state: GameState) {
  const expiring = squadOf(state, state.userClubId).filter((p) => p.squad === 'First team' && p.contractEnd <= state.year);
  addMessage(state, { category: 'transfers', from: 'Director of football', subject: 'The January transfer window is open', body: [
    `The window is open until week ${WINDOWS.januaryTo} of the league season.`,
    expiring.length ? `${expiring.length} ${expiring.length === 1 ? 'player\'s contract ends' : 'players\' contracts end'} this summer: ${expiring.map((p) => p.name).join(', ')}. Renew them from their profiles or they will leave for free.` : 'No contracts run out this summer.',
  ] });
}

function seasonEndMessage(state: GameState) {
  const us = state.clubs[state.userClubId];
  const table = divisionTable(state, us.division);
  const pos = table.findIndex((t) => t.clubId === us.id) + 1;
  const target = boardTarget(state, us.id);
  const mv = promotionsAndRelegations(state);
  const up = mv.promoted[us.id], down = mv.relegated[us.id];
  const ok = pos <= target.pos || !!up;
  addMessage(state, { category: 'board', from: 'The board', role: us.name, subject: pos === 1 ? 'Champions! The board is overjoyed' : up ? 'Promoted! The board is delighted' : down ? 'Relegated. A painful day for the club' : ok ? 'Season review: target met' : 'Season review: below expectations',
    body: [`We finished ${ordinal(pos)} in the ${divisionName(us.division)}. The target was ${target.text}.`,
      up ? `Next season we play in the ${divisionName(up)}.` : down ? `Next season we play in the ${divisionName(down)}. The board expects an immediate return.` : ok ? 'The board is pleased with your work.' : 'The board expects improvement next season.',
      'Start the new season from the home screen when you are ready.'] });
}

/** The user's league table (or any division's). */
export function leagueTable(state: GameState, division = state.clubs[state.userClubId].division || 1): TableRow[] {
  return divisionTable(state, division);
}

export function ordinal(n: number) { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

function award(state: GameState, clubId: string | undefined, name: string, tier: Trophy['tier'], label: string) {
  if (!clubId) return;
  const cab = (state.trophies[clubId] ??= []);
  let t = cab.find((x) => x.name === name);
  if (!t) { t = { name, tier, seasons: [] }; cab.push(t); }
  t.seasons.push(label);
  if (clubId === state.userClubId) state.manager.trophies.push(`${name} ${label}`);
}

/** Closes the season: history, trophies, promotion and relegation, careers, ageing, contracts, youth intake, next season's draw. */
export function startNewSeason(state: GameState) {
  if (!seasonOver(state)) throw new Error('Season not finished');
  const rng = createRng(state.rngState ^ 0x9e3779b9);
  const label = seasonLabel(state.year);
  const mv = promotionsAndRelegations(state);
  const tables = { 1: divisionTable(state, 1), 2: divisionTable(state, 2), 3: divisionTable(state, 3) } as const;
  const honours: Record<string, string> = {};
  for (const d of [1, 2, 3] as const) {
    tables[d].forEach((row, i) => {
      const squad = squadOf(state, row.clubId);
      const top = squad.slice().sort((a, b) => b.current.goals - a.current.goals)[0];
      const rec: SeasonRecord = { season: label, division: divisionName(d), pos: i + 1, pts: row.pts, champion: state.clubs[tables[d][0].clubId].name,
        topScorer: top && top.current.goals ? { name: top.name, goals: top.current.goals } : undefined,
        manager: row.clubId === state.userClubId ? state.managerName : 'AI manager', isYou: row.clubId === state.userClubId,
        movement: mv.promoted[row.clubId] ? 'promoted' : mv.relegated[row.clubId] ? 'relegated' : undefined,
        cup: cupResult(state, 'NC', row.clubId), leagueCup: cupResult(state, 'LC', row.clubId), europe: cupResult(state, 'CC', row.clubId) };
      (state.history[row.clubId] ??= []).unshift(rec);
    });
    award(state, mv.champions[d], divisionName(d), 'league', label);
    honours[mv.champions[d]] = divisionName(d);
  }
  award(state, state.cups.NC?.winner, COMPS.NC.name, 'cup', label);
  award(state, state.cups.LC?.winner, COMPS.LC.name, 'cup', label);
  award(state, state.cups.CC?.winner, COMPS.CC.name, 'continental', label);
  award(state, state.cups.SC?.winner, COMPS.SC.name, 'super', label);
  for (const c of ['NC', 'LC', 'CC'] as const) { const w = state.cups[c]?.winner; if (w) honours[w] = honours[w] ? `${honours[w]}, ${COMPS[c].name}` : COMPS[c].name; }

  const money = seasonFinances(state, tables);
  const nextQualified = qualifiers(state);

  for (const p of Object.values(state.players)) {
    if (p.current.apps) p.career.unshift({ season: label, club: state.clubs[p.clubId]?.name ?? 'Free agent', apps: p.current.apps, goals: p.current.goals, rating: Math.round((p.current.ratingSum / p.current.apps) * 100) / 100, honour: honours[p.clubId] });
    if (p.career.length > 12) p.career.length = 12;
    p.current = { apps: 0, goals: 0, assists: 0, ratingSum: 0 };
    p.yellowCards = 0; p.suspendedFor = 0;
  }
  expireContracts(state);
  for (const p of Object.values(state.players)) {
    develop(rng, p, p.career[0]?.apps ?? 0);
    p.age++;
    p.value = valueFor(p.ability, p.potential, p.age);
  }
  for (const b of state.bids) if (b.status === 'open') b.status = 'expired';
  state.negotiations = {};
  for (const p of Object.values(state.players)) {
    if (p.age >= 36 || (p.age >= 33 && p.ability < 80) || (p.clubId === FREE_AGENT && p.age >= 34)) {
      delete state.players[p.id];
      if (p.clubId === state.userClubId) addMessage(state, { category: 'media', from: 'Club media', subject: `${p.name} retires`, body: [`${p.name} has retired after ${p.career.reduce((s, c) => s + c.apps, 0)} appearances.`] });
    }
  }
  // promotion and relegation
  for (const [id, d] of Object.entries(mv.promoted)) { state.clubs[id].division = d; state.clubs[id].reputation = clamp(state.clubs[id].reputation + 4, 20, 95); }
  for (const [id, d] of Object.entries(mv.relegated)) { state.clubs[id].division = d; state.clubs[id].reputation = clamp(state.clubs[id].reputation - 4, 20, 95); }
  const userMove = mv.promoted[state.userClubId] ? 'promoted' : mv.relegated[state.userClubId] ? 'relegated' : undefined;

  state.year++;
  aiTransfers(state, rng);
  pruneFreeAgents(state);
  for (const c of Object.values(state.clubs)) refillSquad(state, rng, c);
  youthIntake(state, rng);
  state.calendar = makeCalendar(state.year);
  state.fixtures = [];
  state.qualified = nextQualified;
  makeLeagueFixtures(state);
  setupCups(state, rng);
  state.matchday = 1;
  state.lineup = pickLineup(squadOf(state, state.userClubId), state.formation);
  state.rngState = rng.state();
  for (const p of Object.values(state.players)) { p.caStart = p.ability; p.progress = {}; p.condition = 95; }
  state.lastLedger = state.ledger;
  state.ledger = emptyLedger();
  state.ledger.balanceHistory.push(state.clubs[state.userClubId].balance);
  const us = state.clubs[state.userClubId];
  const target = boardTarget(state, us.id);
  const m = (n: number) => `${Math.round(n / 1e5) / 10}M`;
  addMessage(state, { category: 'board', from: 'The board', role: us.name, subject: `New season: ${seasonLabel(state.year)} in the ${divisionName(us.division)}`, body: [
    `${userMove === 'promoted' ? 'Welcome to a higher level! ' : userMove === 'relegated' ? 'A new start after relegation. ' : ''}The board's target: ${target.text}.`,
    `Prize money last season: ${m(money.prize)}. Club reputation ${money.repChange > 0 ? 'rose' : money.repChange < 0 ? 'fell' : 'held steady'} (${us.reputation}).`,
    `Your transfer budget is ${m(money.transferBudget)} and the wage budget is ${Math.round(money.wageBudget / 1000)}k a week.`,
    ...(state.qualified.cc.includes(us.id) ? ['We have qualified for the Continental Cup.'] : []),
    ...(money.balance < 0 ? ['The club is in debt. The board has cut the transfer budget and expects you to sell before buying.'] : [])] });
}

/** CA moves toward PA for young players, declines after 30; attributes follow. */
export function develop(rng: ReturnType<typeof createRng>, p: Player, apps: number) {
  let delta: number;
  // Growth is split: most happens in-season (training.ts developStep); this is the summer step.
  if (p.age <= 23) delta = 0.45 * ((p.potential - p.ability) * (0.18 + p.hidden.professionalism / 100 + Math.min(apps, 30) / 150) + rng.normal(0, 3));
  else if (p.age <= 28) delta = 0.45 * ((p.potential - p.ability) * 0.25 + rng.normal(0, 2));
  else if (p.age <= 30) delta = rng.normal(-1, 2);
  else delta = -rng.int(3, 9) - (p.age - 31) * 2;
  const target = clamp(Math.round(p.ability + delta), 20, p.age <= 28 ? p.potential : 200);
  const step = target > p.ability ? 1 : -1;
  const g = POSITION_WEIGHTS[POS_GROUP[p.pos]];
  const physical = ['Pace', 'Acceleration', 'Stamina', 'Agility', 'Natural Fitness'];
  let guard = 0;
  while (abilityFromAttributes(p.attributes, p.pos) !== target && guard++ < 200) {
    const pool = step < 0 && p.age > 30 ? physical.concat(g.key) : g.key.concat(g.imp, ['Decisions', 'Composure']);
    const a = rng.pick(pool);
    const nv = clamp(p.attributes[a] + step, 1, 20);
    if (nv === p.attributes[a]) continue;
    p.attributes[a] = nv;
    const ca = abilityFromAttributes(p.attributes, p.pos);
    if ((step > 0 && ca > target) || (step < 0 && ca < target)) break;
  }
  p.ability = abilityFromAttributes(p.attributes, p.pos);
  if (p.ability > p.potential) p.potential = p.ability;
}

function refillSquad(state: GameState, rng: ReturnType<typeof createRng>, c: Club) {
  const ft = firstTeam(state, c.id);
  const need: Record<string, number> = {};
  for (const pos of SQUAD_TEMPLATE) need[pos] = (need[pos] ?? 0) + 1;
  for (const p of ft) if (need[p.pos]) need[p.pos]--;
  for (const [pos, n] of Object.entries(need)) {
    for (let i = 0; i < n; i++) {
      // AI clubs promote their best youth player at that position first, else sign someone
      const youth = squadOf(state, c.id).filter((p) => p.squad !== 'First team' && p.pos === pos).sort((a, b) => b.ability - a.ability)[0];
      if (youth && c.id !== state.userClubId && youth.age >= 18) { promote(state, youth.id, false); continue; }
      const level = 60 + c.reputation * 1.1;
      const fa = Object.values(state.players).filter((p) => p.clubId === FREE_AGENT && p.pos === pos && p.ability >= level - 25 && p.age <= 33).sort((a, b) => b.ability - a.ability)[0];
      if (fa && c.id !== state.userClubId) {
        Object.assign(fa, { clubId: c.id, number: freeNumber(state, c.id), wage: wageFor(fa.ability, c.reputation), contractEnd: state.year + 2, joined: state.year });
        continue;
      }
      const age = rng.int(22, 29);
      const ca = clamp(Math.round(rng.normal(60 + c.reputation * 1.1, 8)), 60, 185);
      const p = makePlayer(rng, { id: `p${state.nextId++}`, clubId: c.id, pos: pos as Player['pos'], ca, pa: ca + rng.int(0, 10), age, squad: 'First team', number: freeNumber(state, c.id), year: state.year, reputation: c.reputation });
      state.players[p.id] = p;
      if (c.id === state.userClubId) addMessage(state, { category: 'transfers', from: 'Director of football', subject: `${p.name} (${p.pos}) joins on a free transfer`, body: [`To keep the squad at full strength, we have signed ${p.name}, ${p.age}, a ${p.pos}.`] });
    }
  }
}

/**
 * Summer business for computer-run clubs: rich clubs buy better players (releasing their weakest),
 * clubs deep in debt sell their most valuable player abroad. Keeps money moving and squads competitive.
 */
function aiTransfers(state: GameState, rng: ReturnType<typeof createRng>) {
  const abroad = Object.values(state.clubs).filter((c) => c.division === 0);
  for (const c of Object.values(state.clubs)) {
    if (c.id === state.userClubId || c.division === 0) continue;
    const reserve = c.reputation * c.reputation * 5000;
    const ft = firstTeam(state, c.id);
    if (c.balance < -8_000_000 && ft.length > 16) {
      const star = ft.slice().sort((a, b) => b.value - a.value)[0];
      const buyer = rng.pick(abroad);
      c.balance += star.value; c.transferBudget += Math.round(star.value * 0.5);
      Object.assign(star, { clubId: buyer.id, number: freeNumber(state, buyer.id), captain: false, joined: state.year });
      continue;
    }
    let spend = (c.balance - reserve) * 0.5;
    for (let i = 0; i < 2 && spend > 0; i++) {
      const level = 60 + c.reputation * 1.15;
      const weakest = ft.filter((p) => p.clubId === c.id).sort((a, b) => a.ability - b.ability)[0];
      if (!weakest) break;
      const age = rng.int(21, 28);
      const ca = clamp(Math.round(level + rng.int(0, 12)), 60, 190);
      const fee = valueFor(ca, ca + 5, age);
      if (fee > spend) break;
      const p = makePlayer(rng, { id: `p${state.nextId++}`, clubId: c.id, pos: weakest.pos, ca, pa: ca + rng.int(0, 8), age, squad: 'First team', number: weakest.number, year: state.year, reputation: c.reputation });
      p.joined = state.year;
      state.players[p.id] = p;
      Object.assign(weakest, { clubId: FREE_AGENT, captain: false });
      c.balance -= fee; spend -= fee;
    }
  }
}

/** Keeps the free-agent pool to the 120 best players under 31. */
function pruneFreeAgents(state: GameState) {
  const free = Object.values(state.players).filter((p) => p.clubId === FREE_AGENT).sort((a, b) => b.ability - a.ability);
  free.forEach((p, i) => { if (i >= 120 || p.age >= 31) delete state.players[p.id]; });
}

function freeNumber(state: GameState, clubId: string) {
  const used = new Set(squadOf(state, clubId).map((p) => p.number));
  for (let n = 2; n < 99; n++) if (!used.has(n)) return n;
  return 99;
}

function youthIntake(state: GameState, rng: ReturnType<typeof createRng>) {
  for (const c of Object.values(state.clubs)) {
    if (c.division === 0) continue; // foreign clubs only field a first team
    // U21 players who turn 22 leave if not promoted; U18 aged 18+ move up to U21
    for (const p of squadOf(state, c.id)) {
      if (p.squad === 'U18' && p.age >= 18) p.squad = 'U21';
      else if (p.squad === 'U21' && p.age >= 22) delete state.players[p.id];
    }
    const n = rng.int(3, 5);
    const names: string[] = [];
    for (let i = 0; i < n; i++) {
      const pos = rng.pick(['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'AM', 'LW', 'RW', 'ST'] as const);
      const pa = clamp(Math.round(rng.normal(115 + c.reputation * 0.35, 20)), 70, 195);
      const p = makePlayer(rng, { id: `p${state.nextId++}`, clubId: c.id, pos, ca: rng.int(40, 70), pa, age: rng.int(15, 16), squad: 'U18', number: freeNumber(state, c.id), year: state.year, reputation: c.reputation });
      state.players[p.id] = p; names.push(`${p.name} (${p.pos})`);
    }
    if (c.id === state.userClubId) addMessage(state, { category: 'youth', from: 'Head of youth development', subject: 'Youth intake has arrived', body: [`${n} new players join the U18s: ${names.join(', ')}.`, 'Keep an eye on their development in the Academy.'] });
  }
}

/** Youth → first team: professional contract, so stars change from silver to gold. */
export function promote(state: GameState, playerId: string, notify = true) {
  const p = state.players[playerId];
  if (!p || p.squad === 'First team') return;
  p.squad = 'First team'; p.contractType = 'full-time';
  p.wage = wageFor(p.ability, state.clubs[p.clubId].reputation);
  p.contractEnd = state.year + 3;
  if (notify) addMessage(state, { category: 'youth', from: 'Head of youth development', subject: `${p.name} promoted to the first team`, body: [`${p.name} has signed a professional contract until ${seasonLabel(p.contractEnd)} and joins the senior squad.`] });
}

/** Stars compare players with first-teamers in the user's division. */
export function leagueScale(state: GameState) {
  const d = state.clubs[state.userClubId]?.division || 1;
  const cas = Object.values(state.players).filter((p) => p.squad === 'First team' && state.clubs[p.clubId]?.division === d).map((p) => p.ability);
  return { low: Math.min(...cas), high: Math.max(...cas) };
}
export function youthScale() { return { low: 35, high: 140 }; }

export function setAutoRotate(state: GameState, on: boolean) { state.autoRotate = on; }

export function setTactics(state: GameState, formation: Formation, lineup: string[]) {
  state.formation = formation;
  state.lineup = lineup;
}

export function bestLineup(state: GameState, formation: Formation = state.formation) {
  return pickLineup(squadOf(state, state.userClubId), formation);
}

/** Fills fields added after v0.2 so older saves keep working. (v1 saves can't be converted: see store.ts.) */
export function migrate(state: GameState): GameState {
  state.knowledge ??= {}; state.scouting ??= []; state.shortlist ??= []; state.transferListed ??= [];
  state.bids ??= []; state.negotiations ??= {}; state.installments ??= [];
  state.training ??= defaultTraining(); state.ledger ??= emptyLedger(); state.autoRotate ??= true;
  return state;
}

export function markRead(state: GameState, id: string) { const m = state.inbox.find((x) => x.id === id); if (m) m.unread = false; }
