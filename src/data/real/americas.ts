import { c, type RCountry } from './types';

export const BRAZIL: RCountry = {
  id: 'bra', name: 'Brazil', superCup: 'Supercopa do Brasil',
  cups: [{ id: 'bra-cup', name: 'Copa do Brasil', tiers: [1], main: true }],
  leagues: [{ id: 'bra1', name: 'Brasileirão Série A', short: 'Brasileirão', tier: 1, promote: 0, relegate: 0, tv: 300_000, clubs: [
    c('atleticomg', 'Belo Horizonte Roosters', 'CAM', 66, ['#000000', '#FFFFFF'], 'Arena MRV Park', 46000, [['Everson', 'GK', 35, 74, 'BRA'], ['Gustavo Scarpa', 'AM', 31, 75, 'BRA'], ['Hulk', 'ST', 39, 76, 'BRA']]),
    c('bahia', 'Salvador Tricolor', 'BAH', 58, ['#0055A4', '#E30613'], 'Fonte Nova Park', 47907, [['Everton Ribeiro', 'AM', 36, 74, 'BRA'], ['Willian José', 'ST', 33, 72, 'BRA']]),
    c('botafogo', 'Rio Lone Star', 'BOT', 70, ['#000000', '#FFFFFF'], 'Nilton Santos Park', 44661, [['John', 'GK', 29, 75, 'BRA'], ['Alexander Barboza', 'CB', 30, 75, 'ARG'], ['Marlon Freitas', 'DM', 30, 75, 'BRA'], ['Savarino', 'RW', 28, 75, 'VEN'], ['Igor Jesus', 'ST', 24, 76, 'BRA']]),
    c('ceara', 'Fortaleza Vozão', 'CEA', 44, ['#000000', '#FFFFFF'], 'Castelão Park', 63903),
    c('corinthians', 'São Paulo Timão', 'COR', 68, ['#FFFFFF', '#000000'], 'Itaquera Park', 49205, [['Hugo Souza', 'GK', 26, 75, 'BRA'], ['Rodrigo Garro', 'AM', 27, 77, 'ARG'], ['Memphis Depay', 'ST', 31, 78, 'NED'], ['Yuri Alberto', 'ST', 24, 75, 'BRA']]),
    c('cruzeiro', 'Belo Horizonte Foxes', 'CRU', 66, ['#0055A4', '#FFFFFF'], 'Mineirão Park', 61846, [['Cássio', 'GK', 38, 73, 'BRA'], ['Matheus Pereira', 'AM', 29, 77, 'BRA'], ['Gabigol', 'ST', 28, 75, 'BRA'], ['Kaio Jorge', 'ST', 23, 75, 'BRA']]),
    c('flamengo', 'Rio Mengão', 'FLA', 78, ['#C8102E', '#000000'], 'Maracanã Park', 78838, [
      ['Agustín Rossi', 'GK', 29, 78, 'ARG'], ['Léo Pereira', 'CB', 29, 76, 'BRA'], ['Alex Sandro', 'LB', 34, 74, 'BRA'], ['Jorginho', 'DM', 33, 78, 'ITA'],
      ['Gerson', 'CM', 28, 78, 'BRA'], ['Giorgian De Arrascaeta', 'AM', 31, 80, 'URU'], ['Samuel Lino', 'LW', 25, 77, 'BRA'], ['Pedro', 'ST', 28, 78, 'BRA'], ['Bruno Henrique', 'LW', 34, 74, 'BRA']]),
    c('fluminense', 'Rio Tricolor', 'FLU', 64, ['#7A1F3D', '#00843D'], 'Maracanã Park', 78838, [['Fábio', 'GK', 44, 72, 'BRA'], ['Thiago Silva', 'CB', 40, 76, 'BRA'], ['Ganso', 'AM', 35, 73, 'BRA'], ['Germán Cano', 'ST', 37, 72, 'ARG']]),
    c('fortaleza', 'Fortaleza Leões', 'FOR', 54, ['#0055A4', '#E30613'], 'Castelão Park', 63903), c('gremio', 'Porto Alegre Immortals', 'GRE', 62, ['#0D80BF', '#000000'], 'Grêmio Arena Park', 55662, [['Arthur', 'CM', 28, 74, 'BRA'], ['Martin Braithwaite', 'ST', 34, 73, 'DEN']]),
    c('internacional', 'Porto Alegre Colorados', 'INT', 64, ['#E30613', '#FFFFFF'], 'Beira-Rio Park', 50128, [['Sergio Rochet', 'GK', 32, 76, 'URU'], ['Alan Patrick', 'AM', 34, 75, 'BRA'], ['Enner Valencia', 'ST', 35, 73, 'ECU']]),
    c('juventude', 'Caxias Papo', 'JUV', 40, ['#00843D', '#FFFFFF'], 'Jaconi Park', 19924), c('mirassol', 'Mirassol Leão', 'MIR', 42, ['#FFD200', '#00843D'], 'Maião Park', 15000),
    c('palmeiras', 'São Paulo Verdão', 'PAL', 78, ['#006437', '#FFFFFF'], 'Allianz Park SP', 43713, [
      ['Weverton', 'GK', 37, 76, 'BRA'], ['Gustavo Gómez', 'CB', 32, 78, 'PAR'], ['Murilo', 'CB', 28, 75, 'BRA'], ['Aníbal Moreno', 'DM', 26, 76, 'ARG'],
      ['Raphael Veiga', 'AM', 30, 77, 'BRA'], ['Facundo Torres', 'RW', 25, 76, 'URU'], ['Vitor Roque', 'ST', 20, 77, 'BRA', 85], ['José Manuel López', 'ST', 24, 75, 'ARG']]),
    c('bragantino', 'Bragança Massa Bruta', 'RBB', 52, ['#FFFFFF', '#E30613'], 'Nabi Abi Chedid Park', 15010),
    c('santos', 'Santos Fish', 'SAN', 60, ['#FFFFFF', '#000000'], 'Vila Belmiro Park', 16068, [['Gabriel Brazão', 'GK', 25, 74, 'BRA'], ['Neymar', 'AM', 33, 80, 'BRA'], ['Guilherme', 'LW', 30, 73, 'BRA']]),
    c('saopaulo', 'São Paulo Tricolor Paulista', 'SPF', 70, ['#FFFFFF', '#E30613'], 'Morumbi Park', 66795, [['Rafael', 'GK', 36, 76, 'BRA'], ['Arboleda', 'CB', 34, 74, 'ECU'], ['Oscar', 'AM', 34, 75, 'BRA'], ['Luciano', 'ST', 32, 74, 'BRA'], ['Jonathan Calleri', 'ST', 31, 75, 'ARG']]),
    c('sport', 'Recife Leão da Ilha', 'SPT', 40, ['#E30613', '#000000'], 'Ilha do Retiro Park', 26418),
    c('vasco', 'Rio Gigante', 'VAS', 60, ['#000000', '#FFFFFF'], 'São Januário Park', 21880, [['Léo Jardim', 'GK', 30, 75, 'BRA'], ['Philippe Coutinho', 'AM', 33, 75, 'BRA'], ['Pablo Vegetti', 'ST', 36, 73, 'ARG']]),
    c('vitoriaba', 'Salvador Leão da Barra', 'VIT', 40, ['#E30613', '#000000'], 'Barradão Park', 30793),
  ] }],
};

