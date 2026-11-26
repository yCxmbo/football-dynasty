/* The built-in world: fictional clubs in real-scale formats. Town names are invented so that no
   club recreates a real one; formats follow the leagues and cups they are modelled on. */
import { CLUBS, FOREIGN_CLUBS, LOWER_CLUBS, type ClubSeed } from './names';
import { WORLD_FORMAT, WORLD_VERSION, type ClubDef, type WorldDef } from './worlddef';

const MORE_ENGLISH: Array<[string, string, string]> = [
  ['Ravensby United', 'RAV', 'The Ravens'], ['Whitmore Town', 'WHI', 'The Whites'], ['Coldbeck Rovers', 'CBK', 'The Becks'], ['Langdon Athletic', 'LAN', 'The Lions'],
  ['Barrowfield', 'BAR', 'The Barrows'], ['Norcott City', 'NCT', 'The Cotters'], ['Elmhurst Albion', 'ELM', 'The Elms'], ['Tidewell FC', 'TID', 'The Tides'],
  ['Halsey Wanderers', 'HAL', 'The Hals'], ['Brookvale Town', 'BRK', 'The Brooks'], ['Crestwood United', 'CRE', 'The Crests'], ['Ashbourne Park', 'ASP', 'The Parkers'],
  ['Millbury Rangers', 'MIL', 'The Millers'], ['Stanmore City', 'STA', 'The Stags'], ['Kirkby Vale', 'KIR', 'The Kirks'], ['Dovercourt FC', 'DOV', 'The Doves'],
  ['Felling Athletic', 'FEL', 'The Fellers'], ['Rotherby Town', 'ROT', 'The Bys'], ['Chalkley United', 'CHA', 'The Chalks'], ['Westcombe Rovers', 'WCO', 'The Combes'],
  ['Pemberly County', 'PEM', 'The County'], ['Amblecote FC', 'AMB', 'The Coters'], ['Thatcham Borough', 'THA', 'The Thatchers'], ['Holbeck Wednesday', 'HBW', 'The Owls'],
];

const FOREIGN_TOWNS: Record<string, { name: string; pattern: (town: string, i: number) => string; towns: string[]; continental?: number }> = {
  esp: { name: 'Spain', pattern: (t, i) => [`Real ${t}`, `CD ${t}`, `Atlético ${t}`, `UD ${t}`, `Deportivo ${t}`, `SD ${t}`, `CF ${t}`, `Racing ${t}`][i % 8],
    towns: ['Valdoria', 'Montesur', 'Castellar', 'Peñalta', 'Riosol', 'Almaraz', 'Torrevieja Alta', 'Villacruz', 'Sierramar', 'Puertollano Viejo', 'Lomaverde', 'Campoalto', 'Fuenteblanca', 'Navaluz', 'Olmedilla', 'Torrecampo', 'Benisol', 'Arroyal', 'Mirasierra', 'Calaverde'] },
  ger: { name: 'Germany', pattern: (t, i) => [`FC ${t}`, `SV ${t}`, `VfB ${t}`, `Borussia ${t}`, `Eintracht ${t}`, `TSV ${t}`, `Fortuna ${t}`, `SC ${t}`, `1. FC ${t}`][i % 9],
    towns: ['Nordwald', 'Altstadt', 'Steinbach', 'Rosenheide', 'Kaltenberg', 'Lindenau', 'Wolfsheim', 'Bergfeld', 'Ostermark', 'Eichstadt', 'Talburg', 'Hohenfurt', 'Sandhausen-Nord', 'Brückenau', 'Mühltal', 'Waldeck', 'Seestadt', 'Kronach-West'] },
  ita: { name: 'Italy', pattern: (t, i) => [`AC ${t}`, `Inter ${t}`, `US ${t}`, `AS ${t}`, `SS ${t}`, `Calcio ${t}`, `Sporting ${t}`, `FC ${t}`][i % 8],
    towns: ['Lombarda', 'Toscana Nord', 'Valfiore', 'Montebello', 'Portoreale', 'Castelvento', 'Rivalta', 'Sanmarco', 'Pietrasanta Alta', 'Borgonuovo', 'Collerosso', 'Acquaviva', 'Lagonero', 'Monteverde', 'Fiumara', 'Torregrande', 'Vallescura', 'Campobianco', 'Roccalta', 'Marinella'] },
  fra: { name: 'France', pattern: (t, i) => [`Olympique ${t}`, `AS ${t}`, `FC ${t}`, `Stade ${t}`, `RC ${t}`, `SC ${t}`, `US ${t}`, `Girondins ${t}`][i % 8],
    towns: ['Rhône', 'Bellerive', 'Montclair', 'Saint-Aubin', 'Vauclair', 'Bordemer', 'Fontenoy', 'Vieux-Port', 'Lorvignac', 'Chantebois', 'Mirepont', 'Valrose', 'Hautemer', 'Clairvaux-Ville', 'Roquemaure', 'Beaulac', 'Ormesson', 'Pontvert'] },
};

