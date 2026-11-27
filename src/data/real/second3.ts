/* Second divisions for Belgium, Saudi Arabia and Argentina (2025/26; Argentina: 2025).
   Argentina's Primera Nacional is played as one 20-club league here, made up of the Liga Profesional clubs
   outside the top flight's twenty and the strongest of the second tier. Reserve sides can't be promoted. */
import { c, reserve, type RL } from './types';

export const BEL2: RL = { id: 'bel2', name: 'Challenger Pro League', short: 'Challenger', tier: 2, promote: 1, playoff: [2, 5], relegate: 0, tv: 20_000, clubs: [
  c('beerschot', 'Antwerp Rats', 'BEE', 42, ['#5B2A86', '#FFFFFF'], 'Olympic Park', 12771),
  c('kortrijk', 'Kortrijk Kerels', 'KOR', 40, ['#E30613', '#FFFFFF'], 'Guldensporen Park', 9399),
  c('eupen', 'Eupen Pandas', 'EUP', 38, ['#000000', '#FFFFFF'], 'Kehrweg Park', 8363),
  c('lommel', 'Lommel Green', 'LOM', 36, ['#00843D', '#FFFFFF'], 'Soevereinen Park', 8000),
  c('rwdm', 'Molenbeek Brussels', 'RWD', 36, ['#E30613', '#000000'], 'Machtens Park', 11000),
  c('beveren', 'Beveren Yellow-Blue', 'BEV', 34, ['#FFD200', '#0055A4'], 'Freethiel Park', 8190),
  c('lierse', 'Lier Pallieters', 'LIE', 32, ['#FFD200', '#000000'], 'Vanderpoorten Park', 14538),
  c('seraing', 'Seraing Metallos', 'SER', 32, ['#E30613', '#000000'], 'Pairay Park', 8207),
  c('liege', 'Liège Blood & Navy', 'RFC', 32, ['#E30613', '#002F6C'], 'Rocourt Park', 5000),
  c('patro', 'Maasmechelen Patro', 'PAT', 30, ['#FFD200', '#000000'], 'Patro Park', 4000),
  c('lokeren', 'Lokeren-Temse Tricolours', 'LOK', 30, ['#FFFFFF', '#000000'], 'Daknam Park', 9271),
  c('borains', 'Boussu Borains', 'FCB', 28, ['#E30613', '#FFFFFF'], 'Urbain Park', 4000),
  reserve(c('nxt', 'Bruges NXT', 'NXT', 36, ['#0055A4', '#000000'], 'Knokke Ground', 3000)),
  reserve(c('futures', 'Brussels Futures', 'RSF', 36, ['#4C2683', '#FFFFFF'], 'Neerpede Ground', 2000)),
  reserve(c('jonggenk', 'Limburg Young Smurfs', 'JGK', 34, ['#0055A4', '#FFFFFF'], 'Genk Ground', 2000)),
  reserve(c('jonggent', 'Ghent Young Buffalos', 'JGN', 32, ['#0055A4', '#FFFFFF'], 'Oostakker Ground', 2000)),
] };

export const KSA2: RL = { id: 'ksa2', name: 'Saudi First Division League', short: 'First Division', tier: 2, promote: 2, playoff: [3, 6], relegate: 0, tv: 60_000, clubs: [
  c('wehda', 'Mecca Unity', 'WEH', 42, ['#E30613', '#FFFFFF'], 'King Abdulaziz Park', 38000),
  c('raed', 'Buraidah Pioneers', 'RAE', 38, ['#E30613', '#000000'], 'Buraidah Park', 25000),
  c('orobah', 'Sakaka Arabism', 'ORO', 36, ['#0055A4', '#FFFFFF'], 'Al-Jouf Park', 12000),
  c('faisaly', 'Harmah Faisaly', 'FAI', 38, ['#7A1F3D', '#FFFFFF'], 'Al-Majmaah Park', 7000),
  c('abha', 'Abha Highlanders', 'ABH', 36, ['#00843D', '#FFFFFF'], 'Abha Park', 20000),
  c('batin', 'Hafar Al-Batin Club', 'BAT', 32, ['#0055A4', '#FFFFFF'], 'Al-Batin Park', 6000),
  c('adalah', 'Al-Hasa Justice', 'ADA', 32, ['#E30613', '#FFFFFF'], 'Prince Abdullah bin Jalawi Park', 26000),
  c('jabalain', 'Hail Mountains', 'JAB', 32, ['#E30613', '#FFD200'], 'Prince Abdulaziz bin Musa\'ed Park', 12000),
  c('ula', 'AlUla Oasis', 'ULA', 34, ['#C39E6D', '#000000'], 'AlUla Park', 5000),
  c('arabi', 'Unaizah Arabi', 'ARB', 30, ['#E30613', '#FFFFFF'], 'Unaizah Club Park', 5000),
  c('diriyah', 'Diriyah Club', 'DIR', 30, ['#7A1F3D', '#C39E6D'], 'Diriyah Park', 5000),
  c('jeddah', 'Jeddah Club', 'JED', 30, ['#FFD200', '#000000'], 'Jeddah Club Park', 5000),
  c('bukiryah', 'Bukayriyah Club', 'BUK', 28, ['#00843D', '#FFFFFF'], 'Bukayriyah Park', 5000),
  c('jandal', 'Dumat Al-Jandal Club', 'JAN', 28, ['#0055A4', '#FFD200'], 'Al-Jouf Club Park', 5000),
  c('zulfi', 'Zulfi Club', 'ZUL', 28, ['#00843D', '#FFD200'], 'Zulfi Park', 5000),
  c('ohod', 'Medina Ohod', 'OHD', 30, ['#E30613', '#000000'], 'Prince Mohammed bin Abdulaziz Park', 24000),
  c('taraji', 'Qatif Taraji', 'TAR', 26, ['#E30613', '#FFFFFF'], 'Qatif Park', 5000),
  c('anwar', 'Hotat Sudair Anwar', 'ANW', 26, ['#0055A4', '#FFFFFF'], 'Sudair Park', 4000),
] };

