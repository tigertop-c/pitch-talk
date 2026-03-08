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
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className="sticky top-0 z-50 ios-glass ios-separator px-4 pt-2 pb-3"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-live opacity-75 animate-live-pulse" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-live" />
          </span>
          <span className="text-[11px] uppercase tracking-wider text-live font-semibold">Live</span>
        </div>
        <span className="text-[11px] text-muted-foreground font-medium">IND vs AUS • 2nd T20I</span>
      </div>

      <div className="flex items-baseline justify-between">
        <div>
          <motion.span
            key={match.runs}
            initial={{ scale: 1.15, color: "hsl(211 100% 50%)" }}
            animate={{ scale: 1, color: "hsl(var(--foreground))" }}
            transition={{ type: "spring", damping: 15 }}
            className="text-3xl font-bold tracking-tight"
          >
            {match.runs}
          </motion.span>
          <span className="text-xl text-muted-foreground font-light">/{match.wickets}</span>
          <motion.span
            key={formatBall(match.overs, match.balls)}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="ml-3 text-sm text-primary font-semibold"
          >
            ({formatBall(match.overs, match.balls)})
          </motion.span>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">CRR</div>
          <div className="text-lg font-bold text-primary">{crr}</div>
        </div>
      </div>

      {match.ballEvents.length > 0 && (
        <div className="mt-2.5 flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground mr-1 font-medium">{match.currentBowler}</span>
          {match.ballEvents.slice(-6).map((e, i) => {
            const style =
              e.result === "four" ? "bg-primary text-primary-foreground" :
              e.result === "six" ? "bg-neon text-neon-foreground" :
              e.result === "wicket" ? "bg-destructive text-destructive-foreground" :
              "bg-secondary text-muted-foreground";
            return (
              <span key={i} className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-semibold ${style}`}>
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
