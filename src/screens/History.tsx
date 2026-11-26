import { useState } from 'react';
import { FD } from '../ds';
import { leagueScale } from '../engine/game';
import { topLeague } from '../engine/competitions';
import { leagueLabel } from './comp-ui';
import { badgeUrl } from './badge';
import type { GameState, Player } from '../engine/types';

export default function History({ g }: { g: GameState }) {
  const [tab, setTab] = useState('seasons');
  const club = g.clubs[g.userClubId];
  // everything the club has won, plus the big ones still to win
  const won = g.trophies[club.id] ?? [];
  // everything the club has won, plus the big prizes in its country still to win
  const top = topLeague(g, club.country);
  const mainCups = g.world.cups.filter((c) => c.country === club.country).map((c) => c.name);
  const cont = g.world.continental.filter((k) => k.places[club.country]).sort((a, b) => a.rank - b.rank).map((k) => k.name);
  const targets = [...new Set([leagueLabel(g, club.league), ...(top ? [top.name] : []), ...mainCups, ...cont.slice(0, 1)])];
  const order = [top?.name, ...cont, ...g.world.leagues.filter((l) => l.country === club.country).map((l) => l.name), ...mainCups];
  const tierOf = (name: string) => (cont.includes(name) ? 'continental' as const : g.world.leagues.some((l) => l.name === name) ? 'league' as const : 'cup' as const);
  const trophies = [...won, ...targets.filter((t) => !won.some((w) => w.name === t)).map((name) => ({ name, tier: tierOf(name), seasons: [] as string[] }))]
    .sort((a, b) => (order.indexOf(a.name) + 99) % 99 - (order.indexOf(b.name) + 99) % 99);
  const seasons = g.history[club.id] ?? [];
  const everyone = Object.values(g.players).filter((p) => p.career.some((c) => c.club === club.name) || (p.clubId === club.id && p.current.apps));
  const total = (p: Player, k: 'apps' | 'goals') => p.career.filter((c) => c.club === club.name).reduce((s, c) => s + c[k], 0) + (p.clubId === club.id ? p.current[k] : 0);
  const topApps = everyone.slice().sort((a, b) => total(b, 'apps') - total(a, 'apps'))[0];
  const topGoals = everyone.slice().sort((a, b) => total(b, 'goals') - total(a, 'goals'))[0];
  const bestSeason = (g.history[club.id] ?? []).slice().sort((a, b) => b.pts - a.pts)[0];
  const allMatches = g.fixtures.filter((f) => f.result && (f.homeId === club.id || f.awayId === club.id));
  const bigWin = allMatches.map((f) => { const home = f.homeId === club.id; const [h, a] = f.result!.score; return { f, d: home ? h - a : a - h, s: home ? `${h}–${a}` : `${a}–${h}`, opp: g.clubs[home ? f.awayId : f.homeId].name }; }).sort((a, b) => b.d - a.d)[0];
  const legends = everyone.filter((p) => total(p, 'apps') >= 100).sort((a, b) => total(b, 'apps') - total(a, 'apps')).slice(0, 8)
    .map((p) => ({ name: p.name, number: p.number, pos: p.pos, years: `${p.career.length ? p.career[p.career.length - 1].season.slice(0, 4) : g.year}–${p.clubId === club.id ? 'now' : ''}`, peakAbility: Math.max(p.ability, p.potential * 0.97), apps: total(p, 'apps'), goals: total(p, 'goals'), trophies: p.career.filter((c) => c.honour && c.club === club.name).length }));
  const tabs: Array<[string, string]> = [['seasons', 'Season by season'], ['legends', 'Hall of fame'], ['records', 'Records'], ['career', 'Your career']];
  return (
    <div className="pg-stack">
      <div className="pg-head" style={{ marginBottom: 0 }}><div className="club-cell"><img className="club-badge club-badge--lg" src={badgeUrl(club)} alt="" /><div><h1 className="pg-title">{club.name}</h1><p className="pg-sub">Founded {club.founded} · {club.stadium} ({club.capacity.toLocaleString('en-GB')}) {club.nickname ? ` · “${club.nickname}”` : ''}</p></div></div></div>
      <FD.TrophyCabinet trophies={trophies} />
      <div className="fd-tabs" role="tablist" style={{ margin: 0 }}>
        {tabs.map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={tab === k} className={'fd-tab' + (tab === k ? ' is-on' : '')} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      {tab === 'seasons' && (seasons.length ? <FD.SeasonHistory seasons={seasons} /> : <div className="pg-card pg-empty">Your first season is under way. Finished seasons appear here.</div>)}
      {tab === 'legends' && (legends.length ? <FD.HallOfFame legends={legends} scale={leagueScale(g)} /> : <div className="pg-card pg-empty">Players with 100 appearances for the club enter the hall of fame. Nobody has made it yet.</div>)}
      {tab === 'records' && <FD.ClubRecords groups={[
        { title: 'Players', icon: 'squad', records: [
          topApps && total(topApps, 'apps') ? { label: 'Most appearances', value: total(topApps, 'apps'), holder: topApps.name } : { label: 'Most appearances', value: '–' },
          topGoals && total(topGoals, 'goals') ? { label: 'Top scorer', value: total(topGoals, 'goals'), holder: topGoals.name } : { label: 'Top scorer', value: '–' } ] },
        { title: 'Matches', icon: 'fixtures', records: [
          bigWin && bigWin.d > 0 ? { label: 'Biggest win this season', value: bigWin.s, holder: `vs ${bigWin.opp}` } : { label: 'Biggest win this season', value: '–' },
          bestSeason ? { label: 'Most points in a season', value: bestSeason.pts, holder: bestSeason.season } : { label: 'Most points in a season', value: '–' } ] },
      ]} />}
      {tab === 'career' && <FD.ManagerCareer manager={{ name: g.managerName, reputation: g.manager.trophies.length ? 'Title-winning manager' : 'Up-and-coming manager',
        clubs: [{ club: club.name, division: leagueLabel(g, club.league), from: g.manager.since, to: null, w: g.manager.w, d: g.manager.d, l: g.manager.l, trophies: g.manager.trophies }] }} />}
    </div>
  );
}
