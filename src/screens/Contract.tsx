import { useState } from 'react';
import { FD } from '../ds';
import { askingWage, blocked, negotiate, ROLE_SHARE, type ContractTerms, type PromiseKind } from '../engine/negotiation';
import { expectedRole, SQUAD_ROLES, wageBill, type SquadRole } from '../engine/transfers';
import type { GameState } from '../engine/types';
import { fromCur, toCur } from '../store';
import type { Screen } from './shared';

const PCT = (n: number) => (n ? `${n}%` : 'None');

/** Contract talks with one of your players: wage and length, plus the role, wage clauses, a release clause and
    promises. His asking wage updates as you change the package. */
export default function Contract({ g, id, go, update }: { g: GameState; id?: string; go: (s: Screen, id?: string) => void; update: (fn: (d: GameState) => void) => void }) {
  const p = id ? g.players[id] : undefined;
  const cur = g.currency;
  const [role, setRole] = useState<SquadRole | ''>('');
  const [rise, setRise] = useState(0);
  const [relCut, setRelCut] = useState(0);
  const [proRise, setProRise] = useState(0);
  const [minFee, setMinFee] = useState<'none' | 'low' | 'high'>(p?.releaseClause ? 'high' : 'none');
  const [promises, setPromises] = useState<PromiseKind[]>([]);
  const [years, setYears] = useState(p && p.age >= 32 ? 1 : 3);
  const [wage, setWage] = useState<number | null>(null);
  const [result, setResult] = useState<string | null | undefined>(undefined);
  if (!p || p.clubId !== g.userClubId) return <div className="pg-empty">Not your player. <button className="pg-link" onClick={() => go('squad')}>Squad</button></div>;
  const club = g.clubs[g.userClubId];
  const exp = expectedRole(g, p);
  const terms: ContractTerms = { ...(role ? { role } : {}), rise, relegationCut: relCut, promotionRise: proRise, minFee: minFee === 'none' ? 0 : Math.round((p.value * (minFee === 'low' ? 1.5 : 2.5)) / 100_000) * 100_000 };
  const pkg = { years, terms, promises };
  const ask = askingWage(g, p, pkg);
  const shown = wage ?? toCur(ask, cur);
  const why = blocked(g, p, pkg);
  const room = toCur(club.wageBudget - wageBill(g), cur);
  const toggle = (k: PromiseKind) => setPromises((l) => (l.includes(k) ? l.filter((x) => x !== k) : [...l, k]));
  const offer = () => {
    const o = { wage: fromCur(shown, cur), ...pkg };
    const msg = negotiate(structuredClone(g), p.id, o); // dry run so the answer is known now
    if (msg === null) update((d) => { negotiate(d, p.id, o); });
    setResult(msg);
  };
  const seg = <T extends string | number>(label: string, value: T, opts: Array<[T, string]>, set: (v: T) => void) => (
    <div className="fd-field">
      <span className="fd-field__label">{label}</span>
      <div className="fd-seg" role="radiogroup" aria-label={label}>
        {opts.map(([v, l]) => <button key={String(v)} type="button" role="radio" aria-checked={value === v} className={'fd-seg__opt' + (value === v ? ' is-on' : '')} onClick={() => { set(v); setWage(null); }}>{l}</button>)}
      </div>
    </div>
  );
  return (
    <div className="pg-stack" style={{ maxWidth: 760 }}>
      <div><h1 className="pg-title">New contract: {p.name}</h1>
        <p className="pg-sub">Current deal: <FD.Money amount={toCur(p.wage, cur)} currency={cur} perWeek /> until June {p.contractEnd + 1}. Wage budget room: <FD.Money amount={room} currency={cur} perWeek />.{p.brokenPromises ? ` He remembers ${p.brokenPromises} broken ${p.brokenPromises === 1 ? 'promise' : 'promises'}: he'll want more.` : ''}</p></div>
      <div className="pg-card pg-stack" style={{ gap: 16 }}>
        <div className="fd-grid2">
          <FD.Field label="Squad role" hint={`He sees himself as a ${exp.toLowerCase()} (about ${Math.round(ROLE_SHARE[exp] * 100)}% of games). A bigger role means a lower wage, and he'll expect the games.`}>
            <select className="fd-input" value={role} aria-label="Squad role" onChange={(e) => { setRole(e.target.value as SquadRole | ''); setWage(null); }}>
              <option value="">{exp} (what he expects)</option>
              {SQUAD_ROLES.filter((r) => r !== exp).map((r) => <option key={r} value={r}>{r} · about {Math.round(ROLE_SHARE[r] * 100)}% of games</option>)}
            </select>
          </FD.Field>
          <FD.Field label="Length" hint={p.age >= 32 ? 'Players over 32 sign for 2 years at most' : undefined}><FD.NumberInput value={years} min={1} max={5} suffix={years === 1 ? 'year' : 'years'} onChange={setYears} label="Contract length" /></FD.Field>
        </div>
        <div className="fd-grid2">
          {seg('Yearly wage rise', rise, [[0, 'None'], [5, '5%'], [10, '10%']], setRise)}
          {seg('Release clause', minFee, [['none', 'None'], ['high', `${FD.formatMoney(toCur(p.value * 2.5, cur), cur)}`], ['low', `${FD.formatMoney(toCur(p.value * 1.5, cur), cur)}`]], setMinFee)}
          {seg('Wage cut if relegated', relCut, [[0, 'None'], [25, '25%'], [50, '50%']], setRelCut)}
          {seg('Wage rise if promoted', proRise, [[0, 'None'], [25, '25%'], [50, '50%']], setProRise)}
        </div>
        <div className="fd-field" role="group" aria-label="Promises">
          <span className="fd-field__label">Promises</span>
          <div className="pg-row" style={{ gap: 18 }}>
            <label className="tr-check"><input type="checkbox" checked={promises.includes('captain')} onChange={() => { toggle('captain'); setWage(null); }} /> Make him captain</label>
            <label className="tr-check"><input type="checkbox" checked={promises.includes('signing')} onChange={() => { toggle('signing'); setWage(null); }} /> Sign a quality player this window</label>
          </div>
        </div>
        <p className="hm-note" style={{ margin: 0 }}>Rises, promotion rises and a release clause he can use make him cheaper now; a relegation cut costs you. A promised signing is judged when the window closes: break it and he won't forget. Terms: rise {PCT(rise)} · relegation cut {PCT(relCut)} · promotion rise {PCT(proRise)}.</p>
        <FD.Field label="Wage" hint={`For this package his agent wants about ${FD.formatMoney(toCur(ask, cur), cur, { perWeek: true })}`} tone={fromCur(shown, cur) >= ask * 0.97 ? 'ok' : 'warn'}>
          <FD.MoneyInput value={shown} onChange={(v: number) => setWage(v)} currency={cur} perWeek label="Weekly wage" />
        </FD.Field>
        {why ? <p className="fd-warn" role="status">{why}</p> : null}
        {result === null && <p className="fd-ok" role="status">{p.name} has signed until June {g.players[p.id].contractEnd + 1}.</p>}
        {typeof result === 'string' && <p className="fd-money--neg" role="alert">{result}</p>}
        <div className="pg-row" style={{ justifyContent: 'flex-end' }}>
          <FD.Button variant="ghost" onClick={() => go('player', p.id)}>Back</FD.Button>
          <FD.Button icon="contract" onClick={offer} disabled={result === null || !!why}>Offer contract</FD.Button>
        </div>
      </div>
    </div>
  );
}
