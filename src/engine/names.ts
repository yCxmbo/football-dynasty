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

export interface ClubSeed { name: string; short: string; reputation: number; stadium: string; capacity: number; nickname: string; founded: number; division?: 0 | 1 | 2 | 3; country?: string }
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

/** Championship (tier 2) and League One (tier 3). Fictional clubs. */
export const LOWER_CLUBS: ClubSeed[] = [
  { name: 'Bramford City', short: 'BRM', reputation: 50, stadium: 'Bramford Lane', capacity: 26000, nickname: 'The Blades', founded: 1889, division: 2 },
  { name: 'Lowmoor Athletic', short: 'LOW', reputation: 48, stadium: 'Lowmoor Park', capacity: 24000, nickname: 'The Latics', founded: 1895, division: 2 },
  { name: 'Hartwell Rovers', short: 'HAR', reputation: 47, stadium: 'Hartwell Road', capacity: 21000, nickname: 'Rovers', founded: 1883, division: 2 },
  { name: 'Stonebridge United', short: 'STO', reputation: 46, stadium: 'The Stone Ground', capacity: 23000, nickname: 'The Stones', founded: 1901, division: 2 },
  { name: 'Wexley Town', short: 'WEX', reputation: 45, stadium: 'Wexley Common', capacity: 18000, nickname: 'The Townies', founded: 1893, division: 2 },
  { name: 'Calder Vale', short: 'CAL', reputation: 44, stadium: 'Vale Park Road', capacity: 19000, nickname: 'The Valiants', founded: 1887, division: 2 },
  { name: 'Ironbridge Albion', short: 'IRO', reputation: 43, stadium: 'Foundry Lane', capacity: 20000, nickname: 'The Ironmen', founded: 1878, division: 2 },
  { name: 'Marlow Forest', short: 'MAR', reputation: 42, stadium: 'Marlow Woods', capacity: 16000, nickname: 'The Forest', founded: 1906, division: 2 },
  { name: 'Penbury County', short: 'PEN', reputation: 41, stadium: 'County Ground', capacity: 17000, nickname: 'The County', founded: 1885, division: 2 },
  { name: 'Thornfield Wednesday', short: 'THO', reputation: 40, stadium: 'Thornfield', capacity: 22000, nickname: 'The Owls', founded: 1867, division: 2 },
  { name: 'Redcliffe City', short: 'RED', reputation: 39, stadium: 'Cliff Top', capacity: 15000, nickname: 'The Robins', founded: 1898, division: 2 },
  { name: 'Ashworth Borough', short: 'ASB', reputation: 38, stadium: 'Borough Park', capacity: 14000, nickname: 'The Boro', founded: 1909, division: 2 },
  { name: 'Kettering Vale', short: 'KET', reputation: 36, stadium: 'Rockingham Lane', capacity: 12000, nickname: 'The Poppies', founded: 1897, division: 3 },
  { name: 'Dunmore Athletic', short: 'DUN', reputation: 35, stadium: 'Dunmore Park', capacity: 11000, nickname: 'The Athletic', founded: 1904, division: 3 },
  { name: 'Fenwick United', short: 'FEN', reputation: 34, stadium: 'Fen Lane', capacity: 10500, nickname: 'The Fenmen', founded: 1912, division: 3 },
  { name: 'Hollowell Town', short: 'HOL', reputation: 33, stadium: 'The Hollow', capacity: 9000, nickname: 'The Hollows', founded: 1907, division: 3 },
  { name: 'Brackley Rangers', short: 'BRA', reputation: 32, stadium: 'St James Field', capacity: 9500, nickname: 'Rangers', founded: 1890, division: 3 },
  { name: 'Corran City', short: 'COR', reputation: 31, stadium: 'Corran Road', capacity: 8500, nickname: 'The Citizens', founded: 1919, division: 3 },
  { name: 'Mersey Docks FC', short: 'MER', reputation: 30, stadium: 'Dockside', capacity: 8000, nickname: 'The Dockers', founded: 1903, division: 3 },
  { name: 'Wolsey Wanderers', short: 'WOL', reputation: 29, stadium: 'Wolsey Meadow', capacity: 7500, nickname: 'The Wanderers', founded: 1886, division: 3 },
  { name: 'Grimsby Harbour', short: 'GRI', reputation: 28, stadium: 'Harbour View', capacity: 9000, nickname: 'The Mariners', founded: 1878, division: 3 },
  { name: 'Alton Park', short: 'ALT', reputation: 27, stadium: 'Alton Lane', capacity: 6500, nickname: 'The Parkers', founded: 1921, division: 3 },
  { name: 'Sedgwick Town', short: 'SED', reputation: 26, stadium: 'Sedge Lane', capacity: 6000, nickname: 'The Sedgers', founded: 1911, division: 3 },
  { name: 'Oakham United', short: 'OAK', reputation: 25, stadium: 'Oak Lane', capacity: 5500, nickname: 'The Oaks', founded: 1923, division: 3 },
];