const REST: Array<[string, string, string]> = [
  ['Lusitânia Lisboa', 'por', 'Portugal'], ['Sporting Atlântico', 'por', 'Portugal'], ['Hollandia Rotterdam', 'ned', 'Netherlands'], ['PSV Kempenland', 'ned', 'Netherlands'],
  ['Galata Yıldız', 'tur', 'Turkey'], ['Anadolu Spor', 'tur', 'Turkey'], ['Dynamo Volga', 'eur', 'Eastern Europe'], ['Lokomotiv Karst', 'eur', 'Eastern Europe'],
  ['Caledonian Athletic', 'sco', 'Scotland'], ['Glenmore Rangers', 'sco', 'Scotland'], ['Royal Antwerpen-Noord', 'bel', 'Belgium'], ['Club Westhoek', 'bel', 'Belgium'],
  ['Olympiakos Thalassa', 'gre', 'Greece'], ['Panelliniki AO', 'gre', 'Greece'], ['Rapid Donaustadt', 'aut', 'Austria'], ['Austria Alpen', 'aut', 'Austria'],
  ['FC Bergsee', 'sui', 'Switzerland'], ['Grasshopper Aare', 'sui', 'Switzerland'], ['FC Øresund', 'den', 'Denmark'], ['Brøndby Strand', 'den', 'Denmark'],
  ['Slavia Vltava', 'cze', 'Czechia'], ['Sparta Morava', 'cze', 'Czechia'], ['Dinamo Jadran', 'cro', 'Croatia'], ['Hajduk Dalmacija', 'cro', 'Croatia'],
  ['Crvena Sava', 'srb', 'Serbia'], ['Partizan Dunav', 'srb', 'Serbia'], ['Rosenborg Fjord', 'nor', 'Norway'], ['Malmö Sundet', 'swe', 'Sweden'],
  ['Shakhtar Stepove', 'eur', 'Eastern Europe'], ['Ferencváros Duna', 'eur', 'Eastern Europe'],
];

const id = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '').slice(0, 10);
const range = (i: number, n: number, hi: number, lo: number) => Math.round(hi - (i * (hi - lo)) / Math.max(1, n - 1));

/** The built-in world in the same format as imported world files. */
export function builtinWorld(): WorldDef {
  const clubs: ClubDef[] = [];
  const used = new Set<string>();
  const uid = (base: string) => { let x = base, k = 2; while (used.has(x)) x = base + k++; used.add(x); return x; };
  const seed = (s: ClubSeed, league: string, rep: number): ClubDef => ({ id: uid(s.short.toLowerCase()), name: s.name, short: s.short, country: 'eng', league, reputation: rep, stadium: s.stadium, capacity: s.capacity, nickname: s.nickname, founded: s.founded });
  // England-style pyramid: 3 × 20. The original 12 top-flight clubs keep their ids (ash, car…).
  const eng = [...CLUBS, ...LOWER_CLUBS, ...MORE_ENGLISH.map(([name, short, nickname], i) => ({ name, short, nickname, reputation: 40 - i, stadium: `${name.split(' ')[0]} Park`, capacity: 9000 + (24 - i) * 600, founded: 1880 + i * 2 }))];
  eng.slice(0, 20).forEach((s, i) => clubs.push(seed(s, 'eng1', range(i, 20, 80, 52))));
  eng.slice(20, 40).forEach((s, i) => clubs.push(seed(s, 'eng2', range(i, 20, 52, 38))));
  eng.slice(40, 60).forEach((s, i) => clubs.push(seed(s, 'eng3', range(i, 20, 38, 25))));
  // other countries: one top division each
  const countries = [{ id: 'eng', name: 'England' }, ...Object.entries(FOREIGN_TOWNS).map(([cid, c]) => ({ id: cid, name: c.name }))];
  const size: Record<string, number> = { esp: 20, ger: 18, ita: 20, fra: 18 };
  const top: Record<string, number> = { esp: 86, ger: 82, ita: 82, fra: 79 };
  for (const [cid, c] of Object.entries(FOREIGN_TOWNS)) {
    const n = size[cid];
    // the two existing Continental names per country lead their league
    const named = FOREIGN_CLUBS.filter((f) => f.country === c.name);
    for (let i = 0; i < n; i++) {
      const name = i < named.length ? named[i].name : c.pattern(c.towns[i], i);
      clubs.push({ id: uid(id(name)), name, country: cid, league: `${cid}1`, reputation: range(i, n, top[cid], 48), stadium: i < named.length ? named[i].stadium : `Estadio ${c.towns[i]}`.replace('Estadio', cid === 'ger' ? 'Stadion' : cid === 'ita' ? 'Stadio' : cid === 'fra' ? 'Stade' : 'Estadio'), capacity: 15000 + (n - i) * 2500 });
    }
  }
  // rest of Europe: no league here, they fill the continental competitions
  for (const [name, cid, cname] of REST) {
    if (!countries.some((c) => c.id === cid)) countries.push({ id: cid, name: cname });
    const i = REST.findIndex((r) => r[0] === name);
    clubs.push({ id: uid(id(name)), name, country: cid, reputation: range(i, REST.length, 74, 44), capacity: 30000 - i * 500 });
  }
  const restIds = clubs.filter((c) => !c.league).sort((a, b) => b.reputation - a.reputation).map((c) => c.id);
  return {
    format: WORLD_FORMAT, version: WORLD_VERSION, name: 'Football Dynasty (fictional)', startYear: 2026,
    countries,
    leagues: [
      { id: 'eng1', name: 'Premier Division', short: 'Premier', country: 'eng', tier: 1, promote: 0, relegate: 3, tv: 1_200_000 },
      { id: 'eng2', name: 'Championship', country: 'eng', tier: 2, promote: 2, playoff: [3, 6], relegate: 3, tv: 450_000 },
      { id: 'eng3', name: 'League One', country: 'eng', tier: 3, promote: 2, playoff: [3, 6], relegate: 0, tv: 200_000 },
      { id: 'esp1', name: 'Primera Liga', country: 'esp', tier: 1, promote: 0, relegate: 0, tv: 1_000_000 },
      { id: 'ger1', name: 'Erste Liga', country: 'ger', tier: 1, promote: 0, relegate: 0, tv: 900_000 },
      { id: 'ita1', name: 'Serie Prima', country: 'ita', tier: 1, promote: 0, relegate: 0, tv: 900_000 },
      { id: 'fra1', name: 'Ligue Une', country: 'fra', tier: 1, promote: 0, relegate: 0, tv: 700_000 },
    ],
    cups: [
      { id: 'eng-nc', name: 'National Cup', country: 'eng', tiers: [1, 2, 3], main: true },
      { id: 'eng-lc', name: 'League Cup', country: 'eng', tiers: [1, 2] },
      { id: 'esp-cup', name: 'Copa Nacional', country: 'esp', tiers: [1], main: true },
      { id: 'ger-cup', name: 'Pokal', country: 'ger', tiers: [1], main: true },
      { id: 'ita-cup', name: 'Coppa Nazionale', country: 'ita', tiers: [1], main: true },
      { id: 'fra-cup', name: 'Coupe Nationale', country: 'fra', tiers: [1], main: true },
    ],
    continental: [
      { id: 'cc1', name: 'Continental Cup', rank: 1, size: 32, places: { eng: 4, esp: 4, ger: 4, ita: 4, fra: 3 }, fillers: restIds },
      { id: 'cc2', name: 'Continental Trophy', rank: 2, size: 32, places: { eng: 2, esp: 2, ger: 2, ita: 2, fra: 2 }, cupWinners: true, fillers: restIds },
    ],
    clubs,
  };
}

