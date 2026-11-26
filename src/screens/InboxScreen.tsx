import { FD } from '../ds';
import type { GameState } from '../engine/types';
import type { Screen } from './shared';

export default function InboxScreen({ g, selectedId, onOpen, onBid, onAnswer, go }: { g: GameState; selectedId?: string; onOpen: (id: string) => void; onBid: (bidId: string, accept: boolean) => void; onAnswer: (messageId: string, option: number) => void; go: (s: Screen, id?: string) => void }) {
  if (!g.inbox.length) return <div className="pg-empty">No messages yet.</div>;
  const messages = g.inbox.map((m) => {
    const bid = m.bidId ? g.bids.find((b) => b.id === m.bidId) : undefined;
    const open = bid?.status === 'open';
    const actions: JSX.Element[] = [];
    if (open) {
      actions.push(<FD.Button key="a" size="sm" icon="transfers" onClick={() => onBid(bid!.id, true)}>Accept bid</FD.Button>);
      actions.push(<FD.Button key="r" size="sm" variant="secondary" onClick={() => onBid(bid!.id, false)}>Reject</FD.Button>);
    }
    const ask = m.choice && m.choice.answered === undefined && m.choice.options.length > 0;
    if (ask) m.choice!.options.forEach((o, i) => actions.push(<FD.Button key={`c${i}`} size="sm" variant={i === 0 ? 'primary' : 'secondary'} onClick={() => onAnswer(m.id, i)}>{o}</FD.Button>));
    if (m.playerId && g.players[m.playerId]) actions.push(<FD.Button key="v" size="sm" variant="ghost" onClick={() => go('player', m.playerId)}>View player</FD.Button>);
    const status = bid && !open ? [`This bid was ${bid.status}.`] : [];
    return { ...m, body: [...m.body, ...status], needsReply: open || ask, actions: actions.length ? actions : undefined };
  });
  return (
    <div>
      <div className="pg-head"><div><h1 className="pg-title">Inbox</h1><p className="pg-sub">{g.inbox.filter((m) => m.unread).length} unread</p></div></div>
      <FD.Inbox key={selectedId ?? 'inbox'} messages={messages} selectedId={selectedId ?? g.inbox[0].id} onOpen={(m: { id: string }) => onOpen(m.id)} />
    </div>
  );
}
