import { useState } from 'react';
import { FD } from '../ds';
import { leagueScale, squadOf, youthScale } from '../engine/game';
import type { GameState, Squad as SquadName } from '../engine/types';
import { toCur } from '../store';
import { squadRow, type Screen } from './shared';

export default function Squad({ g, go }: { g: GameState; go: (s: Screen, id?: string) => void }) {
  const [tab, setTab] = useState<SquadName>('First team');
  const all = squadOf(g, g.userClubId);
  const list = all.filter((p) => p.squad === tab);
  const wageBill = all.reduce((s, p) => s + p.wage, 0);
  const avgAge = list.reduce((s, p) => s + p.age, 0) / Math.max(1, list.length);
  const scale = tab === 'First team' ? leagueScale(g) : youthScale();
  return (
    <div>
      <div className="pg-head">
        <div>
          <h1 className="pg-title">Squad</h1>
          <p className="pg-sub">{list.length} players · average age {avgAge.toFixed(1)} · club wage bill <FD.Money amount={toCur(wageBill, g.currency)} currency={g.currency} perWeek /></p>
        </div>
        <div className="fd-seg" role="tablist" aria-label="Squad">
          {(['First team', 'U21', 'U18'] as SquadName[]).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} className={'fd-seg__opt' + (tab === t ? ' is-on' : '')} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
      </div>
      <p className="pg-h">Stars compared to: {tab === 'First team' ? 'Premier Division' : 'youth level'} · click a player for the full profile</p>
      <FD.SquadTable key={tab} players={list.map((p) => squadRow(p, g.currency, g.year))} currency={g.currency} scale={scale} onSelect={(p: { id: string }) => go('player', p.id)} />
    </div>
  );
}
