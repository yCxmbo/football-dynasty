/* Derbies: named rivalries with fuller grounds, hotter matches, more at stake, and head-to-head records. */
import { career } from './career';
import type { Fixture, GameState } from './types';

export interface Rivalry { a: string; b: string; name: string }
export interface DerbyRecord { a: string; b: string; aWins: number; bWins: number; draws: number; last?: string }

const key = (a: string, b: string) => [a, b].sort().join('|');
const cache = new WeakMap<object, Map<string, string>>();

export function derbyName(s: GameState, homeId: string, awayId: string): string | undefined {
  const list = s.world.rivalries;
  if (!list?.length) return undefined;
  let m = cache.get(list);
  if (!m) { m = new Map(list.map((r) => [key(r.a, r.b), r.name])); cache.set(list, m); }
  return m.get(key(homeId, awayId));
}

/** After every derby: head to head, and for yours the board and the dressing room react. */
export function afterDerby(s: GameState, f: Fixture) {
  const name = derbyName(s, f.homeId, f.awayId);
  const r = f.result;
  if (!name || !r) return;
  const rec = ((s.derbies ??= {})[name] ??= { a: [f.homeId, f.awayId].sort()[0], b: [f.homeId, f.awayId].sort()[1], aWins: 0, bWins: 0, draws: 0 });
  const winner = r.winnerId ?? (r.score[0] > r.score[1] ? f.homeId : r.score[1] > r.score[0] ? f.awayId : undefined);
  if (!winner) rec.draws++; else if (winner === rec.a) rec.aWins++; else rec.bWins++;
  rec.last = `${s.clubs[f.homeId].short} ${r.score[0]}–${r.score[1]} ${s.clubs[f.awayId].short}`;
  const me = s.userClubId;
  if (f.homeId !== me && f.awayId !== me) return;
  const squad = Object.values(s.players).filter((p) => p.clubId === me && p.squad === 'First team');
  const c = career(s);
  if (winner === me) {
    c.trust = Math.min(100, c.trust + 3);
    for (const p of squad) if (p.morale === 'low') p.morale = 'ok'; else p.morale = 'high';
    s.derbyWins = (s.derbyWins ?? 0) + 1;
  } else if (winner) {
    c.trust = Math.max(0, c.trust - 4);
    for (const p of squad) if (p.morale === 'high') p.morale = 'ok';
  }
}

/* The world's famous derbies (real-world ids). */
const R = (a: string, b: string, name: string): Rivalry => ({ a, b, name });
export const REAL_RIVALRIES: Rivalry[] = [
  R('eng-arsenal', 'eng-tottenham', 'North London derby'), R('eng-liverpool', 'eng-everton', 'Merseyside derby'), R('eng-manutd', 'eng-mancity', 'Manchester derby'),
  R('eng-manutd', 'eng-liverpool', 'North West derby'), R('eng-newcastle', 'eng-sunderland', 'Tyne–Wear derby'), R('eng-crystalpalace', 'eng-brighton', 'M23 derby'),
  R('eng-astonvilla', 'eng-birmingham', 'Second City derby'), R('eng-forest', 'eng-derby', 'East Midlands derby'), R('eng-sheffutd', 'eng-sheffwed', 'Steel City derby'),
  R('eng-wolves', 'eng-westbrom', 'Black Country derby'), R('eng-portsmouth', 'eng-southampton', 'South Coast derby'), R('eng-ipswich', 'eng-norwich', 'East Anglian derby'),
  R('eng-leeds', 'eng-manutd', 'Roses rivalry'), R('eng-westham', 'eng-millwall', 'Dockers derby'),
  R('esp-realmadrid', 'esp-barcelona', 'El Clásico'), R('esp-realmadrid', 'esp-atletico', 'Madrid derby'), R('esp-barcelona', 'esp-espanyol', 'Barcelona derby'),
  R('esp-sevilla', 'esp-betis', 'Seville derby'), R('esp-athletic', 'esp-realsociedad', 'Basque derby'), R('esp-valencia', 'esp-levante', 'Valencia derby'),
  R('ita-inter', 'ita-milan', 'Derby della Madonnina'), R('ita-roma', 'ita-lazio', 'Derby della Capitale'), R('ita-juventus', 'ita-torino', 'Derby della Mole'),
  R('ita-juventus', 'ita-inter', 'Derby d\'Italia'), R('ita-genoa', 'ita-sampdoria', 'Derby della Lanterna'), R('ita-napoli', 'ita-roma', 'Derby del Sole'),
  R('ger-dortmund', 'ger-schalke', 'Revierderby'), R('ger-bayern', 'ger-dortmund', 'Der Klassiker'), R('ger-hamburg', 'ger-werder', 'Nordderby'),
  R('ger-koln', 'ger-gladbach', 'Rhine derby'), R('ger-hamburg', 'ger-stpauli', 'Hamburg derby'),
  R('fra-psg', 'fra-marseille', 'Le Classique'), R('fra-lyon', 'fra-saintetienne', 'Derby du Rhône'), R('fra-nice', 'fra-monaco', 'Côte d\'Azur derby'), R('fra-lens', 'fra-lille', 'Derby du Nord'),
  R('por-benfica', 'por-sporting', 'Lisbon derby'), R('por-benfica', 'por-porto', 'O Clássico'),
  R('ned-ajax', 'ned-feyenoord', 'De Klassieker'), R('ned-ajax', 'ned-psv', 'De Topper'),
  R('bel-anderlecht', 'bel-standard', 'Belgian Clásico'), R('bel-brugge', 'bel-cercle', 'Bruges derby'),
  R('tur-galatasaray', 'tur-fenerbahce', 'Intercontinental derby'), R('tur-besiktas', 'tur-galatasaray', 'Istanbul derby'),
  R('sco-celtic', 'sco-rangers', 'Old Firm'), R('sco-hearts', 'sco-hibernian', 'Edinburgh derby'), R('sco-dundee', 'sco-dundeeutd', 'Dundee derby'),
  R('bra-flamengo', 'bra-fluminense', 'Fla-Flu'), R('bra-corinthians', 'bra-palmeiras', 'Derby Paulista'), R('bra-gremio', 'bra-internacional', 'Grenal'),
  R('bra-atleticomg', 'bra-cruzeiro', 'Clássico Mineiro'), R('bra-flamengo', 'bra-vasco', 'Clássico dos Milhões'),
  R('arg-boca', 'arg-river', 'Superclásico'), R('arg-racing', 'arg-independiente', 'Avellaneda derby'), R('arg-central', 'arg-newells', 'Rosario derby'),
  R('usa-lafc', 'usa-galaxy', 'El Tráfico'), R('usa-seattle', 'usa-portland', 'Cascadia derby'), R('usa-nycfc', 'usa-nyrb', 'Hudson River derby'),
  R('mex-america', 'mex-chivas', 'El Súper Clásico'), R('mex-tigres', 'mex-monterrey', 'Clásico Regiomontano'), R('mex-america', 'mex-pumas', 'Clásico Capitalino'),
  R('ksa-hilal', 'ksa-nassr', 'Riyadh derby'), R('ksa-ittihad', 'ksa-ahli', 'Jeddah derby'),
];
