import { makeFixtures, formatDate } from './fixtures';
import { available, pickLineup, simulateMatch, type Formation } from './match';
import { POS_GROUP, abilityFromAttributes, clamp, POSITION_WEIGHTS } from './ratings';
import { createRng } from './rng';
import { makePlayer, makeWorld, valueFor, wageFor, SQUAD_TEMPLATE } from './world';
import type { Club, Currency, Fixture, GameState, InboxMessage, Player, SeasonRecord } from './types';
import { FREE_AGENT, seasonLabel } from './types';
import { aiBids, expireContracts, payInstallments, scoutingTick, WINDOWS } from './transfers';
import { defaultTraining, developStep, effects, trainingWeek } from './training';
import { emptyLedger, financeWeek, seasonFinances } from './finance';

export const DIVISION = 'Premier Division';

export function newGame(opts: { seed: number; userClubId: string; managerName: string; currency: Currency; year?: number }): GameState {
  const year = opts.year ?? 2026;
  const rng = createRng(opts.seed);
  const { clubs, players, nextId } = makeWorld(rng, year);
  const state: GameState = {
    version: 1, seed: opts.seed, rngState: rng.state(), year, matchday: 1, userClubId: opts.userClubId, managerName: opts.managerName, currency: opts.currency,
    clubs, players, fixtures: makeFixtures(Object.keys(clubs), year), inbox: [], history: {}, trophies: {}, lineup: [], formation: '4-3-3', nextId,
    manager: { since: year, w: 0, d: 0, l: 0, trophies: [] },
    knowledge: {}, scouting: [], shortlist: [], transferListed: [], bids: [], negotiations: {}, installments: [],
    training: defaultTraining(), ledger: emptyLedger(),
  };
  state.lineup = pickLineup(squadOf(state, opts.userClubId));
  for (const p of Object.values(players)) p.caStart = p.ability;
  state.ledger.balanceHistory.push(clubs[opts.userClubId].balance);
  const club = clubs[opts.userClubId];
  const target = boardTarget(state, opts.userClubId);
  addMessage(state, { category: 'board', from: 'The board', role: club.name, subject: `Welcome to ${club.name}`, body: [
    `Welcome, ${opts.managerName}. The board is delighted to have you at ${club.stadium}.`,
    `Our expectation this season: ${target.text}. Your transfer budget is ${Math.round(club.transferBudget / 1e5) / 10}M and the wage budget is set at the current wage bill plus 10%.`,
  ] });
  return state;
}

export function squadOf(state: GameState, clubId: string) { return Object.values(state.players).filter((p) => p.clubId === clubId); }
export function firstTeam(state: GameState, clubId: string) { return squadOf(state, clubId).filter((p) => p.squad === 'First team'); }

export function boardTarget(state: GameState, clubId: string) {
  const rank = Object.values(state.clubs).sort((a, b) => b.reputation - a.reputation).findIndex((c) => c.id === clubId) + 1;
  const pos = rank <= 2 ? 2 : rank <= 4 ? 4 : rank <= 8 ? 8 : 10;
  return { pos, text: pos <= 2 ? 'a top-two finish and a title challenge' : pos <= 4 ? 'a top-four finish' : pos <= 8 ? 'a top-half finish' : 'avoid relegation (finish 10th or higher)' };
}

function addMessage(state: GameState, m: Omit<InboxMessage, 'id' | 'date' | 'unread'> & { date?: string }) {
  const date = m.date ?? currentDate(state);
  state.inbox.unshift({ ...m, id: `m${state.nextId++}`, date, unread: true });
  if (state.inbox.length > 60) state.inbox.length = 60;
}

export function currentDate(state: GameState) {
  const f = state.fixtures.find((x) => x.matchday === state.matchday) ?? state.fixtures[state.fixtures.length - 1];
  return formatDate(f.date);
}

export const totalMatchdays = (state: GameState) => Math.max(...state.fixtures.map((f) => f.matchday));
export const seasonOver = (state: GameState) => state.matchday > totalMatchdays(state);

export function userFixture(state: GameState, matchday = state.matchday) {
  return state.fixtures.find((f) => f.matchday === matchday && (f.homeId === state.userClubId || f.awayId === state.userClubId));
}

