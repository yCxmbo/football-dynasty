import { useEffect, useMemo, useState } from 'react';
import { FD } from '../ds';
import { COMPS } from '../engine/competitions';
import type { GameState, MatchStats } from '../engine/types';
import type { Screen } from './shared';

const TICK_MS: Record<string, number> = { '1': 700, '2': 320, '4': 120 };

export default function Match({ g, id, live, go, onFinish }: { g: GameState; id?: string; live: boolean; go: (s: Screen) => void; onFinish: () => void }) {
  const f = g.fixtures.find((x) => x.id === id);
  const [minute, setMinute] = useState(live ? 0 : 90);
  const [speed, setSpeed] = useState<string>('2');
  useEffect(() => {
    if (!live || minute >= 90 || speed === 'pause') return;
    const t = setTimeout(() => setMinute((m) => Math.min(90, m + 1)), TICK_MS[speed] ?? 300);
    return () => clearTimeout(t);
  }, [live, minute, speed]);

  const view = useMemo(() => {
    if (!f?.result) return null;
    const r = f.result;
    const H = g.clubs[f.homeId], A = g.clubs[f.awayId];
    const shown = r.events.filter((e) => e.minute <= minute && !(minute < 90 && e.order === 999));
    let sh = 0, sa = 0;
    for (const e of shown) if (e.score) [sh, sa] = e.score;
    const frac = Math.max(0.02, minute / 90);
    const scale = (k: keyof MatchStats) => {
      const v = r.stats[k];
      if (k === 'possession' || k === 'passAcc' || minute >= 90) return v;
      if (k === 'xg') return [Math.round(v[0] * frac * 100) / 100, Math.round(v[1] * frac * 100) / 100];
      return [Math.round(v[0] * frac), Math.round(v[1] * frac)];
    };
    const stats = Object.fromEntries((Object.keys(r.stats) as Array<keyof MatchStats>).map((k) => [k, scale(k)]));
    if (minute < 90) {
      stats.yellow = [shown.filter((e) => e.type === 'yellow' && e.side === 'home').length, shown.filter((e) => e.type === 'yellow' && e.side === 'away').length];
      stats.red = [shown.filter((e) => e.type === 'red' && e.side === 'home').length, shown.filter((e) => e.type === 'red' && e.side === 'away').length];
    }
    const userHome = f.homeId === g.userClubId;
    const ratings = (userHome ? r.ratings.home : r.ratings.away).map((pr) => {
      const p = g.players[pr.playerId];
      const goals = shown.filter((e) => (e.type === 'goal' || e.type === 'penalty') && e.playerId === pr.playerId).length;
      const card = shown.some((e) => e.type === 'red' && e.playerId === pr.playerId) ? 'red' : shown.some((e) => e.type === 'yellow' && e.playerId === pr.playerId) ? 'yellow' : undefined;
      const off = pr.subbedOff && pr.subbedOff <= minute ? pr.subbedOff : undefined;
      // live ratings drift from 6.5 toward the final figure as the match goes on
      const rating = minute >= 90 ? pr.rating : Math.round((6.5 + (pr.rating - 6.5) * frac) * 10) / 10;
      return { number: p?.number ?? 0, name: p?.name ?? 'Former player', pos: p?.pos ?? '', rating, goals, card, subbedOff: off, injured: pr.injured && off ? true : undefined,
        condition: Math.max(35, Math.round(100 - frac * (42 - (p?.attributes['Natural Fitness'] ?? 10)))) };
    });
    return {
      match: {
        competition: `${COMPS[f.comp].name} · ${f.round}`, venue: f.neutral ? 'National Stadium' : H.stadium, status: minute >= 90 ? 'FT' : minute === 45 ? 'HT' : 'live', minute, score: [sh, sa],
        home: { name: H.name, short: H.short, isUser: H.id === g.userClubId }, away: { name: A.name, short: A.short, isUser: A.id === g.userClubId },
        events: shown.map((e) => ({ ...e, isUser: (e.side === 'home') === userHome && !!e.side })),
      },
      stats, ratings,
    };
  }, [f, g, minute]);

  if (!f || !view) return <div className="pg-empty">No match to show. <button className="pg-link" onClick={() => go('fixtures')}>Fixtures</button></div>;
  return (
    <FD.MatchDay
      match={view.match} stats={view.stats} ratings={view.ratings}
      speed={speed} onSpeedChange={setSpeed}
      onSimToEnd={() => setMinute(90)}
      onTactics={() => go('tactics')}
      subsLeft={live ? 5 : undefined}
      onSubstitute={() => go('tactics')}
      onContinue={() => (live ? onFinish() : go('fixtures'))}
    />
  );
}
