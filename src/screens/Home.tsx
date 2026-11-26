import { FD } from '../ds';
import { boardTarget, currentDate, leagueTable, nextUserFixture, ordinal, seasonOver } from '../engine/game';
import { compInfo, cupResult, topLeague } from '../engine/competitions';
import type { GameState } from '../engine/types';
import { fixtureCardProps, leagueLabel, zonesFor } from './comp-ui';
import { toCur } from '../store';
import type { Screen } from './shared';
import { bidsFor } from './shared-transfers';

export default function Home({ g, go, onPlay }: { g: GameState; go: (s: Screen, id?: string) => void; onPlay: () => void }) {
  const cur = g.currency;
  const club = g.clubs[g.userClubId];
  const table = leagueTable(g);
  const pos = table.findIndex((t) => t.clubId === g.userClubId) + 1;
  const played = table[pos - 1].p;
  const target = boardTarget(g, g.userClubId);
  const next = nextUserFixture(g);
  const isNow = next && next.matchday === g.matchday;
  const last = g.fixtures.filter((f) => f.result && (f.homeId === g.userClubId || f.awayId === g.userClubId)).sort((a, b) => a.matchday - b.matchday).pop();
  const cups = Object.values(g.comps).filter((c) => c.kind === 'cup' || c.kind === 'continental').map((c) => ({ c: c.id, r: cupResult(g, c.id, club.id) })).filter((x) => x.r);
  void topLeague;
  const over = seasonOver(g);
  const conf = played === 0 ? 70 : Math.max(5, Math.min(98, 100 - (pos - target.pos) * 12 - (pos > target.pos ? 10 : 0)));
  const confWord = conf >= 80 ? 'Very pleased' : conf >= 60 ? 'Satisfied' : conf >= 40 ? 'Concerned' : 'Losing patience';
  const mine = Object.values(g.players).filter((p) => p.clubId === g.userClubId);
  const alerts = [
    ...bidsFor(g).map(({ b, p }) => ({ icon: 'transfers', tone: 'fd-ok', t: `Bid for ${p.name}`, s: `${g.clubs[b.fromClubId].name} offer ${FD.formatMoney(toCur(b.fee, cur), cur)}`, id: p.id, screen: 'scouting' as Screen })),
    ...g.lineup.map((id) => g.players[id]).filter((p) => p && (p.condition ?? 100) < 70).map((p) => ({ icon: 'training', tone: 'fd-warn', t: `${p.name}: tired (${Math.round(p.condition ?? 100)}%)`, s: g.autoRotate !== false ? 'Will be rested if a fresh player is available' : 'Consider resting this player', id: p.id, screen: 'tactics' as Screen })),
    ...mine.filter((p) => p.injuredFor > 0).map((p) => ({ icon: 'injury', tone: 'fd-money--neg', t: `${p.name}: injured`, s: `Out ${p.injuredFor} more ${p.injuredFor === 1 ? 'match' : 'matches'}`, id: p.id })),
    ...mine.filter((p) => p.suspendedFor > 0).map((p) => ({ icon: 'booking', tone: 'fd-money--neg', t: `${p.name}: suspended`, s: 'Misses the next match', id: p.id })),
    ...mine.filter((p) => p.squad === 'First team' && p.contractEnd <= g.year).map((p) => ({ icon: 'contract', tone: 'fd-warn', t: `${p.name}: contract expiring`, s: 'Ends this summer', id: p.id })),
    ...mine.filter((p) => p.squad === 'First team' && p.morale === 'low').map((p) => ({ icon: 'morale-low', tone: 'fd-warn', t: `${p.name}: unhappy`, s: 'Low morale', id: p.id })),
  ].slice(0, 5);
  const unread = g.inbox.filter((m) => m.unread).slice(0, 3);
  const greeting = over ? 'The season is over' : pos === 1 && played > 0 ? 'Top of the league, boss' : `Good morning, ${g.managerName.startsWith('The ') ? g.managerName.toLowerCase() : g.managerName.split(' ')[0]}`;
  const lead = played === 0 ? `A new season in the ${leagueLabel(g, club.league)} starts ${currentDate(g)}. The board wants ${target.text}.`
    : over ? `You finished ${ordinal(pos)}. Read the board's review, then start the new season.`
    : `${ordinal(pos)} after ${played} ${played === 1 ? 'match' : 'matches'}, ${pos === 1 ? `${table[0].pts - table[1].pts} ${table[0].pts - table[1].pts === 1 ? 'point' : 'points'} clear` : `${table[0].pts - table[pos - 1].pts} points off the top`}.`;

  return (
    <div>
      <div className="pg-head"><div><h1 className="pg-title">{greeting}</h1><p className="pg-sub">{lead}</p></div></div>
      <div className="hm-grid">
        <div className="hm-col">
          <h2 className="pg-h">Next match</h2>
          {next ? <FD.FixtureCard {...fixtureCardProps(g, next)} action={isNow ? <FD.Button size="sm" icon="play" onClick={onPlay}>Play match</FD.Button> : <FD.Button size="sm" variant="secondary" icon="sim" onClick={onPlay}>Continue to it</FD.Button>} />
            : <div className="pg-card hm-note">{over ? 'No more league matches this season.' : 'No match this week.'}</div>}
          {last && <>
            <h2 className="pg-h">Last result</h2>
            <FD.FixtureCard {...fixtureCardProps(g, last)} action={<FD.Button size="sm" variant="ghost" onClick={() => go('match', last.id)}>Match report</FD.Button>} />
          </>}
        </div>
        <div className="hm-col">
          <h2 className="pg-h">{leagueLabel(g, club.league)}</h2>
          <FD.LeagueTable compact rows={table.map((r) => ({ ...r }))} zones={zonesFor(g, club.league)} />
          <button className="pg-link" style={{ alignSelf: 'flex-start' }} onClick={() => go('table')}>Full table</button>
          {cups.length > 0 && <>
            <h2 className="pg-h">Cups</h2>
            <div className="pg-card hm-fin">
              {cups.map(({ c, r }) => {
                const out = r !== 'Winners' && g.cups[c]?.exits[club.id];
                return <div key={c}><span className="pg-h">{compInfo(g, c).name}</span><strong className={r === 'Winners' ? 'fd-gold' : out ? 'fd-muted' : 'fd-ok'}>{r === 'Winners' ? 'Winners' : out ? `Out (${r})` : r}</strong></div>;
              })}
            </div>
          </>}
          <h2 className="pg-h">Board</h2>
          <div className="pg-card hm-board">
            <div className="hm-board__row"><span className="pg-h">Board confidence</span><strong className={conf >= 60 ? 'fd-ok' : conf >= 40 ? 'fd-warn' : 'fd-money--neg'}>{confWord}</strong></div>
            <span className="fd-meter fd-meter--wide"><span className={`fd-meter__bar fd-meter__bar--${conf >= 60 ? 'low' : conf >= 40 ? 'medium' : 'high'}`} style={{ width: conf + '%' }} /></span>
            <p className="hm-note">Target: {target.text}. {played ? `Currently ${ordinal(pos)}.` : ''}</p>
          </div>
        </div>
        <div className="hm-col">
          <h2 className="pg-h">Inbox</h2>
          <ul className="pg-card hm-list">
            {unread.length ? unread.map((m) => (
              <li key={m.id} className="hm-item"><button onClick={() => go('inbox', m.id)}>
                <span className="hm-item__icon"><FD.Icon name={m.category === 'board' ? 'crown' : m.category === 'medical' ? 'injury' : m.category === 'youth' ? 'youth' : m.category === 'transfers' ? 'transfers' : 'inbox'} size={18} /></span>
                <span className="hm-item__text"><strong>{m.subject}</strong><span className="fd-muted">{m.from} · {m.date}</span></span>
              </button></li>)) : <li className="hm-item hm-note">No unread messages.</li>}
          </ul>
          <h2 className="pg-h">Squad alerts</h2>
          <ul className="pg-card hm-list">
            {alerts.length ? alerts.map((a) => (
              <li key={a.t} className="hm-item"><button onClick={() => { const to = (a as { screen?: Screen }).screen; if (to) go(to); else go('player', a.id); }}>
                <span className={`hm-item__icon ${a.tone}`}><FD.Icon name={a.icon} size={18} /></span>
                <span className="hm-item__text"><strong>{a.t}</strong><span className="fd-muted">{a.s}</span></span>
              </button></li>)) : <li className="hm-item hm-note">Everyone is fit and available.</li>}
          </ul>
          <h2 className="pg-h">Finances</h2>
          <div className="pg-card hm-fin">
            <div><span className="pg-h">Balance</span><strong><FD.Money amount={toCur(club.balance, cur)} currency={cur} /></strong></div>
            <div><span className="pg-h">Transfer budget</span><strong><FD.Money amount={toCur(club.transferBudget, cur)} currency={cur} /></strong></div>
            <div><span className="pg-h">Profit this season</span><strong><FD.Money amount={toCur(Object.values(g.ledger.income).reduce((a, b) => a + b, 0) - Object.values(g.ledger.expenses).reduce((a, b) => a + b, 0), cur)} currency={cur} signed /></strong></div>
            <div><span className="pg-h">Wage bill</span><strong><FD.Money amount={toCur(mine.reduce((s, p) => s + p.wage, 0), cur)} currency={cur} perWeek /></strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}
