import { useEffect } from "react";
import { motion } from "framer-motion";
import { Target, Zap, CircleDot, AlertTriangle, Clock, Sparkles, ArrowRight, Ban, RotateCcw } from "lucide-react";
import { playWinSound, playFailSound, playClickSound } from "@/lib/sounds";

export type PredictionState = "idle" | "locked" | "pending" | "resolved";

export interface BallResult {
  label: string;
  type: "dot" | "single" | "double" | "triple" | "four" | "six" | "wicket" | "wide" | "noball";
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
  isFirstPrediction?: boolean;
  totalUserPredictions?: number;
  myTeamBatting?: boolean; // true = my team is batting, false = my team is bowling
}

const mainOutcomes = [
  { label: "Dot", icon: CircleDot, color: "bg-secondary text-foreground" },
  { label: "Single", icon: Target, color: "bg-secondary text-foreground" },
  { label: "Boundary", icon: Zap, color: "bg-primary/10 text-primary" },
  { label: "Six", icon: Sparkles, color: "bg-neon/10 text-neon" },
  { label: "Wicket", icon: AlertTriangle, color: "bg-destructive/10 text-destructive" },
];

const secondaryOutcomes = [
  { label: "Two", icon: RotateCcw, color: "bg-secondary text-muted-foreground" },
  { label: "Three", icon: RotateCcw, color: "bg-secondary text-muted-foreground" },
  { label: "Wide", icon: ArrowRight, color: "bg-secondary text-muted-foreground" },
  { label: "No Ball", icon: Ban, color: "bg-secondary text-muted-foreground" },
];

const RESULT_STYLES: Record<string, string> = {
  dot: "bg-secondary text-muted-foreground",
  single: "bg-secondary text-foreground",
  double: "bg-secondary text-foreground",
  triple: "bg-secondary text-foreground",
  four: "bg-primary/15 text-primary",
  six: "bg-neon/15 text-neon",
  wicket: "bg-destructive/15 text-destructive",
  wide: "bg-secondary text-muted-foreground",
  noball: "bg-secondary text-muted-foreground",
};

const RANK_BADGES = ["👑", "🥈", "🥉"];

const HINT_MESSAGES = [
  "👆 Predict what happens next!",
  "🎯 What's the next ball gonna be?",
  "⚡ Quick! Lock in your prediction!",
  "🏏 Tap to predict this delivery!",
];

