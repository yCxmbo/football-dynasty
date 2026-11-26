import { useEffect, useMemo, useState } from 'react';
import { FD } from '../ds';
import { createLive, MAX_SUBS, ratingOf, substitute, TALKS, talkDue, teamTalk, tick, toResult, type LiveMatch } from '../engine/live';
import { recordSummerResult, summerStep } from '../engine/summer';
import type { GameState, MatchStats } from '../engine/types';
import { SubPanel, TICK_MS } from './Match';
import type { Screen } from './shared';

/** Your national team's tournament match, played live like a club match. */
export default function NationalMatch({ g, go, update }: { g: GameState; go: (s: Screen) => void; update: (fn: (d: GameState) => void) => void }) {
  const req = summerStep(g)?.request;
  const [lm, setLm] = useState<LiveMatch | null>(() => (req ? createLive(req.seed, req.home, req.away, req.venue, req.mods) : null));
  const [speed, setSpeed] = useState('2');
  const [subOpen, setSubOpen] = useState(false);
  const key: 'home' | 'away' = req?.home.user ? 'home' : 'away';
  const talk = lm ? talkDue(lm, key) : null;

  useEffect(() => {
    if (!lm || lm.done || speed === 'pause' || subOpen || talk) return;
    const t = setTimeout(() => setLm((prev) => { if (!prev) return prev; const next = structuredClone(prev); tick(next); return next; }), TICK_MS[speed] ?? 300);
    return () => clearTimeout(t);
  }, [lm, speed, subOpen, talk]);

  const view = useMemo(() => {
    if (!lm || !req) return null;
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
      match: {
        competition: `${req.t.name} · ${req.stage === 'Group' ? 'Group stage' : req.stage}`, venue: req.venue,
        home: { name: req.home.name, short: req.h, isUser: key === 'home' }, away: { name: req.away.name, short: req.a, isUser: key === 'away' },
        status: lm.done ? 'FT' : lm.minute === 45 ? 'HT' : 'live', minute: lm.minute, score: lm.score,
        events: lm.events.map((e) => ({ ...e, isUser: !!e.side && e.side === key })),
      },
      stats, ratings,
    };
  }, [lm, req, key]);

  if (!req || !lm || !view) return <div className="pg-empty">No national team match to play. <button className="pg-link" onClick={() => go('international')}>International</button></div>;
  const side = lm[key];
  const finish = () => {
    const done = structuredClone(lm);
    while (!done.done) tick(done);
    update((d) => recordSummerResult(d, toResult(done, req.h, req.a).result));
    go('international');
  };
  return (
    <>
      <FD.MatchDay match={view.match} stats={view.stats} ratings={view.ratings} speed={speed} onSpeedChange={setSpeed}
        onSimToEnd={() => setLm((prev) => { if (!prev) return prev; const next = structuredClone(prev); while (!next.done) tick(next); return next; })}
        onTactics={() => go('international')} subsLeft={MAX_SUBS - side.subsUsed} onSubstitute={() => setSubOpen(true)}
        onContinue={finish} />
      {talk && (
        <div className="sub-backdrop" role="dialog" aria-modal="true" aria-label="Team talk">
          <div className="pg-card talk-panel">
            <h2 className="pg-title" style={{ fontSize: 24, lineHeight: '28px', margin: 0 }}>{talk === 'pre' ? 'Team talk before kickoff' : `Half-time team talk · ${lm.score[0]}–${lm.score[1]}`}</h2>
            <p className="hm-note" style={{ margin: 0 }}>Keep calm when you're on top, demand more when you're behind, encourage when it's even.</p>
            <div className="talk-options">
              {TALKS.map((t) => <FD.Button key={t.tone} variant="secondary" onClick={() => setLm((prev) => { const next = structuredClone(prev!); teamTalk(next, key, t.tone); return next; })}>{t.label}</FD.Button>)}
              <FD.Button variant="ghost" onClick={() => setLm((prev) => { const next = structuredClone(prev!); teamTalk(next, key, 'skip'); return next; })}>Say nothing</FD.Button>
            </div>
          </div>
        </div>
      )}
      {subOpen && (
        <SubPanel lm={lm} sideKey={key} onClose={() => setSubOpen(false)}
          onSub={(off, on) => { const next = structuredClone(lm); const err = substitute(next, key, off, on); if (!err) setLm(next); return err; }} />
      )}
    </>
  );
}
