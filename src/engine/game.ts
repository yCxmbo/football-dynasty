import { makeRumours, runMarket } from './market';
import { windowsFor } from './windows';
import { prepFor } from './opposition';
import { fansAfterMatch, fansNewSeason, homeLift } from './fans';
import { recordInjury, relapses } from './medical';
import { payAddOns } from './deals';
import { AUTO_SIGN, makeCandidates, MAX_SIGN, regionFee, signIntake } from './youth';
import { affiliateSummer, feederDevelopment } from './affiliates';
import { checkContractPromises, summerWages } from './negotiation';
import { scoutingNetworkDay } from './network';
import { matchOdds } from './preview';
import { postMatchConference, preMatchConference } from './press';
import { archiveReview, noteCourse } from './seasonreview';
import { checkBadge, managerExperience, motivationFactor, profileOf, youthCoaching } from './manager';
import { captainOf, takersOf } from './leadership';
import { withDefaults, type Instructions } from './instructions';
import { makePredictions, predictedPos, previewMessage } from './preview';
import { bestRoles, fixRoles, type SlotRole } from './roles';
import { ensureFamiliarity, familiarity, familiarityFactor, learnFromMatch, loadPreset, saveActive, switchTactic, weeklyFamiliarity } from './tactics';
import { aiFormation, managerBoost, managerOf, managers, managersAfterSeason, midSeasonSackings, weeklyAppointments } from './managers';
import { awardPremium, awardsMessage, seasonAwards } from './awards';
import { formatDate } from './fixtures';
import { available, fitFor, pickLineup, slotsOf, type Formation, type MatchMods } from './match';
import { createLive, runToEnd, toResult, type LiveMatch } from './live';
import { POS_GROUP, abilityFromAttributes, clamp, POSITION_WEIGHTS } from './ratings';
import { nationRanking, playSummer } from './international';
import { summerStep } from './summer';
import { jobOffers, managerReputation, tidySelection } from './nationaljob';
import { returnLoans } from './loans';
import { afterFriendly, makeFriendlyOffers, sharpness } from './friendlies';
import { afterDerby, derbyName, REAL_RIVALRIES } from './rivalries';
import { moraleBonus, styleTilt, talkMultiplier, youthDevelopmentBoost, youthIntakeBonus } from './style';
import { recordSeason, recordTransfer } from './records';
import { afterMatch, afterSeason, afterTournament } from './achievements';
import { finishBuilding, trainingFacilityBoost, youthFacilityBonus } from './facilities';
import { weeklyMood } from './media';
import { atmosphere, atmosphereFactor, weeklyDynamics } from './dynamics';
import { judgeVision, maybeTakeover, renewVisionIfDone, visionOf } from './vision';
import { developmentBoost, initStaff, injuryLengthFactor, moraleRecoveryChance, recoveryBonus, refreshPool, youthPotentialBonus } from './staff';
import { career, compensation, makeOffers, managerWage, midSeasonVerdict, seasonVerdict, vacanciesAfterSeason } from './career';
import { NATION, nationCode, nationName } from './nations';
import { reserveNames } from './namepools';
import { createRng } from './rng';
import { makePlayer, valueFor, wageFor, SQUAD_TEMPLATE } from './world';
import type { Club, CompId, Currency, Fixture, GameState, InboxMessage, Player, SeasonRecord, Trophy } from './types';
import { FREE_AGENT, seasonLabel } from './types';
import { aiBids, expireContracts, payInstallments, scoutingTick } from './transfers';
import { defaultTraining, developStep, effects, trainingWeek, groupAverages, positionTrainingWeek } from './training';
import { cupGate, emptyLedger, financeWeek, seasonFinances } from './finance';
import {
  advanceCups, buildComps, clubsInLeague, compInfo, cupResult, currentSlot, leagueDef, leagueTableOf, makeCalendar,
  promotionsAndRelegations, qualifiers, resetLeagueCache, setupSplit, isLeague, setupPlayoffs, setupSeason, winnerOf, type TableRow, withThe } from './competitions';
import { buildWorld, type WorldDef } from './worlddef';
import { noteJoined, squadOf, withSquadIndex } from './index';
import { builtinWorld } from './builtin';

export type { TableRow };

export interface NewGameOpts { seed: number; userClubId: string; managerName: string; currency: Currency; year?: number; world?: WorldDef; source?: 'builtin' | 'real' | 'import'; style?: import('./style').ManagerStyle }

export function newGame(opts: NewGameOpts): GameState {
  const def = opts.world ?? builtinWorld();
  const year = opts.year ?? def.startYear ?? 2026;
  const rng = createRng(opts.seed);
  const userCountry = def.clubs.find((c) => c.id === opts.userClubId)?.country ?? def.countries[0].id;
  const { clubs, players, nextId } = buildWorld(def, rng, year, userCountry);
  const state: GameState = {
    version: 3, seed: opts.seed, rngState: rng.state(), year, matchday: 1, userClubId: opts.userClubId, managerName: opts.managerName, currency: opts.currency,
    clubs, players, fixtures: [], calendar: [], leagueWeeks: 38, comps: {}, cups: {}, groups: {}, qualified: {},
    world: { name: def.name, source: opts.source ?? (opts.world ? 'import' : 'builtin'), userCountry, countries: def.countries, leagues: def.leagues, cups: def.cups, continental: def.continental, rivalries: (def.rivalries ?? []).filter((r) => def.clubs.some((c) => c.id === r.a) && def.clubs.some((c) => c.id === r.b)) },
    inbox: [], history: {}, trophies: {}, lineup: [], formation: '4-3-3', nextId, autoRotate: true,
    manager: { since: year, w: 0, d: 0, l: 0, trophies: [] },
    knowledge: {}, scouting: [], shortlist: [], transferListed: [], bids: [], negotiations: {}, installments: [],
    training: defaultTraining(), ledger: emptyLedger(),
  };
  state.qualified = qualifiers(state, true);
  buildComps(state);
  state.calendar = makeCalendar(state, year);
  setupSeason(state, rng);
  state.rngState = rng.state();
  state.lineup = pickLineup(squadOf(state, opts.userClubId));
  career(state);
  initStaff(state, rng);
  managers(state);
  ensureFamiliarity(state);
  withSquadIndex(state, () => { makePredictions(state); const pv = previewMessage(state); if (pv) addMessage(state, { category: 'media', from: 'Season preview', ...pv }); });
  if (opts.style) state.managerStyle = opts.style;
  profileOf(state); // starting attributes follow the style
  makeFriendlyOffers(state, rng);
  for (const p of Object.values(players)) p.caStart = p.ability;
  state.ledger.balanceHistory.push(clubs[opts.userClubId].balance);
  const club = clubs[opts.userClubId];
  const target = boardTarget(state, opts.userClubId);
  const cont = Object.values(state.comps).filter((c) => c.kind === 'continental' && (state.qualified[c.id] ?? []).includes(club.id));
  addMessage(state, { category: 'board', from: 'The board', role: club.name, subject: `Welcome to ${club.name}`, body: [
    `Welcome, ${opts.managerName}. The board is delighted to have you at ${club.stadium}.`,
    `We play in ${withThe(leagueName(state, club.league))}. Our expectation this season: ${target.text}.`,
    `Your transfer budget is ${Math.round(club.transferBudget / 1e5) / 10}M.`,
    ...cont.map((c) => `We are in ${withThe(c.name)} this season.`),
  ] });
  return state;
}

export const leagueName = (state: GameState, id?: string) => leagueDef(state, id)?.name ?? 'no league';

export { squadOf };
export function firstTeam(state: GameState, clubId: string) { return squadOf(state, clubId).filter((p) => p.squad === 'First team'); }

/** The board's target for a club this season; for you, any promise from your interview if it's tougher. */
export function boardTarget(state: GameState, clubId: string): { pos: number; text: string } {
  const base = baseTarget(state, clubId);
  const pr = state.career?.promise;
  if (clubId === state.userClubId && pr && pr.clubId === clubId && pr.season === state.year && pr.pos < base.pos) return { pos: pr.pos, text: pr.text };
  return base;
}

