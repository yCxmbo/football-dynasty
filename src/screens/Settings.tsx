import { FD } from '../ds';
import type { Currency, GameState } from '../engine/types';
import type { Theme } from '../store';

export default function Settings({ g, theme, setTheme, setCurrency, onNewCareer }: { g: GameState; theme: Theme; setTheme: (t: Theme) => void; setCurrency: (c: Currency) => void; onNewCareer: () => void }) {
  return (
    <div className="st">
      <h1 className="pg-title">Settings</h1>
      <div className="st__row"><div><strong>Theme</strong><p>Night is the default; Day suits long sessions in bright rooms.</p></div>
        <div className="fd-seg" role="radiogroup" aria-label="Theme">
          {(['dark', 'light'] as Theme[]).map((t) => <button key={t} type="button" role="radio" aria-checked={theme === t} className={'fd-seg__opt' + (theme === t ? ' is-on' : '')} onClick={() => setTheme(t)}>{t === 'dark' ? 'Night' : 'Day'}</button>)}
        </div></div>
      <div className="st__row"><div><strong>Currency</strong><p>Every amount in the game is shown in this currency.</p></div><FD.CurrencyToggle value={g.currency} onChange={setCurrency} /></div>
      <div className="st__row"><div><strong>Saving</strong><p>The game saves automatically in this browser after every action.</p></div></div>
      <div className="st__row"><div><strong>New career</strong><p>Deletes this save and starts again with a new club.</p></div>
        <FD.Button variant="secondary" onClick={() => { if (window.confirm('Delete this save and start a new career?')) onNewCareer(); }}>Start a new career</FD.Button></div>
    </div>
  );
}