export const ARGENTINA: RCountry = {
  id: 'arg', name: 'Argentina', superCup: 'Supercopa Argentina',
  cups: [{ id: 'arg-cup', name: 'Copa Argentina', tiers: [1], main: true }],
  leagues: [{ id: 'arg1', name: 'Liga Profesional', short: 'Liga Profesional', tier: 1, promote: 0, relegate: 0, tv: 160_000, clubs: [
    c('boca', 'Buenos Aires Xeneizes', 'BOC', 74, ['#0033A0', '#FFD100'], 'Bombonera Park', 54000, [['Agustín Marchesín', 'GK', 37, 74, 'ARG'], ['Leandro Paredes', 'DM', 31, 78, 'ARG'], ['Ander Herrera', 'CM', 35, 73, 'ESP'], ['Edinson Cavani', 'ST', 38, 73, 'URU'], ['Miguel Merentiel', 'ST', 29, 74, 'URU']]),
    c('river', 'Buenos Aires Millonarios', 'RIV', 76, ['#FFFFFF', '#E30613'], 'Monumental Park', 85018, [['Franco Armani', 'GK', 38, 75, 'ARG'], ['Germán Pezzella', 'CB', 34, 74, 'ARG'], ['Gonzalo Montiel', 'RB', 28, 75, 'ARG'], ['Enzo Pérez', 'DM', 39, 72, 'ARG'], ['Juan Fernando Quintero', 'AM', 32, 75, 'COL'], ['Miguel Borja', 'ST', 32, 74, 'COL'], ['Sebastián Driussi', 'ST', 29, 74, 'ARG']]),
    c('racing', 'Avellaneda Academy', 'RAC', 66, ['#6CABDD', '#FFFFFF'], 'Cylinder Park', 51389, [['Gabriel Arias', 'GK', 37, 73, 'CHI'], ['Juan Fernando Quintero', 'AM', 32, 0, 'COL'], ['Adrián Martínez', 'ST', 33, 74, 'ARG']]),
    c('independiente', 'Avellaneda Red Devils', 'IND', 60, ['#E30613', '#FFFFFF'], 'Libertadores Park', 42069), c('sanlorenzo', 'Boedo Saints', 'SLO', 56, ['#003D7C', '#E30613'], 'New Gasómetro Park', 47964),
    c('estudiantes', 'La Plata Pincharratas', 'EST', 60, ['#E30613', '#FFFFFF'], 'UNO Park', 30018, [['Guido Carrillo', 'ST', 34, 72, 'ARG']]), c('velez', 'Liniers Fortín', 'VEL', 58, ['#FFFFFF', '#0055A4'], 'Amalfitani Park', 49540),
    c('huracan', 'Parque Patricios Globe', 'HUR', 50, ['#FFFFFF', '#E30613'], 'Ducó Park', 48314), c('talleres', 'Córdoba Matadors', 'TAL', 56, ['#002F6C', '#FFFFFF'], 'Kempes Park', 57000),
    c('belgrano', 'Córdoba Pirates', 'BEL', 48, ['#6CABDD', '#FFFFFF'], 'Gigante de Alberdi Park', 28000), c('lanus', 'Lanús Granate', 'LAN', 54, ['#7A1F3D', '#FFFFFF'], 'Fortaleza Park', 47027),
    c('argentinos', 'Paternal Little Devils', 'ARJ', 50, ['#E30613', '#FFFFFF'], 'Maradona Paternal Park', 26000), c('central', 'Rosario Canallas', 'ROS', 56, ['#FFD200', '#0055A4'], 'Gigante de Arroyito Park', 41654, [['Ángel Di María', 'RW', 37, 0, 'ARG'], ['Jorge Broun', 'GK', 39, 70, 'ARG']]),
    c('newells', 'Rosario Lepers', 'NOB', 52, ['#E30613', '#000000'], 'Coloso Park', 42000), c('godoycruz', 'Mendoza Tomba', 'GOD', 44, ['#0055A4', '#FFFFFF'], 'Malvinas Park', 40268),
    c('defensa', 'Florencio Varela Falcons', 'DYJ', 46, ['#FFD200', '#00843D'], 'Norberto Tomaghello Park', 18000), c('tigre', 'Victoria Matadores', 'TIG', 44, ['#0055A4', '#E30613'], 'Monumental de Victoria', 26282),
    c('platense', 'Vicente López Calamares', 'PLA', 42, ['#FFFFFF', '#6B3D2E'], 'Vicente López Park', 25000), c('union', 'Santa Fe Tatengues', 'UNI', 44, ['#E30613', '#FFFFFF'], '15 de Abril Park', 28000),
    c('gimnasia', 'La Plata Lobo', 'GIM', 46, ['#FFFFFF', '#002F6C'], 'Bosque Park', 21500),
  ] }],
};

