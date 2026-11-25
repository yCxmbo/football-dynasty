import { useState } from 'react';
import { FD } from '../ds';
import { CLUBS, LOWER_CLUBS } from '../engine/names';
import type { Currency } from '../engine/types';

const DIVS: Array<[1 | 2 | 3, string, string]> = [
  [1, 'Premier Division', 'The top flight. Titles, the Continental Cup, and the bottom three go down.'],
  [2, 'Championship', 'Two automatic promotion places and a play-off for a third.'],
  [3, 'League One', 'Start at the bottom and build a dynasty. No relegation.'],
];

export default function NewGame({ onStart, oldSave }: { onStart: (o: { clubId: string; name: string; currency: Currency }) => void; oldSave?: boolean }) {
  const [div, setDiv] = useState<1 | 2 | 3>(1);
  const [club, setClub] = useState('ash');
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<Currency>('EUR');
  const all = [...CLUBS.map((c) => ({ ...c, division: 1 as const })), ...LOWER_CLUBS];
  const ranked = all.filter((c) => c.division === div).sort((a, b) => b.reputation - a.reputation);
  return (
    <main className="ng">
      <img className="ng__crest" src={`${import.meta.env.BASE_URL}crest-512.png`} alt="Football Dynasty: Soccer Management" />
      <section className="ng__card pg-card">
        <h1 className="pg-title">Start your dynasty</h1>
        {oldSave && <p className="fd-warn" role="status">Your previous save is from an older version without divisions and cups, and can't be loaded. Starting a career replaces it.</p>}
        <div className="fd-grid2">
          <FD.Field label="Your name"><div className="fd-input"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Manager name" aria-label="Your name" maxLength={40} /></div></FD.Field>
          <FD.Field label="Currency"><FD.CurrencyToggle value={currency} onChange={setCurrency} /></FD.Field>
        </div>
        <h2 className="pg-h">Choose a division</h2>
        <div className="fd-seg" role="radiogroup" aria-label="Division" style={{ alignSelf: 'flex-start' }}>
          {DIVS.map(([d, l]) => <button key={d} type="button" role="radio" aria-checked={div === d} className={'fd-seg__opt' + (div === d ? ' is-on' : '')} onClick={() => { setDiv(d); setClub(all.filter((c) => c.division === d).sort((a, b) => b.reputation - a.reputation)[0].short.toLowerCase()); }}>{l}</button>)}
        </div>
        <p className="hm-note">{DIVS[div - 1][2]}</p>
        <h2 className="pg-h">Choose your club</h2>
        <div className="ng__clubs" role="radiogroup" aria-label="Club">
          {ranked.map((c, i) => {
            const id = c.short.toLowerCase();
            return (
              <button key={id} type="button" role="radio" aria-checked={club === id} className={'ng__club' + (club === id ? ' is-on' : '')} onClick={() => setClub(id)}>
                <strong>{c.name}</strong>
                <FD.StarRating value={Math.max(0.5, Math.min(5, Math.round(((c.reputation - 20) / 58) * 10) / 2))} size={14} />
                <span>{div === 1 ? (i < 2 ? 'Title favourites' : i < 4 ? 'Expected: top four' : i < 8 ? 'Expected: top half' : 'Expected: avoid relegation') : i < 2 ? 'Expected: promotion' : i < 5 ? 'Expected: play-offs' : div === 3 ? 'Expected: build for the future' : 'Expected: avoid relegation'} · {c.stadium}</span>
              </button>
            );
          })}
        </div>
        <div className="pg-row" style={{ justifyContent: 'flex-end' }}>
          <FD.Button icon="play" onClick={() => onStart({ clubId: club, name: name.trim() || 'The Boss', currency })}>Start career</FD.Button>
        </div>
      </section>
    </main>
  );
}
