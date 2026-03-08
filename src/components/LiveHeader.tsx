import { motion } from "framer-motion";
import { type MatchState, formatBall } from "@/hooks/useMatchState";

interface LiveHeaderProps {
  match: MatchState;
  crr: string;
}

const LiveHeader = ({ match, crr }: LiveHeaderProps) => {
  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 bg-card border-b-[3px] border-foreground px-4 py-3"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-live opacity-75 animate-live-pulse" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-live" />
          </span>
          <span className="text-xs font-mono uppercase tracking-widest text-live font-semibold">Live</span>
        </div>
        <span className="text-xs font-mono text-muted-foreground">IND vs AUS • 2nd T20I</span>
      </div>

      <div className="flex items-baseline justify-between">
        <div>
          <motion.span
            key={match.runs}
            initial={{ scale: 1.2, color: "hsl(78 100% 50%)" }}
            animate={{ scale: 1, color: "hsl(0 0% 95%)" }}
            className="text-3xl font-bold font-mono tracking-tight"
          >
            {match.runs}
          </motion.span>
          <span className="text-xl font-mono text-muted-foreground">/{match.wickets}</span>
          <motion.span
            key={formatBall(match.overs, match.balls)}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="ml-3 text-sm font-mono text-neon font-semibold"
          >
            ({formatBall(match.overs, match.balls)})
          </motion.span>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground font-mono">CRR</div>
          <div className="text-lg font-bold font-mono text-primary">{crr}</div>
        </div>
      </div>

      {/* Last 6 balls mini strip */}
      {match.ballEvents.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-muted-foreground mr-1">{match.currentBowler}</span>
          {match.ballEvents.slice(-6).map((e, i) => {
            const bg =
              e.result === "four" ? "bg-primary text-primary-foreground" :
              e.result === "six" ? "bg-neon text-neon-foreground" :
              e.result === "wicket" ? "bg-destructive text-destructive-foreground" :
              "bg-muted text-muted-foreground";
            return (
              <span key={i} className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-mono font-bold ${bg}`}>
                {e.result === "wicket" ? "W" : e.runs}
              </span>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default LiveHeader;