export const USA: RCountry = {
  id: 'usa', name: 'United States', superCup: false,
  cups: [{ id: 'usa-cup', name: 'U.S. Open Cup', tiers: [1], main: true }],
  leagues: [{ id: 'usa1', name: 'Major League Soccer', short: 'MLS', tier: 1, promote: 0, relegate: 0, tv: 320_000, clubs: [
    c('miami', 'Miami Herons', 'MIA', 66, ['#F7B5CD', '#231F20'], 'Fort Lauderdale Park', 21550, [
      ['Óscar Ustari', 'GK', 39, 70, 'ARG'], ['Jordi Alba', 'LB', 36, 76, 'ESP'], ['Sergio Busquets', 'DM', 37, 76, 'ESP'], ['Rodrigo De Paul', 'CM', 31, 80, 'ARG'],
      ['Lionel Messi', 'RW', 38, 86, 'ARG'], ['Luis Suárez', 'ST', 38, 76, 'URU'], ['Tadeo Allende', 'RW', 26, 72, 'ARG']]),
    c('galaxy', 'Los Angeles Stars', 'LAG', 58, ['#00245D', '#FFD200'], 'Carson Park', 27000, [['Riqui Puig', 'CM', 26, 76, 'ESP'], ['Gabriel Pec', 'RW', 24, 74, 'BRA'], ['Marco Reus', 'AM', 36, 74, 'GER']]),
    c('lafc', 'Los Angeles Black & Gold', 'LFC', 62, ['#000000', '#C39E6D'], 'Exposition Park', 22000, [['Hugo Lloris', 'GK', 38, 75, 'FRA'], ['Son Heung-min', 'LW', 33, 82, 'KOR'], ['Denis Bouanga', 'LW', 30, 77, 'GAB']]),
    c('seattle', 'Seattle Sounders', 'SEA', 58, ['#5D9741', '#005595'], 'Lumen Park', 37722, [['Stefan Frei', 'GK', 39, 70, 'SUI'], ['Albert Rusnák', 'AM', 30, 74, 'SVK'], ['Jordan Morris', 'ST', 30, 72, 'USA']]),
    c('atlanta', 'Atlanta Five Stripes', 'ATL', 54, ['#80000A', '#221F1F'], 'Mercedes Park', 42500, [['Miguel Almirón', 'AM', 31, 74, 'PAR'], ['Emmanuel Latte Lath', 'ST', 26, 73, 'CIV']]),
    c('columbus', 'Columbus Crew Club', 'CLB', 56, ['#FEDD00', '#000000'], 'Lower.com Park', 20371, [['Diego Rossi', 'LW', 27, 74, 'URU'], ['Wessam Abou Ali', 'ST', 26, 73, 'PLE']]),
    c('cincinnati', 'Cincinnati Orange & Blue', 'CIN', 56, ['#F05323', '#263B80'], 'TQL Park', 26000, [['Roman Celentano', 'GK', 25, 72, 'USA'], ['Evander', 'AM', 27, 76, 'BRA'], ['Kévin Denkey', 'ST', 24, 74, 'TOG']]),
    c('philadelphia', 'Philadelphia Unity', 'PHI', 54, ['#071B2C', '#B1872D'], 'Chester Park', 18500, [['Andre Blake', 'GK', 34, 74, 'JAM'], ['Kai Wagner', 'LB', 28, 72, 'GER']]),
    c('nycfc', 'New York Pigeons', 'NYC', 54, ['#6CACE4', '#041E42'], 'Bronx Park', 28743), c('nyrb', 'New Jersey Bulls', 'NYR', 52, ['#ED1E36', '#FFFFFF'], 'Harrison Park', 25000, [['Emil Forsberg', 'AM', 34, 74, 'SWE']]),
    c('orlando', 'Orlando Lions', 'ORL', 52, ['#633492', '#FFFFFF'], 'Inter&Co Park', 25500, [['Martín Ojeda', 'AM', 26, 73, 'ARG'], ['Luis Muriel', 'ST', 34, 72, 'COL']]),
    c('nashville', 'Nashville Coyotes', 'NSH', 50, ['#ECE83A', '#1F1646'], 'Geodis Park', 30000, [['Hany Mukhtar', 'AM', 30, 75, 'GER'], ['Sam Surridge', 'ST', 27, 72, 'ENG']]),
    c('charlotte', 'Charlotte Crown', 'CLT', 48, ['#1A85C8', '#000000'], 'Bank of America Park', 38000, [['Kristijan Kahlina', 'GK', 32, 72, 'CRO'], ['Pep Biel', 'AM', 28, 72, 'ESP'], ['Wilfried Zaha', 'LW', 32, 73, 'CIV']]),
    c('portland', 'Portland Lumberjacks', 'POR', 50, ['#004812', '#EAE727'], 'Providence Park', 25218, [['Diego Chará', 'DM', 39, 68, 'COL'], ['David Da Costa', 'AM', 24, 72, 'POR']]),
    c('vancouver', 'Vancouver Orcas', 'VAN', 50, ['#00245E', '#9DC2EA'], 'BC Park', 22120, [['Yohei Takaoka', 'GK', 29, 72, 'JPN'], ['Thomas Müller', 'AM', 35, 77, 'GER'], ['Ryan Gauld', 'AM', 29, 73, 'SCO'], ['Brian White', 'ST', 29, 72, 'USA']]),
    c('minnesota', 'Minnesota Loons', 'MIN', 48, ['#8CD2F4', '#231F20'], 'Allianz Field Park', 19400), c('rsl', 'Salt Lake Royals', 'RSL', 48, ['#B30838', '#013A81'], 'America First Park', 20213),
    c('austin', 'Austin Verde', 'ATX', 48, ['#00B140', '#000000'], 'Q2 Park', 20738), c('sandiego', 'San Diego Waves', 'SDF', 48, ['#000000', '#F5A7C0'], 'Snapdragon Park', 35000, [['Hirving Lozano', 'RW', 30, 75, 'MEX'], ['Anders Dreyer', 'RW', 27, 74, 'DEN']]),
    c('toronto', 'Toronto Reds', 'TOR', 50, ['#B81137', '#455560'], 'BMO Park', 30000, [['Lorenzo Insigne', 'LW', 34, 72, 'ITA'], ['Federico Bernardeschi', 'RW', 31, 73, 'ITA']]),
  ] }],
};

