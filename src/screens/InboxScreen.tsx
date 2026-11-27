import { useEffect, useMemo, useState } from 'react';
import { FD } from '../ds';
import type { GameState, InboxMessage } from '../engine/types';
import type { Screen } from './shared';

const CATEGORY: Record<string, [string, string]> = {
  board: ['crown', 'Board'], transfers: ['transfers', 'Transfers'], scouting: ['scouting', 'Scouting'], medical: ['injury', 'Medical'],
  media: ['inbox', 'Media'], training: ['training', 'Training'], youth: ['youth', 'Academy'], match: ['fixtures', 'Matches'], finance: ['finances', 'Finances'],
};

/** The inbox. The category filter stays put while you open messages; decisions (bids, questions) sit at the top
    of the open message so you never scroll for them. */
export default function InboxScreen({ g, selectedId, onOpen, onBid, onAnswer, go }: { g: GameState; selectedId?: string; onOpen: (id: string) => void; onBid: (bidId: string, accept: boolean) => void; onAnswer: (messageId: string, option: number) => void; go: (s: Screen, id?: string) => void }) {
  const [filter, setFilter] = useState('all');
  const [pending, setPending] = useState(false);
  const msgs = g.inbox;
  const needsDecision = (m: InboxMessage) => {
    const bid = m.bidId ? g.bids.find((b) => b.id === m.bidId) : undefined;
    return bid?.status === 'open' || !!(m.choice && m.choice.answered === undefined && m.choice.options.length);
  };
  const cats = ['all', ...Object.keys(CATEGORY).filter((c) => msgs.some((m) => m.category === c))];
  const list = useMemo(() => msgs.filter((m) => (filter === 'all' || m.category === filter) && (!pending || needsDecision(m))), [msgs, filter, pending, g.bids]); // eslint-disable-line react-hooks/exhaustive-deps
  const sel = selectedId && msgs.some((m) => m.id === selectedId) ? selectedId : list[0]?.id;
  const cur = msgs.find((m) => m.id === sel);
  // opening the inbox marks the first message read, as before
  useEffect(() => { if (cur && cur.unread && !selectedId) onOpen(cur.id); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!msgs.length) return <div className="pg-empty">No messages yet.</div>;
  const decisions = msgs.filter(needsDecision).length;

  const actions = (m: InboxMessage) => {
    const out: JSX.Element[] = [];
    const bid = m.bidId ? g.bids.find((b) => b.id === m.bidId) : undefined;
    if (bid?.status === 'open') {
      out.push(<FD.Button key="a" size="sm" icon="transfers" onClick={() => onBid(bid.id, true)}>Accept bid</FD.Button>);
      out.push(<FD.Button key="r" size="sm" variant="secondary" onClick={() => onBid(bid.id, false)}>Reject</FD.Button>);
    }
    if (m.choice && m.choice.answered === undefined) m.choice.options.forEach((o, i) => out.push(<FD.Button key={`c${i}`} size="sm" variant={i === 0 ? 'primary' : 'secondary'} onClick={() => onAnswer(m.id, i)}>{o}</FD.Button>));
    if (m.playerId && g.players[m.playerId]) out.push(<FD.Button key="v" size="sm" variant="ghost" onClick={() => go('player', m.playerId)}>View player</FD.Button>);
    return { out, status: bid && bid.status !== 'open' ? `This bid was ${bid.status}.` : undefined };
  };
  const curActions = cur ? actions(cur) : null;
  const icon = (c: string) => (CATEGORY[c] ?? CATEGORY.media)[0];

  return (
    <div>
      <div className="pg-head">
        <div><h1 className="pg-title">Inbox</h1><p className="pg-sub">{msgs.filter((m) => m.unread).length} unread{decisions ? ` · ${decisions} waiting for a decision` : ''}</p></div>
      </div>
      <div className="fd-inbox">
        <div className="fd-inbox__list">
          <div className="fd-chips" role="tablist" aria-label="Filter messages">
            {cats.map((c) => {
              const n = msgs.filter((m) => (c === 'all' || m.category === c) && m.unread).length;
              return <button key={c} type="button" role="tab" aria-selected={filter === c} className={'fd-chip' + (filter === c ? ' is-on' : '')} onClick={() => setFilter(c)}>{c === 'all' ? 'All' : CATEGORY[c][1]}{n ? <span className="fd-chip__n">{n}</span> : null}</button>;
            })}
            {decisions ? <button type="button" className={'fd-chip' + (pending ? ' is-on' : '')} aria-pressed={pending} onClick={() => setPending((v) => !v)}>Needs a decision<span className="fd-chip__n">{decisions}</span></button> : null}
          </div>
          <ul className="fd-msgs">
            {list.map((m) => (
              <li key={m.id}>
                <button type="button" className={'fd-msg' + (m.id === sel ? ' is-on' : '') + (m.unread ? ' is-unread' : '')} onClick={() => onOpen(m.id)} aria-current={m.id === sel || undefined}>
                  <span className="fd-msg__icon"><FD.Icon name={icon(m.category)} size={18} /></span>
                  <span className="fd-msg__main">
                    <span className="fd-msg__top"><span className="fd-msg__from">{m.from}</span><span className="fd-msg__date">{m.date}</span></span>
                    <span className="fd-msg__subject">{m.unread ? <span className="fd-dot" aria-label="Unread" /> : null}{m.subject}</span>
                    {needsDecision(m) ? <span className="fd-tag fd-tag--warn">Needs a decision</span> : null}
                  </span>
                </button>
              </li>
            ))}
            {!list.length ? <li className="hm-note" style={{ padding: 12 }}>Nothing here.</li> : null}
          </ul>
        </div>
        <section className="fd-inbox__read" aria-live="polite">
          {cur ? (
            <>
              <header className="fd-read__head">
                <span className="fd-label"><FD.Icon name={icon(cur.category)} size={14} /> {(CATEGORY[cur.category] ?? CATEGORY.media)[1]}</span>
                <h2 className="fd-read__subject">{cur.subject}</h2>
                <span className="fd-read__meta">{cur.from}{cur.role ? `, ${cur.role}` : ''} · {cur.date}</span>
              </header>
              {curActions && curActions.out.length ? <div className="fd-read__actions inbox-actions">{curActions.out}</div> : null}
              <div className="fd-read__body">
                {cur.body.map((para, i) => <p key={i}>{para}</p>)}
                {curActions?.status ? <p className="fd-muted">{curActions.status}</p> : null}
              </div>
            </>
          ) : <p className="fd-muted">No message selected</p>}
        </section>
      </div>
    </div>
  );
}