/** The board's usual target, by the club's size in its league. */
export function baseTarget(state: GameState, clubId: string) {
  const club = state.clubs[clubId];
  const l = leagueDef(state, club.league);
  if (!l) return { pos: 99, text: 'do well in cup competitions' };
  const ids = clubsInLeague(state, l.id);
  const n = ids.length;
  const rank = ids.map((id) => state.clubs[id]).sort((a, b) => b.reputation - a.reputation).findIndex((c) => c.id === clubId) + 1;
  const safe = n - l.relegate;
  if (l.tier === 1) {
    const places = state.world.continental.filter((k) => k.rank === 1).reduce((a, k) => a + (k.places[l.country] ?? 0), 0);
    if (rank <= 2) return { pos: 2, text: 'a top-two finish and a title challenge' };
    if (places && rank <= places) return { pos: places, text: `a top-${places} finish and Champions-level continental football` };
    if (rank <= Math.ceil(n / 2)) return { pos: Math.ceil(n / 2), text: 'a top-half finish' };
    return l.relegate ? { pos: safe, text: `avoid relegation (finish ${ordinal(safe)} or higher)` } : { pos: n - 2, text: 'stay clear of the bottom two' };
  }
  if (rank <= l.promote) return { pos: l.promote, text: `promotion (a top-${l.promote} finish)` };
  if (l.playoff && rank <= l.playoff[1]) return { pos: l.playoff[1], text: `a play-off place (top ${l.playoff[1]})` };
  return l.relegate ? { pos: safe, text: `avoid relegation (finish ${ordinal(safe)} or higher)` } : { pos: Math.ceil(n * 0.75), text: 'build for the future' };
}

function addMessage(state: GameState, m: Omit<InboxMessage, 'id' | 'date' | 'unread'> & { date?: string }) {
  const date = m.date ?? currentDate(state);
  state.inbox.unshift({ ...m, id: `m${state.nextId++}`, date, unread: true });
  if (state.inbox.length > 80) state.inbox.length = 80;
}

export function currentDate(state: GameState) {
  return formatDate(today(state));
}

