import { FD } from '../ds';
import { leagueScale } from '../engine/game';
import { askingPrice, expectedRole, knowledgeOf, seenRange, wageBill, wageDemand, windowOpen, type OfferTerms } from '../engine/transfers';
import type { GameState } from '../engine/types';
import { fromCur, toCur } from '../store';
import type { Screen } from './shared';
import { WindowBanner } from './Transfers';

export default function Offer({ g, id, go, submit }: { g: GameState; id?: string; go: (s: Screen, id?: string) => void; submit: (id: string, o: OfferTerms) => void }) {
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
  return (
    <div className="pg-stack">
      <WindowBanner g={g} />
      {signed ? (
        <div className="pg-card pg-row" style={{ justifyContent: 'space-between' }}>
          <span><strong className="fd-ok">Done deal.</strong> {neg?.lastResponse?.message}</span>
          <span className="pg-row"><FD.Button variant="secondary" onClick={() => go('transfers')}>Back to transfers</FD.Button><FD.Button onClick={() => go('player', p.id)}>View player</FD.Button></span>
        </div>
      ) : (
        <FD.TransferOffer
          key={p.id}
          player={{ name: p.name, pos: p.pos, age: p.age, club: g.clubs[p.clubId]?.name ?? 'Free agent', ability: Math.round((lo + hi) / 2), value: c(p.value), askingPrice: c(ask), wage: c(p.wage), wantsWage: c(wageDemand(g, p)) }}
          currency={cur} scale={leagueScale(g)}
          transferBudget={c(club.transferBudget)} wageBudget={c(club.wageBudget - wageBill(g))}
          initial={{ fee: c(neg?.lastResponse?.counter ?? ask), upfront: 100, months: 12, wage: c(wageDemand(g, p)), years: p.age >= 32 ? 1 : 3, role: expectedRole(g, p), contractType: p.age <= 19 ? 'youth' : 'full-time' }}
          response={neg?.lastResponse}
          onCancel={() => go('player', p.id)}
          onSubmit={(o: OfferTerms) => windowOpen(g) && submit(p.id, { ...o, fee: fromCur(o.fee, cur), appearanceFee: fromCur(o.appearanceFee, cur), goalBonus: fromCur(o.goalBonus, cur), wage: fromCur(o.wage, cur), signingBonus: fromCur(o.signingBonus, cur), releaseClause: fromCur(o.releaseClause, cur), agentFee: fromCur(o.agentFee, cur) })}
        />
      )}
      {!signed && p.clubId !== 'free' && <p className="hm-note">The selling club looks at what the fee is worth now: money paid later and add-ons count for less. After four poor offers they stop talking until the next window.</p>}
    </div>
  );
}
