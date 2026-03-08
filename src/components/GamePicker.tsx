import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, ChevronRight, Users, Zap, Wifi, WifiOff } from "lucide-react";
import { useCricketMatches, type CricApiMatch } from "@/hooks/useCricketMatches";
import { Skeleton } from "@/components/ui/skeleton";
import cskLogo from "@/assets/teams/csk.png";
import dcLogo from "@/assets/teams/dc.png";
import gtLogo from "@/assets/teams/gt.png";
import kkrLogo from "@/assets/teams/kkr.png";
import lsgLogo from "@/assets/teams/lsg.png";
import miLogo from "@/assets/teams/mi.png";
import pbksLogo from "@/assets/teams/pbks.png";
import rrLogo from "@/assets/teams/rr.png";
import rcbLogo from "@/assets/teams/rcb.png";
import srhLogo from "@/assets/teams/srh.png";

export interface UpcomingMatch {
  id: string;
  team1: { name: string; short: string; logo: string };
  team2: { name: string; short: string; logo: string };
  startTime: Date;
  venue: string;
  matchNumber: number;
  liveRooms: number;
  isSimulation?: boolean;
  status?: string;
}

const spring = { type: "spring" as const, damping: 25, stiffness: 350 };

// Map team names/shortnames to local logos
const TEAM_LOGO_MAP: Record<string, string> = {
  csk: cskLogo, "chennai super kings": cskLogo,
  dc: dcLogo, "delhi capitals": dcLogo,
  gt: gtLogo, "gujarat titans": gtLogo,
  kkr: kkrLogo, "kolkata knight riders": kkrLogo,
  lsg: lsgLogo, "lucknow super giants": lsgLogo,
  mi: miLogo, "mumbai indians": miLogo,
  pbks: pbksLogo, "punjab kings": pbksLogo,
  rr: rrLogo, "rajasthan royals": rrLogo,
  rcb: rcbLogo, "royal challengers bengaluru": rcbLogo, "royal challengers bangalore": rcbLogo,
  srh: srhLogo, "sunrisers hyderabad": srhLogo,
};

function getTeamLogo(name: string, shortname?: string, img?: string): string {
  const key = (shortname || name).toLowerCase();
  if (TEAM_LOGO_MAP[key]) return TEAM_LOGO_MAP[key];
  const nameKey = name.toLowerCase();
  if (TEAM_LOGO_MAP[nameKey]) return TEAM_LOGO_MAP[nameKey];
  // Fallback to API image
  return img || "";
}

function getTeamShort(name: string, shortname?: string): string {
  if (shortname) return shortname.toUpperCase();
  // Try to extract abbreviation
  const words = name.split(" ");
  if (words.length >= 2) return words.map(w => w[0]).join("").toUpperCase().slice(0, 3);
  return name.slice(0, 3).toUpperCase();
}

const SIMULATION_MATCHES: UpcomingMatch[] = [
  {
    id: "sim-dc-mi",
    team1: { name: "Delhi Capitals", short: "DC", logo: dcLogo },
    team2: { name: "Mumbai Indians", short: "MI", logo: miLogo },
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    venue: "Arun Jaitley Stadium, Delhi",
    matchNumber: 32,
    liveRooms: 12,
    isSimulation: true,
  },
  {
    id: "sim-csk-rcb",
    team1: { name: "Chennai Super Kings", short: "CSK", logo: cskLogo },
    team2: { name: "Royal Challengers Bengaluru", short: "RCB", logo: rcbLogo },
    startTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
    venue: "M.A. Chidambaram Stadium",
    matchNumber: 33,
    liveRooms: 5,
    isSimulation: true,
  },
  {
    id: "sim-kkr-srh",
    team1: { name: "Kolkata Knight Riders", short: "KKR", logo: kkrLogo },
    team2: { name: "Sunrisers Hyderabad", short: "SRH", logo: srhLogo },
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    venue: "Eden Gardens, Kolkata",
    matchNumber: 34,
    liveRooms: 0,
    isSimulation: true,
  },
];

function apiMatchToUpcoming(m: CricApiMatch, index: number): UpcomingMatch {
  const t1Info = m.teamInfo?.[0];
  const t2Info = m.teamInfo?.[1];
  const team1Name = t1Info?.name || m.teams?.[0] || "Team A";
  const team2Name = t2Info?.name || m.teams?.[1] || "Team B";

  return {
    id: m.id,
    team1: {
      name: team1Name,
      short: getTeamShort(team1Name, t1Info?.shortname),
      logo: getTeamLogo(team1Name, t1Info?.shortname, t1Info?.img),
    },
    team2: {
      name: team2Name,
      short: getTeamShort(team2Name, t2Info?.shortname),
      logo: getTeamLogo(team2Name, t2Info?.shortname, t2Info?.img),
    },
    startTime: new Date(m.dateTimeGMT),
    venue: m.venue || "TBD",
    matchNumber: index + 1,
    liveRooms: m.matchStarted && !m.matchEnded ? Math.floor(Math.random() * 20) + 3 : 0,
    isSimulation: false,
    status: m.status,
  };
}

