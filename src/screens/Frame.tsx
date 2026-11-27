import { useEffect, useState, type ReactNode } from 'react';
import { FD } from '../ds';
import type { Currency } from '../engine/types';

export interface NavItem { id: string; label: string; icon: string; badge?: number; group?: string }

/** The app frame: top bar and a sidebar grouped into sections (same look as the design system's frame). */
export default function Frame({ crestSrc, club, season, budget, currency, onCurrencyChange, active, nav, onNavigate, primaryAction, children }: {
  crestSrc: string; club: string; season: string; budget?: number; currency: Currency; onCurrencyChange: (c: Currency) => void;
  active: string; nav: NavItem[]; onNavigate: (id: string) => void; primaryAction?: ReactNode; children: ReactNode;
}) {
  const [more, setMore] = useState(false);
  const tabs = ['home', 'inbox', 'squad', 'tactics'].map((id) => nav.find((n) => n.id === id)).filter((n): n is NavItem => !!n);
  const inMore = !tabs.some((n) => n.id === active);
  const pick = (id: string) => { setMore(false); onNavigate(id); };
  useEffect(() => {
    if (!more) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMore(false); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [more]);
  return (
    <div className="fd-app">
      <header className="fd-topbar">
        <div className="fd-topbar__brand"><img src={crestSrc} alt="Football Dynasty" className="fd-topbar__crest" /><span className="fd-topbar__game">Football Dynasty</span></div>
        <div className="fd-topbar__club"><span className="fd-topbar__clubname">{club}</span><span className="fd-topbar__date">{season}</span></div>
        <div className="fd-topbar__right">
          {budget !== undefined ? <span className="fd-topbar__budget"><span className="fd-label">Transfer budget</span><FD.Money amount={budget} currency={currency} /></span> : null}
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
      {/* phones: a bottom tab bar, with everything else under More */}
      <nav className="tabbar" aria-label="Main (phone)">
        {tabs.map((n) => (
          <button key={n.id} type="button" className={'tabbar__tab' + (n.id === active ? ' is-on' : '')} aria-current={n.id === active ? 'page' : undefined} onClick={() => pick(n.id)}>
            <FD.Icon name={n.icon} size={22} /><span>{n.label}</span>{n.badge ? <span className="tabbar__badge">{n.badge}</span> : null}
          </button>
        ))}
        <button type="button" className={'tabbar__tab' + (inMore || more ? ' is-on' : '')} aria-expanded={more} aria-controls="more-sheet" onClick={() => setMore((v) => !v)}>
          <span className="tabbar__dots" aria-hidden="true">•••</span><span>More</span>
        </button>
      </nav>
      {more ? (
        <div className="sheet" role="presentation" onClick={() => setMore(false)}>
          <div className="sheet__panel" id="more-sheet" role="dialog" aria-modal="true" aria-label="All screens" onClick={(e) => e.stopPropagation()}>
            {[...new Set(nav.filter((n) => !tabs.includes(n)).map((n) => n.group ?? ''))].map((grp) => (
              <div key={grp} className="sheet__group">
                {grp ? <span className="fd-label">{grp}</span> : null}
                <div className="sheet__grid">
                  {nav.filter((n) => !tabs.includes(n) && (n.group ?? '') === grp).map((n) => (
                    <button key={n.id} type="button" className={'sheet__item' + (n.id === active ? ' is-on' : '')} onClick={() => pick(n.id)}>
                      <FD.Icon name={n.icon} size={20} /><span>{n.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
