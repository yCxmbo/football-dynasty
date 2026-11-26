/* Runs simulation jobs in a Web Worker, falling back to the main thread where workers aren't available. */
import type { GameState } from '../engine/types';
import { runJob, type SimJob } from './jobs';

let worker: Worker | null | undefined;
function getWorker() {
  if (worker !== undefined) return worker;
  try { worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }); } catch { worker = null; }
  return worker;
}

export interface SimRun { result: Promise<GameState>; stop: () => void }

export function simulate(state: GameState, job: SimJob, onProgress: (label: string) => void): SimRun {
  const w = getWorker();
  if (!w) {
    let stopped = false;
    const d = structuredClone(state);
    return { result: runJob(d, job, onProgress, () => stopped), stop: () => { stopped = true; } };
  }
  const result = new Promise<GameState>((resolve, reject) => {
    w.onmessage = (e: MessageEvent<{ type: 'progress'; label: string } | { type: 'done'; state: GameState } | { type: 'error'; message: string }>) => {
      const m = e.data;
      if (m.type === 'progress') onProgress(m.label);
      else if (m.type === 'done') resolve(m.state);
      else reject(new Error(m.message));
    };
    w.onerror = (err) => { reject(err); worker = null; }; // fall back next time
    w.postMessage({ type: 'run', state, job });
  });
  return { result, stop: () => w.postMessage({ type: 'stop' }) };
}
