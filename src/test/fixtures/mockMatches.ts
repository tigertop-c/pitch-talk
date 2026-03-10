import type { CricApiMatch } from "@/hooks/useCricketMatches";

// IPL 2026 mock matches for local development and testing.
// Enable with VITE_USE_MOCK_DATA=true in your .env.local
//
// Covers:
//   - 1 live match (matchStarted: true, matchEnded: false, bbbEnabled: true)
//   - 3 upcoming fixtures
//   - 1 recently ended match (filtered out by useCricketMatches)
//
// All team shortnames map to local logos via TEAM_LOGO_MAP in GamePicker.tsx

const NOW = new Date();
const inHours = (h: number) => new Date(NOW.getTime() + h * 60 * 60 * 1000).toISOString().replace(".000Z", "");
const inDays = (d: number) => inHours(d * 24);

export const MOCK_MATCHES: CricApiMatch[] = [
  // ─── LIVE ──────────────────────────────────────────────────────────────────
  {
    id: "mock-ipl-001-mi-csk",
    name: "Mumbai Indians vs Chennai Super Kings, Match 1, IPL 2026",
    matchType: "t20",
    status: "Mumbai Indians won the toss and elected to bat",
    venue: "Wankhede Stadium, Mumbai",
    date: NOW.toISOString().slice(0, 10),
    dateTimeGMT: inHours(-1), // started 1 hour ago
    teams: ["Mumbai Indians", "Chennai Super Kings"],
    teamInfo: [
      { name: "Mumbai Indians", shortname: "MI", img: "" },
      { name: "Chennai Super Kings", shortname: "CSK", img: "" },
    ],
    score: [
      { r: 87, w: 2, o: 9.4, inning: "Mumbai Indians Inning 1" },
    ],
    series_id: "mock-ipl-2026-series",
    fantasyEnabled: true,
    bbbEnabled: true,
    hasSquad: true,
    matchStarted: true,
    matchEnded: false,
  },

  // ─── UPCOMING ──────────────────────────────────────────────────────────────
  {
    id: "mock-ipl-002-rcb-kkr",
    name: "Royal Challengers Bengaluru vs Kolkata Knight Riders, Match 2, IPL 2026",
    matchType: "t20",
    status: "Match starts at 19:30 IST",
    venue: "M. Chinnaswamy Stadium, Bengaluru",
    date: inDays(1).slice(0, 10),
    dateTimeGMT: inDays(1),
    teams: ["Royal Challengers Bengaluru", "Kolkata Knight Riders"],
    teamInfo: [
      { name: "Royal Challengers Bengaluru", shortname: "RCB", img: "" },
      { name: "Kolkata Knight Riders", shortname: "KKR", img: "" },
    ],
    score: [],
    series_id: "mock-ipl-2026-series",
    fantasyEnabled: true,
    bbbEnabled: false,
    hasSquad: true,
    matchStarted: false,
    matchEnded: false,
  },
  {
    id: "mock-ipl-003-srh-dc",
    name: "Sunrisers Hyderabad vs Delhi Capitals, Match 3, IPL 2026",
    matchType: "t20",
    status: "Match starts at 15:30 IST",
    venue: "Rajiv Gandhi Intl Stadium, Hyderabad",
    date: inDays(2).slice(0, 10),
    dateTimeGMT: inDays(2),
    teams: ["Sunrisers Hyderabad", "Delhi Capitals"],
    teamInfo: [
      { name: "Sunrisers Hyderabad", shortname: "SRH", img: "" },
      { name: "Delhi Capitals", shortname: "DC", img: "" },
    ],
    score: [],
    series_id: "mock-ipl-2026-series",
    fantasyEnabled: true,
    bbbEnabled: false,
    hasSquad: true,
    matchStarted: false,
    matchEnded: false,
  },
  {
    id: "mock-ipl-004-rr-gt",
    name: "Rajasthan Royals vs Gujarat Titans, Match 4, IPL 2026",
    matchType: "t20",
    status: "Match starts at 19:30 IST",
    venue: "Sawai Mansingh Stadium, Jaipur",
    date: inDays(3).slice(0, 10),
    dateTimeGMT: inDays(3),
    teams: ["Rajasthan Royals", "Gujarat Titans"],
    teamInfo: [
      { name: "Rajasthan Royals", shortname: "RR", img: "" },
      { name: "Gujarat Titans", shortname: "GT", img: "" },
    ],
    score: [],
    series_id: "mock-ipl-2026-series",
    fantasyEnabled: true,
    bbbEnabled: false,
    hasSquad: true,
    matchStarted: false,
    matchEnded: false,
  },

  // ─── ENDED (should be filtered out by useCricketMatches) ───────────────────
  {
    id: "mock-ipl-000-lsg-pbks",
    name: "Lucknow Super Giants vs Punjab Kings, Match 0, IPL 2026",
    matchType: "t20",
    status: "Lucknow Super Giants won by 24 runs",
    venue: "Ekana Cricket Stadium, Lucknow",
    date: inDays(-1).slice(0, 10),
    dateTimeGMT: inDays(-1),
    teams: ["Lucknow Super Giants", "Punjab Kings"],
    teamInfo: [
      { name: "Lucknow Super Giants", shortname: "LSG", img: "" },
      { name: "Punjab Kings", shortname: "PBKS", img: "" },
    ],
    score: [
      { r: 184, w: 6, o: 20, inning: "Lucknow Super Giants Inning 1" },
      { r: 160, w: 10, o: 19.2, inning: "Punjab Kings Inning 1" },
    ],
    series_id: "mock-ipl-2026-series",
    fantasyEnabled: true,
    bbbEnabled: false,
    hasSquad: true,
    matchStarted: true,
    matchEnded: true,
  },
];

export const MOCK_API_RESPONSE = {
  apikey: "mock-key",
  data: MOCK_MATCHES,
  status: "success" as const,
  info: {
    hitsToday: 1,
    hitsUsed: 1,
    hitsLimit: 2000,
    credits: 0,
    server: 0,
    offsetRows: MOCK_MATCHES.length,
    totalRows: MOCK_MATCHES.length,
    queryTime: 0,
    s: 0,
    cache: 0,
  },
};
