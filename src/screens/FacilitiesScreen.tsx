import { useState } from 'react';
import { FD } from '../ds';
import { MAX_CAPACITY, MAX_LEVEL, expandStadium, facilitiesOf, fanBase, seatCost, trainingFacilityBoost, upgrade, upgradeCost, upkeepPerWeek, youthFacilityBonus, type FacilityKind } from '../engine/facilities';
import { attendance } from '../engine/finance';
import type { GameState } from '../engine/types';
import { toCur } from '../store';

function Pips({ level }: { level: number }) {
  return <span className="fac-pips" aria-label={`Level ${level} of ${MAX_LEVEL}`}>{Array.from({ length: MAX_LEVEL }, (_, i) => <span key={i} className={i < level ? 'is-on' : ''} />)}</span>;
}

export default function FacilitiesScreen({ g, update }: { g: GameState; update: (fn: (d: GameState) => void) => void }) {
  const [note, setNote] = useState('');
  const c = g.clubs[g.userClubId];
  const f = facilitiesOf(g, c.id);
  const cur = g.currency;
  const money = (n: number) => FD.formatMoney(toCur(n, cur), cur);
  const act = (fn: (d: GameState) => string | null) => { let e: string | null = null; update((d) => { e = fn(d); }); setTimeout(() => setNote(e ?? ''), 0); };
  const fans = fanBase(c);
  const crowd = attendance(c, 1, 20);
  const card = (kind: FacilityKind, title: string, effect: string, now: string) => (
    <section className="pg-card fac-card">
      <div className="pg-row" style={{ justifyContent: 'space-between' }}><h2 className="pg-h" style={{ margin: 0 }}>{title}</h2><Pips level={f[kind]} /></div>
      <p className="hm-note" style={{ margin: 0 }}>{effect}</p>
      <p style={{ margin: 0 }}><strong>Level {f[kind]}</strong> · {now}</p>
      {f[kind] < MAX_LEVEL
        ? <FD.Button variant="secondary" onClick={() => act((d) => upgrade(d, kind))}>Upgrade to level {f[kind] + 1} · {money(upgradeCost(c, f[kind]))}</FD.Button>
        : <span className="fd-muted">The best there is.</span>}
    </section>
  );
  return (
    <div className="pg-stack" style={{ gap: 16 }}>
      <div>
        <h1 className="pg-title">Stadium and facilities</h1>
        <p className="hm-note" style={{ margin: 0 }}>Club balance {money(c.balance)}, transfer budget {money(c.transferBudget)}. Building work is paid from the balance and comes out of the transfer budget too; facilities cost {money(upkeepPerWeek(g, c.id))} a week to run.</p>
      </div>
      {note && <p className="fd-warn" role="alert">{note}</p>}
      <section className="pg-card fac-card">
        <h2 className="pg-h" style={{ margin: 0 }}>{c.stadium}</h2>
        <p style={{ margin: 0 }}><strong>{c.capacity.toLocaleString()} seats</strong> · about {fans.toLocaleString()} fans would come to a big game · a full-strength crowd now is about {crowd.toLocaleString()}</p>
        <p className="hm-note" style={{ margin: 0 }}>{fans > c.capacity ? `Demand is higher than the capacity: more seats mean more gate money (${money(Math.round(20 + c.reputation * 0.5))} a ticket).` : 'The stadium is already big enough for your support. Grow the club\'s reputation before adding seats.'}</p>
        {f.expansion ? <p className="fd-ok" style={{ margin: 0 }}>Building {f.expansion.seats.toLocaleString()} new seats: open from next season.</p> : (
          <div className="pg-row" style={{ flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {[2500, 5000, 10000].filter((n) => c.capacity + n <= MAX_CAPACITY).map((n) => (
              <FD.Button key={n} variant="secondary" onClick={() => act((d) => expandStadium(d, n))}>+{n.toLocaleString()} seats · {money(seatCost(c, n))}</FD.Button>
            ))}
          </div>
        )}
      </section>
      <div className="fac-grid">
        {card('training', 'Training ground', 'Better pitches, gym and analysis help every player develop.', `development ${trainingFacilityBoost(g) >= 1 ? '+' : ''}${Math.round((trainingFacilityBoost(g) - 1) * 100)}%`)}
        {card('youth', 'Youth academy', 'Better coaching and recruitment bring better youngsters each summer.', `intake potential ${youthFacilityBonus(g) >= 0 ? '+' : ''}${youthFacilityBonus(g)}`)}
      </div>
    </div>
  );
}
