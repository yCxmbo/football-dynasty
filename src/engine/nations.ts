/* National teams: FIFA codes, confederations, a typical squad-player overall (used to fill squads with
   depth players where the world has too few real ones) and shirt colours for badges. Estimates as of 2025. */
import type { Rng } from './rng';

export type Confed = 'UEFA' | 'CONMEBOL' | 'CONCACAF' | 'CAF' | 'AFC' | 'OFC';
export interface Nation { code: string; name: string; confed: Confed; ovr: number; colours: [string, string] }

const N = (code: string, name: string, confed: Confed, ovr: number, a: string, b: string): Nation => ({ code, name, confed, ovr, colours: [a, b] });

export const NATIONS: Nation[] = [
  // UEFA
  N('ESP', 'Spain', 'UEFA', 84, '#C60B1E', '#FFC400'), N('FRA', 'France', 'UEFA', 84, '#002395', '#FFFFFF'), N('ENG', 'England', 'UEFA', 83, '#FFFFFF', '#CE1124'),
  N('POR', 'Portugal', 'UEFA', 82, '#C8102E', '#006600'), N('GER', 'Germany', 'UEFA', 82, '#FFFFFF', '#000000'), N('NED', 'Netherlands', 'UEFA', 81, '#F36C21', '#FFFFFF'),
  N('ITA', 'Italy', 'UEFA', 80, '#0066CC', '#FFFFFF'), N('BEL', 'Belgium', 'UEFA', 79, '#E30613', '#000000'), N('CRO', 'Croatia', 'UEFA', 78, '#FF0000', '#FFFFFF'),
  N('DEN', 'Denmark', 'UEFA', 77, '#C8102E', '#FFFFFF'), N('SUI', 'Switzerland', 'UEFA', 77, '#FF0000', '#FFFFFF'), N('TUR', 'Turkey', 'UEFA', 76, '#E30A17', '#FFFFFF'),
  N('NOR', 'Norway', 'UEFA', 76, '#BA0C2F', '#00205B'), N('AUT', 'Austria', 'UEFA', 76, '#ED2939', '#FFFFFF'), N('SRB', 'Serbia', 'UEFA', 75, '#C6363C', '#0C4076'),
  N('SWE', 'Sweden', 'UEFA', 75, '#FECC02', '#006AA7'), N('UKR', 'Ukraine', 'UEFA', 75, '#FFD500', '#005BBB'), N('POL', 'Poland', 'UEFA', 75, '#FFFFFF', '#DC143C'),
  N('SCO', 'Scotland', 'UEFA', 73, '#0065BF', '#FFFFFF'), N('HUN', 'Hungary', 'UEFA', 73, '#CE2939', '#477050'), N('CZE', 'Czechia', 'UEFA', 73, '#D7141A', '#11457E'),
  N('SVK', 'Slovakia', 'UEFA', 72, '#0B4EA2', '#FFFFFF'), N('GRE', 'Greece', 'UEFA', 72, '#0D5EAF', '#FFFFFF'), N('WAL', 'Wales', 'UEFA', 72, '#C8102E', '#00B140'),
  N('IRL', 'Republic of Ireland', 'UEFA', 71, '#169B62', '#FFFFFF'), N('SVN', 'Slovenia', 'UEFA', 71, '#FFFFFF', '#005DA4'), N('GEO', 'Georgia', 'UEFA', 71, '#FFFFFF', '#E30613'),
  N('ROU', 'Romania', 'UEFA', 71, '#FCD116', '#002B7F'), N('RUS', 'Russia', 'UEFA', 72, '#FFFFFF', '#D52B1E'), N('BIH', 'Bosnia and Herzegovina', 'UEFA', 70, '#002395', '#FECB00'),
  N('ALB', 'Albania', 'UEFA', 69, '#E41E20', '#000000'), N('ISL', 'Iceland', 'UEFA', 68, '#02529C', '#DC1E35'), N('NIR', 'Northern Ireland', 'UEFA', 68, '#00843D', '#FFFFFF'),
  N('MNE', 'Montenegro', 'UEFA', 68, '#D3AE3B', '#C40308'), N('KOS', 'Kosovo', 'UEFA', 68, '#244AA5', '#D0A650'), N('FIN', 'Finland', 'UEFA', 68, '#FFFFFF', '#002F6C'),
  N('MKD', 'North Macedonia', 'UEFA', 67, '#D20000', '#FFE600'), N('BUL', 'Bulgaria', 'UEFA', 66, '#FFFFFF', '#00966E'), N('ISR', 'Israel', 'UEFA', 67, '#FFFFFF', '#0038B8'),
  N('ARM', 'Armenia', 'UEFA', 64, '#D90012', '#0033A0'),
  // CONMEBOL
  N('ARG', 'Argentina', 'CONMEBOL', 84, '#75AADB', '#FFFFFF'), N('BRA', 'Brazil', 'CONMEBOL', 83, '#FEDD00', '#009C3B'), N('URU', 'Uruguay', 'CONMEBOL', 78, '#7BAFD4', '#FFFFFF'),
  N('COL', 'Colombia', 'CONMEBOL', 77, '#FCD116', '#003893'), N('ECU', 'Ecuador', 'CONMEBOL', 75, '#FFDD00', '#034EA2'), N('PAR', 'Paraguay', 'CONMEBOL', 72, '#D52B1E', '#FFFFFF'),
  N('CHI', 'Chile', 'CONMEBOL', 71, '#D52B1E', '#0039A6'), N('PER', 'Peru', 'CONMEBOL', 70, '#FFFFFF', '#D91023'), N('VEN', 'Venezuela', 'CONMEBOL', 70, '#7A1F3D', '#FFFFFF'),
  N('BOL', 'Bolivia', 'CONMEBOL', 65, '#007934', '#FFFFFF'),
  // CONCACAF
  N('USA', 'United States', 'CONCACAF', 75, '#FFFFFF', '#002868'), N('MEX', 'Mexico', 'CONCACAF', 74, '#006847', '#FFFFFF'), N('CAN', 'Canada', 'CONCACAF', 73, '#D80621', '#FFFFFF'),
  N('PAN', 'Panama', 'CONCACAF', 68, '#DA121A', '#FFFFFF'), N('CRC', 'Costa Rica', 'CONCACAF', 67, '#CE1126', '#002B7F'), N('JAM', 'Jamaica', 'CONCACAF', 67, '#FED100', '#009B3A'),
  N('HON', 'Honduras', 'CONCACAF', 65, '#FFFFFF', '#0073CF'), N('SLV', 'El Salvador', 'CONCACAF', 62, '#0F47AF', '#FFFFFF'), N('HAI', 'Haiti', 'CONCACAF', 63, '#00209F', '#D21034'),
  N('CUW', 'Curaçao', 'CONCACAF', 63, '#002B7F', '#F9E814'), N('GUF', 'French Guiana', 'CONCACAF', 58, '#FFDD00', '#00843D'),
  // CAF
  N('MAR', 'Morocco', 'CAF', 79, '#C1272D', '#006233'), N('SEN', 'Senegal', 'CAF', 77, '#FFFFFF', '#00853F'), N('NGA', 'Nigeria', 'CAF', 75, '#008751', '#FFFFFF'),
  N('CIV', 'Ivory Coast', 'CAF', 75, '#F77F00', '#009E60'), N('EGY', 'Egypt', 'CAF', 73, '#CE1126', '#FFFFFF'), N('ALG', 'Algeria', 'CAF', 74, '#FFFFFF', '#006633'),
  N('CMR', 'Cameroon', 'CAF', 73, '#007A5E', '#CE1126'), N('GHA', 'Ghana', 'CAF', 73, '#FFFFFF', '#000000'), N('TUN', 'Tunisia', 'CAF', 70, '#E70013', '#FFFFFF'),
  N('MLI', 'Mali', 'CAF', 71, '#14B53A', '#FCD116'), N('RSA', 'South Africa', 'CAF', 69, '#FFB612', '#007749'), N('COD', 'DR Congo', 'CAF', 71, '#007FFF', '#CE1021'),
  N('BFA', 'Burkina Faso', 'CAF', 68, '#EF2B2D', '#009E49'), N('GUI', 'Guinea', 'CAF', 69, '#CE1126', '#FCD116'), N('CPV', 'Cape Verde', 'CAF', 67, '#003893', '#FFFFFF'),
  N('GAB', 'Gabon', 'CAF', 67, '#009E60', '#FCD116'), N('ANG', 'Angola', 'CAF', 66, '#CC092F', '#000000'), N('ZAM', 'Zambia', 'CAF', 65, '#198A00', '#FFFFFF'),
  N('GAM', 'Gambia', 'CAF', 65, '#CE1126', '#0C1C8C'), N('BEN', 'Benin', 'CAF', 64, '#FCD116', '#008751'), N('TOG', 'Togo', 'CAF', 64, '#006A4E', '#FFCE00'),
  N('EQG', 'Equatorial Guinea', 'CAF', 63, '#E32118', '#3E9A00'), N('MOZ', 'Mozambique', 'CAF', 62, '#D21034', '#000000'), N('ZIM', 'Zimbabwe', 'CAF', 62, '#FFD200', '#006400'),
  N('CTA', 'Central African Republic', 'CAF', 60, '#003082', '#FFCE00'),
  // AFC
  N('JPN', 'Japan', 'AFC', 76, '#000555', '#FFFFFF'), N('KOR', 'South Korea', 'AFC', 74, '#C60C30', '#003478'), N('IRN', 'Iran', 'AFC', 72, '#FFFFFF', '#DA0000'),
  N('AUS', 'Australia', 'AFC', 70, '#FFCD00', '#00843D'), N('KSA', 'Saudi Arabia', 'AFC', 68, '#006C35', '#FFFFFF'), N('QAT', 'Qatar', 'AFC', 67, '#8A1538', '#FFFFFF'),
  N('UZB', 'Uzbekistan', 'AFC', 68, '#FFFFFF', '#1EB53A'), N('IRQ', 'Iraq', 'AFC', 66, '#FFFFFF', '#007A3D'), N('JOR', 'Jordan', 'AFC', 66, '#FFFFFF', '#CE1126'),
  N('UAE', 'United Arab Emirates', 'AFC', 65, '#FFFFFF', '#00732F'), N('OMA', 'Oman', 'AFC', 63, '#DB161B', '#FFFFFF'), N('CHN', 'China', 'AFC', 62, '#DE2910', '#FFDE00'),
  N('PLE', 'Palestine', 'AFC', 61, '#FFFFFF', '#007A3D'), N('BHR', 'Bahrain', 'AFC', 61, '#CE1126', '#FFFFFF'),
  // OFC
  N('NZL', 'New Zealand', 'OFC', 64, '#FFFFFF', '#000000'), N('NCL', 'New Caledonia', 'OFC', 55, '#9E9E9E', '#D52B1E'),
];

