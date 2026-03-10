/**
 * IPL 2026 team rosters with official player photos.
 * Photos sourced from: https://www.iplt20.com/assets/images/playermaster/[id].png
 */

export interface IPLPlayer {
  name: string;          // Full name (used for display)
  shortName: string;     // Short name (used in ball-by-ball scoreboard)
  photoUrl: string;
}

const photo = (id: number) =>
  `https://www.iplt20.com/assets/images/playermaster/${id}.png`;

interface TeamRoster {
  batsmen: IPLPlayer[];
  bowlers: IPLPlayer[];
}

export const TEAM_ROSTERS: Record<string, TeamRoster> = {
  MI: {
    batsmen: [
      { name: "Rohit Sharma",      shortName: "Rohit",    photoUrl: photo(107) },
      { name: "Suryakumar Yadav",  shortName: "SKY",      photoUrl: photo(108) },
      { name: "Tilak Varma",       shortName: "Tilak",    photoUrl: photo(20594) },
      { name: "Hardik Pandya",     shortName: "Hardik",   photoUrl: photo(2740) },
      { name: "Ryan Rickelton",    shortName: "Rickelton",photoUrl: photo(22003) },
      { name: "Naman Dhir",        shortName: "Dhir",     photoUrl: photo(20628) },
      { name: "Robin Minz",        shortName: "Minz",     photoUrl: photo(22053) },
      { name: "Raj Angad Bawa",    shortName: "Bawa",     photoUrl: photo(20618) },
    ],
    bowlers: [
      { name: "Jasprit Bumrah",    shortName: "Bumrah",   photoUrl: photo(1124) },
      { name: "Trent Boult",       shortName: "Boult",    photoUrl: photo(969) },
      { name: "Allah Ghazanfar",   shortName: "Ghazanfar",photoUrl: photo(20725) },
      { name: "Mitchell Santner",  shortName: "Santner",  photoUrl: photo(1903) },
      { name: "Deepak Chahar",     shortName: "Chahar",   photoUrl: photo(140) },
    ],
  },

  CSK: {
    batsmen: [
      { name: "MS Dhoni",          shortName: "Dhoni",    photoUrl: photo(1) },
      { name: "Ruturaj Gaikwad",   shortName: "Ruturaj",  photoUrl: photo(5443) },
      { name: "Shivam Dube",       shortName: "Dube",     photoUrl: photo(5431) },
      { name: "Dewald Brevis",     shortName: "Brevis",   photoUrl: photo(20593) },
      { name: "Ramnaresh Sarwan",  shortName: "Sarwan",   photoUrl: photo(3334) },
      { name: "Shaik Rasheed",     shortName: "Rasheed",  photoUrl: photo(20629) },
      { name: "Anshul Kamboj",     shortName: "Kamboj",   photoUrl: photo(20630) },
      { name: "Sam Curran",        shortName: "Curran",   photoUrl: photo(3646) },
    ],
    bowlers: [
      { name: "Khaleel Ahmed",     shortName: "Khaleel",  photoUrl: photo(2964) },
      { name: "Noor Ahmad",        shortName: "Noor",     photoUrl: photo(20590) },
      { name: "Mukesh Choudhary",  shortName: "Mukesh",   photoUrl: photo(20575) },
      { name: "Rahul Chahar",      shortName: "R.Chahar", photoUrl: photo(3763) },
      { name: "Nathan Ellis",      shortName: "Ellis",    photoUrl: photo(17118) },
    ],
  },

  RCB: {
    batsmen: [
      { name: "Virat Kohli",       shortName: "Kohli",    photoUrl: photo(164) },
      { name: "Rajat Patidar",     shortName: "Patidar",  photoUrl: photo(5471) },
      { name: "Phil Salt",         shortName: "Salt",     photoUrl: photo(5606) },
      { name: "Tim David",         shortName: "T.David",  photoUrl: photo(4524) },
      { name: "Liam Livingstone",  shortName: "Livingstone",photoUrl: photo(3644) },
      { name: "Krunal Pandya",     shortName: "Krunal",   photoUrl: photo(3183) },
      { name: "Devdutt Padikkal",  shortName: "Padikkal", photoUrl: photo(5430) },
      { name: "Jitesh Sharma",     shortName: "Jitesh",   photoUrl: photo(5437) },
    ],
    bowlers: [
      { name: "Josh Hazlewood",    shortName: "Hazlewood",photoUrl: photo(857) },
      { name: "Bhuvneshwar Kumar", shortName: "Bhuvi",    photoUrl: photo(116) },
      { name: "Yash Dayal",        shortName: "Dayal",    photoUrl: photo(20591) },
      { name: "Suyash Sharma",     shortName: "S.Sharma", photoUrl: photo(5668) },
      { name: "Rasikh Dar",        shortName: "Rasikh",   photoUrl: photo(20624) },
    ],
  },

  DC: {
    batsmen: [
      { name: "KL Rahul",          shortName: "KL Rahul", photoUrl: photo(1125) },
      { name: "Axar Patel",        shortName: "Axar",     photoUrl: photo(1113) },
      { name: "David Miller",      shortName: "Miller",   photoUrl: photo(187) },
      { name: "Karun Nair",        shortName: "Karun",    photoUrl: photo(276) },
      { name: "Tristan Stubbs",    shortName: "Stubbs",   photoUrl: photo(20631) },
      { name: "Faf du Plessis",    shortName: "Faf",      photoUrl: photo(142) },
      { name: "Jake Fraser-McGurk",shortName: "Fraser-M", photoUrl: photo(20688) },
      { name: "Sameer Rizvi",      shortName: "Rizvi",    photoUrl: photo(20689) },
    ],
    bowlers: [
      { name: "Kuldeep Yadav",     shortName: "Kuldeep",  photoUrl: photo(261) },
      { name: "Mitchell Starc",    shortName: "Starc",    photoUrl: photo(490) },
      { name: "T. Natarajan",      shortName: "Natarajan",photoUrl: photo(3831) },
      { name: "Mukesh Kumar",      shortName: "M.Kumar",  photoUrl: photo(5622) },
      { name: "Mohit Sharma",      shortName: "M.Sharma", photoUrl: photo(195) },
    ],
  },

  KKR: {
    batsmen: [
      { name: "Ajinkya Rahane",    shortName: "Rahane",   photoUrl: photo(135) },
      { name: "Rinku Singh",       shortName: "Rinku",    photoUrl: photo(3830) },
      { name: "Sunil Narine",      shortName: "Narine",   photoUrl: photo(203) },
      { name: "Rovman Powell",     shortName: "Powell",   photoUrl: photo(3333) },
      { name: "Rachin Ravindra",   shortName: "Rachin",   photoUrl: photo(20684) },
      { name: "Quinton de Kock",   shortName: "de Kock",  photoUrl: photo(834) },
      { name: "Angkrish Raghuvanshi",shortName:"Angkrish", photoUrl: photo(20690) },
      { name: "Venkatesh Iyer",    shortName: "Venkatesh",photoUrl: photo(8540) },
    ],
    bowlers: [
      { name: "Varun Chakaravarthy",shortName:"Varun",    photoUrl: photo(5432) },
      { name: "Harshit Rana",      shortName: "H.Rana",   photoUrl: photo(20626) },
      { name: "Akash Deep",        shortName: "Akash",    photoUrl: photo(14800) },
      { name: "Anrich Nortje",     shortName: "Nortje",   photoUrl: photo(5433) },
      { name: "Spencer Johnson",   shortName: "Johnson",  photoUrl: photo(20717) },
    ],
  },

  SRH: {
    batsmen: [
      { name: "Travis Head",       shortName: "Head",     photoUrl: photo(1020) },
      { name: "Abhishek Sharma",   shortName: "Abhishek", photoUrl: photo(3760) },
      { name: "Heinrich Klaasen",  shortName: "Klaasen",  photoUrl: photo(3869) },
      { name: "Ishan Kishan",      shortName: "Ishan",    photoUrl: photo(2975) },
      { name: "Nitish Kumar Reddy",shortName: "Nitish",   photoUrl: photo(5711) },
      { name: "Kamindu Mendis",    shortName: "Kamindu",  photoUrl: photo(20720) },
      { name: "Adam Gilchrist",    shortName: "Gilchrist",photoUrl: photo(20721) },
      { name: "Jaydev Unadkat",    shortName: "Unadkat",  photoUrl: photo(86) },
    ],
    bowlers: [
      { name: "Pat Cummins",       shortName: "Cummins",  photoUrl: photo(488) },
      { name: "Harshal Patel",     shortName: "Harshal",  photoUrl: photo(157) },
      { name: "Brydon Carse",      shortName: "Carse",    photoUrl: photo(22075) },
      { name: "Simarjeet Singh",   shortName: "Simarjeet",photoUrl: photo(20706) },
      { name: "Zeeshan Ansari",    shortName: "Zeeshan",  photoUrl: photo(20707) },
    ],
  },

  RR: {
    batsmen: [
      { name: "Yashasvi Jaiswal",  shortName: "Jaiswal",  photoUrl: photo(13538) },
      { name: "Riyan Parag",       shortName: "Parag",    photoUrl: photo(4445) },
      { name: "Shimron Hetmyer",   shortName: "Hetmyer",  photoUrl: photo(1705) },
      { name: "Dhruv Jurel",       shortName: "Jurel",    photoUrl: photo(20620) },
      { name: "Vaibhav Suryavanshi",shortName:"Suryavanshi",photoUrl:photo(22203)},
      { name: "Ravindra Jadeja",   shortName: "Jadeja",   photoUrl: photo(9) },
      { name: "Jos Buttler",       shortName: "Buttler",  photoUrl: photo(509) },
      { name: "Nitish Rana",       shortName: "N.Rana",   photoUrl: photo(2738) },
    ],
    bowlers: [
      { name: "Jofra Archer",      shortName: "Archer",   photoUrl: photo(3502) },
      { name: "Ravi Bishnoi",      shortName: "Bishnoi",  photoUrl: photo(19351) },
      { name: "Sandeep Sharma",    shortName: "Sandeep",  photoUrl: photo(1112) },
      { name: "Tushar Deshpande",  shortName: "Tushar",   photoUrl: photo(3257) },
      { name: "Nandre Burger",     shortName: "Burger",   photoUrl: photo(20716) },
    ],
  },

  PBKS: {
    batsmen: [
      { name: "Shreyas Iyer",      shortName: "Shreyas",  photoUrl: photo(1563) },
      { name: "Prabhsimran Singh", shortName: "Prabhsimran",photoUrl:photo(5436) },
      { name: "Shashank Singh",    shortName: "Shashank", photoUrl: photo(3261) },
      { name: "Marcus Stoinis",    shortName: "Stoinis",  photoUrl: photo(964) },
      { name: "Priyansh Arya",     shortName: "Priyansh", photoUrl: photo(22052) },
      { name: "Nehal Wadhera",     shortName: "Nehal",    photoUrl: photo(5859) },
      { name: "Glenn Maxwell",     shortName: "Maxwell",  photoUrl: photo(220) },
      { name: "Harnoor Singh",     shortName: "Harnoor",  photoUrl: photo(20711) },
    ],
    bowlers: [
      { name: "Arshdeep Singh",    shortName: "Arshdeep", photoUrl: photo(4698) },
      { name: "Yuzvendra Chahal",  shortName: "Chahal",   photoUrl: photo(111) },
      { name: "Marco Jansen",      shortName: "Jansen",   photoUrl: photo(17068) },
      { name: "Lockie Ferguson",   shortName: "Ferguson", photoUrl: photo(3729) },
      { name: "Xavier Bartlett",   shortName: "Bartlett", photoUrl: photo(22112) },
    ],
  },

  GT: {
    batsmen: [
      { name: "Shubman Gill",      shortName: "Gill",     photoUrl: photo(3761) },
      { name: "Sai Sudharsan",     shortName: "Sudharsan",photoUrl: photo(20592) },
      { name: "Glenn Phillips",    shortName: "Phillips", photoUrl: photo(3027) },
      { name: "Shahrukh Khan",     shortName: "SRK",      photoUrl: photo(7779) },
      { name: "Washington Sundar", shortName: "Sundar",   photoUrl: photo(2973) },
      { name: "Anuj Rawat",        shortName: "Rawat",    photoUrl: photo(20619) },
      { name: "Mahipal Lomror",    shortName: "Lomror",   photoUrl: photo(5439) },
      { name: "Kumar Kushagra",    shortName: "Kushagra", photoUrl: photo(20712) },
    ],
    bowlers: [
      { name: "Rashid Khan",       shortName: "Rashid",   photoUrl: photo(2885) },
      { name: "Mohammed Siraj",    shortName: "Siraj",    photoUrl: photo(3840) },
      { name: "Kagiso Rabada",     shortName: "Rabada",   photoUrl: photo(1664) },
      { name: "Prasidh Krishna",   shortName: "Prasidh",  photoUrl: photo(5105) },
      { name: "Gerald Coetzee",    shortName: "Coetzee",  photoUrl: photo(20723) },
    ],
  },

  LSG: {
    batsmen: [
      { name: "Rishabh Pant",      shortName: "Pant",     photoUrl: photo(2972) },
      { name: "Nicholas Pooran",   shortName: "Pooran",   photoUrl: photo(1703) },
      { name: "Aiden Markram",     shortName: "Markram",  photoUrl: photo(1667) },
      { name: "Mitchell Marsh",    shortName: "Marsh",    photoUrl: photo(221) },
      { name: "Ayush Badoni",      shortName: "Badoni",   photoUrl: photo(20586) },
      { name: "Abdul Samad",       shortName: "Samad",    photoUrl: photo(19352) },
      { name: "David Warner",      shortName: "Warner",   photoUrl: photo(178) },
      { name: "Himmat Singh",      shortName: "Himmat",   photoUrl: photo(20713) },
    ],
    bowlers: [
      { name: "Mohammad Shami",    shortName: "Shami",    photoUrl: photo(94) },
      { name: "Mayank Yadav",      shortName: "M.Yadav",  photoUrl: photo(20585) },
      { name: "Avesh Khan",        shortName: "Avesh",    photoUrl: photo(1561) },
      { name: "Wanindu Hasaranga", shortName: "Hasaranga",photoUrl: photo(3082) },
      { name: "Digvijay Deshmukh", shortName: "Digvijay", photoUrl: photo(20714) },
    ],
  },
};

/** Get photo URL for a player by name or shortName (case-insensitive) */
export function getPlayerPhoto(name: string): string | null {
  if (!name) return null;
  const lower = name.toLowerCase();
  for (const roster of Object.values(TEAM_ROSTERS)) {
    for (const p of [...roster.batsmen, ...roster.bowlers]) {
      if (p.name.toLowerCase() === lower || p.shortName.toLowerCase() === lower) {
        return p.photoUrl;
      }
    }
  }
  return null;
}
