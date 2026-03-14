/**
 * IPL 2026 Interactive Banter & Hype Engine
 * Senior NLP Engineer: Indian Sports Culture & Vernacular Dialects
 *
 * Returns exactly 4 quick-comment picks per ball event:
 *   [0] Hype     – celebration / positivity
 *   [1] Gali     – Hinglish trash-talk / frustration
 *   [2] Tactical – expert analysis
 *   [3] Comeback – defensive shield / national pride
 *
 * All strings are strictly 3–5 words (Hinglish/regional lingo).
 */

import type { TeamId } from "@/components/ChatInput";

// ─────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────
export interface BanterContext {
  lastBallResult: string | null;   // "six"|"four"|"wicket"|"dot"|"wide"|"noball"|"single"|"double"|...
  runs: number;
  wickets: number;
  target: number | null;
  overs: number;
  balls: number;
  battingTeam: TeamId | null;
  bowlingTeam: TeamId | null;
  striker: string | null;          // on-strike batsman name
  bowler: string | null;           // current bowler name
  innings: 1 | 2;
  userTeam: TeamId;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function pickExcluding<T>(arr: T[], exclude: T | null): T {
  const f = arr.filter(i => i !== exclude);
  return f.length > 0 ? pickRandom(f) : pickRandom(arr);
}

// ─────────────────────────────────────────────
// GAME STATE
// ─────────────────────────────────────────────
type GamePhase = "powerplay" | "middle" | "death";
type GameState = "winning" | "pressure" | "crunch" | "blown";

function getPhase(overs: number): GamePhase {
  if (overs < 6) return "powerplay";
  if (overs < 15) return "middle";
  return "death";
}

function getGameState(ctx: BanterContext): GameState {
  const { runs, wickets, target, overs, balls } = ctx;
  const played = overs * 6 + balls;
  if (target) {
    const needed = target - runs;
    const left = Math.max(1, 120 - played);
    const rrr = (needed / left) * 6;
    if (needed <= 12 && left <= 18) return "crunch";
    if (rrr > 18 || (needed > 80 && left < 24)) return "blown";
    if (rrr > 10) return "pressure";
    return "winning";
  }
  if (wickets >= 6 && overs < 15) return "blown";
  if (wickets >= 5) return "pressure";
  return "winning";
}

// ─────────────────────────────────────────────
// RIVALRY DETECTION
// ─────────────────────────────────────────────
const RIVALRY_PAIRS: [TeamId, TeamId][] = [
  ["MI", "CSK"], ["RCB", "KKR"], ["DC", "PBKS"],
  ["SRH", "KKR"], ["RCB", "CSK"], ["MI", "RCB"], ["GT", "CSK"],
];
function isRivalry(t1: TeamId | null, t2: TeamId | null): boolean {
  if (!t1 || !t2) return false;
  return RIVALRY_PAIRS.some(([a, b]) =>
    (a === t1 && b === t2) || (a === t2 && b === t1)
  );
}

// ─────────────────────────────────────────────
// PLAYER-SPECIFIC HYPE  (batting)
// ─────────────────────────────────────────────
const PLAYER_HYPE: Record<string, string[]> = {
  // RCB
  "Kohli":            ["King ka darbar!", "Goat ne maara!", "Defending champs power!"],
  "Virat Kohli":      ["King ka darbar!", "Goat ne maara!", "Cup saade power!"],
  "Patidar":          ["Patidar on fire!", "RCB finds hero!", "Rajat ke liye!"],
  "Rajat Patidar":    ["Patidar on fire!", "RCB's surprise weapon!", "Rajat ke liye!"],
  // CSK
  "Dhoni":            ["Thala ne kiya!", "Finisher zinda hai!", "Last ball magic!"],
  "MS Dhoni":         ["Thala ne kiya!", "Finisher zinda hai!", "Ageless wonder Thala!"],
  "Ruturaj":          ["Gaikwad fires up!", "Ruturaj timing class!", "CSK opener shines!"],
  "Ruturaj Gaikwad":  ["Gaikwad fires up!", "Ruturaj timing class!", "Chennai ka champion!"],
  // MI
  "Rohit":            ["Hitman fired up!", "Vadapav power aa!", "Global boss aaya!"],
  "Rohit Sharma":     ["Hitman ne dikhaaya!", "Mumbai ka boss!", "Vadapav power!"],
  "SKY":              ["360 degree hit!", "SKY ne uda!", "Ek hi hai!"],
  "Suryakumar Yadav": ["SKY beyond limits!", "360 legend aaya!", "Mumbai magic hai!"],
  "Hardik":           ["Hardik all-round!", "All-rounder fires!", "Pandya power!"],
  "Hardik Pandya":    ["All-rounder on fire!", "Hardik ne kiya!", "Pandya power show!"],
  // RR
  "Jaiswal":          ["Street se palace!", "Yashasvi fired up!", "Future star shines!"],
  "Yashasvi Jaiswal": ["Street se palace!", "Jaiswal uda diya!", "India ka future!"],
  "Buttler":          ["Buttler fires up!", "Jos magic hai!", "English power!"],
  "Jos Buttler":      ["Buttler on rampage!", "Jos ne uda!", "Royal magic!"],
  // GT
  "Gill":             ["Shubman shine kar!", "India ka future!", "Gill class hai!"],
  "Shubman Gill":     ["Shubman ne kiya!", "Future superstar!", "Gujarat ka hero!"],
  // LSG
  "Pant":             ["Risky Pant zinda!", "Sher ka dimag!", "Rishabh fires!"],
  "Rishabh Pant":     ["Pant on fire!", "Risky business paid!", "LSG ka hero!"],
  // SRH
  "Head":             ["Head se udata!", "Aussie danger aaya!", "Travis fires big!"],
  "Travis Head":      ["Head ne kiya!", "Australia power!", "250 loading hai!"],
  "Abhishek":         ["Young gun fires!", "Abhishek se daaro!", "SRH's new weapon!"],
  "Abhishek Sharma":  ["Abhishek on fire!", "Young sher roars!", "SRH's powerplay king!"],
  // KKR
  "Rinku":            ["Rinku Singh classic!", "5-sixer king!", "Sixer machine wapas!"],
  "Rinku Singh":      ["Rinku ne kiya!", "5 balls hero!", "Kolkata ka sher!"],
  "Narine":           ["Mystery man bats!", "Narine fires up!", "Kolkata's joker card!"],
  "Sunil Narine":     ["Narine all-round!", "Unpredictable as always!", "KKR's trump card!"],
  // DC
  "KL Rahul":         ["KL timing class!", "Rahul elegance!", "DC ka captain!"],
  "Axar":             ["Axar all-round!", "Delhi's hidden gem!", "Left-arm warrior!"],
  "Axar Patel":       ["Axar ne kiya!", "All-round Axar!", "Capital's ace!"],
  // PBKS
  "Shreyas":          ["Shreyas class hit!", "Captain fires!", "Punjab's hope!"],
  "Shreyas Iyer":     ["Shreyas ne kiya!", "Captain's knock!", "Punjab ke captain!"],
  "Prabhsimran":      ["Prabhsimran fires!", "Punjab opener!", "Young lion roars!"],
  "Prabhsimran Singh":["Young Punjab gun!", "Prabhsimran on fire!", "Sher Punjab de!"],
};

// ─────────────────────────────────────────────
// PLAYER-SPECIFIC HYPE  (bowling — on wicket)
// ─────────────────────────────────────────────
const PLAYER_BOWL_HYPE: Record<string, string[]> = {
  "Bumrah":           ["Boom boom magic!", "Yorker king hai!", "Best in world!"],
  "Jasprit Bumrah":   ["Bumrah ne kiya!", "Unplayable yorker!", "Goat bowler hai!"],
  "Rashid":           ["Mystery spinner strikes!", "Rashid ka jadoo!", "Googly ne phansa!"],
  "Rashid Khan":      ["Rashid ka karnama!", "Spin wizard hai!", "Padhna mushkil!"],
  "Chahal":           ["Chahal ka jadoo!", "Leg spin magic!", "Googly ne phansa!"],
  "Yuzvendra Chahal": ["Chahal wicket!", "Googly trap set!", "Spin se gaya!"],
  "Arshdeep":         ["Punjab da sher!", "Left arm swing!", "Arshdeep ne kiya!"],
  "Arshdeep Singh":   ["Arshdeep fires!", "Swing ka boss!", "Punjab's weapon!"],
  "Varun":            ["Varun ka jadoo!", "Mystery phas gaya!", "KKR magic ball!"],
  "Varun Chakaravarthy": ["Mystery wicket!", "Varun ka karnama!", "KKR spin magic!"],
  "Cummins":          ["Cummins delivers!", "SRH captain fires!", "Pacer on fire!"],
  "Pat Cummins":      ["Cummins takes it!", "Captain's delivery!", "Aussie pace works!"],
  "Hazlewood":        ["Hazlewood strikes!", "RCB pace fires!", "Seam magic yaar!"],
  "Josh Hazlewood":   ["Hazlewood delivers!", "RCB new ball!", "Seam movement magic!"],
  "Kuldeep":          ["Kuldeep ka jadoo!", "China-man magic!", "Delhi's match-winner!"],
  "Kuldeep Yadav":    ["Kuldeep fires!", "Wrist spin magic!", "DC's secret weapon!"],
  "Starc":            ["Starc fires!","Left arm pace!","Inswinger got him!"],
  "Mitchell Starc":   ["Starc in-swinger!", "Left arm destroyer!", "DC pace works!"],
  "Shami":            ["Shami takes it!", "Seam king fires!", "LSG's ace takes!"],
  "Mohammad Shami":   ["Shami wicket!", "Seam magic!", "India's best pacer!"],
  "Noor":             ["Noor Ahmad fires!", "Afghan magic hai!", "CSK's new gem!"],
  "Noor Ahmad":       ["Noor Ahmad magic!", "Afghan spinner strikes!", "CSK's new weapon!"],
};

// ─────────────────────────────────────────────
// NATIONAL PRIDE  (blown-game shield)
// ─────────────────────────────────────────────
const NATIONAL_COMEBACKS = [
  "World Cup toh India!",
  "2026 WC hamaare!",
  "India ne jeeta WC!",
  "IPL toh moh-maya!",
  "India sab se best!",
  "Desh ka maan hai!",
];

// ─────────────────────────────────────────────
// RIVALRY TRASH TALK  (high-intensity matches)
// ─────────────────────────────────────────────
interface RivalryLines { [team: string]: string[] }
const RIVALRY_TRASH: Record<string, RivalryLines> = {
  "MI_CSK": {
    MI:  ["CSK ki khair nahi!", "5 vs 5, tiebreak!", "Mumbai mantra wins!", "Thala retire ho!",
          "Old man cricket bye!", "Mumbai kha jayega!", "Blue army jeetega!", "Paltan fires up!"],
    CSK: ["Thala ka rule!", "Mumbai mita denge!", "5 vs 5 CSK wins!", "Script band kar!",
          "Budhde nahi hain!", "Whistle podu dhoom!", "Experience wins always.", "Chennai mantra!"],
  },
  "RCB_KKR": {
    RCB: ["KKR phool nahi!", "Korbo? Losbo yaar!", "Ee sala cup!", "Defending champs hain!",
          "Bangalore on top!", "KKR kaunsa?", "Purple army hara!", "Ee sala number 1!"],
    KKR: ["Pehle ek toh!", "Korbo lorbo jeetbo!", "RCB ka kya hoga?", "17 saal wale!",
          "Kolkata laughs!", "Eden power fire!", "RCB calculator aaya!", "KKR ne phera!"],
  },
  "DC_PBKS": {
    DC:   ["Capital beats Punjab!", "Dilli Power wins!", "Punjab se Dilli!", "BC kya loge?",
           "Axar fires up!", "DC dhamaka hai!", "Dilli ke dil!", "PBKS jao ghar!"],
    PBKS: ["Sher Punjab de!", "Dilli nahi rokegi!", "Punjab da pyaar!", "North India ours!",
           "DC kabhi nahi!", "Mohali ka dhamaka!", "Sher fire karo!", "Punjab ka pyaar!"],
  },
  "RCB_CSK": {
    RCB: ["17 saal ka badla!", "CSK retire ho!", "Defending champs hain!", "Pehle trophy lao!",
          "Budhde hat jao!", "Bengaluru on top!", "RCB fire aaya!", "2025 hamaara!"],
    CSK: ["5 vs 1, samjhe?", "Thala toh Thala!", "Ek match se kya?", "Legacy speaks loudest!",
          "Yellow power wins!", "Thala ne dekha!", "Chennai na ruka!", "Baap baap hota!"],
  },
  "MI_RCB": {
    MI:  ["Ambani power wins!", "5 trophy vs 1!", "Script ready tha!", "Kohli bhi nahi!",
          "Mumbai kha jayega!", "5 ka score hai!", "Paltan fires RCB!", "Calculator aao RCB!"],
    RCB: ["Defending champs hain!", "King ka darbar!", "Ambani paisa hi?", "17 saal mein 1!",
          "2025 ka badla!", "Ee sala MI out!", "Kohli ne kiya!", "Blue army bye bye!"],
  },
  "SRH_KKR": {
    SRH: ["250 vs mystery?", "Flat pitch wins!", "Hyderabad crushes!", "250 loading hai!",
          "Head Travis coming!", "SRH ka dhamaka!", "Kolkata nahi ruka!", "SRH 200 loading!"],
    KKR: ["Mystery spinner aaya!", "Varun ne phas!", "Kolkata spins it!", "Score toh karo!",
          "Spin web lagao!", "250? Spin karo!", "Narine ka jaadu!", "Eden magic aaya!"],
  },
  "GT_CSK": {
    GT:  ["Rashid ka jaadu!", "Gujarat disciplines!", "Young blood wins!", "Thala ko retire?",
          "Youth team GT!", "Spin ko baadha!", "New power aaya!", "GT fires today!"],
    CSK: ["5 trophy kahaan?", "Experience jeetegi!", "Thala ka rule!", "Baap yaad karoge!",
          "Newcomer seekho!", "Thala vs Rashid!", "Yellow wins always.", "5 se seekho!"],
  },
  "LSG_MI": {
    LSG: ["Pant vs Rohit!", "Lucknow rises!", "UP power fire!", "MI nahi rokega!",
          "Nawabi power hai!", "Pant fired up!", "LSG thunder hai!", "UP sher roar!"],
    MI:  ["5 trophy yaar!", "Pant pe Bumrah!", "Ambani power wins!", "Mumbai ka dum!",
          "Slow start, strong!", "Paltan ne kiya!", "MI bounce back!", "Blue army power!"],
  },
  "RR_MI": {
    RR:  ["Royal charm wins!", "Jaipur ka magic!", "Jaiswal fire on!", "Pink wins today!",
          "Royals ne kiya!", "2008 yaad karo!", "RR surprise hai!", "Pink power!"],
    MI:  ["5 trophy ki baat!", "Ambani power wins!", "Rohit ne dikhaaya!", "Mumbai kha lega!",
          "Paltan ne kiya!", "MI history hai!", "Paltan fires!", "5 number hai!"],
  },
};

function getRivalryKey(t1: TeamId | null, t2: TeamId | null): string | null {
  if (!t1 || !t2) return null;
  if (RIVALRY_TRASH[`${t1}_${t2}`]) return `${t1}_${t2}`;
  if (RIVALRY_TRASH[`${t2}_${t1}`]) return `${t2}_${t1}`;
  return null;
}

// ─────────────────────────────────────────────
// TEAM BANTER DATA
// Structure: per-team × per-event-type × tone
// ─────────────────────────────────────────────
interface BanterSet { hype: string[]; gali: string[]; tactical: string[]; comeback: string[] }

type TeamBanterMap = {
  six_bat: BanterSet;       // My team hit six
  four_bat: BanterSet;      // My team hit four
  wicket_lost: BanterSet;   // My team lost wicket
  wicket_taken: BanterSet;  // My team got wicket
  dot_bat: BanterSet;       // My team played dot
  opp_six: BanterSet;       // Opponent hit six (I'm frustrated)
  noball: BanterSet;
  wide_bat: BanterSet;      // Wide — my team batting (extra)
  general: BanterSet;
};

const TEAM_BANTER: Record<TeamId, TeamBanterMap> = {
  RCB: {
    six_bat: {
      hype:     ["Cup saade power!", "King ka darbar!", "Ee sala cup!", "Goat strikes again!", "Defending champs power!"],
      gali:     ["Bowler kya tha?", "Stadium baahar gaya!", "Hawaai ticket mila!", "Bowler rote ghar!"],
      tactical: ["Powerplay ka fayda.", "Length set tha.", "Momentum shift ho!", "Right shot chuna."],
      comeback: ["Defending champs rule!", "17 saal ka badla!", "Calculators phekh diye!", "RCB itihas hua!"],
    },
    four_bat: {
      hype:     ["Shot hai shot!", "Pure timing class!", "Gap dhundh liya!", "Boundary milaya!", "Kohli style hai!"],
      gali:     ["Fielder kahan tha?", "Bowler phir gaya!", "Line kahan thi?", "Defense tod diya!"],
      tactical: ["Gap identify kiya.", "Field exploit kiya.", "Smart cricket ye!", "Angle use hua."],
      comeback: ["Runs aa rahe!", "RCB never stops!", "Trophy power hai.", "We are RCB!"],
    },
    wicket_lost: {
      hype:     ["King ko lao!", "Next batsman fire!", "RCB depth hai!"],
      gali:     ["Saala kya tha!", "Wrong shot tha!", "Aisa mat karo!", "Haath lagaayo!"],
      tactical: ["Pitch read karo.", "Respect good bowling.", "Rotation chahiye yaar.", "Next set ho."],
      comeback: ["Ek match se kya?", "Trophy phir bhi!", "Abhi game baaki!", "Picture abhi baaki!"],
    },
    wicket_taken: {
      hype:     ["Ukhad diya!", "Chalo ghar jao!", "Game over beta!", "RCB bowling bhaari!", "Champion team hai!"],
      gali:     ["Wapis jao beta!", "Kya samjhe the?", "Bye bye padhe!", "Bag pack karo!"],
      tactical: ["Bowling plan perfect.", "Field set tha.", "Pressure mein aaye.", "Length was right."],
      comeback: ["Momentum shift ho!", "One more needed!", "RCB keeps going."],
    },
    dot_bat: {
      hype:     ["Next ball maro!", "Set ho jao.", "Building base here."],
      gali:     ["Maar na yaar!", "Kya kar raha?", "Strike rate yaad?", "Test match band!"],
      tactical: ["Rotate the strike.", "Read the field.", "Spin se bachna.", "Single bhi lena."],
      comeback: ["Kohli set ho.", "Watch next over.", "Patience is power."],
    },
    opp_six: {
      hype:     ["Tight bowling next!", "Fight back karo!", "Apna over aayega!"],
      gali:     ["Bowler kahan tha?", "Field set nahi?", "Kya bowling tha?", "Fielder soya tha?"],
      tactical: ["Field change kar.", "Length badlo please.", "Cutters try karo.", "Plan B chahiye."],
      comeback: ["RCB wapas aayega!", "Ee sala cup!", "Baaki hai game!", "Trophy hamari hai."],
    },
    noball: {
      hype:     ["Free hit time!", "Maaro full toss!", "Bonus ball hai!"],
      gali:     ["Fixing hai kya?", "Gadhe se nahi!", "Laaparvahi dekh le!", "Free hit? Gadhe!"],
      tactical: ["Full toss expect.", "Power shot maaro.", "Free hit fayda le."],
      comeback: ["RCB lega faayda.", "Bonus chance mila!"],
    },
    wide_bat: {
      hype:     ["Extra run aaya!", "Pressure mein hai!", "Wide toh wide!"],
      gali:     ["Gully cricket khel!", "Kahan phenk raha?", "Band kar bowling!", "Control karo thoda!"],
      tactical: ["Extra runs count.", "Patience maintain.", "Next ball target."],
      comeback: ["Koi baat nahi.", "RCB jeetega."],
    },
    general: {
      hype:     ["Defending champs power!", "Ee sala cup!", "RCB forever!", "Champion energy on!", "King Kohli zindabad!"],
      gali:     ["Pehle trophy lao.", "Hasar hai inki!", "Opponents kaanpe!", "17 saal ka badla!"],
      tactical: ["Match situation samjho.", "Phase by phase.", "Smart cricket RCB.", "Death overs crucial."],
      comeback: ["Trophy hamari hai.", "RCB itihas hua!", "Calculators phekh diye!", "17 saal mein 1!"],
    },
  },

  CSK: {
    six_bat: {
      hype:     ["Whistle podu aa!", "Thala fired up!", "Yellow army rocks!", "Sher aaya re!", "Volume badhao!"],
      gali:     ["Bowler wapas jao!", "Chennai mitti hai!", "Stadium baahar gaya!", "Bowler phir gaya!"],
      tactical: ["Death over class.", "Dhoni plan execute.", "Setting up finish.", "Right length target."],
      comeback: ["5 trophy, yaad?", "Baap hamesha baap.", "Experience speaks, kid.", "Thala ka plan!"],
    },
    four_bat: {
      hype:     ["Boundary milaya!", "CSK timing class!", "Yellow magic hai!", "Chennai power!", "Whistle podu!"],
      gali:     ["Bowler gayaa hai!", "Field thoda?", "Line nahi thi!", "Gayaa bowler gayaa!"],
      tactical: ["Gap mila perfect.", "Captain's call ye.", "Field exploit tha.", "Smart rotation CSK."],
      comeback: ["5 trophy wale!", "Kuch seekh lo.", "Thala watching!", "Legacy continues."],
    },
    wicket_lost: {
      hype:     ["Dhoni aayega!", "Next sher ready!", "CSK system hai!"],
      gali:     ["Arrey kya yaar?", "Aisa mat karo!", "Nahi chahiye tha!", "Missed shot tha!"],
      tactical: ["Setting the stage.", "Thala padh raha.", "Death overs wait!", "Respect that ball."],
      comeback: ["5 Trophy yaad hai?", "Baap hamesha baap.", "Abhi Thala hai!", "Experience bolta hai!"],
    },
    wicket_taken: {
      hype:     ["Ukhad diya!", "Ghar jao beta!", "Chennai magic!", "CSK bowling bhaari!", "Yellow power!"],
      gali:     ["Wapis jao!", "Kya samjhe ho?", "Chalte bano!", "Bag pack karo!"],
      tactical: ["Plan execute tha.", "Bowler class tha.", "Field setting correct.", "Pressure built perfectly."],
      comeback: ["Momentum CSK ka!", "Pressure banao!", "One more needed!"],
    },
    dot_bat: {
      hype:     ["Building pressure.", "Setting the stage.", "Thala padh raha!"],
      gali:     ["Maar na bhai!", "Kya chal raha?", "Single bhi le!", "Strike rate?"],
      tactical: ["Rotation pe dhyan.", "Read the field.", "Next over bada.", "Spin se bachna."],
      comeback: ["CSK tactic hai.", "Wait for Dhoni.", "Death over magic!", "Thala ka time!"],
    },
    opp_six: {
      hype:     ["Dhoni handle karega!", "CSK experience wins!", "Tight next over!"],
      gali:     ["Bowler kahan tha?", "Kya bowling tha?", "Fielder kahan gaya?", "Control karo!"],
      tactical: ["Change the length.", "Kutch try karo.", "Spinner lao please.", "Field change chahiye."],
      comeback: ["5 trophy yaad?", "CSK jeetega.", "Baap hamesha baap.", "Experience bolta hai."],
    },
    noball: {
      hype:     ["Free hit time!", "Maaro full toss!"],
      gali:     ["Fixing hai kya?", "Line kahan thi?", "Gadhe se nahi!", "Free hit? Gadhe!"],
      tactical: ["Full shot maaro.", "Free hit target.", "Power time hai."],
      comeback: ["CSK lega faayda.", "Bonus chance hai."],
    },
    wide_bat: {
      hype:     ["Extra run aaya!", "Wide toh wide!"],
      gali:     ["Kahan phenk raha?", "Control karo thoda!", "Gully cricket hai!"],
      tactical: ["Extra runs count.", "Patience rakho.", "Next ball target."],
      comeback: ["CSK jeetega.", "Thala dekhega ye."],
    },
    general: {
      hype:     ["Thala for reason!", "5 trophy legacy!", "Whistle podu!", "Yellow army!", "Thala ka jagah!"],
      gali:     ["Yaar kya ho?", "Pehle khelo samjho.", "Soch ke khelo!", "CSK se daaro!"],
      tactical: ["Match situation samjho.", "Experienced team hai.", "Death over plan.", "Smart cricket CSK."],
      comeback: ["Buddha hoga tera!", "Ageless Thala hai.", "20 saal legend!", "Experience wins always."],
    },
  },

  MI: {
    six_bat: {
      hype:     ["Duniya hila denge!", "Ambani power baby!", "Mumbai meri jaan!", "Blue army rocks!", "Paltan fires up!"],
      gali:     ["Stadium baahar gaya!", "Bowler kya kar?", "Udaa diya!", "Hawaai ticket milaa!"],
      tactical: ["Powerplay fayda liya.", "Death over plan.", "Pace attack ready.", "Right zone target."],
      comeback: ["Slow starters, strong!", "MI wapas aayega!", "Script ready tha!", "5 trophy power!"],
    },
    four_bat: {
      hype:     ["Boundary milaya!", "Mumbai timing!", "MI style cricket!", "Rohit touch hai!", "Paltan rocks!"],
      gali:     ["Bowler phir gaya!", "Field kahan tha?", "Nahi ruk sakta!", "Bowler retire ho!"],
      tactical: ["Gap se nikala.", "Read field well.", "Smart shot MI.", "Angle exploit tha."],
      comeback: ["MI toh MI!", "Comeback kings hain.", "History dekh lo!", "5 trophies power."],
    },
    wicket_lost: {
      hype:     ["Next batsman fire!", "MI depth hai!", "Bounce back kar!"],
      gali:     ["Aisa kya tha?", "Yaar nahi chahiye!", "Wrong shot tha!", "Ugh, kya hua?"],
      tactical: ["Situation padh ke.", "Respect that spell.", "Rotate the strike.", "Tail wagging danger."],
      comeback: ["Slow starters, strong!", "MI comeback loading!", "History dekh MI ki.", "Paltan hoga wapas!"],
    },
    wicket_taken: {
      hype:     ["Boom boom magic!", "Ukhad diya!", "MI bowling best!", "Ambani power!", "Blue army wins!"],
      gali:     ["Wapis jao beta!", "Bag pack karo!", "Lesson hua tujhe!", "Chalo ghar jao!"],
      tactical: ["Bowling plan perfect.", "Length set tha.", "Field was right.", "Pressure through bowling."],
      comeback: ["Momentum MI ka!", "Pressure banao!", "Tight over needed!"],
    },
    dot_bat: {
      hype:     ["Pressure build kar!", "Next over bada.", "Setting up tha."],
      gali:     ["Maar na yaar!", "Strike rate yaad?", "Test match band!", "Kya kar raha?"],
      tactical: ["Rotation needed.", "Find the gaps.", "Don't give dot.", "Read the spin."],
      comeback: ["MI tactic hai.", "Watch the comeback.", "Slow start, big finish.", "Script likhna hai!"],
    },
    opp_six: {
      hype:     ["Bumrah aayega!", "Tight next over!", "MI fight karega!"],
      gali:     ["Bowler kahan tha?", "Field kahan gaya?", "Kya bowling tha?", "Plan B kahan?"],
      tactical: ["Bumrah lao please.", "Change the length.", "Yorker try karo.", "Field set karo."],
      comeback: ["MI script ready!", "5 trophy power.", "Ambani jeetaayega.", "Comeback loading..."],
    },
    noball: {
      hype:     ["Free hit time!", "Sixer maaro!"],
      gali:     ["Fixing? Gadhe!", "Line nahi tha!", "Laaparvahi dekh le!", "Free hit? Gadhe!"],
      tactical: ["Full toss lao.", "Power se maaro.", "Free hit fayda."],
      comeback: ["MI lega faayda.", "Bonus ball mila."],
    },
    wide_bat: {
      hype:     ["Extra run milega!", "Pressure mein hai!"],
      gali:     ["Gully level bowling!", "Kahan fek raha?", "Band kar!"],
      tactical: ["Extra adds up.", "Keep patience.", "Next ball target."],
      comeback: ["MI jeetega.", "Watch the script."],
    },
    general: {
      hype:     ["Mumbai mantra!", "5 trophies power!", "MI forever!", "Ambani dream team!", "Paltan rocks!"],
      gali:     ["Dono haath deke!", "Script likhenge.", "Itna tension kyun?", "Band kar bakwaas!"],
      tactical: ["Analyze the field.", "Smart cricket MI.", "Death over focus.", "Bumrah ka plan."],
      comeback: ["Script ready thi!", "Paisa vasool!", "Comeback loading...", "5 trophy says hi!"],
    },
  },

  SRH: {
    six_bat: {
      hype:     ["250 loading hai!", "Silence mode on!", "Batting ya game?", "SRH attack time!", "Hyderabad fires!"],
      gali:     ["Bowler chhup jao!", "Uda diya gend!", "Field kahan tha?", "Stadium baahar!"],
      tactical: ["Aggressive powerplay plan.", "Target par track.", "Head is dangerous.", "Pace attack set."],
      comeback: ["SRH attack famous!", "High score hoga!", "Orange army roars!", "Hyderabad ka dil!"],
    },
    four_bat: {
      hype:     ["Boundary milaya!", "Orange army!", "SRH style hit!", "Aggressive cricket!", "Hyderabad style!"],
      gali:     ["Bowler phir gaya!", "Field kahan tha?", "Nahi ruka gend!"],
      tactical: ["Good gap find.", "Field exploit hua.", "Angle use kiya.", "Smart SRH hit."],
      comeback: ["SRH never stops.", "250 aa raha!", "Orange roar continues."],
    },
    wicket_lost: {
      hype:     ["Next aggressor ready!", "SRH depth hai!", "Bounce back SRH!"],
      gali:     ["Arrey kya tha?", "Nahi chahiye tha!", "Aisa shot nahi!", "Ugh, bad shot!"],
      tactical: ["Respect that ball.", "Read the spell.", "Set before hitting.", "Pitch read karo."],
      comeback: ["Chasing mein bhi!", "Flat pitch nahi?", "SRH jeetega!", "Orange fights back!"],
    },
    wicket_taken: {
      hype:     ["Cummins ne kiya!", "SRH bowling!", "Ukhad diya!", "Orange army wins!", "Hyderabad hai!"],
      gali:     ["Wapis jao beta!", "Chup ho gaye?", "Bag pack karo!", "Score yaad hai?"],
      tactical: ["Field was perfect.", "Yorker tha deadly.", "Plan execute tha.", "Cummins bowling plan."],
      comeback: ["Pressure banao ab!", "More wickets needed.", "SRH dominating now."],
    },
    dot_bat: {
      hype:     ["Maaro next ball!", "Build up ho.", "Set karke maro."],
      gali:     ["Maar na yaar!", "SRH itna slow?", "250 bhool gaya?", "Strike rate kahan?"],
      tactical: ["Set before attack.", "Read the field.", "Rotate karo please.", "Spinners pe dhyan."],
      comeback: ["Aggression aayega.", "Watch the hitting.", "SRH wapas aayega.", "Orange roar coming."],
    },
    opp_six: {
      hype:     ["Cummins fix karega!", "Tight bowling next!", "SRH fight karega!"],
      gali:     ["Bowler kahan tha?", "Field set nahi?", "Kya bowling tha?", "Ugh, kahan tha!"],
      tactical: ["Cummins lao please.", "Change the plan.", "Yorker try karo.", "Pace attack now."],
      comeback: ["250 reply denge!", "SRH jeetega!", "Orange army roars.", "High score ours!"],
    },
    noball: {
      hype:     ["Free hit! Maro!"],
      gali:     ["Fixing? Gadhe!", "Laaparvahi!"],
      tactical: ["Full hit opportunity.", "Power shot now."],
      comeback: ["SRH lega faayda.", "Extra run milega."],
    },
    wide_bat: {
      hype:     ["Extra run!"],
      gali:     ["Kahan fek raha?", "Gully cricket hai!"],
      tactical: ["Extra adds up.", "Stay patient now."],
      comeback: ["SRH jeetega!"],
    },
    general: {
      hype:     ["250 plus loading!", "Orange army!", "Silence mode!", "Attack attack attack!", "Hyderabad power!"],
      gali:     ["Sirf flat pitch?", "Chup ho gaye?", "Intent kahan gaya?", "Batting sab hai?"],
      tactical: ["Aggression is plan.", "Death over target.", "Cummins is key.", "Pace attack SRH."],
      comeback: ["SRH wapas aayega!", "Batting power hai.", "Hyderabad roars!", "Orange never says die!"],
    },
  },

  KKR: {
    six_bat: {
      hype:     ["Korbo lorbo jeetbo!", "Kolkata ka pyaar!", "Purple army fires!", "Mystery magic!", "KKR power!"],
      gali:     ["Bowler kahan gaya?", "Stadium baahar gaya!", "Uda diya yaar!", "Kya tha bowler?"],
      tactical: ["Narine strategy tha.", "Spin-heavy game plan.", "Smart hit tha.", "Right length target."],
      comeback: ["Ek baar KKR!", "Kolkata nahi hare!", "Purple power!", "KKR itihas hai!"],
    },
    four_bat: {
      hype:     ["Korbo lorbo!", "KKR boundary!", "Kolkata magic hai!", "Purple army!", "Kolkata roars!"],
      gali:     ["Bowler phir gaya!", "Gap se nikal gaya!", "Nahi ruka gend!"],
      tactical: ["Field exploit tha.", "Gap dekha sahi.", "Smart KKR hit.", "Angle use kiya."],
      comeback: ["KKR comeback!", "Kolkata ek hai.", "Purple power strong.", "Ek baar KKR."],
    },
    wicket_lost: {
      hype:     ["Next KKR hero!", "Depth hai hamari!", "KKR bounce back!"],
      gali:     ["Kya tha yaar?", "Aisa mat karo!", "Ajeeb shot tha!", "Kya kar diya?"],
      tactical: ["Mystery spin respect.", "Read the googly.", "Rotation pe dhyan.", "Set before hitting."],
      comeback: ["KKR kabhi nahi!", "Ek baar KKR!", "Fight back karo!", "Purple spirit!"],
    },
    wicket_taken: {
      hype:     ["Mystery spinner hits!", "Korbo lorbo!", "Varun ka jadoo!", "Ukhad diya!", "KKR bowling!"],
      gali:     ["Chalo ghar jao!", "Samjhe nahi kuch!", "Bye bye!", "Bag pack karo!"],
      tactical: ["Mystery delivery tha.", "Perfect field setting.", "Spin trap set.", "Plan execute tha."],
      comeback: ["KKR pressure banao.", "More wickets now.", "Spin tighten kar."],
    },
    dot_bat: {
      hype:     ["Next ball hit!", "Building kar.", "Set karke maro."],
      gali:     ["Maar na bhai!", "Kya chal raha?", "Rotate karo!", "Strike rate kahan?"],
      tactical: ["Spin se bachna.", "Rotate karo please.", "Read the field.", "Don't give dot."],
      comeback: ["KKR maange more.", "Watch the assault.", "Purple army fires.", "Varun ke baad?"],
    },
    opp_six: {
      hype:     ["Varun fix karega!", "Tight bowling next!", "Mystery trap set!"],
      gali:     ["Field set nahi?", "Bowler kahan tha?", "Kya bowling tha?", "Ugh!"],
      tactical: ["Varun lao please.", "Mystery spinner lao.", "Field change kar.", "Plan B hai."],
      comeback: ["KKR jeetega.", "Spin trap aayega.", "Korbo lorbo jeetbo.", "Purple answers back!"],
    },
    noball: {
      hype:     ["Free hit hai!"],
      gali:     ["Fixing? Gadhe!", "Laaparvahi!"],
      tactical: ["Full hit opportunity."],
      comeback: ["KKR lega faayda."],
    },
    wide_bat: {
      hype:     ["Extra run!"],
      gali:     ["Gully cricket!", "Kahan fek!"],
      tactical: ["Extra adds up."],
      comeback: ["KKR jeetega!"],
    },
    general: {
      hype:     ["Korbo lorbo jeetbo!", "Purple power!", "Kolkata magic!", "KKR forever!", "Mystery rocks!"],
      gali:     ["Spin se phansenge!", "Mystery hai tujhpe.", "Sochke aao!", "Googly ready hai!"],
      tactical: ["Tactical cricket KKR.", "Spin-heavy plan.", "Narine is key.", "Smart field setting."],
      comeback: ["Ek baar KKR!", "Kolkata spirit!", "Nahi haarge kabhi!", "Purple army always!"],
    },
  },

  DC: {
    six_bat: {
      hype:     ["Dilli se hoon!", "Dilli Power baby!", "System hang kiya!", "Roar macha!", "Delhi capital!"],
      gali:     ["Bowler kahan tha?", "Stadium baahar!", "Uda diya gend!", "Fielder soya tha!"],
      tactical: ["Axar plan tha.", "Powerplay target.", "Capital aggression!", "Kuldeep setup tha."],
      comeback: ["Dilli kabhi nahi!", "Capital comeback!", "Roar macha denge!", "Dilli wapas aayega!"],
    },
    four_bat: {
      hype:     ["Dilli boundary!", "Capital timing!", "Roar macha!", "DC power!", "Delhi on fire!"],
      gali:     ["Field kahan tha?", "Bowler phir gaya!", "Nahi ruk sakta!"],
      tactical: ["Gap dekh liya.", "Smart cricket DC.", "Angle exploit tha.", "Good shot selection."],
      comeback: ["DC comeback!", "Dilli wapas aayega.", "Capital spirit!", "We fight always."],
    },
    wicket_lost: {
      hype:     ["Next dilli hero!", "Depth hai!", "Bounce back DC!"],
      gali:     ["Arrey kya tha?", "Aisa shot nahi!", "Nahi chahiye tha!", "BC kya kiya?"],
      tactical: ["Respect that ball.", "Read the line.", "Set before power.", "Rotation karo please."],
      comeback: ["Dilli kabhi nahi!", "Abhi game baaki!", "Capital spirit hai!", "Roar macha denge!"],
    },
    wicket_taken: {
      hype:     ["Dilli ne kiya!", "Capital bowling!", "Ukhad diya!", "DC strikes!", "Kuldeep magic!"],
      gali:     ["Wapis jao beta!", "Bag pack karo!", "Bye bye!", "Lesson hua tujhe!"],
      tactical: ["Kuldeep plan tha.", "Field was set.", "Swing worked perfectly.", "Length was right."],
      comeback: ["DC pressure banao.", "More wickets now.", "Capital tighten kar."],
    },
    dot_bat: {
      hype:     ["Next ball hit!", "Build kar DC.", "Set karke maro."],
      gali:     ["Maar na yaar!", "BC maaro thoda!", "Strike rate?", "Kya kar raha?"],
      tactical: ["Rotate the strike.", "Find the gaps.", "Read the spin.", "Don't give dot."],
      comeback: ["DC bounce back.", "Dilli fight karta!", "Capital wapas.", "We never quit."],
    },
    opp_six: {
      hype:     ["Kuldeep fix karega!", "Tight bowling next!", "DC fight karega!"],
      gali:     ["Field set nahi?", "Bowler kahan tha?", "Kya bowling tha?", "Fielder soya!"],
      tactical: ["Kuldeep lao please.", "Change the plan.", "Yorker try karo.", "Field change kar."],
      comeback: ["DC jeetega!", "Capital answer dega.", "Dilli se hoon.", "We fight back!"],
    },
    noball: {
      hype:     ["Free hit DC!"],
      gali:     ["Fixing? Gadhe!", "Laaparvahi!"],
      tactical: ["Full toss lao."],
      comeback: ["DC lega faayda."],
    },
    wide_bat: {
      hype:     ["Extra run!"],
      gali:     ["Kahan fek raha?", "Gully cricket!"],
      tactical: ["Extra adds up."],
      comeback: ["Dilli jeetega!"],
    },
    general: {
      hype:     ["Dilli Power!", "Capital city rules!", "System hang kiya!", "Roar macha!", "DC on fire!"],
      gali:     ["Kya samjhe ho?", "Ye Dilli hai!", "BC maza aaya?", "Dilli se daaro!"],
      tactical: ["Smart cricket.", "Powerplay focus.", "Kuldeep is key.", "Death over plan."],
      comeback: ["Dilli se hoon!", "Capital comeback!", "Never say never!", "Roar macha denge!"],
    },
  },

  PBKS: {
    six_bat: {
      hype:     ["Sher Punjab de!", "Punjab da sher!", "Punj bahar aaya!", "PBKS fires!", "Kirra shot!"],
      gali:     ["Bowler kahan tha?", "Stadium baahar!", "Uda diya gend!", "Wah Punjab wah!"],
      tactical: ["Arshdeep plan.", "Death over focus.", "Punjab aggression plan.", "Right zone target."],
      comeback: ["Sher Punjab de!", "Punjab wapas!", "North India ours!", "Punjab never quits!"],
    },
    four_bat: {
      hype:     ["Punjab boundary!", "Sher Punjab!", "PBKS timing!", "Punjab fires!", "North India best!"],
      gali:     ["Bowler phir gaya!", "Field kahan tha?", "Nahi ruk sakta!"],
      tactical: ["Good gap find.", "Right length hai.", "Angle exploit tha.", "Smart Punjab shot."],
      comeback: ["Punjab comeback!", "Sher aayega.", "North India pride.", "We fight!"],
    },
    wicket_lost: {
      hype:     ["Next Punjab hero!", "Depth hai!"],
      gali:     ["Arrey kya tha?", "Aisa mat karo!", "Kya hua be?", "Wrong shot tha!"],
      tactical: ["Respect that spell.", "Read the ball.", "Set before power.", "Rotate karo please."],
      comeback: ["Naseeb hi kharab!", "Bottlers? Never!", "Punjab fight karta!", "Sher wapas aayega!"],
    },
    wicket_taken: {
      hype:     ["Arshdeep ne kiya!", "Punjab bowling!", "Ukhad diya!", "PBKS power!", "Sher Punjab!"],
      gali:     ["Chalo ghar jao!", "Bye bye!", "Bag pack karo!"],
      tactical: ["Swing plan tha.", "Field was set.", "Length perfect tha.", "Plan execute tha."],
      comeback: ["PBKS pressure banao.", "More wickets needed.", "Punjab tighten kar."],
    },
    dot_bat: {
      hype:     ["Next ball maro!", "Build kar PBKS."],
      gali:     ["Maar na yaar!", "Kya chal raha?", "Punjab itna slow?", "Strike rate?"],
      tactical: ["Rotate the strike.", "Find the gaps.", "Read the spin.", "Don't give dot."],
      comeback: ["Punjab manega.", "Watch the power.", "Sher wapas aayega.", "We never quit."],
    },
    opp_six: {
      hype:     ["Arshdeep fix karega!", "Tight bowling next!", "Punjab fight karega!"],
      gali:     ["Field set nahi?", "Bowler kahan tha?", "Kya bowling tha?", "Fielder soya!"],
      tactical: ["Arshdeep lao please.", "Change the plan.", "Yorker try karo.", "Field change kar."],
      comeback: ["Punjab jeetega!", "Sher Punjab de.", "Dil bada hai!", "2025 ka champion?"],
    },
    noball: {
      hype:     ["Free hit!"],
      gali:     ["Fixing? Gadhe!", "Laaparvahi!"],
      tactical: ["Full toss lao."],
      comeback: ["PBKS lega faayda."],
    },
    wide_bat: {
      hype:     ["Extra run!"],
      gali:     ["Gully cricket!", "Kahan fek!"],
      tactical: ["Extra adds up."],
      comeback: ["PBKS jeetega!"],
    },
    general: {
      hype:     ["Sher Punjab de!", "Punjab da pride!", "PBKS power!", "North India best!", "Kirra cricket!"],
      gali:     ["Inse umeed bekar!", "Naseeb hi kharab!", "Bottlers forever?", "Phir se?"],
      tactical: ["Arshdeep is key.", "Death overs focus.", "Smart batting PBKS.", "Field reading crucial."],
      comeback: ["2025 ka champion?", "Dil bada hai!", "Punjab never quits!", "Sher Punjab de!"],
    },
  },

  GT: {
    six_bat: {
      hype:     ["Gujarat ka jadoo!", "Gill ne kiya!", "Disciplined cricket!", "GT power!", "Ahmedabad fires!"],
      gali:     ["Bowler kahan tha?", "Stadium baahar!", "Uda diya!", "Kya fielding tha?"],
      tactical: ["Rashid setup tha.", "Powerplay target.", "Disciplined approach.", "Right zone target."],
      comeback: ["GT jeetega!", "Disciplined comeback!", "Gill shines always!", "GT itihas hai!"],
    },
    four_bat: {
      hype:     ["Gujarat boundary!", "GT timing!", "Gill class hai!", "GT on fire!", "Rashid support!"],
      gali:     ["Bowler phir gaya!", "Field kahan tha?", "Nahi ruk sakta!"],
      tactical: ["Good gap find.", "Smart cricket GT.", "Angle use kiya.", "Right shot selection."],
      comeback: ["GT comeback!", "Picture abhi baaki.", "Gill carries on.", "GT spirit strong."],
    },
    wicket_lost: {
      hype:     ["Next GT hero!", "Depth hai!", "Bounce back GT!"],
      gali:     ["Kya tha yaar?", "Aisa shot nahi!", "Arrey yaar!", "Wrong shot tha!"],
      tactical: ["Respect that spell.", "Read the pitch.", "Set before hitting.", "Rotation karo please."],
      comeback: ["Picture abhi baaki!", "GT kabhi nahi!", "Comeback karenge!", "Gill still here!"],
    },
    wicket_taken: {
      hype:     ["Rashid ka jadoo!", "GT bowling!", "Ukhad diya!", "Mystery spinner!", "Ahmedabad wins!"],
      gali:     ["Wapis jao beta!", "Googly mein phas!", "Bye bye!", "Bag pack karo!"],
      tactical: ["Rashid plan tha.", "Field was perfect.", "Length was right.", "Googly trap set."],
      comeback: ["GT pressure banao.", "More wickets now.", "Rashid continues."],
    },
    dot_bat: {
      hype:     ["Building pressure.", "Next ball maro.", "Set karke maro."],
      gali:     ["Maar na yaar!", "Kya chal raha?", "GT itna slow?", "Strike rate?"],
      tactical: ["Rotate karo please.", "Read the field.", "Spin se bachna.", "Don't give dot."],
      comeback: ["GT jeetega.", "Discipline works.", "Rashid aayega.", "Trust the process."],
    },
    opp_six: {
      hype:     ["Rashid fix karega!", "Tight bowling next!", "GT fight karega!"],
      gali:     ["Field set nahi?", "Bowler kahan tha?", "Kya bowling tha?", "Plan B?"],
      tactical: ["Rashid lao please.", "Mystery spinner lao.", "Field change kar.", "Length change karo."],
      comeback: ["GT jeetega!", "Rashid ka plan.", "Disciplined wapas aayenge.", "Jalne walo jalegi!"],
    },
    noball: {
      hype:     ["Free hit!"],
      gali:     ["Fixing? Gadhe!"],
      tactical: ["Full toss lao."],
      comeback: ["GT lega faayda."],
    },
    wide_bat: {
      hype:     ["Extra run!"],
      gali:     ["Gully cricket!", "Kahan fek!"],
      tactical: ["Extra adds up."],
      comeback: ["GT jeetega!"],
    },
    general: {
      hype:     ["GT disciplined cricket!", "Rashid magic!", "Gill future hai!", "Gujarat power!", "Ahmedabad shines!"],
      gali:     ["Jalne walo ki?", "Jeet toh rahe!", "Trophy yaad hai?", "Rashid aayega!"],
      tactical: ["Calculated cricket.", "Rashid is key.", "Smart batting GT.", "Death over plan."],
      comeback: ["Jalne walo jalegi!", "Jeet toh rahe hain.", "Picture abhi baaki!", "GT never gives up!"],
    },
  },

  RR: {
    six_bat: {
      hype:     ["Hawa mein uda!", "Royal style hit!", "Rajputana power!", "RR fires!", "Pink army!"],
      gali:     ["Bowler kahan tha?", "Stadium baahar!", "Uda diya!", "Kya fielding tha?"],
      tactical: ["Jaiswal setup tha.", "Powerplay target.", "Royals aggression!", "Right length target."],
      comeback: ["Royals bounce back!", "Rajputana spirit!", "Jeet toh rahe!", "RR forever!"],
    },
    four_bat: {
      hype:     ["Royal boundary!", "RR timing!", "Jaiswal class!", "Pink army fires!", "Royals on fire!"],
      gali:     ["Bowler phir gaya!", "Field kahan gaya?", "Nahi ruk sakta!"],
      tactical: ["Good gap find.", "Smart Royal shot.", "Angle use kiya.", "Field exploit tha."],
      comeback: ["RR comeback!", "Royals spirit!", "Pink army always.", "Rajputana fights."],
    },
    wicket_lost: {
      hype:     ["Next Royal hero!", "Depth hai!", "Bounce back RR!"],
      gali:     ["Arrey kya tha?", "Aisa shot nahi!", "Kya hua yaar!", "Wrong shot tha!"],
      tactical: ["Respect that spell.", "Read the spin.", "Set before power.", "Rotation karo please."],
      comeback: ["Royals kabhi nahi!", "Rajputana spirit!", "Abhi game baaki!", "Pink army strong!"],
    },
    wicket_taken: {
      hype:     ["Archer ne kiya!", "RR bowling!", "Ukhad diya!", "Royals power!", "Jofra magic!"],
      gali:     ["Chalo ghar jao!", "Bye bye!", "Bag pack karo!"],
      tactical: ["Swing plan tha.", "Field was right.", "Length perfect tha.", "Plan execute tha."],
      comeback: ["RR pressure banao.", "More wickets needed.", "Royals tighten."],
    },
    dot_bat: {
      hype:     ["Building kar!", "Next ball maro.", "Set karke maro."],
      gali:     ["Maar na bhai!", "Kya chal raha?", "Strike rate?", "Single bhi lo!"],
      tactical: ["Rotate the strike.", "Find the gaps.", "Read the line.", "Don't give dot."],
      comeback: ["RR jeetega.", "Royals maange more.", "Pink power wapas.", "We bounce back."],
    },
    opp_six: {
      hype:     ["Archer fix karega!", "Tight bowling next!", "RR fight karega!"],
      gali:     ["Field set nahi?", "Bowler kahan tha?", "Kya bowling tha?"],
      tactical: ["Archer lao please.", "Change the length.", "Yorker try karo.", "Field change kar."],
      comeback: ["RR jeetega!", "Royals answer back.", "Rajputana spirit.", "Jeet toh rahe hain."],
    },
    noball: {
      hype:     ["Free hit!"],
      gali:     ["Fixing? Gadhe!"],
      tactical: ["Full toss lao."],
      comeback: ["RR lega faayda."],
    },
    wide_bat: {
      hype:     ["Extra run!"],
      gali:     ["Gully cricket!", "Kahan fek!"],
      tactical: ["Extra adds up."],
      comeback: ["RR jeetega!"],
    },
    general: {
      hype:     ["Rajputana power!", "Royals forever!", "Hawa mein uda!", "Pink army!", "Jaipur roars!"],
      gali:     ["Jalne walo ki?", "Hawa nikal jayegi.", "Rajputana aayega.", "Pink scares!"],
      tactical: ["Spin is key.", "Death overs focus.", "Smart cricket RR.", "Archer is weapon."],
      comeback: ["Jeet toh rahe!", "Royals comeback!", "Rajputana spirit!", "Pink army always!"],
    },
  },

  LSG: {
    six_bat: {
      hype:     ["Lucknow roar!", "Nawabi power!", "Pant ne kiya!", "LSG fires!", "UP pride!"],
      gali:     ["Bowler kahan tha?", "Stadium baahar!", "Uda diya!", "Fielder soya tha!"],
      tactical: ["Death over target.", "Powerplay focus.", "Pant aggression!", "Right zone target."],
      comeback: ["LSG comeback!", "UP wapas aayega!", "Nawabi style!", "LSG never quits!"],
    },
    four_bat: {
      hype:     ["Lucknow boundary!", "Nawabi timing!", "LSG power!", "Pant touch hai!", "UP on fire!"],
      gali:     ["Bowler phir gaya!", "Field kahan gaya?", "Nahi ruk sakta!"],
      tactical: ["Good gap find.", "Smart LSG hit.", "Angle use kiya.", "Field exploit tha."],
      comeback: ["LSG comeback!", "Nawabi style.", "UP spirit.", "We keep going."],
    },
    wicket_lost: {
      hype:     ["Next LSG hero!", "Depth hai!", "Bounce back LSG!"],
      gali:     ["Kya tha yaar?", "Aisa shot nahi!", "Wrong shot tha!", "Arrey yaar!"],
      tactical: ["Respect that spell.", "Read the pitch.", "Set before power.", "Rotation karo."],
      comeback: ["Adab se hara?", "LSG wapas aayega!", "Abhi game baaki!", "Nawabi fights back."],
    },
    wicket_taken: {
      hype:     ["Shami ne kiya!", "LSG bowling!", "Ukhad diya!", "Mayank fires!", "LSG wins!"],
      gali:     ["Chalo ghar jao!", "Bye bye!", "Bag pack karo!", "Wapis jao!"],
      tactical: ["Pace plan tha.", "Field was set.", "Length perfect tha.", "Shami plan worked."],
      comeback: ["LSG pressure banao.", "More wickets needed.", "Keep tightening."],
    },
    dot_bat: {
      hype:     ["Next ball maro!", "Build kar LSG."],
      gali:     ["Maar na yaar!", "Adab se hara?", "Strike rate check!", "Boring cricket band!"],
      tactical: ["Rotate karo please.", "Find the gaps.", "Read the field.", "Don't give dot."],
      comeback: ["LSG jeetega.", "Nawab waits.", "Watch the power.", "We answer back."],
    },
    opp_six: {
      hype:     ["Shami fix karega!", "Tight bowling next!", "LSG fight karega!"],
      gali:     ["Field set nahi?", "Bowler kahan tha?", "Kya bowling tha?"],
      tactical: ["Shami lao please.", "Change the plan.", "Yorker try karo.", "Field change kar."],
      comeback: ["LSG jeetega!", "Nawabi answer dega.", "UP spirit strong.", "We bounce back!"],
    },
    noball: {
      hype:     ["Free hit!"],
      gali:     ["Fixing? Gadhe!"],
      tactical: ["Full toss opportunity."],
      comeback: ["LSG lega faayda."],
    },
    wide_bat: {
      hype:     ["Extra run!"],
      gali:     ["Gully cricket!", "Kahan fek!"],
      tactical: ["Extra adds up."],
      comeback: ["LSG jeetega!"],
    },
    general: {
      hype:     ["Nawabi power!", "Lucknow roars!", "Pant fired!", "LSG pride!", "UP on top!"],
      gali:     ["Adab se hara?", "Boring cricket band!", "Strike rate check!", "Kya chal raha?"],
      tactical: ["Pace attack focus.", "Smart cricket LSG.", "Pant is key.", "Death over plan."],
      comeback: ["LSG comeback!", "Nawabi spirit!", "UP wapas aayega!", "Pant ka plan!"],
    },
  },
};

// ─────────────────────────────────────────────
// DROPPED CATCH  (universal — very specific gali)
// ─────────────────────────────────────────────
const DROP_CATCH_GALI = [
  "Haath mein makkhan?",
  "Saala catch ya laddo?",
  "Ghar jao panauti!",
  "Match gaya yaar!",
  "Ugh, dropped again!",
  "Haath toot gaye?",
  "Butter-fingers nikal!",
  "Toddler better pkdega!",
  "Kitna easy tha!",
  "Net pe ja wapas!",
];
const DROP_CATCH_TACTICAL = [
  "Concentration chahiye.",
  "Next chance pakdo.",
  "Keep eyes on ball.",
  "Hands should follow.",
];

// ─────────────────────────────────────────────
// UMPIRE ERROR  (universal)
// ─────────────────────────────────────────────
const UMPIRE_GALI = [
  "Chashma pehan le!",
  "Andha kanoon!",
  "Paisa kahan khaya?",
  "DRS lo please!",
];

// ─────────────────────────────────────────────
// SLOW STRIKE RATE  (death overs pressure)
// ─────────────────────────────────────────────
const DEATH_PRESSURE_GALI = [
  "Maar na bhai!",
  "Test match band kar!",
  "Strike rate kahan hai?",
  "Kya time waste hai!",
  "Bowler ki mercy mat le!",
  "Pagal ho gaya?",
  "Seed pita hai kya?",
  "Kya lete ho wahan?",
  "Rotate toh karo!",
  "Ghanta batting hai!",
  "Sambhal ke maar bhai!",
  "Doosra strike pe jao!",
];

// ─────────────────────────────────────────────
// Item 1: OPPONENT TEAM SPECIFIC TAUNTS
// Used when opponent is doing well (opp six, wicket taken from my team)
// ─────────────────────────────────────────────
const OPP_TEAM_TAUNTS: Record<TeamId, string[]> = {
  RCB: ["17 saal ek cup!", "Ee sala? Haha!", "Calculator phekh doge!", "Bengaluru toh royega!", "Kohli bhi nahi!"],
  CSK: ["Budhde retire karo!", "Whistle podu hai?", "Chennai kya karoge?", "5 trophy 20 saal!", "Age nahi hai!"],
  MI: ["Ambani paisa hai?", "Flatpitch cricket bas!", "Rohit retire ho!", "Slow start bhaad mein!", "Paisa power hai?"],
  KKR: ["Korbo lorbo losbo!", "Kolkata spin gaya!", "Eden mein royenge!", "Purple? Pagal?", "KKR ek season?"],
  SRH: ["250 kab bana?", "Hyderabad gaya kaam!", "Flat pitch dhundho!", "Head bhi nahi!", "SRH demolition loading!"],
  GT: ["Naya team hai!", "Rashid bhi hara!", "Gujarat jaldi jao!", "Newcomer ko pata!", "Youth team hai bas!"],
  DC: ["Kabhi jeetoge?", "Semifinals rona!", "Dilli dabba tha!", "Never won yaar!", "Axar bhi nahi!"],
  RR: ["Royals kya?", "2008 se kya kiya?", "Buttler gaya toh?", "Pink city pink ho!", "Jaipur mein royenge!"],
  PBKS: ["Punjab trophy kab?", "Sher Punjab daanta!", "PBKS = ek loss!", "Mohali ka hall!", "Trophy kabhi nahi!"],
  LSG: ["Nawab nahi yaar!", "Pant bhi jayega!", "Lucknow zyada nahi!", "LSG bye bye!", "UP cricket alag!"],
};

// ─────────────────────────────────────────────
// Item 1: FRUSTRATED OPPONENT GOOD BALL (when opp bowler clean bowled etc.)
// ─────────────────────────────────────────────
const OPPONENT_GOOD_BOWL_GALI = [
  "Kya bowling tha yaar?",
  "Abhi kaun rokega?",
  "Tera bowler lucky!",
  "Lucky wicket mila!",
  "Full toss thi nahi?",
  "Ball ki line thi?",
  "Padosi zyada khelta!",
  "Naseeb se liya!",
];

// ─────────────────────────────────────────────
// MAIN EXPORT — getBanterPicks
// ─────────────────────────────────────────────
export function getBanterPicks(
  ctx: BanterContext,
  lastChosen: string | null
): string[] {
  const { userTeam, battingTeam, bowlingTeam, striker, bowler,
          lastBallResult, overs, wickets, runs, target, innings } = ctx;

  const phase = getPhase(overs);
  const gameState = getGameState(ctx);
  const isMyTeamBatting = battingTeam ? userTeam === battingTeam : true;
  const rivalryActive = isRivalry(battingTeam, bowlingTeam);
  const crunchOrDeath = phase === "death" || gameState === "crunch";
  const teamData = TEAM_BANTER[userTeam];

  // ── select event bucket ──────────────────────────────────
  let bucket: BanterSet;
  switch (lastBallResult) {
    case "six":
      bucket = isMyTeamBatting ? teamData.six_bat : teamData.opp_six;
      break;
    case "four":
      bucket = isMyTeamBatting ? teamData.four_bat : teamData.opp_six; // reuse opp_six for mild frustration
      break;
    case "wicket":
      bucket = isMyTeamBatting ? teamData.wicket_lost : teamData.wicket_taken;
      break;
    case "dot":
      if (isMyTeamBatting) {
        bucket = crunchOrDeath
          ? { ...teamData.dot_bat, gali: DEATH_PRESSURE_GALI }
          : teamData.dot_bat;
      } else {
        // Opponent played dot — I'm happy
        bucket = {
          hype:     teamData.wicket_taken.hype,
          gali:     ["Batsman kya kar?", "Koi shot nahi?", "Chalo rotate karo."],
          tactical: teamData.dot_bat.tactical,
          comeback: teamData.general.comeback,
        };
      }
      break;
    case "wide":
      if (isMyTeamBatting) {
        bucket = teamData.wide_bat;
      } else {
        bucket = {
          hype:     ["Pressure mein hai!", "Free run milaa!"],
          gali:     ["Kahan fek raha?", "Gully cricket khel!", "Band kar bowling!", "3 wide ban gaye!"],
          tactical: ["Line pe dhyan.", "Control karo delivery.", "Width mat do."],
          comeback: teamData.general.comeback,
        };
      }
      break;
    case "noball":
      bucket = teamData.noball;
      break;
    default:
      bucket = teamData.general;
  }

  // ── HYPE pick ────────────────────────────────────────────
  let hype: string;
  if (lastBallResult === "six" && isMyTeamBatting && striker && PLAYER_HYPE[striker]) {
    hype = pickExcluding(PLAYER_HYPE[striker], lastChosen);
  } else if (lastBallResult === "wicket" && !isMyTeamBatting && bowler && PLAYER_BOWL_HYPE[bowler]) {
    hype = pickExcluding(PLAYER_BOWL_HYPE[bowler], lastChosen);
  } else {
    hype = pickExcluding(bucket.hype, lastChosen);
  }

  // ── GALI pick  (spicier in rivalry + death overs + opp taunts) ────────
  let gali: string;
  const rivalryKey = getRivalryKey(battingTeam, bowlingTeam);
  // Determine opposing team (for item 1: opponent-specific taunts)
  const opposingTeam: TeamId | null = isMyTeamBatting ? bowlingTeam : battingTeam;

  if (rivalryActive && rivalryKey && crunchOrDeath &&
      RIVALRY_TRASH[rivalryKey]?.[userTeam]) {
    gali = pickExcluding(RIVALRY_TRASH[rivalryKey][userTeam], lastChosen);
  } else if (rivalryActive && rivalryKey &&
             RIVALRY_TRASH[rivalryKey]?.[userTeam] && Math.random() > 0.45) {
    gali = pickExcluding(RIVALRY_TRASH[rivalryKey][userTeam], lastChosen);
  } else if (lastBallResult === "noball" || lastBallResult === "wide") {
    gali = pickExcluding([...bucket.gali, ...DROP_CATCH_GALI.slice(0, 2)], lastChosen);
  } else if (
    // Item 1: when opponent hits six or takes my team's wicket, inject team-specific taunt
    (!isMyTeamBatting && lastBallResult === "six" && opposingTeam && OPP_TEAM_TAUNTS[opposingTeam] && Math.random() < 0.45) ||
    (isMyTeamBatting && lastBallResult === "wicket" && opposingTeam && OPP_TEAM_TAUNTS[opposingTeam] && Math.random() < 0.35)
  ) {
    gali = pickExcluding(OPP_TEAM_TAUNTS[opposingTeam!], lastChosen);
  } else if (
    // Item 1: opponent bowler doing well — frustrated gali
    isMyTeamBatting && lastBallResult === "dot" && phase === "death" && Math.random() < 0.3
  ) {
    gali = pickExcluding([...bucket.gali, ...OPPONENT_GOOD_BOWL_GALI], lastChosen);
  } else {
    gali = pickExcluding(bucket.gali, lastChosen);
  }

  // ── TACTICAL pick ────────────────────────────────────────
  const tactical = pickExcluding(bucket.tactical, lastChosen);

  // ── COMEBACK/DEFENSIVE pick ──────────────────────────────
  let comeback: string;
  if (gameState === "blown") {
    // National pride shield
    comeback = pickExcluding(NATIONAL_COMEBACKS, lastChosen);
  } else if (rivalryActive && rivalryKey &&
             RIVALRY_TRASH[rivalryKey]?.[userTeam] && Math.random() > 0.5) {
    comeback = pickExcluding(RIVALRY_TRASH[rivalryKey][userTeam], lastChosen);
  } else {
    comeback = pickExcluding(bucket.comeback, lastChosen);
  }

  return [hype, gali, tactical, comeback];
}
