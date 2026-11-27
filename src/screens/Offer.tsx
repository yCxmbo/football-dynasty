import { useState } from 'react';
import { FD } from '../ds';
import { agentDemand, greedyAgent } from '../engine/deals';
import { leagueScale, squadOf } from '../engine/game';
import { askingPrice, expectedRole, knowledgeOf, seenRange, swapValue, wageBill, wageDemand, windowOpen, type OfferTerms } from '../engine/transfers';
import type { GameState } from '../engine/types';
import { fromCur, toCur } from '../store';
import type { Screen } from './shared';
import { WindowBanner } from './Transfers';

export default function Offer({ g, id, go, submit }: { g: GameState; id?: string; go: (s: Screen, id?: string) => void; submit: (id: string, o: OfferTerms) => void }) {
  const [swap, setSwap] = useState('');
  const p = id ? g.players[id] : undefined;
  if (!p) return <div className="pg-empty">Player not found. <button className="pg-link" onClick={() => go('transfers')}>Back to transfers</button></div>;
  const cur = g.currency;
  const club = g.clubs[g.userClubId];
  const neg = g.negotiations[p.id];
  const signed = p.clubId === g.userClubId;
  const k = knowledgeOf(g, p);
  const ask = askingPrice(g, p);
  const [lo, hi] = seenRange(p.ability, k);
  const c = (n: number) => toCur(n, cur);
  const agent = agentDemand(p, ask);
  const free = !g.clubs[p.clubId];
  const swapOptions = free ? [] : squadOf(g, g.userClubId).filter((x) => x.squad === 'First team' && !x.loan && x.injuredFor <= 0 && swapValue(g, x.id, p.clubId) > 0).sort((a, b) => b.value - a.value);
  const swapWorth = swap ? swapValue(g, swap, p.clubId) : 0;
  return (
    <div className="pg-stack">
      <WindowBanner g={g} />
      {!signed && p.releaseClause && <p className="pg-card loan-note">Release clause: {FD.formatMoney(c(p.releaseClause), cur)}. Offer at least that, all up front, and {g.clubs[p.clubId]?.name} can't refuse: only the player has to agree.</p>}
      {signed ? (
        <div className="pg-card pg-row" style={{ justifyContent: 'space-between' }}>
          <span><strong className="fd-ok">Done deal.</strong> {neg?.lastResponse?.message}</span>
          <span className="pg-row"><FD.Button variant="secondary" onClick={() => go('transfers')}>Back to transfers</FD.Button><FD.Button onClick={() => go('player', p.id)}>View player</FD.Button></span>
        </div>
      ) : (
        <>
        <section className="pg-card deal-extras">
          <div>
            <span className="fd-label">His agent</span>
            <p className="hm-note" style={{ margin: 0 }}>Wants about <strong>{FD.formatMoney(c(agent), cur)}</strong> for the deal{greedyAgent(p) ? ' (a hard bargainer)' : ''}. Pay that in the agent's fee and he'll talk his client into a wage up to 10% lower.</p>
          </div>
          {swapOptions.length ? (
            <label className="tac-field"><span className="fd-label">Include a player (swap)</span>
              <select className="fd-input" value={swap} aria-label="Include one of your players in the deal" onChange={(e) => setSwap(e.target.value)}>
                <option value="">No player</option>
                {swapOptions.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.pos}, {x.age}) · worth {FD.formatMoney(c(swapValue(g, x.id, p.clubId)), cur)} to them</option>)}
              </select>
              {swap ? <span className="hm-note">{g.clubs[p.clubId]?.name} count {g.players[swap]?.name} as {FD.formatMoney(c(swapWorth), cur)} towards the fee, so you can offer less cash. He joins them if the deal is done.</span> : null}
            </label>
          ) : null}
        </section>
        <FD.TransferOffer
          key={p.id + swap}
          player={{ name: p.name, pos: p.pos, age: p.age, club: g.clubs[p.clubId]?.name ?? 'Free agent', ability: Math.round((lo + hi) / 2), value: c(p.value), askingPrice: c(Math.max(0, ask - swapWorth)), wage: c(p.wage), wantsWage: c(wageDemand(g, p)) }}
          currency={cur} scale={leagueScale(g)}
          transferBudget={c(club.transferBudget)} wageBudget={c(club.wageBudget - wageBill(g))}
          initial={{ agentFee: c(agent), fee: c(Math.max(0, (neg?.lastResponse?.counter ?? ask) - swapWorth)), upfront: 100, months: 12, wage: c(wageDemand(g, p)), years: p.age >= 32 ? 1 : 3, role: expectedRole(g, p), contractType: p.age <= 19 ? 'youth' : 'full-time' }}
          response={neg?.lastResponse}
          onCancel={() => go('player', p.id)}
          onSubmit={(o: OfferTerms) => windowOpen(g) && submit(p.id, { ...o, ...(swap ? { swapPlayerId: swap } : {}), fee: fromCur(o.fee, cur), appearanceFee: fromCur(o.appearanceFee, cur), goalBonus: fromCur(o.goalBonus, cur), wage: fromCur(o.wage, cur), signingBonus: fromCur(o.signingBonus, cur), releaseClause: fromCur(o.releaseClause, cur), agentFee: fromCur(o.agentFee, cur) })}
        />
        </>
      )}
      {!signed && p.clubId !== 'free' && <p className="hm-note">The selling club looks at what the fee is worth now: money paid later and add-ons count for less. After four poor offers they stop talking until the next window.</p>}
    </div>
  );
}
