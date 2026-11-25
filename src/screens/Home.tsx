import { FD } from '../ds';
import { boardTarget, currentDate, leagueTable, ordinal, seasonOver, userFixture } from '../engine/game';
import { formatDate } from '../engine/fixtures';
import type { Fixture, GameState } from '../engine/types';
import { toCur } from '../store';
import type { Screen } from './shared';
import { bidsFor } from './shared-transfers';

export function fixtureCardProps(g: GameState, f: Fixture) {
  const H = g.clubs[f.homeId], A = g.clubs[f.awayId];
  const table = leagueTable(g);
  const form = (id: string) => table.find((t) => t.clubId === id)?.form;
  return {
    competition: 'Premier Division', matchday: `Matchday ${f.matchday}`, status: f.result ? 'FT' : 'upcoming', score: f.result?.score,
    date: formatDate(f.date), kickoff: '15:00', venue: H.stadium,
    home: { name: H.name, short: H.short, isUser: H.id === g.userClubId, form: form(H.id) },
    away: { name: A.name, short: A.short, isUser: A.id === g.userClubId, form: form(A.id) },
  };
}

export default function Home({ g, go, onPlay }: { g: GameState; go: (s: Screen, id?: string) => void; onPlay: () => void }) {
  const cur = g.currency;
  const club = g.clubs[g.userClubId];
  const table = leagueTable(g);
  const pos = table.findIndex((t) => t.clubId === g.userClubId) + 1;
  const played = table[pos - 1].p;
  const target = boardTarget(g, g.userClubId);
  const next = userFixture(g);
  const last = g.fixtures.filter((f) => f.result && (f.homeId === g.userClubId || f.awayId === g.userClubId)).pop();
  const over = seasonOver(g);
  const conf = played === 0 ? 70 : Math.max(5, Math.min(98, 100 - (pos - target.pos) * 12 - (pos > target.pos ? 10 : 0)));
  const confWord = conf >= 80 ? 'Very pleased' : conf >= 60 ? 'Satisfied' : conf >= 40 ? 'Concerned' : 'Losing patience';
  const mine = Object.values(g.players).filter((p) => p.clubId === g.userClubId);
  const alerts = [
    ...bidsFor(g).map(({ b, p }) => ({ icon: 'transfers', tone: 'fd-ok', t: `Bid for ${p.name}`, s: `${g.clubs[b.fromClubId].name} offer ${FD.formatMoney(toCur(b.fee, cur), cur)}`, id: p.id, screen: 'scouting' as Screen })),
    ...mine.filter((p) => p.injuredFor > 0).map((p) => ({ icon: 'injury', tone: 'fd-money--neg', t: `${p.name}: injured`, s: `Out ${p.injuredFor} more ${p.injuredFor === 1 ? 'match' : 'matches'}`, id: p.id })),
    ...mine.filter((p) => p.suspendedFor > 0).map((p) => ({ icon: 'booking', tone: 'fd-money--neg', t: `${p.name}: suspended`, s: 'Misses the next match', id: p.id })),
    ...mine.filter((p) => p.squad === 'First team' && p.contractEnd <= g.year).map((p) => ({ icon: 'contract', tone: 'fd-warn', t: `${p.name}: contract expiring`, s: 'Ends this summer', id: p.id })),
    ...mine.filter((p) => p.squad === 'First team' && p.morale === 'low').map((p) => ({ icon: 'morale-low', tone: 'fd-warn', t: `${p.name}: unhappy`, s: 'Low morale', id: p.id })),
  ].slice(0, 5);
  const unread = g.inbox.filter((m) => m.unread).slice(0, 3);
  const greeting = over ? 'The season is over' : pos === 1 && played > 0 ? 'Top of the league, boss' : `Good morning, ${g.managerName.split(' ')[0]}`;
  const lead = played === 0 ? `A new season starts ${currentDate(g)}. The board wants ${target.text}.`
    : over ? `You finished ${ordinal(pos)}. Read the board's review, then start the new season.`
    : `${ordinal(pos)} after ${played} ${played === 1 ? 'match' : 'matches'}, ${pos === 1 ? `${table[0].pts - table[1].pts} ${table[0].pts - table[1].pts === 1 ? 'point' : 'points'} clear` : `${table[0].pts - table[pos - 1].pts} points off the top`}.`;

  return (
    <div>
      <div className="pg-head"><div><h1 className="pg-title">{greeting}</h1><p className="pg-sub">{lead}</p></div></div>
      <div className="hm-grid">
        <div className="hm-col">
          <h2 className="pg-h">Next match</h2>
          {next ? <FD.FixtureCard {...fixtureCardProps(g, next)} action={<FD.Button size="sm" icon="play" onClick={onPlay}>Play match</FD.Button>} />
            : <div className="pg-card hm-note">{over ? 'No more league matches this season.' : 'No match this week.'}</div>}
          {last && <>
            <h2 className="pg-h">Last result</h2>
            <FD.FixtureCard {...fixtureCardProps(g, last)} action={<FD.Button size="sm" variant="ghost" onClick={() => go('match', last.id)}>Match report</FD.Button>} />
          </>}
        </div>
        <div className="hm-col">
          <h2 className="pg-h">League</h2>
          <FD.LeagueTable compact rows={table.slice(0, 8).map((r) => ({ ...r }))} zones={{ champions: 1, championsLabel: 'Champions' }} />
          <button className="pg-link" style={{ alignSelf: 'flex-start' }} onClick={() => go('table')}>Full table</button>
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
