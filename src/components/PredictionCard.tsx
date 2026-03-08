import { useEffect } from "react";
import { motion } from "framer-motion";
import { Target, Zap, CircleDot, AlertTriangle, Clock, Sparkles, ArrowRight, Ban } from "lucide-react";
import { playWinSound, playFailSound, playClickSound } from "@/lib/sounds";

export type PredictionState = "idle" | "locked" | "pending" | "resolved";

export interface BallResult {
  label: string;
  type: "dot" | "single" | "double" | "four" | "six" | "wicket";
}

export interface FriendPick {
  name: string;
  avatar: string;
  pick: string;
  won?: boolean;
}

interface PredictionCardProps {
  id: number;
  ballLabel: string;
  countdown: number;
  state: PredictionState;
  result: BallResult | null;
  selected: string | null;
  friendPicks: FriendPick[];
  userScores: Record<string, { wins: number; total: number; streak: number }>;
  onPredict: (pick: string) => void;
}

const mainOutcomes = [
  { label: "Dot", icon: CircleDot, color: "bg-muted text-foreground border-foreground" },
  { label: "Single", icon: Target, color: "bg-surface-elevated text-foreground border-foreground" },
  { label: "Boundary", icon: Zap, color: "bg-primary text-primary-foreground border-foreground" },
  { label: "Six", icon: Sparkles, color: "bg-neon text-neon-foreground border-foreground" },
  { label: "Wicket", icon: AlertTriangle, color: "bg-destructive text-destructive-foreground border-foreground" },
];

const secondaryOutcomes = [
  { label: "Wide", icon: ArrowRight, color: "bg-muted text-foreground border-foreground" },
  { label: "No Ball", icon: Ban, color: "bg-muted text-foreground border-foreground" },
];

const RESULT_STYLES: Record<string, string> = {
  dot: "bg-muted text-muted-foreground",
  single: "bg-surface-elevated text-foreground",
  double: "bg-surface-elevated text-foreground",
  four: "bg-primary text-primary-foreground",
  six: "bg-neon text-neon-foreground",
  wicket: "bg-destructive text-destructive-foreground",
};

const RANK_BADGES = ["👑", "🥈", "🥉"];