/** Foreign clubs for the Continental Cup. Invented names that only hint at a country. */
export const FOREIGN_CLUBS: ClubSeed[] = [
  { name: 'Real Castellana', short: 'RCA', reputation: 80, stadium: 'Estadio Castellano', capacity: 80000, nickname: 'Los Blancos', founded: 1902, division: 0, country: 'Spain' },
  { name: 'Atlético Meseta', short: 'ATM', reputation: 72, stadium: 'Estadio de la Meseta', capacity: 68000, nickname: 'Los Rojiblancos', founded: 1903, division: 0, country: 'Spain' },
  { name: 'Borussia Nordwald', short: 'BNW', reputation: 76, stadium: 'Nordwald-Arena', capacity: 75000, nickname: 'Die Schwarzgelben', founded: 1909, division: 0, country: 'Germany' },
  { name: 'Rot-Weiss Altstadt', short: 'RWA', reputation: 66, stadium: 'Altstadt-Stadion', capacity: 50000, nickname: 'Die Roten', founded: 1900, division: 0, country: 'Germany' },
  { name: 'Inter Lombarda', short: 'INL', reputation: 77, stadium: 'Stadio Lombardo', capacity: 75000, nickname: 'I Nerazzurri', founded: 1908, division: 0, country: 'Italy' },
  { name: 'AC Toscana', short: 'ACT', reputation: 67, stadium: 'Stadio Toscano', capacity: 45000, nickname: 'La Viola', founded: 1926, division: 0, country: 'Italy' },
  { name: 'Olympique Rhône', short: 'OLR', reputation: 70, stadium: 'Stade du Rhône', capacity: 59000, nickname: 'Les Gones', founded: 1950, division: 0, country: 'France' },
  { name: 'Lusitânia Lisboa', short: 'LUS', reputation: 69, stadium: 'Estádio Lusitânia', capacity: 64000, nickname: 'As Águias', founded: 1904, division: 0, country: 'Portugal' },
  { name: 'Sporting Atlântico', short: 'SPA', reputation: 63, stadium: 'Estádio Atlântico', capacity: 50000, nickname: 'Os Leões', founded: 1906, division: 0, country: 'Portugal' },
  { name: 'Hollandia Rotterdam', short: 'HOR', reputation: 65, stadium: 'De Haven', capacity: 47000, nickname: 'De Havenstad', founded: 1908, division: 0, country: 'Netherlands' },
  { name: 'Galata Yıldız', short: 'GAL', reputation: 64, stadium: 'Yıldız Arena', capacity: 52000, nickname: 'Aslanlar', founded: 1905, division: 0, country: 'Turkey' },
  { name: 'Dynamo Volga', short: 'DVO', reputation: 58, stadium: 'Volga Stadium', capacity: 40000, nickname: 'The Dynamos', founded: 1923, division: 0, country: 'Russia' },
];
