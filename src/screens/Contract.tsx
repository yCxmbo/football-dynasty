import { useState } from 'react';
import { FD } from '../ds';
import { renewContract, wageBill, wageDemand } from '../engine/transfers';
import type { GameState } from '../engine/types';
import { fromCur, toCur } from '../store';
import type { Screen } from './shared';

export default function Contract({ g, id, go, update }: { g: GameState; id?: string; go: (s: Screen, id?: string) => void; update: (fn: (d: GameState) => void) => void }) {
  const p = id ? g.players[id] : undefined;
  const cur = g.currency;
  const [wage, setWage] = useState(() => (p ? toCur(wageDemand(g, p, true), cur) : 0));
  const [years, setYears] = useState(p && p.age >= 32 ? 1 : 3);
  const [result, setResult] = useState<string | null | undefined>(undefined);
  if (!p || p.clubId !== g.userClubId) return <div className="pg-empty">Not your player. <button className="pg-link" onClick={() => go('squad')}>Squad</button></div>;
  const club = g.clubs[g.userClubId];
  const want = toCur(wageDemand(g, p, true), cur);
  const room = toCur(club.wageBudget - wageBill(g), cur);
  const offer = () => {
    // Dry run on a copy so the answer is known now; apply only if he agrees.
    const msg = renewContract(structuredClone(g), p.id, fromCur(wage, cur), years);
    if (msg === null) update((d) => { renewContract(d, p.id, fromCur(wage, cur), years); });
    setResult(msg);
  };
  return (
    <div className="pg-stack" style={{ maxWidth: 640 }}>
      <div><h1 className="pg-title">New contract: {p.name}</h1>
        <p className="pg-sub">Current deal: <FD.Money amount={toCur(p.wage, cur)} currency={cur} perWeek /> until June {p.contractEnd + 1}. Wage budget room: <FD.Money amount={room} currency={cur} perWeek />.</p></div>
      <div className="pg-card pg-stack" style={{ gap: 16 }}>
        <div className="fd-grid2">
          <FD.Field label="Wage" hint={`His agent wants about ${FD.formatMoney(want, cur, { perWeek: true })}`} tone={wage >= want * 0.95 ? 'ok' : 'warn'}><FD.MoneyInput value={wage} onChange={setWage} currency={cur} perWeek label="Weekly wage" /></FD.Field>
          <FD.Field label="Length" hint={p.age >= 32 ? 'Players over 32 sign for 2 years at most' : undefined}><FD.NumberInput value={years} min={1} max={5} suffix={years === 1 ? 'year' : 'years'} onChange={setYears} label="Contract length" /></FD.Field>
        </div>
        {result === null && <p className="fd-ok" role="status">{p.name} has signed until June {g.players[p.id].contractEnd + 1}.</p>}
        {typeof result === 'string' && <p className="fd-money--neg" role="alert">{result}</p>}
        <div className="pg-row" style={{ justifyContent: 'flex-end' }}>
          <FD.Button variant="ghost" onClick={() => go('player', p.id)}>Back</FD.Button>
          <FD.Button icon="contract" onClick={offer} disabled={result === null}>Offer contract</FD.Button>
        </div>
      </div>
    </div>
  );
}