/** An ISO date moved by a number of days. */
export const addDays = (iso: string, n: number) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
/** Today's date in the game. */
export function today(state: GameState) {
  return state.today ?? state.calendar[Math.min(state.matchday, state.calendar.length) - 1]?.date ?? '';
}
/** Whether today has fixtures still to play. */
export const fixturesToday = (state: GameState) => { const slot = state.calendar[state.matchday - 1]; return !!slot && slot.date <= today(state); };
/** Your fixture today, if you have one. */
export function todaysFixture(state: GameState) { return fixturesToday(state) ? userFixture(state) : undefined; }
/** Moves the game on by one day: today's fixtures (yours included, simulated) are played first. */
export function advanceDay(state: GameState) {
  if (seasonOver(state) || state.career?.sacked) return;
  if (fixturesToday(state)) playMatchday(state);
  else { state.today = addDays(today(state), 1); withSquadIndex(state, () => newDay(state)); }
}
/** Days until your next fixture (0 if it's today). */
export function daysToNextMatch(state: GameState) {
  const f = nextUserFixture(state);
  const d = f ? state.calendar[f.matchday - 1]?.date : undefined;
  if (!d) return undefined;
  return Math.round((Date.parse(d) - Date.parse(today(state))) / 86_400_000);
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
export const compName = (state: GameState, c: CompId) => compInfo(state, c).name;

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

/** Computer-run clubs' elevens and roles, remembered while nothing that decides them has changed: the shape, who
    is available, their ability and (below 85%) their exact fitness (picking is deterministic, so this never changes a result). */
const aiPicks = new WeakMap<GameState, Map<string, { key: string; ids: string[]; roles?: SlotRole[] }>>();
function aiPickKey(state: GameState, clubId: string, formation: Formation) {
  let k = formation;
  for (const p of squadOf(state, clubId)) if (p.squad === 'First team' && available(p)) { const c = p.condition ?? 100; k += '|' + p.id + '/' + p.ability + (c >= 85 ? '' : ':' + c); }
  return k;
}
function aiPick(state: GameState, clubId: string, formation: Formation) {
  let m = aiPicks.get(state);
  if (!m) { m = new Map(); aiPicks.set(state, m); }
  const key = aiPickKey(state, clubId, formation);
  let v = m.get(clubId);
  if (!v || v.key !== key) { v = { key, ids: pickLineup(squadOf(state, clubId), formation) }; m.set(clubId, v); }
  return v;
}
function xiFor(state: GameState, clubId: string, formation: Formation = '4-3-3'): Player[] {
  if (clubId === state.userClubId) return userLineup(state).map((id) => state.players[id]);
  return aiPick(state, clubId, formation).ids.map((id) => state.players[id]);
}
/** Roles for the eleven xiFor just picked (its cache entry is fresh, so no need to check the key again). */
function aiRoles(state: GameState, clubId: string, formation: Formation, xi: Player[]) {
  const v = aiPicks.get(state)?.get(clubId);
  if (!v || v.ids.length !== xi.length || v.ids.some((id, i) => id !== xi[i]?.id)) return bestRoles(formation, xi);
  return (v.roles ??= bestRoles(formation, xi));
}

/** A side's shape for a match: yours from the Tactics screen, a computer-run club's from its manager. */
export function sideShape(state: GameState, clubId: string) {
  if (clubId === state.userClubId) return { formation: state.formation, roles: fixRoles(state.formation, state.roles) };
  return { formation: aiFormation(state, clubId), roles: undefined as SlotRole[] | undefined };
}

function benchFor(state: GameState, clubId: string, xi: Player[]) {
  const ids = new Set(xi.map((p) => p.id));
  return firstTeam(state, clubId).filter((p) => !ids.has(p.id) && available(p)).sort((a, b) => b.ability - a.ability).slice(0, clubId === state.userClubId ? 12 : 9);
}

/** Inbox news of sackings and appointments, for clubs in your league and the biggest clubs. */
function managerNews(state: GameState, sacked: string[], appointed: Array<{ clubId: string; from?: string; mgr: { name: string; nation: string; rep: number } }>) {
  const us = state.clubs[state.userClubId];
  const near = (id: string) => state.clubs[id] && (state.clubs[id].league === us.league || state.clubs[id].reputation >= 82);
  for (const id of sacked.filter(near)) addMessage(state, { category: 'media', from: 'Football news', subject: `${state.clubs[id].name} sack their manager`, body: [
    `${state.clubs[id].name} have parted company with their manager after a poor run. The job is open: apply on the Career screen if you want it.`] });
  for (const { clubId, mgr, from } of appointed.filter((x) => near(x.clubId) || (x.from && near(x.from)))) addMessage(state, { category: 'media', from: 'Football news', subject: `${mgr.name} takes over at ${state.clubs[clubId].name}`, body: [
    from ? `${state.clubs[clubId].name} have lured ${mgr.name} (${nationName(mgr.nation)}) away from ${state.clubs[from]?.name}, who are now looking for a manager.`
      : `${state.clubs[clubId].name} have appointed ${mgr.name} (${nationName(mgr.nation)}) as their new manager.`] });
}

/** The rumour mill: the hottest links, those in your league, and any about your players. */
function rumourNews(state: GameState, list: import('./market').Rumour[], window: 'Summer' | 'January') {
  if (!list.length) return;
  const us = state.clubs[state.userClubId];
  const ours = list.filter((r) => r.fromId === us.id);
  const near = list.filter((r) => r.fromId !== us.id && (state.clubs[r.toId]?.league === us.league || state.clubs[r.fromId]?.league === us.league));
  const hot = list.filter((r) => !ours.includes(r) && !near.includes(r)).sort((a, b) => b.heat - a.heat).slice(0, 5);
  const line = (r: import('./market').Rumour) => `${r.name} (${state.clubs[r.fromId]?.name}) to ${state.clubs[r.toId]?.name}${r.heat === 3 ? ': close to a deal' : r.heat === 2 ? ': talks under way' : ': early interest'}.`;
  addMessage(state, { category: 'transfers', from: 'Transfer rumours', subject: ours.length ? `${state.clubs[ours[0].toId]?.name} want ${ours[0].name}` : `Rumour mill: ${list.length} names linked before the ${window === 'January' ? 'January' : 'summer'} window`, body: [
    ...ours.map((r) => `${line(r)} Expect a bid when the window opens.`), ...near.map(line), ...hot.map(line),
    'All the rumours are under Transfer news on the Transfers screen.'] });
}

/** After a window: the biggest deals, and those in your league. */
function marketNews(state: GameState, window: 'Summer' | 'January', ids: string[]) {
  const deals = (state.records?.deals ?? []).filter((d) => d.playerId && ids.includes(d.playerId));
  if (!deals.length) return;
  const us = state.clubs[state.userClubId];
  const inLeague = deals.filter((d) => state.clubs[d.toId!]?.league === us.league || state.clubs[d.fromId!]?.league === us.league);
  const top = deals.slice().sort((a, b) => b.fee - a.fee).slice(0, 5);
  const m = (n: number) => `${Math.round(n / 1e5) / 10}M`;
  const line = (d: (typeof deals)[number]) => `${d.name}: ${d.from} to ${d.to}, ${m(d.fee)}${d.rumoured ? ' (as rumoured)' : ''}.`;
  addMessage(state, { category: 'transfers', from: 'Transfer news', subject: `${window} window: ${deals.length} deals, led by ${top[0].name} (${m(top[0].fee)})`, body: [
    'Biggest deals:', ...top.map(line), ...(inLeague.length ? ['In our league:', ...inLeague.filter((d) => !top.includes(d)).slice(0, 8).map(line)] : []),
    'See every deal under Transfer news on the Transfers screen.'] });
}

function setupFor(state: GameState, f: Fixture) {
  const te = effects(state.training);
  const uh = f.homeId === state.userClubId, ua = f.awayId === state.userClubId;
  const hs = sideShape(state, f.homeId), aw = sideShape(state, f.awayId);
  const hx = xiFor(state, f.homeId, hs.formation), ax = xiFor(state, f.awayId, aw.formation);
  const hr = hs.roles ?? aiRoles(state, f.homeId, hs.formation, hx), ar = aw.roles ?? aiRoles(state, f.awayId, aw.formation, ax);
  const H = state.clubs[f.homeId], A = state.clubs[f.awayId];
  const tilt = { ...styleTilt(state), talk: talkMultiplier(state) * motivationFactor(state) };
  const sharp = sharpness(state, state.calendar[f.matchday - 1]?.week ?? 0);
  const derby = derbyName(state, f.homeId, f.awayId);
  // following the assistant's suggested formation gives a small edge
  const prep = (uh || ua) && f.comp !== 'friendly' ? prepFor(state, f) : { boost: 1, marked: undefined };
  const plan = prep.boost * (uh ? homeLift(state) : 1);
  // how well the squad knows the tactic (computer-run sides play theirs every week)
  const fam = uh || ua ? familiarityFactor(familiarity(state)) * atmosphereFactor(atmosphere(state)) : 1, aiFam = familiarityFactor(90);
  const mods: MatchMods = { derby, homeBoost: uh ? te.matchBoost * sharp * plan * fam : managerBoost(state, f.homeId) * aiFam, awayBoost: ua ? te.matchBoost * sharp * plan * fam : managerBoost(state, f.awayId) * aiFam, homeInjury: uh ? te.injury : 1, awayInjury: ua ? te.injury : 1, neutral: f.neutral, knockout: f.ko };
  return {
    home: { xi: hx, bench: benchFor(state, f.homeId, hx), formation: hs.formation, roles: hr, name: H.name, user: uh, captain: captainOf(state, f.homeId)?.id, ...(ua && prep.marked ? { marked: prep.marked } : {}), ...(uh ? { tilt, takers: takersOf(state), instr: withDefaults(state.instructions), defFormation: state.defFormation, ...(state.routines ? { routines: state.routines } : {}) } : {}) },
    away: { xi: ax, bench: benchFor(state, f.awayId, ax), formation: aw.formation, roles: ar, name: A.name, user: ua, captain: captainOf(state, f.awayId)?.id, ...(uh && prep.marked ? { marked: prep.marked } : {}), ...(ua ? { tilt, takers: takersOf(state), instr: withDefaults(state.instructions), defFormation: state.defFormation, ...(state.routines ? { routines: state.routines } : {}) } : {}) },
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
  const mine = p.clubId === state.userClubId;
  const intensity = mine ? (state.training.intensity === 'high' ? -1.2 : state.training.intensity === 'low' ? 1.2 : 0) : 0;
  return Math.max(2.5, base + intensity + (mine ? recoveryBonus(state) : 0));
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
  if (seasonOver(state) || state.career?.sacked) return undefined;
  const date = state.calendar[state.matchday - 1]?.date;
  const f = withSquadIndex(state, () => {
    const r = playSlot(state, live);
    // the day is over: tomorrow is next
    if (date) { state.today = addDays(date, 1); newDay(state); }
    return r;
  });
  return f;
}

function playSlot(state: GameState, live?: { fixtureId: string; lm: LiveMatch }): Fixture | undefined {
  const rng = createRng(state.rngState ^ (state.matchday * 7919));
  const md = state.matchday;
  const slot = currentSlot(state);
  const leagueIds = new Set(slot.entries.filter((e) => compInfo(state, e.comp).kind === 'league').map((e) => e.comp));
  const leagueWeek = leagueIds.size > 0;
  const te = effects(state.training);
  const homeIds = new Set<string>();
  const derbyHomes = new Set<string>();
  const positions: Record<string, number> = {};
  // league positions before kick-off (for gate money): only needed in a league week, for the leagues playing
  if (leagueWeek) for (const l of state.world.leagues) if (leagueIds.has(l.id)) leagueTableOf(state, l.id).forEach((r, i) => { positions[r.clubId] = i + 1; });
  for (const f of state.fixtures.filter((x) => x.matchday === md && !x.result)) {
    const uh = f.homeId === state.userClubId, ua = f.awayId === state.userClubId;
    let lm: LiveMatch;
    if (live && live.fixtureId === f.id) lm = structuredClone(live.lm);
    else { const st = setupFor(state, f); lm = createLive(rng.int(0, 2 ** 31 - 1), st.home, st.away, st.venue, st.mods); if (!uh && !ua) lm.step = 2; }
    if (uh || ua) { state.lineup = repairLineup(state); learnFromMatch(state); if (state.matchPrep?.fixtureId === f.id) delete state.matchPrep; }
    runToEnd(lm);
    const { result, conditions } = toResult(lm, f.homeId, f.awayId);
    f.result = result;
    if (f.ko) result.winnerId = winnerOf(f);
    for (const [id, c] of Object.entries(conditions)) if (state.players[id]) state.players[id].condition = c;
    applyResult(state, f, rng);
    if (f.comp !== 'friendly') afterDerby(state, f);
    if ((uh || ua) && f.comp !== 'friendly' && state.clauses?.length) payAddOns(state, uh ? result.ratings.home : result.ratings.away);
    if (uh || ua) for (const p of relapses(state, (uh ? result.ratings.home : result.ratings.away).filter((x) => x.minutes > 0).map((x) => x.playerId)))
      addMessage(state, { category: 'medical', from: 'Medical team', role: 'Head physio', playerId: p.id, subject: `${p.name} has broken down again`, body: [`${p.name} came back early and the injury has flared up: ${p.injury?.type.toLowerCase()}. He's out for ${p.injuredFor} matches, longer than the first time.`] });
    if ((uh || ua) && f.comp !== 'friendly') {
      const mine = uh ? result.ratings.home : result.ratings.away;
      const won = result.winnerId ? result.winnerId === state.userClubId : uh ? result.score[0] > result.score[1] : result.score[1] > result.score[0];
      managerExperience(state, won, mine.filter((x) => x.minutes > 0 && (state.players[x.playerId]?.age ?? 99) <= 21).length, mine.filter((x) => x.card).length);
    }
    if ((uh || ua) && f.comp !== 'friendly') for (const m of fansAfterMatch(state, f, derbyName(state, f.homeId, f.awayId), standingOf(state))) addMessage(state, { category: 'media', from: 'Supporters', ...m });
    if (derbyName(state, f.homeId, f.awayId)) derbyHomes.add(f.homeId);
    if (compInfo(state, f.comp).kind === 'league') homeIds.add(f.homeId); else if (f.comp !== 'friendly') cupGate(state, f);
    if (!uh && !ua) slim(f);
  }
  const days = state.calendar[md] ? Math.round((Date.parse(state.calendar[md].date) - Date.parse(slot.date)) / 86400000) : 30;
  for (const id in state.players) {
    const p = state.players[id];
    if (p.injuredFor > 0) { p.injuredFor--; if (!p.injuredFor && p.injury && !p.injury.rushed) delete p.injury; }
    if (p.suspendedFor > 0) p.suspendedFor--;
    if (p.condition !== undefined && p.condition < 100) p.condition = Math.min(100, Math.round(p.condition + days * recoveryPerDay(state, p)));
  }
  const cupNews = advanceCups(state, rng, slot);
  for (const e of slot.entries) if (isLeague(state, e.comp)) setupSplit(state, e.comp, Number(e.round.replace('Matchday ', '')));
  if (leagueWeek) {
    financeWeek(state, leagueIds, homeIds, positions, derbyHomes);
    if (leagueIds.has(state.clubs[state.userClubId]?.league ?? '')) noteCourse(state);
    for (const p of squadOf(state, state.userClubId)) if (p.morale === 'low' && rng.chance(moraleRecoveryChance(state) + moraleBonus(state))) p.morale = 'ok';
    weeklyMood(state, rng, slot.week);
    { const news = weeklyDynamics(state, slot.week); if (news.length) addMessage(state, { category: 'media', from: 'Assistant manager', role: 'Dressing room', subject: news.length > 1 ? 'Dressing-room news' : news[0].split(':')[0].slice(0, 60), body: [...news, 'See the Dynamics tab on the Squad screen.'] }); }
    { const learned = positionTrainingWeek(state); if (learned.length) addMessage(state, { category: 'training', from: 'Head coach', role: 'Training ground', subject: learned[0].replace(/\.$/, ''), body: learned }); }
    for (const msg of trainingWeek(rng, state, squadOf(state, state.userClubId))) addMessage(state, { category: 'training', from: 'Head coach', role: 'Training ground', subject: 'Training update', body: [msg] });
    // about five development steps a season, whatever the league length (small steps would round away)
    const every = Math.max(4, Math.round(state.leagueWeeks / 5.5));
    if (slot.week % every === 0) {
      for (const p of Object.values(state.players)) {
        if (p.clubId === FREE_AGENT) continue;
        const mine = p.clubId === state.userClubId;
        developStep(rng, p, 0.6 / Math.floor(state.leagueWeeks / every), mine ? te.development * developmentBoost(state) * trainingFacilityBoost(state) * youthDevelopmentBoost(state, p.age) * youthCoaching(state, p.age) : feederDevelopment(state, p), mine ? state.training.focus[p.id] : undefined);
      }
    }
    if (slot.week === state.leagueWeeks) setupPlayoffs(state);
    // a board that has lost all faith acts before the season is out
    if (slot.week % 4 === 0) managerNews(state, midSeasonSackings(state, rng, slot.week, (id) => boardTarget(state, id)), []);
    if (slot.week % 4 === 0 && state.clubs[state.userClubId].league && midSeasonVerdict(state, boardTarget(state, state.userClubId), slot.week)) {
      const c = career(state);
      const comp = compensation(state);
      c.earnings = (c.earnings ?? 0) + comp;
      c.sacked = true;
      c.offers = makeOffers(state, rng, c.vacancies, 'sacked');
      addMessage(state, { category: 'board', from: 'The board', role: state.clubs[state.userClubId].name, subject: 'You have been sacked', body: [
        `Results have fallen far short of the target (${boardTarget(state, state.userClubId).text}). The board has decided to make a change, effective immediately.`,
        `You receive ${Math.round(comp / 1e5) / 10}M in compensation for the rest of your contract.`,
        `${c.offers.length} club${c.offers.length === 1 ? '' : 's'} would give you a new start. Choose one on the Career screen to carry on.`] });
    }
  }
  state.rngState = rng.state();
  state.matchday++;
  if (leagueWeek) {
    scoutingTick(state);
    payInstallments(state);
    aiBids(state, state.rngState ^ (state.matchday * 104729));
    { const cc = state.career; if (cc?.contract && !cc.sacked) cc.earnings = (cc.earnings ?? 0) + cc.contract.wage; }
    weeklyFamiliarity(state);
    managerNews(state, [], weeklyAppointments(state, createRng((state.rngState ^ (state.matchday * 0x9e37)) >>> 0)));
    if (slot.week === state.leagueWeeks - 4) rumourNews(state, makeRumours(state, createRng((state.rngState ^ 0x72756e) >>> 0), 'Summer'), 'Summer');
  }
  const uf = state.fixtures.find((f) => f.matchday === md && involves(f, state.userClubId));
  if (uf && uf.comp === 'friendly') {
    const { earned, tour } = afterFriendly(state, uf);
    const r = uf.result!, home = uf.homeId === state.userClubId;
    addMessage(state, { category: 'match', from: 'Club media', subject: `${uf.round}: ${state.clubs[uf.homeId].name} ${r.score[0]}–${r.score[1]} ${state.clubs[uf.awayId].name}`, body: [
      `${home ? 'A run-out at home' : `On tour against ${state.clubs[uf.homeId].name}`}: the players are sharper for it.`,
      `The club earned ${Math.round(earned / 1e5) / 10}M${tour ? ', and the tour has raised our profile abroad' : ''}.`] });
  } else if (uf) {
    postMatchMessages(state, uf);
    const pc = postMatchConference(state, uf);
    if (pc && pc.questions.length) {
      state.press = pc;
      addMessage(state, { category: 'media', from: 'Press officer', subject: `Post-match press conference: ${pc.opp}`, body: [`The press want your thoughts after the game against ${pc.opp}: ${pc.questions.length} questions. Answer them, or send your assistant.`], link: { screen: 'press', label: 'Go to the press room' } });
    }
    afterMatch(state, uf);
  }
  for (const line of cupNews) if (line.includes(state.clubs[state.userClubId].name) || line.startsWith('Continental')) addMessage(state, { category: 'media', from: 'Football news', subject: line, body: [line] });
  if (seasonOver(state)) seasonEndMessage(state);
  return uf;
}

function applyResult(state: GameState, f: Fixture, rng: ReturnType<typeof createRng>) {
  const r = f.result!;
  const friendly = f.comp === 'friendly';
  for (const pr of [...r.ratings.home, ...r.ratings.away]) {
    const p = state.players[pr.playerId];
    if (!p) continue;
    // friendlies don't count: only a knock can carry over
    if (friendly) { if (pr.injured) { p.injuredFor = 1 + rng.int(0, 2); recordInjury(state, p, 'match'); } continue; }
    p.current.apps++; p.current.goals += pr.goals; p.current.assists += pr.assists; p.current.ratingSum += pr.rating;
    if (pr.card === 'yellow') { p.yellowCards++; if (p.yellowCards % 5 === 0) p.suspendedFor = 2; }
    if (pr.card === 'red') p.suspendedFor = 2; // counts down once after this slot → misses 1
    if (pr.injured) { p.injuredFor = Math.max(1, Math.round((1 + rng.int(1, 4) + Math.round(p.hidden.injuryProneness / 8)) * (p.clubId === state.userClubId ? injuryLengthFactor(state) : 1))); recordInjury(state, p, 'match'); }
    if (pr.rating >= 7.5) p.morale = 'high'; else if (pr.rating < 6) p.morale = p.morale === 'high' ? 'ok' : 'low';
  }
  if (friendly) return;
  // clean sheets (goalkeepers who played an hour or more) and the player of the match
  for (const [list, conceded] of [[r.ratings.home, r.score[1]], [r.ratings.away, r.score[0]]] as const) {
    if (conceded) continue;
    for (const pr of list) { const p = state.players[pr.playerId]; if (p && p.pos === 'GK' && pr.minutes >= 60) p.current.cleanSheets = (p.current.cleanSheets ?? 0) + 1; }
  }
  const best = [...r.ratings.home, ...r.ratings.away].filter((x) => x.minutes >= 30).sort((a, b) => b.rating - a.rating)[0];
  if (best && state.players[best.playerId]) { const p = state.players[best.playerId]; p.current.potm = (p.current.potm ?? 0) + 1; }
}

function postMatchMessages(state: GameState, f: Fixture) {
  const r = f.result!;
  const userHome = f.homeId === state.userClubId;
  const us = state.clubs[state.userClubId], them = state.clubs[userHome ? f.awayId : f.homeId];
  const gf = userHome ? r.score[0] : r.score[1], ga = userHome ? r.score[1] : r.score[0];
  const won = f.ko ? r.winnerId === us.id : gf > ga;
  const word = f.ko ? (won ? 'win' : 'defeat') : gf > ga ? 'win' : gf < ga ? 'defeat' : 'draw';
  if (gf > ga) state.manager.w++; else if (gf === ga) state.manager.d++; else state.manager.l++;
  const comp = compInfo(state, f.comp);
  const pens = r.pens ? ` (${userHome ? r.pens[0] : r.pens[1]}\u2013${userHome ? r.pens[1] : r.pens[0]} on penalties)` : '';
  let line2: string;
  if (comp.kind === 'league') {
    const t = leagueTableOf(state, f.comp);
    const pos = t.findIndex((r) => r.clubId === us.id) + 1;
    line2 = `They are ${ordinal(pos)} in ${withThe(comp.name)} after ${t[pos - 1]?.p ?? 0} matches.`;
  } else if (f.round === 'Final') line2 = won ? `${us.name} win ${withThe(comp.name)}!` : `Heartbreak in ${withThe(comp.name)} final.`;
  else line2 = won ? `${us.name} are through in ${withThe(comp.name)}.` : `${us.name} are out of ${withThe(comp.name)} (${f.round.toLowerCase()}).`;
  addMessage(state, { category: 'media', from: `${us.name.split(' ')[0]} Gazette`, subject: `${word === 'win' ? 'Fans celebrate' : word === 'draw' ? 'Honours even in' : 'Frustration after'} ${gf}\u2013${ga}${pens} ${word} ${userHome || f.neutral ? 'against' : 'at'} ${them.name}`,
    body: [`${comp.name}, ${f.round}: ${us.name} ${gf > ga ? 'beat' : gf === ga ? 'drew with' : 'lost to'} ${them.name} ${gf}\u2013${ga}${pens}.`, line2] });
  const mine = userHome ? r.ratings.home : r.ratings.away;
  for (const pr of mine) {
    const p = state.players[pr.playerId];
    if (pr.injured && p.injuredFor > 0) addMessage(state, { category: 'medical', from: 'Medical team', role: 'Head physio', playerId: p.id, subject: `${p.name}: ${(p.injury?.type ?? 'injured').toLowerCase()}, out ${p.injuredFor} ${p.injuredFor === 1 ? 'match' : 'matches'}`, body: [`${p.name} was hurt against ${them.name}${p.injury ? ` (${p.injury.type.toLowerCase()})` : ''} and should miss about ${p.injuredFor} ${p.injuredFor === 1 ? 'match' : 'matches'}.`, 'See the Medical screen for when he should be back, and whether to rush him.'] });
    if (p.suspendedFor > 0 && (pr.card === 'red' || p.yellowCards % 5 === 0)) addMessage(state, { category: 'match', from: 'League office', subject: `${p.name} suspended for the next match`, body: [pr.card === 'red' ? `${p.name} was sent off and is banned for one match.` : `${p.name} has reached ${p.yellowCards} yellow cards and is banned for one match.`] });
  }
}

/** Each new day: transfer windows open and close on their real dates. Every country's clubs do their winter
    business when their own window closes; your window brings news on opening, deadline day and closing; rumours
    start three weeks before your winter window. Logged so each happens once, even when days are skipped. */
/** Your league position and the board's target position, for the supporters. */
function standingOf(state: GameState) {
  const l = state.clubs[state.userClubId]?.league;
  if (!l || (state.course?.length ?? 0) < 5) return undefined; // early tables mean little
  const pos = leagueTableOf(state, l).findIndex((r) => r.clubId === state.userClubId) + 1;
  return pos ? { pos, target: boardTarget(state, state.userClubId).pos } : undefined;
}

function newDay(state: GameState) {
  if (seasonOver(state)) return;
  { // about six weeks before the end: the head of youth presents next season's candidates
    const cue = state.calendar[Math.max(0, state.calendar.length - 7)]?.date;
    if (cue && today(state) >= cue && state.youth?.year !== state.year && state.clubs[state.userClubId]?.league) {
      state.youth = makeCandidates(state, youthPotentialBonus(state) + youthFacilityBonus(state) + youthIntakeBonus(state));
      addMessage(state, { category: 'youth', from: 'Head of youth development', subject: 'Next season\'s youth intake: choose who to sign', body: [...state.youth.comments, `There are ${state.youth.candidates.length} candidates. Pick up to ${MAX_SIGN} in the Academy; if you don't, I'll sign the best ${AUTO_SIGN} when the season turns.`], link: { screen: 'youth', label: 'See the candidates' } });
    }
  }
  for (const { p, kept } of checkContractPromises(state)) addMessage(state, { category: 'media', from: p.name, role: 'Player', playerId: p.id, subject: kept ? `${p.name}: “You kept your word”` : `${p.name}: “You promised me a signing”`,
    body: [kept ? `${p.name} is pleased: you promised a quality signing when he signed his contract, and one has arrived.` : `When ${p.name} signed his contract you promised a quality signing this window. None arrived. He is unhappy and will remember it the next time you talk contracts.`] });
  { const found = scoutingNetworkDay(state); if (found.length) addMessage(state, { category: 'scouting', from: 'Chief scout', subject: `Scouting reports: ${found.length === 1 ? 'new recommendations' : `${found.length} assignments report`}`, body: [...found, 'They are on the Scouting screen, graded against our squad.'], link: { screen: 'scouting', label: 'See recommendations' } }); }
  { // the day before your match (or on the day): the pre-match press conference
    const nf = nextUserFixture(state);
    const nd = nf ? state.calendar[nf.matchday - 1]?.date : undefined;
    if (nf && nd && nf.comp !== 'friendly' && state.press?.fixtureId !== nf.id && (Date.parse(nd) - Date.parse(today(state))) / 86_400_000 <= 1) {
      const o = matchOdds(state, nf.homeId, nf.awayId, nf.neutral);
      state.press = preMatchConference(state, nf, derbyName(state, nf.homeId, nf.awayId), nf.homeId === state.userClubId ? o.home : o.away);
      addMessage(state, { category: 'media', from: 'Press officer', subject: `Pre-match press conference: ${state.press.opp}`, body: [`The press are waiting before the game against ${state.press.opp}: ${state.press.questions.length} questions. Answer them, or send your assistant.`], link: { screen: 'press', label: 'Go to the press room' } });
    }
  }
  { const b = checkBadge(state); if (b) addMessage(state, { category: 'board', from: 'Coaching association', subject: `You have passed the ${b.name}`, body: [`Congratulations: you now hold the ${b.name}. Your coaching attributes have improved.`, 'Bigger clubs look for higher licences when they appoint a manager. See the Career screen.'] }); }
  const d = today(state), year = state.year;
  const us = state.clubs[state.userClubId];
  const log = (state.windowLog ??= {});
  const once = (key: string) => { const k = `${year}:${key}`; if (log[k]) return false; log[k] = true; return true; };
  const countries = new Set(Object.values(state.clubs).filter((c) => c.league).map((c) => c.country));
  for (const country of countries) {
    const w = windowsFor(country, year).find((x) => x.name === 'Winter');
    if (!w || d <= w.to || !once(`market-${country}`)) continue;
    let h = 0; for (const ch of country) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const deals = runMarket(state, createRng((state.rngState ^ h ^ 0x6a616e) >>> 0), 'January', seasonLabel(year), country);
    if (country === us.country) marketNews(state, 'January', deals.map((p) => p.id));
  }
  const fmt = (iso: string) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  for (const w of windowsFor(us.country, year)) {
    if (w.name === 'Winter' && d >= addDays(w.from, -21) && d <= w.to && once('rumours-winter')) rumourNews(state, makeRumours(state, createRng((state.rngState ^ 0x72756d) >>> 0), 'January'), 'January');
    if (d >= w.from && d <= w.to && once(`open-${w.name}`)) {
      const expiring = squadOf(state, state.userClubId).filter((p) => p.squad === 'First team' && p.contractEnd <= year);
      addMessage(state, { category: 'transfers', from: 'Director of football', subject: `The ${w.label} is open`, body: [
        `It closes on ${fmt(w.to)}. Bids, loans and signings can be made until then.`,
        ...(w.name === 'Winter' ? [expiring.length ? `${expiring.length} ${expiring.length === 1 ? 'player\'s contract ends' : 'players\' contracts end'} this summer: ${expiring.map((p) => p.name).join(', ')}. Renew them from their profiles or they will leave for free.` : 'No contracts run out this summer.'] : []),
      ] });
    }
    if (d === w.to && once(`deadline-${w.name}`)) addMessage(state, { category: 'transfers', from: 'Director of football', subject: `Deadline day: the ${w.label} closes tonight`, body: ['Any deal still to be done has to be done today.'] });
    if (d > w.to && once(`closed-${w.name}`)) {
      state.negotiations = {};
      addMessage(state, { category: 'transfers', from: 'Director of football', subject: `The ${w.label} has closed`, body: ['No more signings until the next window. Bids still open have lapsed.'] });
    }
  }
}

function seasonEndMessage(state: GameState) {
  const us = state.clubs[state.userClubId];
  if (!us.league) return;
  const table = leagueTableOf(state, us.league);
  const pos = table.findIndex((t) => t.clubId === us.id) + 1;
  const target = boardTarget(state, us.id);
  const mv = promotionsAndRelegations(state).moves[us.id];
  const ok = pos <= target.pos || mv?.dir === 'promoted';
  const l = leagueDef(state, us.league);
  const title = l?.titlePlayoff ? state.cups[`tp-${l.id}`] : undefined;
  const champion = l?.titlePlayoff ? title?.winner === us.id : pos === 1;
  addMessage(state, { category: 'board', from: 'The board', role: us.name, subject: champion ? `Champions! ${l?.titlePlayoff ? `You won the ${l.titlePlayoff.trophy}. ` : ''}The board is overjoyed` : mv?.dir === 'promoted' ? 'Promoted! The board is delighted' : mv?.dir === 'relegated' ? 'Relegated. A painful day for the club' : ok ? 'Season review: target met' : 'Season review: below expectations',
    body: [`We finished ${ordinal(pos)} in ${withThe(leagueName(state, us.league))}. The target was ${target.text}.${predictedPos(state, us.id) ? ` The pundits had us down for ${ordinal(predictedPos(state, us.id)!)}.` : ''}`,
      mv ? `Next season we play in ${withThe(leagueName(state, mv.to))}.${mv.dir === 'relegated' ? ' The board expects an immediate return.' : ''}` : ok ? 'The board is pleased with your work.' : 'The board expects improvement next season.',
      'Start the new season from the home screen when you are ready.'] });
}

/** A league table (the user's league by default). */
export function leagueTable(state: GameState, leagueId = state.clubs[state.userClubId].league ?? state.world.leagues[0].id): TableRow[] {
  return leagueTableOf(state, leagueId);
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
const STAGE = ['Winners', 'Final', 'Semi-final', 'Quarter-final', 'Round of 16', 'Knockout play-off', 'Round of 32', 'Round of 64', 'Round of 128', 'First round', 'Group stage', 'League phase'];

export function startNewSeason(state: GameState) {
  if (!seasonOver(state)) throw new Error('Season not finished');
  withSquadIndex(state, () => rollover(state));
  delete state.today; // the new season starts on its first fixture date
  delete state.talks;
  if (state.windowLog) for (const k of Object.keys(state.windowLog)) if (!k.startsWith(`${state.year}:`)) delete state.windowLog[k];
}

function rollover(state: GameState) {
  const rng = createRng(state.rngState ^ 0x9e3779b9);
  const fansAtEnd = state.fans?.mood;
  const targetAtEnd = state.clubs[state.userClubId]?.league ? boardTarget(state, state.userClubId).text : undefined;
  if (state.fans) fansNewSeason(state);
  delete state.injuryLog;
  const label = seasonLabel(state.year);
  const { moves, champions } = promotionsAndRelegations(state);
  const honours: Record<string, string> = {};
  const best = (id: string, kinds: string[]) => Object.values(state.comps).filter((c) => kinds.includes(c.kind)).map((c) => cupResult(state, c.id, id)).filter(Boolean)
    .sort((a, b) => STAGE.indexOf(a!) - STAGE.indexOf(b!))[0];
  for (const l of state.world.leagues) {
    const t = leagueTableOf(state, l.id);
    const mainCup = state.world.cups.find((c) => c.country === l.country && c.main);
    const secondCup = state.world.cups.find((c) => c.country === l.country && !c.main);
    t.forEach((row, i) => {
      const squad = squadOf(state, row.clubId);
      const top = squad.slice().sort((a, b) => b.current.goals - a.current.goals)[0];
      const rec: SeasonRecord = { season: label, division: l.name, pos: i + 1, pts: row.pts, champion: state.clubs[champions[l.id] ?? t[0].clubId].name,
        topScorer: top && top.current.goals ? { name: top.name, goals: top.current.goals } : undefined,
        manager: row.clubId === state.userClubId ? state.managerName : 'AI manager', isYou: row.clubId === state.userClubId,
        movement: moves[row.clubId]?.dir,
        cup: mainCup ? cupResult(state, mainCup.id, row.clubId) : undefined, leagueCup: secondCup ? cupResult(state, secondCup.id, row.clubId) : undefined,
        europe: best(row.clubId, ['continental']) };
      (state.history[row.clubId] ??= []).unshift(rec);
    });
    if (champions[l.id]) { const name = l.titlePlayoff?.trophy ?? l.name; award(state, champions[l.id], name, 'league', label); honours[champions[l.id]] = name; }
    if (l.titlePlayoff?.shield && t[0]) award(state, t[0].clubId, l.titlePlayoff.shield, 'cup', label);
  }
  for (const c of Object.values(state.comps)) {
    if (c.kind === 'league' || c.kind === 'playoff' || c.kind === 'title') continue;
    const w = state.cups[c.id]?.winner;
    if (!w) continue;
    award(state, w, c.name, c.kind === 'continental' ? 'continental' : c.kind === 'super' ? 'super' : 'cup', label);
    if (c.kind !== 'super') honours[w] = honours[w] ? `${honours[w]}, ${c.name}` : c.name;
  }
  // the board's verdict on your season, vacancies elsewhere, and offers
  {
    const c = career(state);
    const us = state.clubs[state.userClubId];
    const vac = vacanciesAfterSeason(state, rng, (id) => boardTarget(state, id));
    managersAfterSeason(state, rng, vac, honours, (id) => boardTarget(state, id));
    // every club without a manager now: this summer's sackings, retirements and jobs still open
    const open = Object.keys(state.clubs).filter((id) => id !== us.id && state.clubs[id].league && !managerOf(state, id));
    if (us.league) {
      const target = boardTarget(state, us.id);
      const t = leagueTableOf(state, us.league);
      const pos = t.findIndex((r) => r.clubId === us.id) + 1;
      const won = Object.values(state.comps).filter((x) => x.kind !== 'league' && x.kind !== 'playoff' && state.cups[x.id]?.winner === us.id).length;
      let sacked = seasonVerdict(state, target, { pos, champion: pos === 1, promoted: moves[us.id]?.dir === 'promoted', relegated: moves[us.id]?.dir === 'relegated', trophies: won });
      // the club vision: each objective judged, moving the board's trust
      const vj = judgeVision(state);
      c.trust = clamp(c.trust + vj.trust, 0, 100);
      if (!sacked && c.trust < 25) sacked = true;
      addMessage(state, { category: 'board', from: 'The board', role: us.name, subject: `Club vision: ${vj.trust >= 0 ? 'on course' : 'falling short'}`, body: [
        ...vj.lines, vj.trust >= 0 ? `The board's trust in you rises (${vj.trust >= 0 ? '+' : ''}${vj.trust}).` : `The board's trust in you falls (${vj.trust}).`] });
      if (!sacked) {
        const renewed = renewVisionIfDone(state);
        const takeover = maybeTakeover(state, createRng((state.rngState ^ 0x7a6b0e) >>> 0));
        if (takeover) addMessage(state, { category: 'board', from: 'Club statement', role: us.name, subject: 'The club has new owners', body: [...takeover, 'See the new club vision on the Career screen.'] });
        else if (renewed) addMessage(state, { category: 'board', from: 'The board', role: us.name, subject: 'A new club vision', body: [`The board has set new objectives: ${visionOf(state).goals.map((g) => g.text.toLowerCase()).join('; ')}.`] });
      }
      c.vacancies = open;
      c.offers = sacked ? makeOffers(state, rng, c.vacancies, 'sacked') : c.trust >= 60 ? makeOffers(state, rng, c.vacancies, 'good') : [];
      // a contract that runs out now: renewed if the board still believes in you, otherwise you leave
      if (!sacked && c.contract && c.contract.until <= state.year) {
        if (c.trust >= 45) {
          const old = c.contract.wage;
          c.contract = { wage: Math.max(Math.round(old * (pos === 1 ? 1.25 : 1.1) / 1000) * 1000, managerWage(state, us.id)), until: state.year + 2 };
          addMessage(state, { category: 'board', from: 'The board', role: us.name, subject: 'Your contract is renewed', body: [
            `Your contract was due to end this summer. The board has extended it for two more seasons, with your wage up from ${Math.round(old / 1000)}k to ${Math.round(c.contract.wage / 1000)}k a week.`] });
        } else {
          c.sacked = true;
          c.offers = makeOffers(state, rng, c.vacancies, 'sacked');
          addMessage(state, { category: 'board', from: 'The board', role: us.name, subject: 'Your contract will not be renewed', body: [
            `Your contract ends this summer and the board has decided not to offer a new one.`,
            `${c.offers.length} club${c.offers.length === 1 ? '' : 's'} would give you a new start, and ${c.vacancies.length} clubs are looking for a manager. Choose your next job on the Career screen.`] });
        }
      }
      if (sacked) {
        const comp = compensation(state);
        c.earnings = (c.earnings ?? 0) + comp;
        c.sacked = true;
        addMessage(state, { category: 'board', from: 'The board', role: us.name, subject: 'You have been sacked', body: [
          `Finishing ${ordinal(pos)} against a target of ${target.text} was not good enough. The board has ended your contract, with ${Math.round(comp / 1e5) / 10}M in compensation.`,
          `${c.offers.length} club${c.offers.length === 1 ? '' : 's'} would give you a new start, and ${c.vacancies.length} clubs are looking for a manager. Choose your next job on the Career screen.`] });
      } else if (c.offers.length) {
        addMessage(state, { category: 'board', from: 'Your agent', subject: `${c.offers.length} club${c.offers.length === 1 ? '' : 's'} want you`, body: [
          ...c.offers.map((o) => o.note), 'You can accept on the Career screen until the end of next season, or stay where you are.'] });
      }
    }
  }
  afterSeason(state, { promoted: moves[state.userClubId]?.dir === 'promoted', champion: Object.values(champions).includes(state.userClubId) });
  const tables = Object.fromEntries(state.world.leagues.map((l) => [l.id, leagueTableOf(state, l.id)]));
  const money = seasonFinances(state, tables);
  const nextQualified = qualifiers(state);

  // the summer's international tournaments, with this season's squads
  // your live tournament (if you managed one this summer) is already played; the rest are simulated now
  const lived = state.summer ? summerStep(state) : undefined;
  const played = state.summer && lived?.run ? { id: state.summer.id, run: lived.run } : undefined;
  state.summer = undefined;
  for (const run of playSummer(state, rng, played)) {
    const t = run.tournament;
    const mine = run.userPlayers;
    addMessage(state, { category: 'media', from: 'International desk', subject: `${NATION[t.winner].name} win the ${t.name}`, body: [
      ...run.messages,
      ...(mine.length ? [`${mine.length} of our players went: ${mine.map((p) => `${p.name} (${NATION[p.nation].name}, ${p.reached.toLowerCase()})`).join(', ')}.`] : ['None of our players were called up.']),
      ...mine.filter((p) => p.reached === 'Winners').map((p) => `${p.name} is a champion with ${NATION[p.nation].name}!`),
    ] });
    const un = run.userNation;
    if (un && state.nationalJob) {
      const nation = NATION[un.code].name;
      if (un.reached === 'Winners') state.manager.trophies.push(t.name);
      afterTournament(state, t.name, un.reached);
      const verdict = un.reached === 'Winners' ? `You won the ${t.name} with ${nation}!`
        : un.reached === 'Did not qualify' ? `${nation} failed to qualify for the ${t.name}.`
        : un.reached === 'Runners-up' ? `${nation} lost the final of the ${t.name}.`
        : un.reached === 'Group stage' ? `${nation} went out in the group stage of the ${t.name}.`
        : `${nation} reached the ${un.reached.toLowerCase()} of the ${t.name}.`;
      // a big nation that goes out early (or misses out) dismisses its manager
      const rank = nationRanking(state, createRng(state.year)).findIndex((q) => q.code === un.code) + 1;
      const sacked = (un.reached === 'Did not qualify' || un.reached === 'Group stage') && rank <= 16;
      addMessage(state, { category: 'board', from: `${nation} FA`, role: 'National team', subject: sacked ? `${nation} dismiss you` : `${t.name}: ${un.reached}`, body: [
        verdict,
        `Your record with ${nation}: ${state.nationalJob.w} won, ${state.nationalJob.d} drawn, ${state.nationalJob.l} lost.`,
        sacked ? 'The federation expected much more and has ended your contract. Other nations may still call.' : 'The federation would like you to stay on.',
      ] });
      if (sacked) state.nationalJob = undefined;
    }
  }
  tidySelection(state);

  recordSeason(state, label);
  {
    const a = seasonAwards(state, label);
    archiveReview(state, targetAtEnd, fansAtEnd);
    addMessage(state, { category: 'media', from: 'Football awards', subject: a.ball[0] ? `${a.ball[0].name} wins the Golden Ball` : `${label} awards`, body: awardsMessage(state, a) });
  }
  for (const p of Object.values(state.players)) {
    if (p.current.apps) p.career.unshift({ season: label, club: `${state.clubs[p.clubId]?.name ?? 'Free agent'}${p.loan ? ' (loan)' : ''}`, apps: p.current.apps, goals: p.current.goals, rating: Math.round((p.current.ratingSum / p.current.apps) * 100) / 100, honour: honours[p.clubId] });
    if (p.career.length > 12) p.career.length = 12;
    p.current = { apps: 0, goals: 0, assists: 0, ratingSum: 0 };
    p.yellowCards = 0; p.suspendedFor = 0;
  }
  returnLoans(state);
  expireContracts(state);
  for (const p of Object.values(state.players)) {
    develop(rng, p, p.career[0]?.apps ?? 0);
    p.age++;
    // your players' development history, season by season (visible attributes only)
    if (p.clubId === state.userClubId) { (p.history ??= []).push({ season: seasonLabel(state.year + 1), ...groupAverages(p) }); if (p.history.length > 15) p.history.shift(); }
    p.value = Math.round(valueFor(p.ability, p.potential, p.age) * awardPremium(p, label));
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
  for (const [id, m] of Object.entries(moves)) {
    const c = state.clubs[id];
    c.league = m.to;
    c.division = leagueDef(state, m.to)!.tier;
    c.reputation = clamp(c.reputation + (m.dir === 'promoted' ? 4 : -4), 15, 95);
  }
  resetLeagueCache(state);
  const userMove = moves[state.userClubId]?.dir;
  summerWages(state, userMove);
  { const lines = affiliateSummer(state); if (lines.length) addMessage(state, { category: 'finance', from: 'Director of football', subject: 'Affiliate clubs: this season\'s fees', body: lines, link: { screen: 'affiliates', label: 'Affiliate clubs' } }); }

  state.year++;
  const summerDeals = runMarket(state, rng, 'Summer', seasonLabel(state.year));
  aiTransfers(state, rng);
  marketNews(state, 'Summer', summerDeals.map((p) => p.id));
  pruneFreeAgents(state);
  {
    // free agents by position, best first: built once (scanning every player per gap was slow)
    const fas = new Map<string, Player[]>();
    for (const p of Object.values(state.players)) if (p.clubId === FREE_AGENT && p.age <= 33) { const l = fas.get(p.pos); if (l) l.push(p); else fas.set(p.pos, [p]); }
    for (const l of fas.values()) l.sort((a, b) => b.ability - a.ability);
    for (const c of Object.values(state.clubs)) refillSquad(state, rng, c, fas);
  }
  youthIntake(state, rng);
  refreshPool(state, rng);
  state.preseason = 0; state.friendlyFees = {};
  makeFriendlyOffers(state, rng);
  const opened = finishBuilding(state);
  if (opened) addMessage(state, { category: 'board', from: 'The board', role: state.clubs[state.userClubId].name, subject: 'The new stands are open', body: [opened] });
  state.qualified = nextQualified;
  buildComps(state);
  state.calendar = makeCalendar(state, state.year);
  setupSeason(state, rng);
  state.matchday = 1;
  state.lineup = pickLineup(squadOf(state, state.userClubId), state.formation);
  state.rngState = rng.state();
  for (const p of Object.values(state.players)) { p.caStart = p.ability; p.progress = {}; p.condition = 95; }
  { makePredictions(state); const pv = previewMessage(state); if (pv) addMessage(state, { category: 'media', from: 'Season preview', ...pv }); }
  state.lastLedger = state.ledger;
  state.ledger = emptyLedger();
  state.ledger.balanceHistory.push(state.clubs[state.userClubId].balance);
  const us = state.clubs[state.userClubId];
  const target = boardTarget(state, us.id);
  const m = (n: number) => `${Math.round(n / 1e5) / 10}M`;
  addMessage(state, { category: 'board', from: 'The board', role: us.name, subject: `New season: ${seasonLabel(state.year)} in ${withThe(leagueName(state, us.league))}`, body: [
    `${userMove === 'promoted' ? 'Welcome to a higher level! ' : userMove === 'relegated' ? 'A new start after relegation. ' : ''}The board's target: ${target.text}.`,
    `Prize money last season: ${m(money.prize)}. Club reputation ${money.repChange > 0 ? 'rose' : money.repChange < 0 ? 'fell' : 'held steady'} (${us.reputation}).`,
    `Your transfer budget is ${m(money.transferBudget)} and the wage budget is ${Math.round(money.wageBudget / 1000)}k a week.`,
    ...Object.values(state.comps).filter((c) => c.kind === 'continental' && (state.qualified[c.id] ?? []).includes(us.id)).map((c) => `We have qualified for ${withThe(c.name)}.`),
    ...(money.balance < 0 ? ['The club is in debt. The board has cut the transfer budget and expects you to sell before buying.'] : [])] });
  if (!state.nationalJob) {
    const offers = jobOffers(state, nationRanking(state, createRng(state.year * 100 + 7)).map((q) => q.code));
    if (offers.length) addMessage(state, { category: 'board', from: 'International football', subject: 'National teams would talk to you', body: [
      `With your reputation (${managerReputation(state)}), these national teams would appoint you alongside your club job: ${offers.map((o) => NATION[o.code].name).join(', ')}.`,
      'See International → National team to take a job, pick your squad and formation.'] });
  }
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

function refillSquad(state: GameState, rng: ReturnType<typeof createRng>, c: Club, fas: Map<string, Player[]>) {
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
      const list = fas.get(pos) ?? [];
      const at = c.id !== state.userClubId ? list.findIndex((p) => p.clubId === FREE_AGENT && p.ability >= level - 25) : -1;
      const fa = at >= 0 ? list.splice(at, 1)[0] : undefined;
      if (fa) {
        Object.assign(fa, { clubId: c.id, number: freeNumber(state, c.id), wage: wageFor(fa.ability, c.reputation), contractEnd: state.year + 2, joined: state.year });
        continue;
      }
      const age = rng.int(22, 29);
      const ca = clamp(Math.round(rng.normal(60 + c.reputation * 1.1, 8)), 60, 185);
      const p = makePlayer(rng, { id: `p${state.nextId++}`, clubId: c.id, pos: pos as Player['pos'], ca, pa: ca + rng.int(0, 10), age, squad: 'First team', number: freeNumber(state, c.id), year: state.year, reputation: c.reputation, country: c.country });
      state.players[p.id] = p; noteJoined(state, p);
      if (c.id === state.userClubId) addMessage(state, { category: 'transfers', from: 'Director of football', subject: `${p.name} (${p.pos}) joins on a free transfer`, body: [`To keep the squad at full strength, we have signed ${p.name}, ${p.age}, a ${p.pos}.`] });
    }
  }
}

/**
 * Summer business for computer-run clubs: rich clubs buy better players (releasing their weakest),
 * clubs deep in debt sell their most valuable player abroad. Keeps money moving and squads competitive.
 */
function aiTransfers(state: GameState, rng: ReturnType<typeof createRng>) {
  const abroad = Object.values(state.clubs).filter((c) => c.country !== state.clubs[state.userClubId].country && c.reputation >= 60);
  for (const c of Object.values(state.clubs)) {
    if (c.id === state.userClubId || !c.league) continue;
    const reserve = c.reputation * c.reputation * 5000;
    const ft = firstTeam(state, c.id);
    if (c.balance < -8_000_000 && ft.length > 16) {
      const star = ft.slice().sort((a, b) => b.value - a.value)[0];
      const buyer = rng.pick(abroad);
      c.balance += star.value; c.transferBudget += Math.round(star.value * 0.5);
      Object.assign(star, { clubId: buyer.id, number: freeNumber(state, buyer.id), captain: false, joined: state.year });
      recordTransfer(state, star.name, c.name, buyer.name, star.value, seasonLabel(state.year), { playerId: star.id, fromId: c.id, toId: buyer.id, distress: true });
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
      const p = makePlayer(rng, { id: `p${state.nextId++}`, clubId: c.id, pos: weakest.pos, ca, pa: ca + rng.int(0, 8), age, squad: 'First team', number: weakest.number, year: state.year, reputation: c.reputation, country: c.country });
      p.joined = state.year;
      state.players[p.id] = p; noteJoined(state, p);
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
    if (!c.league || c.country !== state.world.userCountry) continue; // youth academies are simulated in the user's country only
    // U21 players who turn 22 leave if not promoted; U18 aged 18+ move up to U21
    for (const p of squadOf(state, c.id)) {
      if (p.squad === 'U18' && p.age >= 18) p.squad = 'U21';
      else if (p.squad === 'U21' && p.age >= 22) delete state.players[p.id];
    }
    if (c.id === state.userClubId && state.youth) {
      // your chosen candidates join (the best four if you didn't choose)
      const joined = signIntake(state, (p) => { const id = `p${state.nextId++}`; Object.assign(p, { id, clubId: c.id, number: freeNumber(state, c.id) }); state.players[id] = p; noteJoined(state, p); });
      const fee = regionFee(state) * (state.youthRegions?.length ?? 0);
      if (fee) { c.balance -= fee; state.ledger.expenses.staff += fee; }
      addMessage(state, { category: 'youth', from: 'Head of youth development', subject: 'Youth intake has arrived', body: [`${joined.length} new players join the U18s: ${joined.map((p) => `${p.name} (${p.pos})`).join(', ')}.`, ...(fee ? [`Our youth scouting abroad cost ${Math.round(fee / 1e5) / 10}M this year.`] : []), 'Keep an eye on their development in the Academy.'] });
      continue;
    }
    const n = rng.int(3, 5);
    const names: string[] = [];
    for (let i = 0; i < n; i++) {
      const pos = rng.pick(['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'AM', 'LW', 'RW', 'ST'] as const);
      const pa = clamp(Math.round(rng.normal(115 + c.reputation * 0.35 + (c.id === state.userClubId ? youthPotentialBonus(state) + youthFacilityBonus(state) + youthIntakeBonus(state) : 0), 20)), 70, 195);
      const p = makePlayer(rng, { id: `p${state.nextId++}`, clubId: c.id, pos, ca: rng.int(40, 70), pa, age: rng.int(15, 16), squad: 'U18', number: freeNumber(state, c.id), year: state.year, reputation: c.reputation, country: c.country });
      state.players[p.id] = p; noteJoined(state, p); names.push(`${p.name} (${p.pos})`);
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
  const l = state.clubs[state.userClubId]?.league;
  const cas = Object.values(state.players).filter((p) => p.squad === 'First team' && state.clubs[p.clubId]?.league === l).map((p) => p.ability);
  return { low: Math.min(...cas), high: Math.max(...cas) };
}
export function youthScale() { return { low: 35, high: 140 }; }

export function setAutoRotate(state: GameState, on: boolean) { state.autoRotate = on; }
export function setInstructions(state: GameState, change: Partial<Instructions>) { saveActive(state, { instr: change }); }

export function setTactics(state: GameState, formation: Formation, lineup: string[]) {
  if (formation !== state.formation) saveActive(state, { formation });
  state.formation = formation;
  state.lineup = lineup;
}
/** Sets (or, with none, clears) a separate shape without the ball for the active tactic. */
export function setDefFormation(state: GameState, f: Formation | null) { saveActive(state, { defFormation: f }); }

/** Changes the role and duty in one slot of the active tactic. */
export function setRole(state: GameState, index: number, role: SlotRole) {
  const roles = fixRoles(state.formation, state.roles);
  roles[index] = role;
  saveActive(state, { roles });
}
/** Switches tactic (A/B/C) and picks the best eleven for its shape if the shape changed. */
export function useTactic(state: GameState, index: number) {
  const before = state.formation;
  switchTactic(state, index);
  if (state.formation !== before) state.lineup = bestLineup(state);
}
/** Replaces the active tactic with a style preset. */
export function applyPreset(state: GameState, presetId: string) {
  const before = state.formation;
  loadPreset(state, presetId);
  if (state.formation !== before) state.lineup = bestLineup(state);
}

export function bestLineup(state: GameState, formation: Formation = state.formation) {
  return pickLineup(squadOf(state, state.userClubId), formation);
}

/** Fills fields added after v0.2 so older saves keep working. (v1 saves can't be converted: see store.ts.) */
export function migrate(state: GameState): GameState {
  if (!state.world.rivalries && state.world.source === 'real') state.world.rivalries = REAL_RIVALRIES.filter((r) => state.clubs[r.a] && state.clubs[r.b]);
  if (state.world.source !== 'builtin') reserveNames(Object.values(state.players).filter((p) => !p.filler && !p.id.startsWith('nt-')).map((p) => p.name));
  for (const p of Object.values(state.players)) if (p.nationality && p.nationality.length > 3) p.nationality = nationCode(p.nationality) ?? p.nationality;
  state.knowledge ??= {}; state.scouting ??= []; state.shortlist ??= []; state.transferListed ??= [];
  state.bids ??= []; state.negotiations ??= {}; state.installments ??= [];
  state.training ??= defaultTraining(); state.ledger ??= emptyLedger(); state.autoRotate ??= true;
  career(state);
  profileOf(state);
  if (!state.staff) initStaff(state, createRng(state.rngState ^ 0x5eed));
  managers(state);
  ensureFamiliarity(state);
  if (!state.predictions) withSquadIndex(state, () => makePredictions(state));
  return state;
}

export function markRead(state: GameState, id: string) { const m = state.inbox.find((x) => x.id === id); if (m) m.unread = false; }
