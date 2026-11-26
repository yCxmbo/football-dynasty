/* Background simulation: the page stays responsive while seasons are played. */
import type { GameState } from '../engine/types';
import { runJob, type SimJob } from './jobs';

let stop = false;
self.onmessage = async (e: MessageEvent<{ type: 'run'; state: GameState; job: SimJob } | { type: 'stop' }>) => {
  const m = e.data;
  if (m.type === 'stop') { stop = true; return; }
  stop = false;
  try {
    const state = await runJob(m.state, m.job, (label) => self.postMessage({ type: 'progress', label }), () => stop);
    self.postMessage({ type: 'done', state });
  } catch (err) {
    self.postMessage({ type: 'error', message: String(err) });
  }
};
