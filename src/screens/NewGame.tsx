import { useState } from 'react';
import { FD } from '../ds';
import { CLUBS } from '../engine/names';
import type { Currency } from '../engine/types';

export default function NewGame({ onStart }: { onStart: (o: { clubId: string; name: string; currency: Currency }) => void }) {
  const [club, setClub] = useState('ash');
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<Currency>('EUR');
  const ranked = CLUBS.slice().sort((a, b) => b.reputation - a.reputation);
  return (
    <main className="ng">
      <img className="ng__crest" src="/crest-512.png" alt="Football Dynasty: Soccer Management" />
      <section className="ng__card pg-card">
        <h1 className="pg-title">Start your dynasty</h1>
        <div className="fd-grid2">
          <FD.Field label="Your name"><div className="fd-input"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Manager name" aria-label="Your name" maxLength={40} /></div></FD.Field>
          <FD.Field label="Currency"><FD.CurrencyToggle value={currency} onChange={setCurrency} /></FD.Field>
        </div>
        <h2 className="pg-h">Choose your club</h2>
        <div className="ng__clubs" role="radiogroup" aria-label="Club">
          {ranked.map((c, i) => {
            const id = c.short.toLowerCase();
            return (
              <button key={id} type="button" role="radio" aria-checked={club === id} className={'ng__club' + (club === id ? ' is-on' : '')} onClick={() => setClub(id)}>
                <strong>{c.name}</strong>
                <FD.StarRating value={Math.max(0.5, Math.round(((c.reputation - 45) / 33) * 10) / 2)} size={14} />
                <span>{i < 2 ? 'Title favourites' : i < 4 ? 'Expected: top four' : i < 8 ? 'Expected: top half' : 'Expected: avoid the bottom'} · {c.stadium}</span>
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
