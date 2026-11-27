import type { ReactNode } from 'react';
import { FD } from '../ds';
import type { Currency } from '../engine/types';

export interface NavItem { id: string; label: string; icon: string; badge?: number; group?: string }

/** The app frame: top bar and a sidebar grouped into sections (same look as the design system's frame). */
export default function Frame({ crestSrc, club, season, budget, currency, onCurrencyChange, active, nav, onNavigate, primaryAction, children }: {
  crestSrc: string; club: string; season: string; budget: number; currency: Currency; onCurrencyChange: (c: Currency) => void;
  active: string; nav: NavItem[]; onNavigate: (id: string) => void; primaryAction?: ReactNode; children: ReactNode;
}) {
  return (
    <div className="fd-app">
      <header className="fd-topbar">
        <div className="fd-topbar__brand"><img src={crestSrc} alt="Football Dynasty" className="fd-topbar__crest" /><span className="fd-topbar__game">Football Dynasty</span></div>
        <div className="fd-topbar__club"><span className="fd-topbar__clubname">{club}</span><span className="fd-topbar__date">{season}</span></div>
        <div className="fd-topbar__right">
          <span className="fd-topbar__budget"><span className="fd-label">Transfer budget</span><FD.Money amount={budget} currency={currency} /></span>
          <FD.CurrencyToggle value={currency} onChange={onCurrencyChange} />
          {primaryAction}
        </div>
      </header>
      <div className="fd-app__body">
        <nav className="fd-sidebar" aria-label="Main">
          {nav.map((n, i) => {
            const on = n.id === active;
            const head = n.group && n.group !== nav[i - 1]?.group ? <div className="nav-group" key={'g' + n.group} role="presentation"><span>{n.group}</span></div> : null;
            return [head, (
              <button key={n.id} type="button" className={'fd-nav' + (on ? ' is-on' : '')} aria-current={on ? 'page' : undefined} onClick={() => onNavigate(n.id)} title={n.label}>
                <FD.Icon name={n.icon} size={20} /><span>{n.label}</span>{n.badge ? <span className="fd-nav__badge">{n.badge}</span> : null}
              </button>
            )];
          })}
        </nav>
        <main className="fd-main">{children}</main>
      </div>
    </div>
  );
}