function xiFor(state: GameState, clubId: string): Player[] {
  if (clubId === state.userClubId) {
    const valid = state.lineup.length === 11 && state.lineup.every((id) => state.players[id] && available(state.players[id]) && state.players[id].clubId === clubId);
    if (!valid) state.lineup = pickLineup(squadOf(state, clubId), state.formation);
    return state.lineup.map((id) => state.players[id]);
  }
  return pickLineup(squadOf(state, clubId)).map((id) => state.players[id]);
}

/** Simulates every fixture of the current matchday. Returns the user's fixture (with result). */
export function playMatchday(state: GameState): Fixture | undefined {
  if (seasonOver(state)) return undefined;
  const rng = createRng(state.rngState ^ (state.matchday * 7919));
  const md = state.matchday;
  const te = effects(state.training);
  const homeIds = new Set<string>();
  const positions = Object.fromEntries(leagueTable(state).map((r, i) => [r.clubId, i + 1]));
  for (const f of state.fixtures.filter((x) => x.matchday === md)) {
    const home = xiFor(state, f.homeId), away = xiFor(state, f.awayId);
    const H = state.clubs[f.homeId], A = state.clubs[f.awayId];
    homeIds.add(f.homeId);
    const uh = f.homeId === state.userClubId, ua = f.awayId === state.userClubId;
    f.result = simulateMatch(rng, home, away, H.name, A.name, H.stadium, uh ? state.formation : '4-3-3', ua ? state.formation : '4-3-3',
      { homeBoost: uh ? te.matchBoost : 1, awayBoost: ua ? te.matchBoost : 1, homeInjury: uh ? te.injury : 1, awayInjury: ua ? te.injury : 1 });
    applyResult(f, home, away, rng);
  }
  for (const p of Object.values(state.players)) {
    if (p.injuredFor > 0) p.injuredFor--;
    if (p.suspendedFor > 0) p.suspendedFor--;
  }

  financeWeek(state, homeIds, positions);
  for (const msg of trainingWeek(rng, state, squadOf(state, state.userClubId))) addMessage(state, { category: 'training', from: 'Head coach', role: 'Training ground', subject: 'Training update', body: [msg] });
  if (md % 4 === 0) {
    for (const p of Object.values(state.players)) {
      if (p.clubId === FREE_AGENT) continue;
      const mine = p.clubId === state.userClubId;
      developStep(rng, p, 0.12, mine ? te.development : 1, mine ? state.training.focus[p.id] : undefined);
    }
  }
  state.rngState = rng.state();
  state.matchday++;
  scoutingTick(state);
  payInstallments(state);
  aiBids(state, state.rngState ^ (state.matchday * 104729));
  if (state.matchday === WINDOWS.januaryFrom) januaryReminder(state);
  if (state.matchday === WINDOWS.summerUntil + 1 || state.matchday === WINDOWS.januaryTo + 1) state.negotiations = {};
  const uf = state.fixtures.find((f) => f.matchday === md && (f.homeId === state.userClubId || f.awayId === state.userClubId));
  if (uf) postMatchMessages(state, uf);
  if (seasonOver(state)) seasonEndMessage(state);
  return uf;
}

function applyResult(f: Fixture, home: Player[], away: Player[], rng: ReturnType<typeof createRng>) {
  const r = f.result!;
  const apply = (side: Player[], ratings: typeof r.ratings.home) => {
    ratings.forEach((pr, i) => {
      const p = side[i];
      p.current.apps++; p.current.goals += pr.goals; p.current.assists += pr.assists; p.current.ratingSum += pr.rating;
      if (pr.card === 'yellow') { p.yellowCards++; if (p.yellowCards % 5 === 0) p.suspendedFor = 2; }
      if (pr.card === 'red') p.suspendedFor = 2; // counts down once after this matchday → misses 1
      if (pr.injured) p.injuredFor = 1 + rng.int(1, 4) + Math.round(p.hidden.injuryProneness / 8);
      // form → morale
      if (pr.rating >= 7.5) p.morale = 'high'; else if (pr.rating < 6) p.morale = p.morale === 'high' ? 'ok' : 'low';
    });
  };
  apply(home, r.ratings.home); apply(away, r.ratings.away);
}