function formatTimeUntil(date: Date): string {
  const diff = date.getTime() - Date.now();
  if (diff <= 0) return "LIVE NOW";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

interface GamePickerProps {
  onSelectMatch: (match: UpcomingMatch) => void;
}

const MatchCard = ({ match, i, onSelect }: { match: UpcomingMatch; i: number; onSelect: () => void }) => {
  const timeUntil = formatTimeUntil(match.startTime);
  const isImminent = match.startTime.getTime() - Date.now() < 3 * 60 * 60 * 1000;
  const isLive = match.startTime.getTime() <= Date.now();

  return (
    <motion.button
      key={match.id}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.1 * (i + 1) }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className="w-full ios-card p-4 text-left active:bg-muted/50 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {match.isSimulation && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent/20 text-accent-foreground">
              <Zap size={8} className="inline mr-0.5 -mt-px" />SIM
            </span>
          )}
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {match.isSimulation ? `Simulation • Match ${match.matchNumber}` : `Match ${match.matchNumber}`}
          </span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
          isLive
            ? "bg-destructive/15 text-destructive"
            : isImminent
              ? "bg-destructive/15 text-destructive"
              : "bg-secondary text-muted-foreground"
        }`}>
          {isLive ? (
            <>
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75 animate-live-pulse" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-destructive" />
              </span>
              LIVE
            </>
          ) : (
            <>
              <Clock size={9} />
              {timeUntil}
            </>
          )}
        </span>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          {match.team1.logo ? (
            <img src={match.team1.logo} alt={match.team1.short} className="w-12 h-12 object-contain" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-[11px] font-bold text-muted-foreground">{match.team1.short}</div>
          )}
          <div>
            <p className="text-[15px] font-bold text-foreground">{match.team1.short}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{match.team1.name}</p>
          </div>
        </div>
        <span className="text-[13px] font-black text-muted-foreground/50 mx-2">vs</span>
        <div className="flex items-center gap-3 flex-1 justify-end text-right">
          <div>
            <p className="text-[15px] font-bold text-foreground">{match.team2.short}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{match.team2.name}</p>
          </div>
          {match.team2.logo ? (
            <img src={match.team2.logo} alt={match.team2.short} className="w-12 h-12 object-contain" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-[11px] font-bold text-muted-foreground">{match.team2.short}</div>
          )}
        </div>
      </div>

      {/* Status for live matches */}
      {match.status && !match.isSimulation && (
        <p className="text-[10px] text-muted-foreground mt-2 italic">{match.status}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border">
        <span className="text-[10px] text-muted-foreground truncate flex-1 mr-2">
          📍 {match.venue}
        </span>
        <div className="flex items-center gap-2">
          {match.liveRooms > 0 && (
            <span className="text-[10px] text-neon font-semibold flex items-center gap-1">
              <Users size={10} />
              {match.liveRooms} rooms
            </span>
          )}
          <ChevronRight size={14} className="text-muted-foreground" />
        </div>
      </div>
    </motion.button>
  );
};

const GamePicker = ({ onSelectMatch }: GamePickerProps) => {
  const [mode, setMode] = useState<"live" | "simulation">("live");
  const { matches, loading, error } = useCricketMatches();

  const liveMatches = matches.map((m, i) => apiMatchToUpcoming(m, i));
  const displayMatches = mode === "live" ? liveMatches : SIMULATION_MATCHES;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-4 space-y-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="text-center pb-1"
        >
          <h1 className="text-2xl font-black tracking-tight text-foreground">🏏 Pitch Talk</h1>
          <p className="text-[12px] text-muted-foreground mt-1 font-medium">
            Pick a match. Predict every ball. Play with your squad.
          </p>
        </motion.div>

        {/* Mode toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-1.5 p-1 rounded-xl bg-secondary/70"
        >
          <button
            onClick={() => setMode("live")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-semibold transition-all ${
              mode === "live"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            <Wifi size={12} />
            Live Matches
          </button>
          <button
            onClick={() => setMode("simulation")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-semibold transition-all ${
              mode === "simulation"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            <Zap size={12} />
            Simulation
          </button>
        </motion.div>

        {/* Section label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2"
        >
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            {mode === "live" ? "Upcoming Matches" : "Simulation Matches"}
          </span>
          <div className="flex-1 h-px bg-border" />
        </motion.div>

        {/* Loading state */}
        {mode === "live" && loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="ios-card p-4 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-10" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-6" />
                  <div className="flex items-center gap-3">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-10" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="w-12 h-12 rounded-full" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full mt-3" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {mode === "live" && error && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="ios-card p-5 text-center space-y-2"
          >
            <WifiOff size={24} className="mx-auto text-muted-foreground" />
            <p className="text-[13px] text-muted-foreground">Couldn't load live matches</p>
            <p className="text-[11px] text-muted-foreground/70">{error}</p>
            <button
              onClick={() => setMode("simulation")}
              className="mt-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold"
            >
              Try Simulation Mode
            </button>
          </motion.div>
        )}

        {/* Empty state */}
        {mode === "live" && !loading && !error && liveMatches.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="ios-card p-5 text-center space-y-2"
          >
            <p className="text-lg">🏏</p>
            <p className="text-[13px] text-muted-foreground">No upcoming matches right now</p>
            <button
              onClick={() => setMode("simulation")}
              className="mt-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold"
            >
              Play Simulation
            </button>
          </motion.div>
        )}

        {/* Match cards */}
        {!(mode === "live" && (loading || (error && !loading))) && (
          <div className="space-y-3">
            {displayMatches.map((match, i) => (
              <MatchCard key={match.id} match={match} i={i} onSelect={() => onSelectMatch(match)} />
            ))}
          </div>
        )}

        {/* Footer hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-[11px] text-muted-foreground py-2"
        >
          {mode === "simulation" ? "Simulation mode — test with fake match data" : "Tap a match to create or join a room"}
        </motion.p>
      </div>
    </div>
  );
};

export default GamePicker;