const PredictionCard = ({ id, ballLabel, countdown, state, result, selected, friendPicks, userScores, onPredict }: PredictionCardProps) => {
  const urgency = countdown <= 5;
  const won = result && selected && (
    (selected === "Dot" && result.type === "dot") ||
    (selected === "Boundary" && result.type === "four") ||
    (selected === "Six" && result.type === "six") ||
    (selected === "Single" && (result.type === "single" || result.type === "double")) ||
    (selected === "Wicket" && result.type === "wicket") ||
    (selected === "Wide" && result.type === "wide") ||
    (selected === "No Ball" && result.type === "noball")
  );

  useEffect(() => {
    if (state === "resolved" && selected) {
      if (won) playWinSound();
      else playFailSound();
    }
  }, [state]);

  const handleClick = (label: string) => {
    if (state !== "idle") return;
    playClickSound();
    onPredict(label);
  };

  // Rank users by wins for badge display
  const ranked = Object.entries(userScores)
    .map(([name, s]) => ({ name, ...s }))
    .sort((a, b) => b.wins - a.wins || b.streak - a.streak);
  const getRankBadge = (name: string) => {
    const idx = ranked.findIndex(r => r.name === name);
    if (idx < 3 && ranked[idx]?.wins > 0) return RANK_BADGES[idx];
    return null;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-4 my-1"
    >
      <div
        className={`p-3 bg-card border-[3px] border-foreground rounded-lg ${urgency && state === "idle" ? "animate-glow-pulse" : ""}`}
        style={{
          boxShadow:
            state === "resolved" && won
              ? "4px 4px 0px hsl(78 100% 50%), 0 0 20px hsl(78 100% 50% / 0.3)"
              : state === "resolved" && selected && !won
              ? "4px 4px 0px hsl(0 72% 51%)"
              : "4px 4px 0px hsl(0 0% 0%)",
        }}
      >
        {/* Header: ball label + timer/result */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 font-mono font-bold text-sm bg-muted border-2 border-foreground rounded-md"
              style={{ boxShadow: "2px 2px 0px hsl(0 0% 0%)" }}
            >
              {ballLabel}
            </span>
            {state === "resolved" && result && (
              <span className={`px-2 py-0.5 font-mono font-bold text-xs rounded-md border-2 border-foreground ${RESULT_STYLES[result.type]}`}
                style={{ boxShadow: "2px 2px 0px hsl(0 0% 0%)" }}
              >
                {result.label}
              </span>
            )}
            {state === "resolved" && selected && (
              <span className={`text-xs font-mono font-bold ${won ? "text-neon" : "text-destructive"}`}>
                {won ? "🎯 WON" : "💀 MISS"}
              </span>
            )}
          </div>
          {state === "idle" && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md border-2 font-mono text-xs font-bold ${
              urgency 
                ? "border-destructive bg-destructive/20 text-destructive" 
                : "border-foreground bg-muted text-foreground"
            }`}>
              <Clock size={10} />
              <span>{countdown}s</span>
            </div>
          )}
          {state === "locked" && (
            <span className="text-xs font-mono text-neon font-bold px-2 py-0.5 bg-neon/10 rounded-md border border-neon/30">
              🔒 Locked
            </span>
          )}
          {state === "pending" && (
            <span className="text-xs font-mono text-muted-foreground font-bold px-2 py-0.5">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="inline-block"
              >🏏</motion.span>
              {" "}Bowling...
            </span>
          )}
        </div>

        {/* Prediction buttons - only show when idle or locked */}
        {(state === "idle" || state === "locked") && (
          <>
            <div className="grid grid-cols-5 gap-1.5 mb-1.5">
              {mainOutcomes.map((o) => {
                const isSelected = selected === o.label;
                return (
                  <button
                    key={o.label}
                    onClick={() => handleClick(o.label)}
                    disabled={state === "locked"}
                    className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-md border-2 border-foreground text-[10px] font-bold font-mono uppercase transition-all ${
                      isSelected
                        ? "bg-neon text-neon-foreground scale-105 ring-2 ring-neon"
                        : state === "locked"
                        ? "opacity-40 " + o.color
                        : o.color + " active:scale-95 hover:scale-105"
                    }`}
                    style={{ boxShadow: isSelected ? "2px 2px 0px hsl(78 100% 40%)" : "2px 2px 0px hsl(0 0% 0%)" }}
                  >
                    <o.icon size={14} />
                    {o.label}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-1.5 mb-2">
              {secondaryOutcomes.map((o) => {
                const isSelected = selected === o.label;
                return (
                  <button
                    key={o.label}
                    onClick={() => handleClick(o.label)}
                    disabled={state === "locked"}
                    className={`flex items-center gap-1 py-1 px-2 rounded-md border border-border text-[9px] font-bold font-mono uppercase transition-all ${
                      isSelected
                        ? "bg-neon text-neon-foreground ring-1 ring-neon"
                        : state === "locked"
                        ? "opacity-40 bg-muted text-muted-foreground"
                        : "bg-muted/50 text-muted-foreground hover:text-foreground active:scale-95"
                    }`}
                  >
                    <o.icon size={10} />
                    {o.label}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Condensed friend picks inside the card */}
        {friendPicks.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {friendPicks.map((fp, i) => (
              <motion.div
                key={`${fp.name}-${i}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono border ${
                  state === "resolved" && fp.won !== undefined
                    ? fp.won 
                      ? "border-neon/40 bg-neon/10 text-neon" 
                      : "border-destructive/40 bg-destructive/10 text-destructive"
                    : "border-border bg-muted/50 text-muted-foreground"
                }`}
              >
                <span>{fp.avatar}</span>
                {getRankBadge(fp.name) && <span className="text-[8px]">{getRankBadge(fp.name)}</span>}
                <span className="font-bold">{fp.name}</span>
                <span className="opacity-70">→</span>
                <span className="font-bold">{fp.pick}</span>
                {state === "resolved" && fp.won !== undefined && (
                  <span>{fp.won ? "✅" : "❌"}</span>
                )}
                {userScores[fp.name]?.total > 0 && (
                  <span className="text-[8px] opacity-60">{userScores[fp.name].wins}/{userScores[fp.name].total}</span>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PredictionCard;