function postMatchMessages(state: GameState, f: Fixture) {
  const r = f.result!;
  const userHome = f.homeId === state.userClubId;
  const us = state.clubs[state.userClubId], them = state.clubs[userHome ? f.awayId : f.homeId];
  const gf = userHome ? r.score[0] : r.score[1], ga = userHome ? r.score[1] : r.score[0];
  const word = gf > ga ? 'win' : gf < ga ? 'defeat' : 'draw';
  if (word === 'win') state.manager.w++; else if (word === 'draw') state.manager.d++; else state.manager.l++;
  const pos = leagueTable(state).findIndex((t) => t.clubId === us.id) + 1;
  addMessage(state, { category: 'media', from: `${us.name.split(' ')[0]} Gazette`, subject: `${word === 'win' ? 'Fans celebrate' : word === 'draw' ? 'Honours even in' : 'Frustration after'} ${gf}–${ga} ${word} ${userHome ? 'against' : 'at'} ${them.name}`,
    body: [`${us.name} ${word === 'win' ? 'beat' : word === 'draw' ? 'drew with' : 'lost to'} ${them.name} ${gf}–${ga}${userHome ? ` at ${us.stadium}` : ''}.`, `They are ${ordinal(pos)} in the ${DIVISION} after ${state.matchday - 1} matches.`] });
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
    `The window is open until matchday ${WINDOWS.januaryTo}.`,
    expiring.length ? `${expiring.length} ${expiring.length === 1 ? 'player\'s contract ends' : 'players\' contracts end'} this summer: ${expiring.map((p) => p.name).join(', ')}. Renew them from their profiles or they will leave for free.` : 'No contracts run out this summer.',
  ] });
}

function seasonEndMessage(state: GameState) {
  const table = leagueTable(state);
  const pos = table.findIndex((t) => t.clubId === state.userClubId) + 1;
  const target = boardTarget(state, state.userClubId);
  const ok = pos <= target.pos;
  addMessage(state, { category: 'board', from: 'The board', role: state.clubs[state.userClubId].name, subject: pos === 1 ? 'Champions! The board is overjoyed' : ok ? 'Season review: target met' : 'Season review: below expectations',
    body: [`We finished ${ordinal(pos)}. The target was ${target.text}.`, pos === 1 ? `${state.clubs[table[0].clubId].name} are champions of the ${DIVISION}. This is a season the club will never forget.` : ok ? 'The board is pleased with your work.' : 'The board expects improvement next season.', 'Start the new season from the home screen when you are ready.'] });
}

export interface TableRow { clubId: string; club: string; p: number; w: number; d: number; l: number; gf: number; ga: number; pts: number; form: ('W' | 'D' | 'L')[]; isUser: boolean }

export function leagueTable(state: GameState): TableRow[] {
  const rows: Record<string, TableRow> = {};
  for (const c of Object.values(state.clubs)) rows[c.id] = { clubId: c.id, club: c.name, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [], isUser: c.id === state.userClubId };
  const played = state.fixtures.filter((f) => f.result).sort((a, b) => a.matchday - b.matchday);
  for (const f of played) {
    const [h, a] = f.result!.score; const H = rows[f.homeId], A = rows[f.awayId];
    H.p++; A.p++; H.gf += h; H.ga += a; A.gf += a; A.ga += h;
    if (h > a) { H.w++; A.l++; H.pts += 3; H.form.push('W'); A.form.push('L'); }
    else if (h < a) { A.w++; H.l++; A.pts += 3; A.form.push('W'); H.form.push('L'); }
    else { H.d++; A.d++; H.pts++; A.pts++; H.form.push('D'); A.form.push('D'); }
  }
  return Object.values(rows).map((r) => ({ ...r, form: r.form.slice(-5) }))
    .sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || a.club.localeCompare(b.club));
}

