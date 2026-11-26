/* Generated club badges: a shield in the club's two colours with its short name.
   Real club logos are protected designs, so the game never reproduces them. */
import type { Club } from '../engine/types';

const cache = new Map<string, string>();

function hash(s: string) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
const PALETTE = ['#c8102e', '#003399', '#ffffff', '#111111', '#fdb913', '#00843d', '#6cabdd', '#7a263a', '#f47a20', '#5b2c83', '#1d428a', '#e30613'];

/** Readable text colour on a fill (WCAG relative luminance). */
function ink(hex: string) {
  const c = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? '#0b1c31' : '#ffffff';
}

/** Pattern varies by club so neighbouring badges don't look identical. */
export function badgeSvg(club: Pick<Club, 'id' | 'short' | 'colours'>) {
  const h = hash(club.id);
  const [a, b] = club.colours ?? [PALETTE[h % PALETTE.length], PALETTE[(h >>> 4) % PALETTE.length] === PALETTE[h % PALETTE.length] ? '#ffffff' : PALETTE[(h >>> 4) % PALETTE.length]];
  const pattern = h % 4;
  const shield = 'M32 3 L58 11 L56 36 C54 50 44 58 32 62 C20 58 10 50 8 36 L6 11 Z';
  const fill =
    pattern === 0 ? `<path d="${shield}" fill="${a}"/><path d="M32 3 L58 11 L56 36 C54 50 44 58 32 62 Z" fill="${b}"/>` // halves
    : pattern === 1 ? `<path d="${shield}" fill="${a}"/><clipPath id="s${h}"><path d="${shield}"/></clipPath><g clip-path="url(#s${h})" fill="${b}"><rect x="20" y="0" width="8" height="64"/><rect x="36" y="0" width="8" height="64"/></g>` // stripes
    : pattern === 2 ? `<path d="${shield}" fill="${a}"/><clipPath id="s${h}"><path d="${shield}"/></clipPath><rect x="0" y="22" width="64" height="16" fill="${b}" clip-path="url(#s${h})"/>` // band
    : `<path d="${shield}" fill="${a}"/><clipPath id="s${h}"><path d="${shield}"/></clipPath><path d="M0 0 L64 64 L64 40 L24 0 Z" fill="${b}" clip-path="url(#s${h})"/>`; // sash
  const label = (club.short || '???').slice(0, 3).toUpperCase();
  const textFill = pattern === 2 ? ink(b) : ink(a);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${fill}<path d="${shield}" fill="none" stroke="#0b1c31" stroke-opacity=".35" stroke-width="2"/>`
    + `<text x="32" y="${pattern === 2 ? 34.5 : 36}" text-anchor="middle" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="700" font-size="${label.length > 2 && /[MW]/.test(label) ? 13.5 : 15}" fill="${textFill}" ${pattern !== 2 ? `stroke="${ink(textFill)}" stroke-opacity=".35" stroke-width=".6"` : ''}>${label}</text></svg>`;
}

/** Badge as an image URL (cached). */
export function badgeUrl(club: Pick<Club, 'id' | 'short' | 'colours'> | undefined) {
  if (!club) return undefined;
  const key = `${club.id}|${club.short}|${club.colours?.join(',') ?? ''}`;
  let url = cache.get(key);
  if (!url) { url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(badgeSvg(club))}`; cache.set(key, url); }
  return url;
}
