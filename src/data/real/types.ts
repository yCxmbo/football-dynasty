/* Compact source format for the built-in real-world database.
   Players: [name, position, age at the start of 2025/26, overall 1–100 (estimate), nationality (FIFA code), potential overall?].
   Club and competition names are deliberately similar to, not the same as, the real ones; badges are generated from colours. */
export type P = [string, string, number, number, string, number?];
export interface RC { id: string; name: string; short: string; rep: number; col: [string, string]; st?: string; cap?: number; p?: P[] }
export interface RL { id: string; name: string; short?: string; tier: number; promote: number; playoff?: [number, number]; relegate: number; tv: number; titlePlayoff?: { name: string; trophy: string; shield?: string }; split?: boolean; clubs: RC[] }
export interface RCountry { id: string; name: string; superCup?: string | false; leagues: RL[]; cups: Array<{ id: string; name: string; tiers: number[]; main?: boolean }> }
/** Clubs without a league here that fill continental places. */
export interface RFillers { id: string; name: string; clubs: RC[] }

export const c = (id: string, name: string, short: string, rep: number, col: [string, string], st?: string, cap?: number, p: P[] = []): RC => ({ id, name, short, rep, col, st, cap, p });
