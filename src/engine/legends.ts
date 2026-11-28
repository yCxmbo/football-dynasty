/* Retirements, remembered. Your long-serving or decorated players get a proper farewell and become club legends;
   legends can come back as staff (a coach, scout, youth coach or assistant, judged from how they played the game),
   which the fans love. Elsewhere, respected former players move into management. */
import type { StaffMember, StaffRole } from './staff';
import type { GameState, Player } from './types';

export interface Legend { name: string; nationality: string; clubId: string; club: string; apps: number; goals: number; retired: number; attrs: Record<string, number>; awards: number }

const appsAt = (p: Player, club: string) => p.career.filter((c) => c.club.startsWith(club)).reduce((a, c) => a + c.apps, 0) + p.current.apps;
const goalsAt = (p: Player, club: string) => p.career.filter((c) => c.club.startsWith(club)).reduce((a, c) => a + c.goals, 0) + p.current.goals;

/** Called for a player about to retire. Your legends are recorded; returns a farewell message for your players. */
export function farewell(s: GameState, p: Player): { subject: string; body: string[] } | undefined {
  if (p.clubId !== s.userClubId) return undefined;
  const club = s.clubs[p.clubId].name, apps = appsAt(p, club), goals = goalsAt(p, club), total = p.career.reduce((a, c) => a + c.apps, 0) + p.current.apps;
  const awards = p.awards?.length ?? 0;
  if (apps >= 100 || awards >= 1) {
    (s.legends ??= []).unshift({ name: p.name, nationality: p.nationality, clubId: p.clubId, club, apps, goals, retired: s.year, awards, attrs: { ...p.attributes } });
    if (s.legends.length > 30) s.legends.length = 30;
    return { subject: `${p.name} retires: a club legend`, body: [
      `${p.name} has hung up his boots after ${total} appearances, ${apps} of them for ${club}${goals ? `, scoring ${goals} goals` : ''}${awards ? `, with ${awards} individual ${awards === 1 ? 'award' : 'awards'}` : ''}.`,
      'The supporters gave him a standing ovation in his last game. He is now one of the club\'s legends, and may one day come back to work for us.'] };
  }
  return { subject: `${p.name} retires`, body: [`${p.name} has retired after ${total} appearances.`] };
}

const avg = (a: Record<string, number>, ks: string[]) => ks.reduce((t, k) => t + (a[k] ?? 10), 0) / ks.length;
/** The job a legend is best suited to, and how good he'd be at it (1–20). */
export function legendRole(l: Legend): { role: StaffRole; rating: number } {
  const options: Array<[StaffRole, number]> = [
    ['coach', avg(l.attrs, ['Leadership', 'Determination', 'Decisions', 'Teamwork'])],
    ['scout', avg(l.attrs, ['Vision', 'Anticipation', 'Decisions'])],
    ['youth', avg(l.attrs, ['Determination', 'Teamwork', 'Leadership', 'Work Rate'])],
    ['assistant', avg(l.attrs, ['Leadership', 'Composure', 'Teamwork'])],
  ];
  const [role, v] = options.sort((a, b) => b[1] - a[1])[0];
  const experience = Math.min(3, l.apps / 150) + Math.min(2, l.awards);
  return { role, rating: Math.max(6, Math.min(18, Math.round(v * 0.75 + experience + 1))) };
}

/** Legends in the staff market this summer (up to two, retired at least a year, not already on your staff). */
export function legendCandidates(s: GameState, wage: (r: number) => number): StaffMember[] {
  const hired = new Set(Object.values(s.staff ?? {}).map((m) => m?.name));
  return (s.legends ?? []).filter((l) => l.retired < s.year && l.clubId === s.userClubId && !hired.has(l.name)).slice(0, 2).map((l, i) => {
    const { role, rating } = legendRole(l);
    return { id: `lg${s.year}-${i}`, name: l.name, nationality: l.nationality, age: 36 + (s.year - l.retired), role, rating, wage: wage(rating), legend: true };
  });
}

/** A respected player retiring anywhere may move into management: returns his starting standing, if so. */
export function managerMaterial(p: Player): { rep: number; rating: number } | undefined {
  const leader = p.attributes.Leadership ?? 10, total = p.career.reduce((a, c) => a + c.apps, 0) + p.current.apps;
  if (leader < 15 || total < 250) return undefined;
  return { rep: Math.max(25, Math.min(80, Math.round(p.ability / 2.2 + (p.awards?.length ?? 0) * 3))), rating: Math.max(6, Math.min(16, Math.round(leader * 0.7 + (p.attributes.Decisions ?? 10) * 0.2))) };
}
