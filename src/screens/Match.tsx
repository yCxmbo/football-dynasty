import { useEffect, useMemo, useState } from 'react';
import { FD } from '../ds';
import { compInfo } from '../engine/competitions';
import { MAX_SUBS, ratingOf, substitute, tick, type LiveMatch, TALKS, talkDue, teamTalk } from '../engine/live';
import { slotsOf } from '../engine/match';
import type { GameState, MatchStats } from '../engine/types';
import type { Screen } from './shared';

export const TICK_MS: Record<string, number> = { '1': 700, '2': 320, '4': 120 };

export interface LiveState { fixtureId: string; lm: LiveMatch }

/** Live match (user's game, ticked here) or a stored match report. */
export default function Match({ g, id, live, setLive, go, onFinish }: {
  g: GameState; id?: string; live: LiveState | null; setLive: (fn: (prev: LiveState | null) => LiveState | null) => void; go: (s: Screen) => void; onFinish: () => void;
}) {
  const f = g.fixtures.find((x) => x.id === (live?.fixtureId ?? id));
  const isLive = !!live && !!f && live.fixtureId === f.id;
  const [speed, setSpeed] = useState<string>('2');
  const [subOpen, setSubOpen] = useState(false);
  const lm = live?.lm;
  const userKey = f && f.homeId === g.userClubId ? 'home' : 'away';
  const talk = isLive && lm ? talkDue(lm, userKey) : null;

  useEffect(() => {
    if (!isLive || !lm || lm.done || speed === 'pause' || subOpen || talk) return;
    const t = setTimeout(() => setLive((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev.lm);
      tick(next);
      return { ...prev, lm: next };
    }), TICK_MS[speed] ?? 300);
    return () => clearTimeout(t);
  }, [isLive, lm, speed, subOpen, talk, setLive]);

  const view = useMemo(() => {
    if (!f) return null;
    const H = g.clubs[f.homeId], A = g.clubs[f.awayId];
    const userHome = f.homeId === g.userClubId;
    const base = {
      competition: `${compInfo(g, f.comp).name} · ${f.round}`, venue: f.neutral ? 'Neutral venue' : H.stadium,
      home: { name: H.name, short: H.short, isUser: userHome }, away: { name: A.name, short: A.short, isUser: !userHome },
    };
    if (isLive && lm) {
      const key = userHome ? 'home' : 'away';
      const mins = Math.max(1, lm.minute);
      const stats: MatchStats = {
        possession: [Math.round(lm.stats.possession / mins), 100 - Math.round(lm.stats.possession / mins)],
        shots: lm.stats.shots, onTarget: lm.stats.onTarget, xg: [Math.round(lm.stats.xg[0] * 100) / 100, Math.round(lm.stats.xg[1] * 100) / 100],
        corners: lm.stats.corners, fouls: lm.stats.fouls,
        yellow: [0, 1].map((i) => Object.entries(lm.perf).filter(([pid, p]) => lm.sideOf[pid] === (i ? 'away' : 'home') && p.card === 'yellow').length) as [number, number],
        red: [0, 1].map((i) => Object.entries(lm.perf).filter(([pid, p]) => lm.sideOf[pid] === (i ? 'away' : 'home') && p.card === 'red').length) as [number, number],
        passAcc: [Math.round(lm.stats.passAcc[0] / mins) || 0, Math.round(lm.stats.passAcc[1] / mins) || 0],
      };
      const ratings = Object.entries(lm.perf).filter(([pid]) => lm.sideOf[pid] === key)
        .sort((a, b) => (a[1].onAt - b[1].onAt) || (lm[key].xi.indexOf(a[0]) - lm[key].xi.indexOf(b[0])))
        .map(([pid, p]) => ({ number: lm.players[pid].number, name: lm.players[pid].name, pos: lm.players[pid].pos, rating: ratingOf(lm, pid, key), goals: p.goals, card: p.card,
          subbedOff: p.offAt !== undefined && p.card !== 'red' ? p.offAt : undefined, injured: p.injured, condition: Math.round(lm.players[pid].condition) }));
      return {
        match: { ...base, status: lm.done ? 'FT' : lm.minute === 45 ? 'HT' : 'live', minute: lm.minute, score: lm.score,
          events: lm.events.map((e) => ({ ...e, isUser: !!e.side && (e.side === 'home') === userHome })) },
        stats, ratings, key, done: lm.done,
      };
    }
    if (!f.result) return null;
    const r = f.result;
    const mine = userHome ? r.ratings.home : r.ratings.away;
    const ratings = mine.map((pr) => {
      const p = g.players[pr.playerId];
      return { number: p?.number ?? 0, name: p?.name ?? 'Former player', pos: p?.pos ?? '', rating: pr.rating, goals: pr.goals, card: pr.card, subbedOff: pr.subbedOff, injured: pr.injured };
    });
    return { match: { ...base, status: 'FT', minute: 90, score: r.score, events: r.events.map((e) => ({ ...e, isUser: !!e.side && (e.side === 'home') === userHome })) }, stats: r.stats, ratings, key: userHome ? 'home' : 'away', done: true };
  }, [f, g, isLive, lm]);

  if (!f || !view) return <div className="pg-empty">No match to show. <button className="pg-link" onClick={() => go('fixtures')}>Fixtures</button></div>;
  const side = isLive && lm ? lm[view.key as 'home' | 'away'] : undefined;
  return (
    <>
      <FD.MatchDay
        match={view.match} stats={view.stats} ratings={view.ratings}
        speed={speed} onSpeedChange={setSpeed}
        onSimToEnd={() => setLive((prev) => { if (!prev) return prev; const next = structuredClone(prev.lm); while (!next.done) tick(next); return { ...prev, lm: next }; })}
        onTactics={() => go('tactics')}
        subsLeft={side ? MAX_SUBS - side.subsUsed : undefined}
        onSubstitute={() => setSubOpen(true)}
        onContinue={() => (isLive ? onFinish() : go('fixtures'))}
      />
      {talk && isLive && lm && (
        <div className="sub-backdrop" role="dialog" aria-modal="true" aria-label="Team talk">
          <div className="pg-card talk-panel">
            <h2 className="pg-title" style={{ fontSize: 24, lineHeight: '28px', margin: 0 }}>{talk === 'pre' ? 'Team talk before kickoff' : `Half-time team talk · ${lm.score[0]}–${lm.score[1]}`}</h2>
            <p className="hm-note" style={{ margin: 0 }}>What works depends on the moment: keep calm when you're on top, demand more when you're behind, encourage when it's even. The players' reaction shows in the commentary.</p>
            <div className="talk-options">
              {TALKS.map((t) => (
                <FD.Button key={t.tone} variant="secondary" onClick={() => setLive((prev) => { if (!prev) return prev; const next = structuredClone(prev.lm); teamTalk(next, userKey, t.tone); return { ...prev, lm: next }; })}>{t.label}</FD.Button>
              ))}
              <FD.Button variant="ghost" onClick={() => setLive((prev) => { if (!prev) return prev; const next = structuredClone(prev.lm); teamTalk(next, userKey, 'skip'); return { ...prev, lm: next }; })}>Say nothing</FD.Button>
            </div>
          </div>
        </div>
      )}
      {subOpen && isLive && lm && side && (
        <SubPanel lm={lm} sideKey={view.key as 'home' | 'away'} onClose={() => setSubOpen(false)}
          onSub={(off, on) => {
            let err: string | null = null;
            setLive((prev) => {
              if (!prev) return prev;
              const next = structuredClone(prev.lm);
              err = substitute(next, view.key as 'home' | 'away', off, on);
              return err ? prev : { ...prev, lm: next };
            });
            return err;
          }} />
      )}
    </>
  );
}

