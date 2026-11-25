import { FD } from '../ds';
import type { GameState } from '../engine/types';

export default function InboxScreen({ g, selectedId, onOpen }: { g: GameState; selectedId?: string; onOpen: (id: string) => void }) {
  if (!g.inbox.length) return <div className="pg-empty">No messages yet.</div>;
  const messages = g.inbox.map((m) => ({ ...m, needsReply: false }));
  return (
    <div>
      <div className="pg-head"><div><h1 className="pg-title">Inbox</h1><p className="pg-sub">{g.inbox.filter((m) => m.unread).length} unread</p></div></div>
      <FD.Inbox key={selectedId ?? 'inbox'} messages={messages} selectedId={selectedId ?? g.inbox[0].id} onOpen={(m: { id: string }) => onOpen(m.id)} />
    </div>
  );
}