export const MEXICO: RCountry = {
  id: 'mex', name: 'Mexico', superCup: 'Campeón de Campeones',
  cups: [],
  leagues: [{ id: 'mex1', name: 'Liga MX', short: 'Liga MX', tier: 1, promote: 0, relegate: 0, tv: 240_000, clubs: [
    c('america', 'Mexico City Eagles', 'AME', 68, ['#FFD200', '#002F6C'], 'Aztec Park', 83264, [['Luis Malagón', 'GK', 28, 74, 'MEX'], ['Álvaro Fidalgo', 'CM', 28, 75, 'ESP'], ['Alejandro Zendejas', 'RW', 27, 73, 'USA'], ['Brian Rodríguez', 'LW', 25, 73, 'URU']]),
    c('chivas', 'Guadalajara Goats', 'GDL', 62, ['#E30613', '#FFFFFF'], 'Akron Park', 48071, [['Raúl Rangel', 'GK', 25, 72, 'MEX'], ['Roberto Alvarado', 'RW', 26, 73, 'MEX'], ['Javier Hernández', 'ST', 37, 68, 'MEX']]),
    c('cruzazul', 'Mexico City Cement Makers', 'CAZ', 66, ['#0055A4', '#FFFFFF'], 'Ciudad de los Deportes Park', 33000, [['Kevin Mier', 'GK', 25, 74, 'COL'], ['Jorge Sánchez', 'RB', 27, 72, 'MEX'], ['Ángel Sepúlveda', 'ST', 34, 72, 'MEX']]),
    c('pumas', 'Mexico City Pumas', 'PUM', 56, ['#002F6C', '#C39E6D'], 'University Olympic Park', 58445, [['Keylor Navas', 'GK', 38, 75, 'CRC']]),
    c('monterrey', 'Monterrey Striped', 'MTY', 68, ['#002F6C', '#FFFFFF'], 'BBVA Park', 53500, [['Esteban Andrada', 'GK', 34, 73, 'ARG'], ['Sergio Ramos', 'CB', 39, 76, 'ESP'], ['Sergio Canales', 'AM', 34, 76, 'ESP'], ['Óliver Torres', 'CM', 30, 74, 'ESP'], ['Lucas Ocampos', 'RW', 31, 74, 'ARG'], ['Germán Berterame', 'ST', 26, 74, 'MEX']]),
    c('tigres', 'Monterrey Feline', 'TIG', 68, ['#FDB913', '#002F6C'], 'University Park', 41615, [['Nahuel Guzmán', 'GK', 39, 72, 'ARG'], ['Juan Brunetta', 'AM', 28, 75, 'ARG'], ['Ángel Correa', 'ST', 30, 77, 'ARG'], ['André-Pierre Gignac', 'ST', 39, 71, 'FRA']]),
    c('toluca', 'Toluca Red Devils', 'TOL', 64, ['#E30613', '#FFFFFF'], 'Nemesio Díez Park', 30000, [['Alexis Vega', 'LW', 27, 75, 'MEX'], ['Paulinho', 'ST', 25, 75, 'POR']]),
    c('santoslaguna', 'Torreón Warriors', 'SAN', 50, ['#00843D', '#FFFFFF'], 'Corona Park', 30050), c('leon', 'León Emeralds', 'LEO', 54, ['#00843D', '#FFFFFF'], 'Nou Camp León', 31297, [['James Rodríguez', 'AM', 34, 75, 'COL']]),
    c('pachuca', 'Pachuca Tuzos', 'PAC', 58, ['#003D7C', '#FFFFFF'], 'Hidalgo Park', 27512, [['Salomón Rondón', 'ST', 35, 0, 'VEN']]), c('atlas', 'Guadalajara Red & Black', 'ATS', 50, ['#E30613', '#000000'], 'Jalisco Park', 55020),
    c('tijuana', 'Tijuana Xolos', 'TIJ', 48, ['#E30613', '#000000'], 'Caliente Park', 27333), c('puebla', 'Puebla Strip', 'PUE', 42, ['#FFFFFF', '#002F6C'], 'Cuauhtémoc Park', 51726),
    c('queretaro', 'Querétaro Roosters', 'QRO', 40, ['#002F6C', '#000000'], 'Corregidora Park', 33162), c('necaxa', 'Aguascalientes Rays', 'NEC', 44, ['#E30613', '#FFFFFF'], 'Victoria Park', 23851),
    c('mazatlan', 'Mazatlán Purple', 'MAZ', 40, ['#5B2C83', '#FFFFFF'], 'Kraken Park', 25000), c('juarez', 'Juárez Braves', 'JUA', 42, ['#00843D', '#E30613'], 'Olímpico Benito Juárez Park', 19703),
    c('sanluis', 'San Luis Athletic', 'ASL', 42, ['#E30613', '#002F6C'], 'Alfonso Lastras Park', 25709),
  ] }],
};