export const ARG2: RL = { id: 'arg2', name: 'Primera Nacional', short: 'Primera Nacional', tier: 2, promote: 1, playoff: [2, 5], relegate: 0, tv: 30_000, clubs: [
  c('banfield', 'Banfield Drills', 'BAN', 44, ['#00843D', '#FFFFFF'], 'Florencio Sola Park', 34901),
  c('colon', 'Santa Fe Sabaleros', 'COL', 44, ['#E30613', '#000000'], 'Cementerio de los Elefantes Park', 40000),
  c('tucuman', 'Tucumán Decano', 'ATU', 44, ['#6CABDD', '#FFFFFF'], 'Monumental José Fierro Park', 35200),
  c('instituto', 'Córdoba Glory', 'INS', 42, ['#E30613', '#FFFFFF'], 'Juan Domingo Perón Park', 26535),
  c('sanmartinsj', 'San Juan Green & Black', 'SMS', 38, ['#00843D', '#000000'], 'Hilario Sánchez Park', 19000),
  c('rivadavia', 'Mendoza Lepra', 'IRV', 40, ['#002F6C', '#FFFFFF'], 'Bautista Gargantini Park', 24000),
  c('centralcba', 'Santiago Ferroviario', 'CCC', 38, ['#000000', '#FFFFFF'], 'Madre de Ciudades Park', 30000),
  c('sarmiento', 'Junín Green', 'SAR', 38, ['#00843D', '#FFFFFF'], 'Eva Perón Park', 22000),
  c('barracas', 'Barracas Guapo', 'BAR', 38, ['#E30613', '#FFFFFF'], 'Claudio Tapia Park', 4400),
  c('aldosivi', 'Mar del Plata Sharks', 'ALD', 38, ['#FFD200', '#00843D'], 'José María Minella Park', 35354),
  c('riestra', 'Bajo Flores Malevo', 'RIE', 34, ['#000000', '#FFFFFF'], 'Guillermo Laza Park', 3000),
  c('quilmes', 'Quilmes Brewers', 'QUI', 38, ['#FFFFFF', '#002F6C'], 'Centenario Park', 30200),
  c('sanmartint', 'Tucumán Saints', 'SMT', 38, ['#E30613', '#FFFFFF'], 'La Ciudadela Park', 30000),
  c('chacarita', 'San Martín Funebreros', 'CHA', 34, ['#E30613', '#000000'], 'Chacarita Park', 19000),
  c('ferro', 'Caballito Railwaymen', 'FCO', 34, ['#00843D', '#FFFFFF'], 'Arquitecto Etcheverry Park', 24442),
  c('gimnasiam', 'Mendoza Gymnasts', 'GYM', 32, ['#000000', '#FFFFFF'], 'Víctor Legrotaglie Park', 11000),
  c('atlanta', 'Villa Crespo Bohemians', 'ATL', 32, ['#FFD200', '#002F6C'], 'León Kolbowski Park', 14000),
  c('almirante', 'Isidro Casanova Admirals', 'ALM', 30, ['#FFD200', '#000000'], 'Fragata Sarmiento Park', 15000),
  c('allboys', 'Floresta Albos', 'ALB', 30, ['#FFFFFF', '#000000'], 'Islas Malvinas Park', 21000),
  c('moron', 'Morón Gallos', 'MOR', 30, ['#E30613', '#FFFFFF'], 'Nuevo Francisco Urbano Park', 32000),
] };
