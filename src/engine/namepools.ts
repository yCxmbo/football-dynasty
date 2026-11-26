/* Invented player names that fit a nationality: common first names and surnames per language group,
   combined at random, so generated players aren't real people. */
import type { Rng } from './rng';

type Pool = [first: string[], last: string[]];
const P: Record<string, Pool> = {
  en: [['Jack', 'Harry', 'Oliver', 'George', 'Charlie', 'James', 'Thomas', 'Alfie', 'Joe', 'Sam', 'Lewis', 'Callum', 'Ryan', 'Ben', 'Jake', 'Connor', 'Luke', 'Dan', 'Kyle', 'Tom', 'Josh', 'Liam', 'Owen', 'Matt'],
    ['Smith', 'Jones', 'Taylor', 'Brown', 'Wilson', 'Evans', 'Walker', 'Wright', 'Hughes', 'Green', 'Hall', 'Wood', 'Clarke', 'Turner', 'Cooper', 'Ward', 'Morris', 'Bennett', 'Shaw', 'Holmes', 'Barker', 'Fletcher', 'Mason', 'Reid', 'Campbell', 'Murray', 'Doyle', 'Byrne']],
  es: [['Pablo', 'Sergio', 'Álvaro', 'Javier', 'Adrián', 'Diego', 'Daniel', 'Hugo', 'Iker', 'Raúl', 'Marcos', 'Rubén', 'Óscar', 'Víctor', 'Jorge', 'Iván', 'Unai', 'Aitor', 'Mario', 'Carlos', 'Alejandro', 'Gonzalo'],
    ['García', 'Martínez', 'López', 'Sánchez', 'Pérez', 'Gómez', 'Fernández', 'Ruiz', 'Díaz', 'Moreno', 'Muñoz', 'Romero', 'Navarro', 'Torres', 'Domínguez', 'Gil', 'Vázquez', 'Serrano', 'Ramos', 'Molina', 'Ortega', 'Castro', 'Iglesias', 'Herrera']],
  la: [['Mateo', 'Santiago', 'Matías', 'Thiago', 'Facundo', 'Nicolás', 'Lautaro', 'Agustín', 'Joaquín', 'Franco', 'Emiliano', 'Valentín', 'Juan Pablo', 'Luis', 'Andrés', 'Kevin', 'Brayan', 'Jhon', 'Edwin', 'Diego', 'Rodrigo', 'Gustavo'],
    ['González', 'Rodríguez', 'Fernández', 'Benítez', 'Acosta', 'Medina', 'Sosa', 'Ríos', 'Cabrera', 'Villalba', 'Aguirre', 'Giménez', 'Herrera', 'Mendoza', 'Rojas', 'Vargas', 'Castillo', 'Quintero', 'Valencia', 'Ortiz', 'Salazar', 'Núñez', 'Paredes']],
  pt: [['João', 'Pedro', 'Gabriel', 'Lucas', 'Matheus', 'Rafael', 'Guilherme', 'Vinícius', 'Thiago', 'Bruno', 'Diogo', 'Tiago', 'Rodrigo', 'Gonçalo', 'André', 'Caio', 'Felipe', 'Igor', 'Danilo', 'Henrique', 'Rúben', 'Nuno'],
    ['Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Ferreira', 'Almeida', 'Carvalho', 'Gomes', 'Ribeiro', 'Martins', 'Rocha', 'Lima', 'Araújo', 'Barbosa', 'Moreira', 'Cardoso', 'Teixeira', 'Mendes', 'Nascimento', 'Correia']],
  it: [['Lorenzo', 'Alessandro', 'Matteo', 'Andrea', 'Federico', 'Riccardo', 'Davide', 'Simone', 'Luca', 'Francesco', 'Gianluca', 'Tommaso', 'Nicolò', 'Giorgio', 'Michele', 'Stefano', 'Marco', 'Filippo', 'Daniele', 'Pietro'],
    ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi', 'Moretti', 'Barbieri', 'Fontana']],
  fr: [['Lucas', 'Hugo', 'Théo', 'Mathis', 'Nathan', 'Enzo', 'Louis', 'Maxime', 'Antoine', 'Clément', 'Bastien', 'Kylian', 'Yanis', 'Rayan', 'Moussa', 'Ibrahima', 'Mamadou', 'Jules', 'Adrien', 'Florian', 'Quentin', 'Romain'],
    ['Martin', 'Bernard', 'Dubois', 'Durand', 'Lefebvre', 'Moreau', 'Laurent', 'Girard', 'Roux', 'Fournier', 'Morel', 'Mercier', 'Blanc', 'Garnier', 'Faure', 'Chevalier', 'Diallo', 'Traoré', 'Koné', 'Camara', 'Sissoko', 'Mendy']],
  de: [['Lukas', 'Leon', 'Jonas', 'Niklas', 'Felix', 'Maximilian', 'Paul', 'Tim', 'Jan', 'Moritz', 'Florian', 'Julian', 'Tobias', 'Fabian', 'Kevin', 'Marco', 'David', 'Simon', 'Nico', 'Lennart', 'Dominik', 'Stefan'],
    ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Koch', 'Richter', 'Klein', 'Wolf', 'Neumann', 'Braun', 'Zimmermann', 'Krüger', 'Hartmann', 'Lange', 'Huber', 'Gruber']],
  nl: [['Daan', 'Sem', 'Lars', 'Bram', 'Jesse', 'Thijs', 'Ruben', 'Stijn', 'Joris', 'Milan', 'Tom', 'Niels', 'Wout', 'Jens', 'Arne', 'Pieter', 'Senne', 'Bart', 'Koen', 'Mats'],
    ['de Jong', 'Jansen', 'de Vries', 'van den Berg', 'Bakker', 'Visser', 'Smit', 'Meijer', 'de Boer', 'Mulder', 'Bos', 'Vos', 'Peters', 'Hendriks', 'Dekker', 'Peeters', 'Maes', 'Claes', 'Wouters', 'Janssens', 'Willems', 'Goossens']],
  nordic: [['Erik', 'Lars', 'Magnus', 'Oskar', 'Emil', 'Jonas', 'Mikkel', 'Rasmus', 'Kasper', 'Anders', 'Viktor', 'Sander', 'Henrik', 'Mathias', 'Isak', 'Elias', 'Aron', 'Gustav', 'Nils', 'Joakim'],
    ['Hansen', 'Johansen', 'Olsen', 'Larsen', 'Andersen', 'Nielsen', 'Jensen', 'Pedersen', 'Kristiansen', 'Berg', 'Lindqvist', 'Eriksson', 'Karlsson', 'Nilsson', 'Lund', 'Holm', 'Dahl', 'Strand', 'Sørensen', 'Bakke']],
  yu: [['Luka', 'Marko', 'Nikola', 'Stefan', 'Filip', 'Ivan', 'Josip', 'Petar', 'Aleksandar', 'Milan', 'Mario', 'Ante', 'Dario', 'Mateo', 'Jan', 'Žan', 'Andrej', 'Bojan', 'Duje', 'Lovro'],
    ['Petrović', 'Jovanović', 'Horvat', 'Kovačević', 'Marković', 'Kovač', 'Babić', 'Ilić', 'Perić', 'Jurić', 'Pavlović', 'Nikolić', 'Knežević', 'Vuković', 'Radić', 'Božić', 'Tomić', 'Popović', 'Begić', 'Hodžić', 'Zupan', 'Kranjc']],
  pl: [['Jakub', 'Mateusz', 'Kamil', 'Bartosz', 'Piotr', 'Michał', 'Krzysztof', 'Łukasz', 'Paweł', 'Szymon', 'Kacper', 'Tomasz'],
    ['Nowak', 'Kowalski', 'Wiśniewski', 'Wójcik', 'Kamiński', 'Lewandowicz', 'Zieliński', 'Szymański', 'Woźniak', 'Dąbrowski', 'Kozłowski', 'Jankowski']],
  cz: [['Tomáš', 'Jakub', 'Ondřej', 'Jan', 'Lukáš', 'Matěj', 'Martin', 'Dávid', 'Marek', 'Peter', 'Adam', 'Filip'],
    ['Novák', 'Svoboda', 'Dvořák', 'Černý', 'Procházka', 'Kučera', 'Veselý', 'Horák', 'Novotný', 'Kováč', 'Varga', 'Tóth']],
  ua: [['Andriy', 'Dmytro', 'Oleksandr', 'Mykola', 'Vitaliy', 'Taras', 'Bohdan', 'Yevhen', 'Serhiy', 'Volodymyr', 'Artem', 'Ruslan'],
    ['Bondarenko', 'Tkachenko', 'Kovalenko', 'Shevchuk', 'Kravchenko', 'Melnyk', 'Boyko', 'Moroz', 'Lysenko', 'Marchenko', 'Savchenko', 'Rudenko']],
  ro: [['Andrei', 'Mihai', 'Alexandru', 'Ionuț', 'Răzvan', 'Florin', 'Cristian', 'Denis', 'Darius', 'Vlad'], ['Popescu', 'Ionescu', 'Popa', 'Stan', 'Dumitru', 'Munteanu', 'Constantin', 'Marin', 'Stoica', 'Rusu']],
  hu: [['Bence', 'Dániel', 'Ádám', 'Máté', 'Balázs', 'Levente', 'Péter', 'Zsolt', 'Gergő', 'Attila'], ['Nagy', 'Kovács', 'Szabó', 'Horváth', 'Kiss', 'Molnár', 'Németh', 'Farkas', 'Balogh', 'Papp']],
  al: [['Armando', 'Arbër', 'Ermir', 'Elseid', 'Kristjan', 'Florent', 'Edon', 'Valon', 'Arlind', 'Besart'], ['Krasniqi', 'Hoxha', 'Berisha', 'Gashi', 'Shala', 'Morina', 'Kelmendi', 'Bytyqi', 'Rama', 'Dervishi']],
  tr: [['Emre', 'Burak', 'Mert', 'Arda', 'Kerem', 'Yusuf', 'Ozan', 'Can', 'Furkan', 'Berkay', 'Hakan', 'Kaan', 'Ömer', 'Eren', 'Baran', 'Cenk'],
    ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Aydın', 'Öztürk', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Koç', 'Kurt', 'Özdemir', 'Polat']],
  ar: [['Mohammed', 'Ahmed', 'Abdullah', 'Faisal', 'Saud', 'Fahad', 'Salem', 'Yasser', 'Omar', 'Khalid', 'Hassan', 'Youssef', 'Achraf', 'Hamza', 'Ilias', 'Riyad', 'Amine', 'Karim', 'Nabil', 'Sofiane', 'Mahmoud', 'Ali'],
    ['Al-Dosari', 'Al-Shahrani', 'Al-Ghamdi', 'Al-Harbi', 'Al-Otaibi', 'Al-Qahtani', 'Al-Zahrani', 'Al-Malki', 'Al-Amri', 'Hassan', 'El Amrani', 'Benali', 'Bensaid', 'Mansouri', 'Haddad', 'Belhadj', 'Ziani', 'Saleh', 'Ibrahim', 'Farouk']],
  waf: [['Kwame', 'Kofi', 'Emmanuel', 'Samuel', 'Victor', 'Chidi', 'Ademola', 'Moussa', 'Ibrahima', 'Cheikh', 'Sadio', 'Wilfried', 'Serge', 'Franck', 'Jean', 'Joseph', 'Seydou', 'Oumar', 'Amadou', 'Christian', 'Patrick'],
    ['Mensah', 'Asante', 'Osei', 'Boateng', 'Okafor', 'Okoye', 'Adeyemi', 'Eze', 'Nwosu', 'Diallo', 'Ndiaye', 'Sarr', 'Gueye', 'Diop', 'Koné', 'Touré', 'Bamba', 'Kouassi', 'Traoré', 'Coulibaly']],
  jp: [['Takumi', 'Kaoru', 'Daichi', 'Ritsu', 'Wataru', 'Yuto', 'Hiroki', 'Kento', 'Shoma', 'Ayumu', 'Koki', 'Junya', 'Yuki', 'Sota', 'Riku'],
    ['Suzuki', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato', 'Yoshida', 'Yamada', 'Sasaki', 'Matsumoto', 'Inoue', 'Kimura', 'Hayashi', 'Shimizu']],
  kr: [['Woo-young', 'Seung-ho', 'Young-woo', 'Jun-ho', 'Ji-sung'],
    ['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon', 'Jang', 'Lim', 'Han', 'Oh', 'Seo', 'Hwang', 'Song', 'Jeon']],
  fa: [['Mehdi', 'Ali', 'Alireza', 'Saeid', 'Reza', 'Amir', 'Milad', 'Morteza', 'Saman', 'Otabek'],
    ['Karimi', 'Hosseini', 'Rezaei', 'Mohammadi', 'Ahmadi', 'Jafari', 'Ghorbani', 'Nazarov', 'Rahimi', 'Ebrahimi']],
  eaf: [['Michael', 'Brian', 'Joseph', 'Emmanuel', 'Erick', 'Kelvin', 'Dennis', 'Abdul', 'Ibrahim', 'Allan', 'Moses', 'Faisal', 'Kenneth', 'Ronald'],
    ['Otieno', 'Odhiambo', 'Mwangi', 'Okello', 'Mutebi', 'Ssemakula', 'Mbwana', 'Kasongo', 'Ochieng', 'Kamau', 'Nsubuga', 'Mollel', 'Juma', 'Kiprono']],
  sea: [['Supachai', 'Chanathip', 'Teerasil', 'Nguyen', 'Quang', 'Tuan', 'Rizky', 'Egy', 'Arhan', 'Safawi', 'Faisal', 'Sunil', 'Anirudh', 'Lallian'],
    ['Saengsri', 'Chaiyawat', 'Pham', 'Tran', 'Le', 'Hoang', 'Pratama', 'Saputra', 'Hidayat', 'Rahman', 'Ismail', 'Singh', 'Thapa', 'Kumar']],
  zh: [['Wei', 'Lei', 'Jun', 'Hao', 'Yang', 'Peng', 'Tao', 'Bin', 'Jian', 'Long', 'Ming', 'Xin'], ['Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Zhao', 'Huang', 'Zhou', 'Wu', 'Xu', 'Sun']],
  ru: [['Aleksandr', 'Dmitri', 'Maksim', 'Artem', 'Ivan', 'Kirill', 'Nikita', 'Sergei', 'Andrei', 'Igor', 'Roman', 'Denis'], ['Ivanov', 'Smirnov', 'Kuznetsov', 'Popov', 'Sokolov', 'Lebedev', 'Kozlov', 'Novikov', 'Morozov', 'Volkov']],
  gr: [['Giorgos', 'Konstantinos', 'Dimitris', 'Nikos', 'Christos', 'Vangelis', 'Kostas', 'Panagiotis', 'Giannis', 'Anastasios'], ['Papadopoulos', 'Georgiou', 'Nikolaou', 'Karagiannis']],
  ka: [['Giorgi', 'Levan', 'Otar', 'Zuriko', 'Saba', 'Luka', 'Anzor', 'Budu'], ['Beridze', 'Kapanadze', 'Gelashvili']],
};

const GROUP: Record<string, string> = {
  ENG: 'en', SCO: 'en', WAL: 'en', NIR: 'en', IRL: 'en', USA: 'en', CAN: 'en', AUS: 'en', NZL: 'en', JAM: 'en', RSA: 'en', ZAM: 'en', ZIM: 'en',
  ESP: 'es', ARG: 'la', URU: 'la', COL: 'la', ECU: 'la', PAR: 'la', CHI: 'la', PER: 'la', VEN: 'la', BOL: 'la', MEX: 'la', PAN: 'la', CRC: 'la', HON: 'la', SLV: 'la', EQG: 'la',
  BRA: 'pt', POR: 'pt', ANG: 'pt', MOZ: 'pt', CPV: 'pt', ITA: 'it', FRA: 'fr', BEL: 'nl', SUI: 'de', GUF: 'fr', HAI: 'fr', CUW: 'nl', NCL: 'fr',
  GER: 'de', AUT: 'de', NED: 'nl', DEN: 'nordic', NOR: 'nordic', SWE: 'nordic', ISL: 'nordic', FIN: 'nordic',
  CRO: 'yu', SRB: 'yu', SVN: 'yu', BIH: 'yu', MNE: 'yu', MKD: 'yu', BUL: 'yu', POL: 'pl', CZE: 'cz', SVK: 'cz', UKR: 'ua', ROU: 'ro', HUN: 'hu', ALB: 'al', KOS: 'al', ARM: 'ru',
  RUS: 'ru', GRE: 'gr', GEO: 'ka', ISR: 'en', TUR: 'tr',
  MAR: 'ar', ALG: 'ar', TUN: 'ar', EGY: 'ar', KSA: 'ar', QAT: 'ar', UAE: 'ar', IRQ: 'ar', JOR: 'ar', OMA: 'ar', BHR: 'ar', PLE: 'ar',
  SEN: 'waf', NGA: 'waf', CIV: 'waf', GHA: 'waf', CMR: 'waf', MLI: 'waf', GUI: 'waf', BFA: 'waf', COD: 'waf', GAB: 'waf', GAM: 'waf', BEN: 'waf', TOG: 'waf', CTA: 'waf',
  JPN: 'jp', KOR: 'kr', IRN: 'fa', UZB: 'fa', KGZ: 'fa', TJK: 'fa', CHN: 'zh', SYR: 'ar', LBN: 'ar', KUW: 'ar', SUD: 'ar', LBY: 'ar',
  THA: 'sea', VIE: 'sea', IDN: 'sea', MAS: 'sea', IND: 'sea', KEN: 'eaf', UGA: 'eaf', TAN: 'eaf',
};

/** Names of real people in the loaded world, which generated names must not copy. */
const taken = new Set<string>();
export function reserveNames(names: Iterable<string>) { for (const n of names) taken.add(n); }

/** A made-up name that fits the nationality (a FIFA code), never one of a real player in the world. */
export function nameFor(rng: Rng, nationality: string) {
  const [first, last] = P[GROUP[nationality] ?? 'en'];
  for (let i = 0; i < 8; i++) {
    const name = `${rng.pick(first)} ${rng.pick(last)}`;
    if (!taken.has(name)) return name;
  }
  return `${rng.pick(first)} ${rng.pick(last)}-${rng.pick(last)}`;
}
