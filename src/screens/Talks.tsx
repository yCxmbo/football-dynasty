import { useState } from 'react';
import { boardTarget } from '../engine/game';
import { MEETING_TOPICS, meetingCooldown, TALK_TOPICS, talkBlocked, talkTo, teamMeeting, type MeetingTopic, type Reaction, type TalkTopic } from '../engine/talks';
import type { GameState, Player } from '../engine/types';

const WORD: Record<Reaction, string> = { good: 'Responded well', neutral: 'No real change', bad: 'Reacted badly' };
const fmt = (iso: string) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/** One-to-one with a player: pick what to say; his reply and its effect show straight away. */
export function PlayerTalk({ g, p, update }: { g: GameState; p: Player; update: (fn: (d: GameState) => void) => void }) {
  const [reply, setReply] = useState<{ reaction: Reaction; text: string; topic: TalkTopic } | null>(null);
  const last = g.talks?.[p.id];
  const say = (topic: TalkTopic) => {
    // the outcome is seeded by the date, player and topic, so working it out on a copy gives the same answer
    const r = talkTo(structuredClone(g), p.id, topic);
    setReply({ ...r, topic });
    update((d) => { talkTo(d, p.id, topic); });
  };
  return (
    <section className="pg-card talk" aria-labelledby={`talk-${p.id}`}>
      <div className="talk__head">
        <h2 className="pg-h" id={`talk-${p.id}`} style={{ margin: 0 }}>Talk to {p.name.split(' ').slice(-1)[0]}</h2>
        <span className="fd-muted talk__meta">Morale: <strong>{p.morale === 'high' ? 'Good' : p.morale === 'ok' ? 'Okay' : 'Low'}</strong>{last ? ` · last spoke ${fmt(last.date)} (${TALK_TOPICS.find((t) => t.id === last.topic)?.label.toLowerCase()}: ${WORD[last.reaction].toLowerCase()})` : ''}</span>
      </div>
      <div className="talk__opts">
        {TALK_TOPICS.map((t) => {
          const why = talkBlocked(g, p, t.id);
          return (
            <button key={t.id} type="button" className="talk__opt" disabled={!!why} onClick={() => say(t.id)} title={why ?? t.desc}>
              <strong>{t.label}</strong>
              <span>{why ?? t.desc}</span>
            </button>
          );
        })}
      </div>
      {reply ? <p className={`talk__reply talk__reply--${reply.reaction}`} role="status">{reply.topic !== 'mood' ? <strong>{WORD[reply.reaction]}. </strong> : null}{reply.text}</p> : null}
    </section>
  );
}

/** A team meeting: once a fortnight. */
export function TeamMeeting({ g, update }: { g: GameState; update: (fn: (d: GameState) => void) => void }) {
  const [reply, setReply] = useState<{ reaction: Reaction; text: string } | null>(null);
  const cd = meetingCooldown(g);
  const target = boardTarget(g, g.userClubId).pos;
  const hold = (topic: MeetingTopic) => {
    setReply(teamMeeting(structuredClone(g), topic, target));
    update((d) => { teamMeeting(d, topic, target); });
  };
  return (
    <section className="pg-card talk" aria-labelledby="meeting-h">
      <div className="talk__head">
        <h2 className="pg-h" id="meeting-h" style={{ margin: 0 }}>Team meeting</h2>
        <span className="fd-muted talk__meta">{cd ? `Next meeting in ${cd} ${cd === 1 ? 'day' : 'days'}` : 'The squad is ready to listen'}{g.meeting ? ` · last held ${fmt(g.meeting.date)} (${WORD[g.meeting.reaction].toLowerCase()})` : ''}</span>
      </div>
      <p className="hm-note" style={{ marginTop: 0 }}>How the squad takes it depends on recent results, your leaders and whether the message fits the moment.</p>
      <div className="talk__opts">
        {MEETING_TOPICS.map((t) => (
          <button key={t.id} type="button" className="talk__opt" disabled={cd > 0} onClick={() => hold(t.id)} title={t.desc}>
            <strong>{t.label}</strong><span>{t.desc}</span>
          </button>
        ))}
      </div>
      {reply ? <p className={`talk__reply talk__reply--${reply.reaction}`} role="status"><strong>{WORD[reply.reaction]}. </strong>{reply.text}</p> : null}
    </section>
  );
}
