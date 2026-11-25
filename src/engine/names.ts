// Fictional names only. Clubs are invented; see the design system's naming rules.
export const FIRST_NAMES = ['Tomas', 'Kwame', 'Lucas', 'Diego', 'Jonas', 'Rafael', 'Ivan', 'Sami', 'Mateo', 'Bram', 'Yusuf', 'Kofi', 'Leo', 'Owen', 'Arturo', 'Nils', 'Ali', 'Ryan',
  'Theo', 'Daniel', 'Luca', 'Mattias', 'Marcus', 'Dean', 'Felix', 'Hugo', 'Oscar', 'Emil', 'Joao', 'Pedro', 'Samuel', 'Adrien', 'Kenji', 'Mohamed', 'Tariq', 'Javier', 'Ruben',
  'Viktor', 'Andre', 'Callum', 'Jamal', 'Moussa', 'Ismael', 'Erik', 'Pablo', 'Noah', 'Elias', 'Malik', 'Stefan', 'Marco', 'Diogo', 'Aaron', 'Kai', 'Liam', 'Ole', 'Jesper', 'Abdou'];
export const LAST_NAMES = ['Varga', 'Asante', 'Moreau', 'Ferreira', 'Lindqvist', 'Ortiz', 'Petrovic', 'Okafor', 'Silva', 'de Vries', 'Demir', 'Mensah', 'Brandt', 'Hale', 'Vega',
  'Berg', 'Haddad', 'Cole', 'Laurent', 'Osei', 'Bianchi', 'Holm', 'Vance', 'Holt', 'Okoye', 'Byrne', 'Novak', 'Kowalski', 'Santos', 'Alvarez', 'Nakamura', 'Diallo', 'Traore',
  'Jensen', 'Muller', 'Rossi', 'Costa', 'Andersen', 'Murphy', 'Walsh', 'Fernandes', 'Dubois', 'Keller', 'Nilsen', 'Romero', 'Garcia', 'Kaya', 'Yilmaz', 'Mbeki', 'Adeyemi',
  'Sorensen', 'Lopez', 'Marin', 'Weber', 'Fischer', 'Ito', 'Park', 'Reyes', 'Lund', 'Quinn', 'Carvalho', 'Bakker', 'Hughes', 'Price', 'Doyle', 'Sato', 'Mendes'];
export const NATIONALITIES = ['England', 'Spain', 'Portugal', 'France', 'Germany', 'Netherlands', 'Brazil', 'Argentina', 'Uruguay', 'Ghana', 'Nigeria', 'Senegal', 'Sweden',
  'Norway', 'Denmark', 'Serbia', 'Turkey', 'Japan', 'Korea', 'Ireland', 'Scotland', 'Italy', 'Poland', 'Morocco'];

export interface ClubSeed { name: string; short: string; reputation: number; stadium: string; capacity: number; nickname: string; founded: number }
export const CLUBS: ClubSeed[] = [
  { name: 'Ashford United', short: 'ASH', reputation: 72, stadium: 'Ashford Park', capacity: 42000, nickname: 'The Golds', founded: 1884 },
  { name: 'Carrow City', short: 'CAR', reputation: 76, stadium: 'Carrow Road End', capacity: 45000, nickname: 'The Sky Blues', founded: 1880 },
  { name: 'Northgate Rovers', short: 'NOR', reputation: 70, stadium: 'Northgate Road', capacity: 31000, nickname: 'Rovers', founded: 1892 },
  { name: 'Kingsbridge Athletic', short: 'KIN', reputation: 68, stadium: 'The Bridge Ground', capacity: 28000, nickname: 'The Kings', founded: 1899 },
  { name: 'Westmoor Town', short: 'WES', reputation: 62, stadium: 'Moor Lane', capacity: 22000, nickname: 'The Moors', founded: 1905 },
  { name: 'Riverside Albion', short: 'RIV', reputation: 64, stadium: 'Riverside', capacity: 26000, nickname: 'Albion', founded: 1887 },
  { name: 'Highfield Wanderers', short: 'HIG', reputation: 60, stadium: 'Highfield', capacity: 24000, nickname: 'Wanderers', founded: 1876 },
  { name: 'Eastport FC', short: 'EAS', reputation: 58, stadium: 'Harbour Park', capacity: 20000, nickname: 'The Port', founded: 1910 },
  { name: 'Granby Forest', short: 'GRA', reputation: 56, stadium: 'Forest Lane', capacity: 19000, nickname: 'The Foresters', founded: 1883 },
  { name: 'Saltmarsh United', short: 'SAL', reputation: 54, stadium: 'Marsh Field', capacity: 17000, nickname: 'The Marsh', founded: 1902 },
  { name: 'Old Castle', short: 'OLD', reputation: 52, stadium: 'Castle Green', capacity: 15000, nickname: 'The Castle', founded: 1874 },
  { name: 'Blackwater Rangers', short: 'BLA', reputation: 50, stadium: 'Blackwater Stadium', capacity: 14000, nickname: 'Rangers', founded: 1896 },
];
