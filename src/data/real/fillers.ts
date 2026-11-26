import { c, type RFillers } from './types';

/** Clubs outside the 15 playable leagues that take part in continental competitions only. */
export const EUROPE_REST: RFillers = { id: 'eur', name: 'Rest of Europe', clubs: [
  c('salzburg', 'Salzburg Bulls', 'SAL', 66, ['#FFFFFF', '#DD0741'], 'Salzburg Arena', 30188, [['Karim Onisiwo', 'ST', 33, 70, 'AUT']]),
  c('sturm', 'Graz Blackies', 'STU', 58, ['#000000', '#FFFFFF'], 'Graz Arena', 16364),
  c('youngboys', 'Bern Young Lads', 'YB', 60, ['#FFD200', '#000000'], 'Wankdorf Park', 31783),
  c('basel', 'Basel Bebbi', 'BAS', 60, ['#E30613', '#0055A4'], 'St. Jakob Park', 38512, [['Xherdan Shaqiri', 'AM', 33, 75, 'SUI']]),
  c('slavia', 'Prague Stitches', 'SLA', 62, ['#E30613', '#FFFFFF'], 'Eden Park', 19370),
  c('spartaprague', 'Prague Iron Sparta', 'SPA', 60, ['#7A1F3D', '#FFFFFF'], 'Letná Park', 18944),
  c('plzen', 'Plzeň Brewers', 'PLZ', 56, ['#E30613', '#0055A4'], 'Doosan Park', 11700),
  c('olympiacos', 'Piraeus Legend', 'OLY', 66, ['#E30613', '#FFFFFF'], 'Karaiskakis Park', 32115, [['Ayoub El Kaabi', 'ST', 32, 77, 'MAR'], ['Chiquinho', 'AM', 30, 75, 'POR']]),
  c('paok', 'Thessaloniki Double-Headed Eagles', 'PAO', 60, ['#000000', '#FFFFFF'], 'Toumba Park', 28703),
  c('panathinaikos', 'Athens Shamrocks', 'PAN', 58, ['#00843D', '#FFFFFF'], 'Leoforos Park', 16003),
  c('aek', 'Athens Union', 'AEK', 58, ['#FFD200', '#000000'], 'OPAP Arena Park', 32500),
  c('dinamozagreb', 'Zagreb Blues', 'DZG', 60, ['#0055A4', '#FFFFFF'], 'Maksimir Park', 24851),
  c('redstar', 'Belgrade Red Stars', 'CZV', 62, ['#E30613', '#FFFFFF'], 'Marakana Park', 51755),
  c('copenhagen', 'Copenhagen Lions', 'FCK', 62, ['#FFFFFF', '#0055A4'], 'Parken Park', 38065),
  c('midtjylland', 'Herning Wolves', 'FCM', 56, ['#000000', '#E30613'], 'MCH Park', 11432),
  c('bodo', 'Arctic Glimmer', 'BOD', 60, ['#FFD200', '#000000'], 'Aspmyra Park', 8270),
  c('shakhtar', 'Donetsk Miners', 'SHA', 62, ['#F58220', '#000000'], 'Miners Arena', 52518),
  c('legia', 'Warsaw Army Men', 'LEG', 54, ['#00843D', '#FFFFFF'], 'Army Park', 31103),
  c('ferencvaros', 'Budapest Green Eagles', 'FTC', 56, ['#00843D', '#FFFFFF'], 'Groupama Budapest Park', 22000),
  c('malmo', 'Malmö Sky Blues', 'MFF', 54, ['#6CABDD', '#FFFFFF'], 'Eleda Park', 22500),
  c('rapid', 'Vienna Green-Whites', 'RAP', 52, ['#00843D', '#FFFFFF'], 'Allianz Vienna Park', 28000),
  c('ludogorets', 'Razgrad Eagles', 'LUD', 54, ['#00843D', '#FFFFFF'], 'Huvepharma Park', 10442),
  c('maccabi', 'Tel Aviv Yellows', 'MTA', 52, ['#FFD200', '#0055A4'], 'Bloomfield Park', 29400),
] };

export const SOUTH_AMERICA_REST: RFillers = { id: 'sam', name: 'Rest of South America', clubs: [
  c('penarol', 'Montevideo Coal Men', 'PEÑ', 58, ['#FFD200', '#000000'], 'Campeón del Siglo Park', 40005),
  c('nacionaluy', 'Montevideo Tricolores', 'NAC', 56, ['#FFFFFF', '#0055A4'], 'Gran Parque Central', 34000),
  c('atlnacional', 'Medellín Greens', 'ATN', 56, ['#00843D', '#FFFFFF'], 'Atanasio Park', 40043),
  c('colocolo', 'Santiago Chiefs', 'CCO', 54, ['#FFFFFF', '#000000'], 'Monumental Santiago', 47347),
  c('ldu', 'Quito University', 'LDU', 56, ['#FFFFFF', '#E30613'], 'Casa Blanca Park', 41575),
  c('olimpia', 'Asunción Decano', 'OLI', 52, ['#FFFFFF', '#000000'], 'Manuel Ferreira Park', 25000),
] };

export const ASIA_REST: RFillers = { id: 'asi', name: 'Rest of Asia', clubs: [
  c('alsadd', 'Doha Wolves', 'SAD', 60, ['#FFFFFF', '#000000'], 'Jassim bin Hamad Park', 12000),
  c('alain', 'Al Ain Boss', 'AIN', 58, ['#5B2C83', '#FFFFFF'], 'Hazza bin Zayed Park', 25000),
  c('shababahli', 'Dubai Knights', 'SAH', 56, ['#E30613', '#000000'], 'Rashid Park', 12000),
  c('persepolis', 'Tehran Reds', 'PER', 54, ['#E30613', '#FFFFFF'], 'Azadi Park', 78116),
  c('vissel', 'Kobe Crimson', 'VIS', 56, ['#7A1F3D', '#000000'], 'Noevir Park', 30132),
  c('marinos', 'Yokohama Mariners', 'YFM', 54, ['#0055A4', '#FFFFFF'], 'Nissan Park', 72327),
  c('kawasaki', 'Kawasaki Dolphins', 'KAW', 54, ['#6CABDD', '#000000'], 'Todoroki Park', 26827),
  c('ulsan', 'Ulsan Tigers', 'ULS', 54, ['#0055A4', '#FFD200'], 'Munsu Park', 37897),
  c('pohang', 'Pohang Steelers', 'POH', 50, ['#E30613', '#000000'], 'Steelyard Park', 17443),
  c('jeonbuk', 'Jeonju Green Warriors', 'JEO', 54, ['#00843D', '#FFFFFF'], 'Jeonju Park', 42477),
  c('shanghaiport', 'Shanghai Harbour', 'SHP', 52, ['#E30613', '#FFFFFF'], 'Pudong Park', 37000),
  c('buriram', 'Buriram Thunder Castle', 'BUR', 52, ['#002F6C', '#F58220'], 'Chang Arena Park', 32600),
] };