/** A small template for people writing their own world file. */
export function templateWorld(): WorldDef {
  const w: WorldDef = {
    format: WORLD_FORMAT, version: WORLD_VERSION, name: 'My world', startYear: 2026,
    countries: [{ id: 'aaa', name: 'Country A' }, { id: 'bbb', name: 'Country B' }],
    leagues: [
      { id: 'aaa1', name: 'A Top League', country: 'aaa', tier: 1, promote: 0, relegate: 2, tv: 1_000_000 },
      { id: 'aaa2', name: 'A Second League', country: 'aaa', tier: 2, promote: 1, playoff: [2, 5], relegate: 0, tv: 300_000 },
      { id: 'bbb1', name: 'B Top League', country: 'bbb', tier: 1, promote: 0, relegate: 0, tv: 800_000 },
    ],
    cups: [{ id: 'aaa-cup', name: 'A Cup', country: 'aaa', tiers: [1, 2], main: true }, { id: 'bbb-cup', name: 'B Cup', country: 'bbb', tiers: [1], main: true }],
    continental: [{ id: 'cont', name: 'Continental Cup', rank: 1, size: 16, places: { aaa: 4, bbb: 4 } }],
    clubs: [],
    players: [],
  };
  for (const [league, country, n, hi, lo] of [['aaa1', 'aaa', 8, 80, 55], ['aaa2', 'aaa', 8, 52, 35], ['bbb1', 'bbb', 8, 78, 50]] as const) {
    for (let i = 0; i < n; i++) w.clubs.push({ id: `${league}-${i + 1}`, name: `${league.toUpperCase()} Club ${i + 1}`, short: `${country.toUpperCase().slice(0, 1)}${league.slice(-1)}${i + 1}`, country, league, reputation: range(i, n, hi, lo), stadium: `Ground ${i + 1}`, capacity: 20000 });
  }
  w.players = [
    { name: 'Example Keeper', club: 'aaa1-1', pos: 'GK', age: 28, nationality: 'Country A', overall: 80 },
    { name: 'Example Striker', club: 'aaa1-1', pos: 'ST', age: 24, nationality: 'Country A', ability: 165, potential: 180 },
    { name: 'Example Midfielder', club: 'aaa1-1', pos: 'CM', age: 21, attributes: { Passing: 17, Vision: 16, Decisions: 15, Stamina: 14 } },
  ];
  return w;
}