function Cond({ c }: { c: number }) {
  return (
    <span className="sub-cond" title={`Condition ${c}%`}>
      <span className="fd-meter"><span className={`fd-meter__bar fd-meter__bar--${c >= 75 ? 'low' : c >= 60 ? 'medium' : 'high'}`} style={{ width: c + '%' }} /></span>
      <span className={c < 60 ? 'fd-money--neg' : c < 75 ? 'fd-warn' : 'fd-muted'}>{c}%</span>
    </span>
  );
}

export function SubPanel({ lm, sideKey, onSub, onClose }: { lm: LiveMatch; sideKey: 'home' | 'away'; onSub: (off: string, on: string) => string | null; onClose: () => void }) {
  const s = lm[sideKey];
  const slots = slotsOf(s.formation);
  const [off, setOff] = useState<string | null>(null);
  const [on, setOn] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const left = MAX_SUBS - s.subsUsed;
  const bench = s.bench.filter((id) => !lm.perf[id]);
  return (
    <div className="sub-backdrop" role="dialog" aria-modal="true" aria-label="Make a substitution" onClick={onClose}>
      <div className="sub-panel pg-card" onClick={(e) => e.stopPropagation()}>
        <div className="pg-row" style={{ justifyContent: 'space-between' }}>
          <h2 className="pg-title" style={{ fontSize: 24, lineHeight: '28px' }}>Substitution · {lm.minute}′</h2>
          <span className="fd-muted">{left} of {MAX_SUBS} left · match paused</span>
        </div>
        <div className="sub-cols">
          <section>
            <h3 className="pg-h">Take off</h3>
            <ul className="sub-list">
              {s.xi.map((id, i) => id ? (
                <li key={id}><button type="button" className={'sub-row' + (off === id ? ' is-on' : '')} aria-pressed={off === id} onClick={() => setOff(id)}>
                  <span className="sub-num">{lm.players[id].number}</span><span className="sub-name">{lm.players[id].name}</span><span className="fd-pos">{slots[i]}</span>
                  <span className="sub-rating">{ratingOf(lm, id, sideKey).toFixed(1)}</span><Cond c={Math.round(lm.players[id].condition)} />
                </button></li>) : <li key={'x' + i} className="sub-row sub-row--empty"><span className="fd-muted">{slots[i]}: sent off</span></li>)}
            </ul>
          </section>
          <section>
            <h3 className="pg-h">Bring on</h3>
            <ul className="sub-list">
              {bench.length ? bench.map((id) => (
                <li key={id}><button type="button" className={'sub-row' + (on === id ? ' is-on' : '')} aria-pressed={on === id} onClick={() => setOn(id)}>
                  <span className="sub-num">{lm.players[id].number}</span><span className="sub-name">{lm.players[id].name}</span><span className="fd-pos">{lm.players[id].pos}</span>
                  <span /><Cond c={Math.round(lm.players[id].condition)} />
                </button></li>)) : <li className="hm-note">Nobody left on the bench.</li>}
            </ul>
          </section>
        </div>
        {err && <p className="fd-money--neg" role="alert">{err}</p>}
        <div className="pg-row" style={{ justifyContent: 'flex-end' }}>
          <FD.Button variant="ghost" onClick={onClose}>Back to the match</FD.Button>
          <FD.Button icon="transfers" disabled={!off || !on || left <= 0} onClick={() => {
            const e = off && on ? onSub(off, on) : 'Pick one player to take off and one to bring on.';
            if (e) setErr(e); else { setOff(null); setOn(null); setErr(null); onClose(); }
          }}>Make substitution</FD.Button>
        </div>
      </div>
    </div>
  );
}
