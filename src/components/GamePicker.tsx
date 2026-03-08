import { motion } from "framer-motion";
import { Clock, ChevronRight, Users } from "lucide-react";
import dcLogo from "@/assets/dc-logo.png";
import miLogo from "@/assets/mi-logo.png";

export interface UpcomingMatch {
  id: string;
  team1: { name: string; short: string; logo: string };
  team2: { name: string; short: string; logo: string };
  startTime: Date;
  venue: string;
  matchNumber: number;
  liveRooms: number;
}

const spring = { type: "spring" as const, damping: 25, stiffness: 350 };

const UPCOMING_MATCHES: UpcomingMatch[] = [
  {
    id: "dc-mi-32",
    team1: { name: "Delhi Capitals", short: "DC", logo: dcLogo },
    team2: { name: "Mumbai Indians", short: "MI", logo: miLogo },
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    venue: "Arun Jaitley Stadium, Delhi",
    matchNumber: 32,
    liveRooms: 12,
  },
  {
    id: "csk-rcb-33",
    team1: { name: "Chennai Super Kings", short: "CSK", logo: dcLogo },
    team2: { name: "Royal Challengers", short: "RCB", logo: miLogo },
    startTime: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
    venue: "M.A. Chidambaram Stadium",
    matchNumber: 33,
    liveRooms: 5,
  },
  {
    id: "kkr-srh-34",
    team1: { name: "Kolkata Knight Riders", short: "KKR", logo: dcLogo },
    team2: { name: "Sunrisers Hyderabad", short: "SRH", logo: miLogo },
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    venue: "Eden Gardens, Kolkata",
    matchNumber: 34,
    liveRooms: 0,
  },
];

function formatTimeUntil(date: Date): string {
  const diff = date.getTime() - Date.now();
  if (diff <= 0) return "LIVE NOW";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatMatchTime(date: Date): string {
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

interface GamePickerProps {
  onSelectMatch: (match: UpcomingMatch) => void;
}

const GamePicker = ({ onSelectMatch }: GamePickerProps) => {
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
          <h1 className="text-2xl font-black tracking-tight text-foreground">🗣️ The Sledge</h1>
          <p className="text-[12px] text-muted-foreground mt-1 font-medium">
            Pick a match. Predict. Talk trash. Own the receipts.
          </p>
        </motion.div>

        {/* Today's label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2"
        >
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Upcoming Matches
          </span>
          <div className="flex-1 h-px bg-border" />
        </motion.div>

        {/* Match cards */}
        <div className="space-y-3">
          {UPCOMING_MATCHES.map((match, i) => {
            const timeUntil = formatTimeUntil(match.startTime);
            const isImminent = match.startTime.getTime() - Date.now() < 3 * 60 * 60 * 1000;

            return (
              <motion.button
                key={match.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.15 * (i + 1) }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectMatch(match)}
                className="w-full ios-card p-4 text-left active:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    IPL 2025 • Match {match.matchNumber}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isImminent
                      ? "bg-destructive/15 text-destructive"
                      : "bg-secondary text-muted-foreground"
                  }`}>
                    <Clock size={9} className="inline mr-0.5 -mt-px" />
                    {timeUntil}
                  </span>
                </div>

                {/* Teams */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <img src={match.team1.logo} alt={match.team1.short} className="w-12 h-12 object-contain" />
                    <div>
                      <p className="text-[15px] font-bold text-foreground">{match.team1.short}</p>
                      <p className="text-[10px] text-muted-foreground">{match.team1.name}</p>
                    </div>
                  </div>

                  <span className="text-[13px] font-black text-muted-foreground/50 mx-2">vs</span>

                  <div className="flex items-center gap-3 flex-1 justify-end text-right">
                    <div>
                      <p className="text-[15px] font-bold text-foreground">{match.team2.short}</p>
                      <p className="text-[10px] text-muted-foreground">{match.team2.name}</p>
                    </div>
                    <img src={match.team2.logo} alt={match.team2.short} className="w-12 h-12 object-contain" />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground">
                      📍 {match.venue}
                    </span>
                  </div>
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
          })}
        </div>

        {/* Footer hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-[11px] text-muted-foreground py-2"
        >
          Tap a match to create or join a prediction room
        </motion.p>
      </div>
    </div>
  );
};

export default GamePicker;
