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

const PredictionCard = ({ id, ballLabel, countdown, state, result, selected, friendPicks, userScores, onPredict, isFirstPrediction, totalUserPredictions = 0, myTeamBatting }: PredictionCardProps) => {
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
            ? "ring-2 ring-neon/40 animate-win-ring"
            : state === "resolved" && selected && !won
            ? "ring-2 ring-destructive/30 opacity-90"
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

        {/* Your prediction summary after resolution */}
        {state === "resolved" && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", damping: 20, delay: 0.1 }}
            className={`flex items-center gap-2 mb-2 px-3 py-2 rounded-xl ${
              won
                ? "bg-neon/10 border border-neon/20"
                : selected
                ? "bg-destructive/5 border border-destructive/10"
                : "bg-secondary/50"
            }`}
          >
            {selected ? (
              <>
                <span className="text-[10px] text-muted-foreground">You picked:</span>
                <span className={`text-[11px] font-bold ${
                  won
                    ? "text-neon"
                    : "text-muted-foreground line-through decoration-destructive/60"
                }`}>
                  {selected}
                </span>
                {won ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 10, delay: 0.3 }}
                    className="text-xs text-neon font-bold"
                  >
                    🎯 Nailed it!
                  </motion.span>
                ) : (
                  <span className="text-xs text-destructive">❌ Miss</span>
                )}
              </>
            ) : (
              <span className="text-[10px] text-muted-foreground/60 italic">⏭️ No prediction made</span>
            )}
          </motion.div>
        )}

        {showHint && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-2 px-3 py-1.5 rounded-lg bg-neon/10 text-neon text-[11px] font-medium text-center"
          >
            {hintText}
          </motion.div>
        )}

        {/* Ball being thrown — prominent animation during pending state */}
        {state === "pending" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-6 gap-3"
          >
            <motion.div
              className="relative"
              animate={{ x: [0, 60, 120], y: [0, -30, 0], rotate: [0, 180, 360] }}
              transition={{ duration: 1.2, ease: "easeInOut", repeat: Infinity }}
            >
              <span className="text-3xl">🏏</span>
            </motion.div>
            <div className="flex items-center gap-2">
              <motion.span
                className="text-[13px] font-bold text-primary"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                Ball in the air...
              </motion.span>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-primary"
                  animate={{ scale: [0.5, 1.2, 0.5], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Prediction buttons - biased sizing based on team context */}
        {(state === "idle" || state === "locked") && (
          <>
            {(() => {
              // Batting bias: Boundary, Six, Single are "good" → larger. Dot, Wicket smaller.
              // Bowling bias: Wicket, Dot are "good" → larger. Six, Boundary smaller.
              // Wide/No Ball always favor batting (free runs).
              const battingFavored = new Set(["Boundary", "Six", "Single"]);
              const bowlingFavored = new Set(["Wicket", "Dot"]);

              const getMainSize = (label: string): "lg" | "md" | "sm" => {
                if (myTeamBatting === undefined) return "md";
                if (myTeamBatting) {
                  if (battingFavored.has(label)) return "lg";
                  if (bowlingFavored.has(label)) return "sm";
                  return "md";
                } else {
                  if (bowlingFavored.has(label)) return "lg";
                  if (battingFavored.has(label)) return "sm";
                  return "md";
                }
              };

              const getSecSize = (label: string): "lg" | "md" | "sm" => {
                if (myTeamBatting === undefined) return "md";
                // Wide/No Ball = free runs (good for batting)
                if (myTeamBatting && (label === "Wide" || label === "No Ball")) return "lg";
                if (!myTeamBatting && (label === "Wide" || label === "No Ball")) return "sm";
                return "md";
              };

              const mainSizeClasses: Record<string, string> = {
                lg: "py-3 px-1.5 rounded-xl text-[11px]",
                md: "py-2.5 px-1 rounded-xl text-[10px]",
                sm: "py-2 px-1 rounded-xl text-[9px] opacity-80",
              };

              const mainIconSize: Record<string, number> = { lg: 17, md: 15, sm: 13 };

              // Sort main outcomes: favored ones first for visual priority
              const sortedMain = [...mainOutcomes].sort((a, b) => {
                const sA = getMainSize(a.label);
                const sB = getMainSize(b.label);
                const order = { lg: 0, md: 1, sm: 2 };
                return order[sA] - order[sB];
              });

              const secSizeClasses: Record<string, string> = {
                lg: "py-2 px-3 rounded-lg text-[10px]",
                md: "py-1.5 px-2.5 rounded-lg text-[9px]",
                sm: "py-1 px-2 rounded-lg text-[8px] opacity-70",
              };

              return (
                <>
                  <div className="grid grid-cols-5 gap-1.5 mb-1.5">
                    {sortedMain.map((o) => {
                      const isSelected = selected === o.label;
                      const size = getMainSize(o.label);
                      return (
                        <motion.button
                          key={o.label}
                          whileTap={{ scale: 0.92 }}
                          onClick={() => handleClick(o.label)}
                          disabled={state === "locked"}
                          className={`flex flex-col items-center gap-0.5 font-semibold uppercase transition-all duration-200 ${mainSizeClasses[size]} ${
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-[1.02]"
                              : state === "locked"
                              ? "opacity-35 " + o.color
                              : o.color + " active:bg-muted"
                          }`}
                        >
                          <o.icon size={mainIconSize[size]} strokeWidth={1.8} />
                          {o.label}
                        </motion.button>
                      );
                    })}
                  </div>
                  <div className="flex gap-1.5 mb-2">
                    {secondaryOutcomes.map((o) => {
                      const isSelected = selected === o.label;
                      const size = getSecSize(o.label);
                      return (
                        <motion.button
                          key={o.label}
                          whileTap={{ scale: 0.92 }}
                          onClick={() => handleClick(o.label)}
                          disabled={state === "locked"}
                          className={`flex items-center gap-1 font-semibold uppercase transition-all duration-200 ${secSizeClasses[size]} ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : state === "locked"
                              ? "opacity-35 bg-secondary text-muted-foreground"
                              : "bg-secondary/60 text-muted-foreground active:bg-muted"
                          }`}
                        >
                          <o.icon size={size === "lg" ? 12 : 10} />
                          {o.label}
                        </motion.button>
                      );
                    })}
                  </div>
                </>
              );
            })()}
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
