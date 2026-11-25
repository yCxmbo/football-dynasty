import { FD } from '../ds';
import { leagueTable } from '../engine/game';
import { prizeMoney, wageBillOf } from '../engine/finance';
import type { GameState, Ledger } from '../engine/types';
import { seasonLabel } from '../engine/types';
import { toCur } from '../store';

const INCOME: Array<[keyof Ledger['income'], string]> = [['gate', 'Gate receipts'], ['tv', 'TV money'], ['sponsorship', 'Sponsorship'], ['merchandise', 'Merchandise'], ['prize', 'Prize money'], ['sales', 'Player sales']];
const EXPENSES: Array<[keyof Ledger['expenses'], string]> = [['wages', 'Player wages'], ['staff', 'Staff and facilities'], ['transfers', 'Transfer fees']];

function Breakdown({ title, rows, cur }: { title: string; rows: Array<[string, number]>; cur: GameState['currency'] }) {
  const total = rows.reduce((a, [, v]) => a + v, 0);
  return (
    <section className="pg-card fn-list">
      <h2 className="pg-h">{title}</h2>
      {rows.map(([label, v]) => (
        <div key={label} className="fn-row">
          <span>{label}</span>
          <span className="fd-meter fn-meter" aria-hidden><span className="fd-meter__bar fd-meter__bar--gold" style={{ width: total ? (v / total) * 100 + '%' : 0 }} /></span>
          <strong><FD.Money amount={toCur(v, cur)} currency={cur} /></strong>
        </div>
      ))}
      <div className="fn-row fn-total"><span>Total</span><span /><strong><FD.Money amount={toCur(total, cur)} currency={cur} /></strong></div>
    </section>
  );
}

export default function Finances({ g }: { g: GameState }) {
  const cur = g.currency;
  const club = g.clubs[g.userClubId];
  const L = g.ledger;
  const inc = Object.values(L.income).reduce((a, b) => a + b, 0), exp = Object.values(L.expenses).reduce((a, b) => a + b, 0);
  const bill = wageBillOf(g, g.userClubId);
  const usage = Math.round((bill / club.wageBudget) * 100);
  const start = L.balanceHistory[0] ?? club.balance;
  const pos = leagueTable(g).findIndex((r) => r.clubId === g.userClubId) + 1;
  const n = 12;
  const div = club.division || 1;
  return (
    <div className="pg-stack">
      <div className="pg-head" style={{ marginBottom: 0 }}><div><h1 className="pg-title">Finances</h1><p className="pg-sub">{seasonLabel(g.year)} so far. Each matchday counts a share of the year's wages, staff costs and sponsorship; prize money arrives at season end.</p></div></div>
      <div className="tg-effects">
        <div className="pg-card"><span className="pg-h">Balance</span><strong className={club.balance < 0 ? 'fd-money--neg' : ''}><FD.Money amount={toCur(club.balance, cur)} currency={cur} /></strong><span className="hm-note">Season start <FD.Money amount={toCur(start, cur)} currency={cur} /></span></div>
        <div className="pg-card"><span className="pg-h">Profit this season</span><strong><FD.Money amount={toCur(inc - exp, cur)} currency={cur} signed /></strong><span className="hm-note">before prize money</span></div>
        <div className="pg-card"><span className="pg-h">Transfer budget</span><strong><FD.Money amount={toCur(club.transferBudget, cur)} currency={cur} /></strong><span className="hm-note">60% of sales are added back</span></div>
        <div className="pg-card"><span className="pg-h">Wage budget</span><strong><FD.Money amount={toCur(bill, cur)} currency={cur} perWeek /> of <FD.Money amount={toCur(club.wageBudget, cur)} currency={cur} perWeek /></strong>
          <span className="fd-meter fd-meter--wide"><span className={`fd-meter__bar fd-meter__bar--${usage > 100 ? 'high' : usage > 92 ? 'medium' : 'low'}`} style={{ width: Math.min(100, usage) + '%' }} /></span><span className="hm-note">{usage}% used</span></div>
      </div>
      <div className="fn-grid">
        <Breakdown title="Income" rows={INCOME.map(([k, l]) => [l, L.income[k]])} cur={cur} />
        <Breakdown title="Expenses" rows={EXPENSES.map(([k, l]) => [l, L.expenses[k]])} cur={cur} />
      </div>
      <section className="pg-card">
        <h2 className="pg-h">Prize money</h2>
        <p className="hm-note">League prize money is paid at the end of the season, along with cup prize money for the round you reached. You are {pos}{pos === 1 ? 'st' : pos === 2 ? 'nd' : pos === 3 ? 'rd' : 'th'}, worth <FD.Money amount={toCur(prizeMoney(pos, n, div), cur)} currency={cur} /> if it stays that way. Champions get <FD.Money amount={toCur(prizeMoney(1, n, div), cur)} currency={cur} />; last place <FD.Money amount={toCur(prizeMoney(n, n, div), cur)} currency={cur} />.</p>
      </section>
      {g.lastLedger && (
        <section className="pg-card">
          <h2 className="pg-h">Last season</h2>
          <p className="hm-note">Income <FD.Money amount={toCur(Object.values(g.lastLedger.income).reduce((a, b) => a + b, 0), cur)} currency={cur} /> · expenses <FD.Money amount={toCur(Object.values(g.lastLedger.expenses).reduce((a, b) => a + b, 0), cur)} currency={cur} /> · result <FD.Money amount={toCur(Object.values(g.lastLedger.income).reduce((a, b) => a + b, 0) - Object.values(g.lastLedger.expenses).reduce((a, b) => a + b, 0), cur)} currency={cur} signed /></p>
        </section>
      )}
    </div>
  );
}
