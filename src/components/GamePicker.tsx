import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
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

const ALL_IPL_TEAMS = [
  { id: "CSK", name: "Chennai Super Kings", short: "CSK", logo: cskLogo },
  { id: "DC", name: "Delhi Capitals", short: "DC", logo: dcLogo },
  { id: "GT", name: "Gujarat Titans", short: "GT", logo: gtLogo },
  { id: "KKR", name: "Kolkata Knight Riders", short: "KKR", logo: kkrLogo },
  { id: "LSG", name: "Lucknow Super Giants", short: "LSG", logo: lsgLogo },
  { id: "MI", name: "Mumbai Indians", short: "MI", logo: miLogo },
  { id: "PBKS", name: "Punjab Kings", short: "PBKS", logo: pbksLogo },
  { id: "RCB", name: "Royal Challengers Bengaluru", short: "RCB", logo: rcbLogo },
  { id: "RR", name: "Rajasthan Royals", short: "RR", logo: rrLogo },
  { id: "SRH", name: "Sunrisers Hyderabad", short: "SRH", logo: srhLogo },
];

const VENUES: Record<string, string> = {
  CSK: "M.A. Chidambaram Stadium, Chennai",
  DC: "Arun Jaitley Stadium, Delhi",
  GT: "Narendra Modi Stadium, Ahmedabad",
  KKR: "Eden Gardens, Kolkata",
  LSG: "Ekana Cricket Stadium, Lucknow",
  MI: "Wankhede Stadium, Mumbai",
  PBKS: "IS Bindra Stadium, Mohali",
  RCB: "M. Chinnaswamy Stadium, Bengaluru",
  RR: "Sawai Mansingh Stadium, Jaipur",
  SRH: "Rajiv Gandhi Intl Stadium, Hyderabad",
};


interface GamePickerProps {
  onSelectMatch: (match: UpcomingMatch) => void;
}

const GamePicker = ({ onSelectMatch }: GamePickerProps) => {
  const [mode, setMode] = useState<"live" | "simulation">("live");
  const [simTeam1, setSimTeam1] = useState<string | null>(null);
  const [simTeam2, setSimTeam2] = useState<string | null>(null);
  const { matches, loading, error } = useCricketMatches();

  const liveMatches = matches.map((m, i) => apiMatchToUpcoming(m, i));

  const handleSimTeamPick = (teamId: string) => {
    if (!simTeam1) {
      setSimTeam1(teamId);
    } else if (simTeam1 === teamId) {
      setSimTeam1(null);
    } else if (!simTeam2) {
      setSimTeam2(teamId);
    } else if (simTeam2 === teamId) {
      setSimTeam2(null);
    } else {
      // Replace team2
      setSimTeam2(teamId);
    }
  };

  const handleStartSim = () => {
    if (!simTeam1 || !simTeam2) return;
    const t1 = ALL_IPL_TEAMS.find(t => t.id === simTeam1)!;
    const t2 = ALL_IPL_TEAMS.find(t => t.id === simTeam2)!;
    const simMatch: UpcomingMatch = {
      id: `sim-${t1.short.toLowerCase()}-${t2.short.toLowerCase()}`,
      team1: { name: t1.name, short: t1.short, logo: t1.logo },
      team2: { name: t2.name, short: t2.short, logo: t2.logo },
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      venue: VENUES[t1.id] || "Stadium",
      matchNumber: Math.floor(Math.random() * 50) + 1,
      liveRooms: 0,
      isSimulation: true,
    };
    onSelectMatch(simMatch);
  };

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
            Pick two teams. Predict every ball. Play with your squad.
          </p>
        </motion.div>

        {/* Matchup preview */}
        {simTeam1 && simTeam2 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={spring}
            className="ios-card p-5"
          >
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium text-center mb-3">Your Matchup</p>
            <div className="flex items-center justify-center gap-4">
              <div className="flex flex-col items-center gap-1.5">
                <img src={ALL_IPL_TEAMS.find(t => t.id === simTeam1)!.logo} alt={simTeam1} className="w-16 h-16 object-contain" />
                <span className="text-[14px] font-bold text-foreground">{simTeam1}</span>
              </div>
              <span className="text-xl font-black text-muted-foreground/50">vs</span>
              <div className="flex flex-col items-center gap-1.5">
                <img src={ALL_IPL_TEAMS.find(t => t.id === simTeam2)!.logo} alt={simTeam2} className="w-16 h-16 object-contain" />
                <span className="text-[14px] font-bold text-foreground">{simTeam2}</span>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleStartSim}
              className="w-full mt-4 py-3.5 rounded-2xl bg-primary text-primary-foreground text-[15px] font-bold shadow-lg shadow-primary/25 active:shadow-md flex items-center justify-center gap-2"
            >
              <Zap size={16} />
              Start Simulation
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
            className="ios-card p-4"
          >
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1">⚡ Build Your Match</p>
            <p className="text-[13px] text-foreground font-semibold">
              {!simTeam1 ? "Pick the first team" : "Now pick the opponent"}
            </p>
          </motion.div>
        )}

        {/* Team grid */}
        <div className="grid grid-cols-5 gap-2">
          {ALL_IPL_TEAMS.map((t, i) => {
            const isSelected = t.id === simTeam1 || t.id === simTeam2;
            const isTeam1 = t.id === simTeam1;
            const isTeam2 = t.id === simTeam2;
            return (
              <motion.button
                key={t.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...spring, delay: 0.03 * i }}
                whileTap={{ scale: 0.92 }}
                onClick={() => handleSimTeamPick(t.id)}
                className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl transition-all duration-200 ${
                  isSelected
                    ? "bg-primary/15 ring-2 ring-primary shadow-sm"
                    : "bg-secondary/50 active:bg-muted"
                }`}
              >
                <img src={t.logo} alt={t.short} className="w-10 h-10 object-contain" />
                <span className={`text-[9px] font-bold ${isSelected ? "text-primary" : "text-muted-foreground"}`}>{t.short}</span>
                {isTeam1 && <span className="text-[8px] font-bold text-primary bg-primary/10 px-1.5 rounded">1st</span>}
                {isTeam2 && <span className="text-[8px] font-bold text-primary bg-primary/10 px-1.5 rounded">2nd</span>}
              </motion.button>
            );
          })}
        </div>

        {simTeam1 && !simTeam2 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-[11px] text-muted-foreground"
          >
            Tap another team to set the opponent
          </motion.p>
        )}

        {/* Footer hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-[11px] text-muted-foreground py-2"
        >
          Pick any two IPL teams for a 5-over simulation
        </motion.p>
      </div>
    </div>
  );
};

export default GamePicker;
