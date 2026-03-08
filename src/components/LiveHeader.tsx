import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { type MatchState, type Batsman, formatBall } from "@/hooks/useMatchState";
import dcLogo from "@/assets/dc-logo.png";
import miLogo from "@/assets/mi-logo.png";

interface LiveHeaderProps {
  match: MatchState;
  crr: string;
  soundMuted: boolean;
  onToggleSound: () => void;
  battingTeam?: string;
  isChasing?: boolean;
}

const LiveHeader = ({ match, crr, soundMuted, onToggleSound, battingTeam, isChasing }: LiveHeaderProps) => {
  const totalOvers = match.overs + match.balls / 6;
  const remainingOvers = 20 - totalOvers;
  const remainingRuns = match.target ? match.target - match.runs : null;
  const rrr = match.target && remainingOvers > 0
    ? (remainingRuns! / remainingOvers).toFixed(2)
    : null;

  const striker = match.batsmen.find(b => b.isOnStrike) || match.batsmen[0];
  const nonStriker = match.batsmen.find(b => !b.isOnStrike) || match.batsmen[1];

  const BatsmanRow = ({ b, isStrike }: { b: Batsman; isStrike: boolean }) => (
    <div className="flex items-center gap-2 text-[11px]">
      <span className={`font-semibold ${isStrike ? "text-foreground" : "text-muted-foreground"}`}>
        {b.name}{isStrike ? "*" : ""}
      </span>
      <span className="text-foreground font-bold">{b.runs}</span>
      <span className="text-muted-foreground">({b.balls})</span>
    </div>
  );

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className="sticky top-0 z-50 ios-glass ios-separator px-4 pt-2 pb-3"
    >
      {/* Row 1: Live badge + match info + mute button */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-live opacity-75 animate-live-pulse" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-live" />
          </span>
          <span className="text-[11px] uppercase tracking-wider text-live font-semibold">Live</span>
        </div>
        <div className="flex items-center gap-2.5">
          <img src={dcLogo} alt="DC" className="w-7 h-7 object-contain" />
          <span className="text-[13px] text-foreground font-semibold">DC vs MI</span>
          <img src={miLogo} alt="MI" className="w-7 h-7 object-contain" />
          <span className="text-[10px] text-muted-foreground">• IPL 2025</span>
          {/* Sound toggle */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={onToggleSound}
            className={`ml-1 w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
              soundMuted ? "bg-destructive/15 text-destructive" : "bg-secondary text-muted-foreground"
            }`}
            title={soundMuted ? "Unmute sounds" : "Mute sounds"}
          >
            {soundMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </motion.button>
        </div>
      </div>

      {/* Row 2: Big score + overs + run rates */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col">
          {battingTeam && (
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">{battingTeam} batting</span>
          )}
          <div className="flex items-baseline gap-1">
          <motion.span
            key={match.runs}
            initial={{ scale: 1.15, color: "hsl(211 100% 50%)" }}
            animate={{ scale: 1, color: "hsl(var(--foreground))" }}
            transition={{ type: "spring", damping: 15 }}
            className="text-[40px] font-black tracking-tighter leading-none"
          >
            {match.runs}
          </motion.span>
          <span className="text-2xl text-muted-foreground font-light leading-none">/{match.wickets}</span>
          <motion.span
            key={formatBall(match.overs, match.balls)}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="ml-1.5 text-sm text-primary font-semibold"
          >
            ({formatBall(match.overs, match.balls)})
          </motion.span>
        </div>

        <div className="flex gap-4 items-end">
          <div className="text-right">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wide">CRR</div>
            <div className="text-base font-bold text-primary leading-tight">{crr}</div>
          </div>
          {rrr && (
            <div className="text-right">
              <div className="text-[9px] text-muted-foreground uppercase tracking-wide">RRR</div>
              <div className="text-base font-bold text-destructive leading-tight">{rrr}</div>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Target info */}
      {match.target && remainingRuns !== null && remainingRuns > 0 && (
        <div className="mt-1 text-[11px] text-muted-foreground">
          Need <span className="text-foreground font-semibold">{remainingRuns}</span> off{" "}
          <span className="text-foreground font-semibold">{Math.ceil(remainingOvers * 6)}</span> balls
        </div>
      )}

      {/* Row 4: Batsmen */}
      <div className="mt-2 flex items-center gap-4">
        <BatsmanRow b={striker} isStrike={true} />
        <BatsmanRow b={nonStriker} isStrike={false} />
      </div>

      {/* Row 5: Ball-by-ball this over */}
      {match.ballEvents.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5">
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