export const NATION: Record<string, Nation> = Object.fromEntries(NATIONS.map((n) => [n.code, n]));

/** Older saves and the template store country names; map them to codes. */
const BY_NAME: Record<string, string> = Object.fromEntries([...NATIONS.map((n) => [n.name, n.code]), ['Korea', 'KOR'], ['Ireland', 'IRL'], ['Czech Republic', 'CZE'], ['USA', 'USA']]);
export const nationCode = (s: string | undefined) => (!s ? undefined : NATION[s] ? s : BY_NAME[s]);
export const nationName = (s: string | undefined) => (s && NATION[s]?.name) || s || '—';

/** The nation a world country stands for (world ids are lower-case codes such as "eng"). */
export const homeNation = (countryId: string | undefined) => (countryId && NATION[countryId.toUpperCase()] ? countryId.toUpperCase() : undefined);

/** Where foreign generated players come from, roughly by how many play abroad. */
const ABROAD: Array<[string, number]> = [
  ['BRA', 10], ['FRA', 9], ['ARG', 8], ['ESP', 6], ['POR', 6], ['ENG', 5], ['GER', 5], ['NED', 5], ['BEL', 4], ['SEN', 4], ['CIV', 4], ['NGA', 4], ['COL', 4], ['URU', 4],
  ['ITA', 3], ['CRO', 3], ['SRB', 3], ['DEN', 3], ['SWE', 3], ['NOR', 3], ['MAR', 3], ['GHA', 3], ['CMR', 3], ['ALG', 3], ['JPN', 3], ['KOR', 2], ['USA', 2], ['MEX', 2],
  ['POL', 2], ['SUI', 2], ['AUT', 2], ['TUR', 2], ['UKR', 2], ['SCO', 2], ['IRL', 2], ['ECU', 2], ['MLI', 2], ['GUI', 2], ['COD', 2], ['CZE', 2], ['SVK', 2], ['GRE', 2],
  ['WAL', 1], ['HUN', 1], ['BIH', 1], ['ALB', 1], ['VEN', 1], ['PAR', 1], ['CHI', 1], ['EGY', 1], ['TUN', 1], ['AUS', 1], ['CAN', 1], ['IRN', 1], ['GEO', 1], ['SVN', 1],
];
const ABROAD_TOTAL = ABROAD.reduce((a, [, w]) => a + w, 0);

/** Nationality for a generated player at a club in the given world country: mostly local, otherwise from abroad. */
export function generatedNationality(rng: Rng, countryId?: string) {
  const home = homeNation(countryId);
  if (home && rng.chance(home === 'KSA' || home === 'MEX' || home === 'ARG' || home === 'BRA' ? 0.8 : home === 'ENG' || home === 'USA' ? 0.55 : 0.65)) return home;
  let r = rng.next() * ABROAD_TOTAL;
  for (const [code, w] of ABROAD) { r -= w; if (r < 0) return code === home ? 'BRA' : code; }
  return 'BRA';
}
