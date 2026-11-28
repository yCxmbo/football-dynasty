import { useState } from 'react';
import { FD } from '../ds';
import type { Currency, GameState } from '../engine/types';
import { exportSave, type Career, type Theme } from '../store';
import Saves from './Saves';
import Careers from './Careers';
import { resetTips } from './Tip';

export default function Settings({ g, theme, setTheme, setCurrency, onNewCareer, careers, activeId, onLoad, onDelete, onImport, onRestore }: {
  g: GameState; theme: Theme; setTheme: (t: Theme) => void; setCurrency: (c: Currency) => void; onNewCareer: () => void;
  careers: Career[]; activeId: string | null; onLoad: (id: string) => void; onDelete: (id: string) => void; onImport: (text: string) => Promise<string | null>; onRestore: (s: GameState) => void;
}) {
  const [tipsReset, setTipsReset] = useState(false);
  return (
    <div className="st">
      <h1 className="pg-title">Settings</h1>
      <p className="pg-sub">Keyboard: press <kbd>?</kbd> anywhere for the list of shortcuts (<kbd>Space</kbd> to continue, <kbd>S</kbd> to sim to your next match, <kbd>/</kbd> to search players, <kbd>G</kbd> then a letter to change screen).</p>
      <div className="st__row"><div><strong>Theme</strong><p>Night is the default; Day suits long sessions in bright rooms.</p></div>
        <div className="fd-seg" role="radiogroup" aria-label="Theme">
          {(['dark', 'light'] as Theme[]).map((t) => <button key={t} type="button" role="radio" aria-checked={theme === t} className={'fd-seg__opt' + (theme === t ? ' is-on' : '')} onClick={() => setTheme(t)}>{t === 'dark' ? 'Night' : 'Day'}</button>)}
        </div></div>
      <div className="st__row"><div><strong>Currency</strong><p>Every amount in the game is shown in this currency.</p></div><FD.CurrencyToggle value={g.currency} onChange={setCurrency} /></div>
      <div className="st__row"><div><strong>Saving</strong><p>The game saves automatically in this browser. Export a save file to back it up or move it to another device.</p></div>
        <FD.Button variant="secondary" onClick={() => exportSave(g)}>Export save file</FD.Button></div>
      <div className="st__block"><Saves g={g} careerId={activeId} onRestore={onRestore} /></div>
      <div className="st__row"><div><strong>Tips</strong><p>Short tips appear the first time you open each screen.</p></div>
        <FD.Button variant="secondary" disabled={tipsReset} onClick={() => { resetTips(); setTipsReset(true); }}>{tipsReset ? 'Tips will show again' : 'Show tips again'}</FD.Button></div>
      <div className="st__row"><div><strong>New career</strong><p>Starts another career. This one stays saved below.</p></div>
        <FD.Button variant="secondary" onClick={onNewCareer}>Start a new career</FD.Button></div>
      <div className="st__block">
        <strong>Your careers</strong>
        <Careers careers={careers} activeId={activeId} onLoad={onLoad} onDelete={onDelete} onImport={onImport} />
      </div>
    </div>
  );
}