export function ordinal(n: number) { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

/** Closes the season: history, trophies, careers, ageing, development, contracts, youth intake, new fixtures. */
export function startNewSeason(state: GameState) {
  if (!seasonOver(state)) throw new Error('Season not finished');
  const rng = createRng(state.rngState ^ 0x9e3779b9);
  const label = seasonLabel(state.year);
  const table = leagueTable(state);
  const champion = table[0].clubId;
  // top scorer per club
  for (const [i, row] of table.entries()) {
    const squad = squadOf(state, row.clubId);
    const top = squad.slice().sort((a, b) => b.current.goals - a.current.goals)[0];
    const rec: SeasonRecord = { season: label, division: DIVISION, pos: i + 1, pts: row.pts, champion: state.clubs[champion].name,
      topScorer: top && top.current.goals ? { name: top.name, goals: top.current.goals } : undefined,
      manager: row.clubId === state.userClubId ? state.managerName : 'AI manager', isYou: row.clubId === state.userClubId };
    (state.history[row.clubId] ??= []).unshift(rec);
  }
  const money = seasonFinances(state, table);
  const cabinet = (state.trophies[champion] ??= [{ name: DIVISION, tier: 'league', seasons: [] }]);
  const league = cabinet.find((t) => t.name === DIVISION) ?? (cabinet.push({ name: DIVISION, tier: 'league', seasons: [] }), cabinet[cabinet.length - 1]);
  league.seasons.push(label);
  if (champion === state.userClubId) state.manager.trophies.push(`${DIVISION} ${label}`);

  for (const p of Object.values(state.players)) {
    if (p.current.apps) p.career.unshift({ season: label, club: state.clubs[p.clubId].name, apps: p.current.apps, goals: p.current.goals, rating: Math.round((p.current.ratingSum / p.current.apps) * 100) / 100, honour: p.clubId === champion ? DIVISION : undefined });
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
  // retire old players and replace them so squads stay full
  for (const p of Object.values(state.players)) {
    if (p.age >= 36 || (p.age >= 33 && p.ability < 90) || (p.clubId === FREE_AGENT && p.age >= 34)) {
      delete state.players[p.id];
      if (p.clubId === state.userClubId) addMessage(state, { category: 'media', from: 'Club media', subject: `${p.name} retires`, body: [`${p.name} has retired after ${p.career.reduce((s, c) => s + c.apps, 0)} appearances.`] });
    }
  }
  state.year++;
  for (const c of Object.values(state.clubs)) refillSquad(state, rng, c);
  youthIntake(state, rng);
  state.fixtures = makeFixtures(Object.keys(state.clubs), state.year);
  state.matchday = 1;
  state.lineup = pickLineup(squadOf(state, state.userClubId), state.formation);
  state.rngState = rng.state();
  for (const p of Object.values(state.players)) { p.caStart = p.ability; p.progress = {}; }
  state.lastLedger = state.ledger;
  state.ledger = emptyLedger();
  state.ledger.balanceHistory.push(state.clubs[state.userClubId].balance);
  const target = boardTarget(state, state.userClubId);
  const m = (n: number) => `${Math.round(n / 1e5) / 10}M`;
  addMessage(state, { category: 'board', from: 'The board', role: state.clubs[state.userClubId].name, subject: `New season: ${seasonLabel(state.year)}`, body: [
    `A new season begins. The board's target: ${target.text}.`,
    `Prize money last season: ${m(money.prize)}. Club reputation ${money.repChange > 0 ? 'rose' : money.repChange < 0 ? 'fell' : 'held steady'} (${money.reputation}).`,
    `Your transfer budget is ${m(money.transferBudget)} and the wage budget is ${Math.round(money.wageBudget / 1000)}k a week.`,
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

function freeNumber(state: GameState, clubId: string) {
  const used = new Set(squadOf(state, clubId).map((p) => p.number));
  for (let n = 2; n < 99; n++) if (!used.has(n)) return n;
  return 99;
}

function youthIntake(state: GameState, rng: ReturnType<typeof createRng>) {
  for (const c of Object.values(state.clubs)) {
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

export function leagueScale(state: GameState) {
  const cas = Object.values(state.players).filter((p) => p.squad === 'First team' && p.clubId !== FREE_AGENT).map((p) => p.ability);
  return { low: Math.min(...cas), high: Math.max(...cas) };
}
export function youthScale() { return { low: 35, high: 140 }; }

export function setTactics(state: GameState, formation: Formation, lineup: string[]) {
  state.formation = formation;
  state.lineup = lineup;
}

export function bestLineup(state: GameState, formation: Formation = state.formation) {
  return pickLineup(squadOf(state, state.userClubId), formation);
}

/** Fills fields added after v0.1 so older saves keep working. */
export function migrate(state: GameState): GameState {
  state.knowledge ??= {}; state.scouting ??= []; state.shortlist ??= []; state.transferListed ??= [];
  state.bids ??= []; state.negotiations ??= {}; state.installments ??= [];
  state.training ??= defaultTraining(); state.ledger ??= emptyLedger();
  return state;
}

export function markRead(state: GameState, id: string) { const m = state.inbox.find((x) => x.id === id); if (m) m.unread = false; }