const PredictionCard = ({ id, ballLabel, countdown, state, result, selected, friendPicks, userScores, onPredict, isFirstPrediction, totalUserPredictions = 0 }: PredictionCardProps) => {
  const urgency = countdown <= 5;
  const showHint = state === "idle" && !selected && totalUserPredictions < 3;
  const won = result && selected && (
    (selected === "Dot" && result.type === "dot") ||
    (selected === "Boundary" && result.type === "four") ||
    (selected === "Six" && result.type === "six") ||
    (selected === "Single" && result.type === "single") ||
    (selected === "Two" && result.type === "double") ||
    (selected === "Three" && result.type === "triple") ||
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

  const ranked = Object.entries(userScores)
    .map(([name, s]) => ({ name, ...s }))
    .sort((a, b) => b.wins - a.wins || b.streak - a.streak);
  const getRankBadge = (name: string) => {
    const idx = ranked.findIndex(r => r.name === name);
    if (idx < 3 && ranked[idx]?.wins > 0) return RANK_BADGES[idx];
    return null;
  };

  const hintText = HINT_MESSAGES[id % HINT_MESSAGES.length];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 350 }}
      className="mx-4 my-1.5"
    >
      <div
        className={`p-3.5 ios-card transition-all duration-300 ${
          state === "idle" && !selected
            ? "animate-prediction-glow"
            : state === "resolved" && won
            ? "ring-2 ring-neon/40"
            : state === "resolved" && selected && !won
            ? "ring-2 ring-destructive/30"
            : ""
        } ${urgency && state === "idle" ? "ring-2 ring-destructive/20" : ""}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 font-semibold text-xs bg-secondary rounded-lg">
              {ballLabel}
            </span>
            {state === "idle" && !selected && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] font-semibold text-neon"
              >
                YOUR TURN
              </motion.span>
            )}
            {state === "resolved" && result && (
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 15 }}
                className={`px-2.5 py-1 font-semibold text-xs rounded-lg ${RESULT_STYLES[result.type]}`}
              >
                {result.label}
              </motion.span>
            )}
            {state === "resolved" && selected && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 12, delay: 0.1 }}
                className={`text-xs font-semibold ${won ? "text-neon" : "text-destructive"}`}
              >
                {won ? "🎯 Nailed it" : "💀 Miss"}
              </motion.span>
            )}
          </div>
          {state === "idle" && (
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
              urgency ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground"
            }`}>
              <Clock size={10} />
              <span>{countdown}s</span>
            </div>
          )}
          {state === "locked" && (
            <span className="text-xs font-medium text-primary px-2.5 py-1 bg-primary/10 rounded-full">
              🔒 Locked
            </span>
          )}
          {state === "pending" && (
            <span className="text-xs text-muted-foreground font-medium px-2.5 py-1">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="inline-block"
              >🏏</motion.span>
              {" "}Bowling...
            </span>
          )}
        </div>

        {/* Hint for new users */}
        {showHint && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-2 px-3 py-1.5 rounded-lg bg-neon/10 text-neon text-[11px] font-medium text-center"
          >
            {hintText}
          </motion.div>
        )}

        {/* Prediction buttons */}
        {(state === "idle" || state === "locked") && (
          <>
            <div className="grid grid-cols-5 gap-1.5 mb-1.5">
              {mainOutcomes.map((o) => {
                const isSelected = selected === o.label;
                return (
                  <motion.button
                    key={o.label}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleClick(o.label)}
                    disabled={state === "locked"}
                    className={`flex flex-col items-center gap-0.5 py-2.5 px-1 rounded-xl text-[10px] font-semibold uppercase transition-all duration-200 ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-[1.02]"
                        : state === "locked"
                        ? "opacity-35 " + o.color
                        : o.color + " active:bg-muted"
                    }`}
                  >
                    <o.icon size={15} strokeWidth={1.8} />
                    {o.label}
                  </motion.button>
                );
              })}
            </div>
            <div className="flex gap-1.5 mb-2">
              {secondaryOutcomes.map((o) => {
                const isSelected = selected === o.label;
                return (
                  <motion.button
                    key={o.label}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleClick(o.label)}
                    disabled={state === "locked"}
                    className={`flex items-center gap-1 py-1.5 px-2.5 rounded-lg text-[9px] font-semibold uppercase transition-all duration-200 ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : state === "locked"
                        ? "opacity-35 bg-secondary text-muted-foreground"
                        : "bg-secondary/60 text-muted-foreground active:bg-muted"
                    }`}
                  >
                    <o.icon size={10} />
                    {o.label}
                  </motion.button>
                );
              })}
            </div>
          </>
        )}

        {/* Friend picks */}
        {friendPicks.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {friendPicks.map((fp, i) => (
              <motion.div
                key={`${fp.name}-${i}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", damping: 20 }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium ${
                  state === "resolved" && fp.won !== undefined
                    ? fp.won 
                      ? "bg-neon/10 text-neon" 
                      : "bg-destructive/10 text-destructive"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                <span>{fp.avatar}</span>
                {getRankBadge(fp.name) && <span className="text-[8px]">{getRankBadge(fp.name)}</span>}
                <span className="font-semibold">{fp.name}</span>
                <span className="opacity-50">→</span>
                <span className="font-semibold">{fp.pick}</span>
                {state === "resolved" && fp.won !== undefined && (
                  <span>{fp.won ? "✅" : "❌"}</span>
                )}
                {userScores[fp.name]?.total > 0 && (
                  <span className="text-[8px] opacity-50">{userScores[fp.name].wins}/{userScores[fp.name].total}</span>
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
