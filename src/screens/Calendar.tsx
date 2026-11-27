import { useState } from 'react';
import { compInfo } from '../engine/competitions';
import { today } from '../engine/game';
import type { Fixture, GameState } from '../engine/types';
import { badgeUrl } from './badge';
import type { Screen } from './shared';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

export interface CalendarNote { date: string; text: string; tone?: 'gold' | 'teal' | 'warn' }

/** A month at a glance: your fixtures and results, today, and other dates that matter (from `notes`). */
export default function Calendar({ g, go, notes = [] }: { g: GameState; go: (s: Screen, id?: string) => void; notes?: CalendarNote[] }) {
  const now = today(g);
  const [ym, setYm] = useState(() => ({ y: Number(now.slice(0, 4)), m: Number(now.slice(5, 7)) - 1 }));
  const us = g.userClubId;
  const mine = new Map<string, Fixture[]>();
  for (const f of g.fixtures) {
    if (f.homeId !== us && f.awayId !== us) continue;
    const d = g.calendar[f.matchday - 1]?.date;
    if (!d) continue;
    const l = mine.get(d); if (l) l.push(f); else mine.set(d, [f]);
  }
  const noteBy = new Map<string, CalendarNote[]>();
  for (const n of notes) { const l = noteBy.get(n.date); if (l) l.push(n); else noteBy.set(n.date, [n]); }
  const first = new Date(Date.UTC(ym.y, ym.m, 1));
  const lead = (first.getUTCDay() + 6) % 7; // Monday first
  const days = new Date(Date.UTC(ym.y, ym.m + 1, 0)).getUTCDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const shift = (k: number) => setYm(({ y, m }) => { const t = new Date(Date.UTC(y, m + k, 1)); return { y: t.getUTCFullYear(), m: t.getUTCMonth() }; });
  const res = (f: Fixture) => {
    if (!f.result) return null;
    const home = f.homeId === us, [h, a] = f.result.score;
    const gf = home ? h : a, ga = home ? a : h;
    const w = f.result.winnerId ? f.result.winnerId === us : gf > ga;
    const k = f.comp === 'friendly' ? 'D' : w ? 'W' : gf === ga && !f.result.winnerId ? 'D' : 'L';
    return <span className={`fd-form fd-form--${k}`}>{gf}–{ga}</span>;
  };
  return (
    <div className="pg-stack">
      <div className="pg-head" style={{ marginBottom: 0 }}>
        <div><h1 className="pg-title">Calendar</h1><p className="pg-sub">Your fixtures and the dates that matter. Continue moves on a day at a time.</p></div>
        <div className="pg-row" style={{ gap: 8 }}>
          <button type="button" className="fd-btn fd-btn--secondary fd-btn--sm" onClick={() => shift(-1)} aria-label="Previous month">‹</button>
          <strong className="cal-month">{MONTHS[ym.m]} {ym.y}</strong>
          <button type="button" className="fd-btn fd-btn--secondary fd-btn--sm" onClick={() => shift(1)} aria-label="Next month">›</button>
          <button type="button" className="pg-link" onClick={() => setYm({ y: Number(now.slice(0, 4)), m: Number(now.slice(5, 7)) - 1 })}>Today</button>
        </div>
      </div>
      <div className="cal" role="grid" aria-label={`${MONTHS[ym.m]} ${ym.y}`}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="cal__dow" role="columnheader">{d}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="cal__cell cal__cell--empty" />;
          const date = iso(ym.y, ym.m, d);
          const fx = mine.get(date) ?? [];
          const ns = noteBy.get(date) ?? [];
          return (
            <div key={i} className={'cal__cell' + (date === now ? ' is-today' : '') + (date < now ? ' is-past' : '')} role="gridcell" aria-label={date}>
              <span className="cal__day">{d}{date === now ? <span className="cal__today">Today</span> : null}</span>
              {fx.map((f) => {
                const home = f.homeId === us, opp = g.clubs[home ? f.awayId : f.homeId];
                return (
                  <button key={f.id} type="button" className="cal__fx" onClick={() => (f.result ? go('match', f.id) : go('club', opp.id))} title={`${compInfo(g, f.comp).name} · ${f.round}`}>
                    <img className="club-badge" src={badgeUrl(opp)} alt="" />
                    <span className="cal__opp">{opp.short} <span className="fd-muted">({home ? 'H' : 'A'})</span></span>
                    {res(f)}
                    <span className="cal__comp">{f.comp === 'friendly' ? 'Friendly' : compInfo(g, f.comp).short}</span>
                  </button>
                );
              })}
              {ns.map((n, j) => <span key={j} className={`cal__note cal__note--${n.tone ?? 'teal'}`}>{n.text}</span>)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
