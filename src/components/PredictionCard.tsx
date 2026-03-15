import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Target, Zap, CircleDot, AlertTriangle, Clock, Sparkles, ArrowRight, Ban, RotateCcw } from "lucide-react";
import { playWinSound, playFailSound, playClickSound } from "@/lib/sounds";
import {
  estimateShareForPick,
  formatRs,
  formatStake,
  type BallPotEntry,
  type WagerTier,
} from "@/lib/wagers";

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
  netWinnings?: number;
}

interface PredictionCardProps {
  id: number;
  ballLabel: string;
  countdown: number;
  state: PredictionState;
  result: BallResult | null;
  selected: string | null;
  roomStakeTier: WagerTier;
  roomStakeAmount: number;
  friendPicks: FriendPick[];
  userScores: Record<string, { wins: number; total: number; streak: number; netWinnings?: number }>;
  onPredict: (pick: string) => void;
  totalUserPredictions?: number;
  myTeamBatting?: boolean;
  actualNet?: number | null;
  expired?: boolean;
  wagerMode?: boolean;
  eligibleParticipantNames?: string[];
  minimumWagerParticipants?: number;
  predictionDisabled?: boolean;
  predictionDisabledReason?: string | null;
  onInviteMore?: () => void;
  isPracticeMode?: boolean;
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

const RANK_BADGES = ["🥇", "🥈", "🥉"];

const HINT_MESSAGES = [
  "Pick the outcome. The room stake is already locked.",
  "Every live ball is its own pool.",
  "Same room stake, dynamic reward.",
  "Make the call before the clock hits zero.",
];

const PredictionCard = ({
  id,
  ballLabel,
  countdown,
  state,
  result,
  selected,
  roomStakeTier,
  roomStakeAmount,
  friendPicks,
  userScores,
  onPredict,
  totalUserPredictions = 0,
  myTeamBatting,
  actualNet = null,
  expired = false,
  wagerMode = true,
  eligibleParticipantNames = [],
  minimumWagerParticipants = 2,
  predictionDisabled = false,
  predictionDisabledReason = null,
  onInviteMore,
  isPracticeMode,
}: PredictionCardProps) => {
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

  const estimatedShare = useMemo(() => {
    if (!selected || !wagerMode) return null;
    const participants: BallPotEntry[] = [
      ...friendPicks
        .filter((pick) => eligibleParticipantNames.includes(pick.name))
        .map((pick) => ({ name: pick.name, pick: pick.pick, stake: roomStakeAmount })),
      ...(eligibleParticipantNames.includes("You") ? [{ name: "You", pick: selected, stake: roomStakeAmount }] : []),
    ];
    if (participants.length < minimumWagerParticipants) return null;
    return estimateShareForPick(participants, selected, roomStakeAmount);
  }, [eligibleParticipantNames, friendPicks, minimumWagerParticipants, roomStakeAmount, selected, wagerMode]);

  useEffect(() => {
    if (state === "resolved" && selected) {
      if (won && !expired) playWinSound();
      else playFailSound();
    }
  }, [state, selected, won, expired]);

  const handleOutcomeClick = (label: string) => {
    if (state !== "idle" || selected || predictionDisabled) return;
    playClickSound();
    onPredict(label);
  };

  const ranked = Object.entries(userScores)
    .map(([name, score]) => ({ name, ...score }))
    .sort((a, b) => (b.netWinnings || 0) - (a.netWinnings || 0) || b.wins - a.wins || b.streak - a.streak);

  const getRankBadge = (name: string) => {
    const idx = ranked.findIndex((entry) => entry.name === name);
    if (idx < 3 && ranked[idx] && ((ranked[idx].netWinnings || 0) !== 0 || ranked[idx].wins > 0)) return RANK_BADGES[idx];
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
        className={`p-4 rounded-3xl border transition-all duration-300 overflow-hidden relative shadow-lg ${
          state === "idle" && !selected
            ? "bg-card border-neon/40 shadow-neon/10 animate-prediction-glow"
            : state === "locked"
            ? "bg-secondary/60 border-secondary/80"
            : state === "resolved" && won && !expired
            ? "bg-gradient-to-br from-neon/10 to-transparent border-neon/50 shadow-neon/20 animate-win-ring"
            : state === "resolved" && selected && !won
            ? "bg-destructive/5 border-destructive/20 opacity-90"
            : "bg-secondary/50 border-secondary"
        } ${urgency && state === "idle" ? "ring-2 ring-destructive/50 shadow-destructive/20" : ""}`}
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 font-semibold text-xs bg-secondary rounded-lg">
              {ballLabel}
            </span>
            {state === "idle" && !selected && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] font-black tracking-wider text-neon uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse" />
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
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
              urgency ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-secondary text-foreground"
            }`}>
              <Clock size={12} />
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
              >
                🏏
              </motion.span>{" "}
              Bowling...
            </span>
          )}
        </div>

        {wagerMode ? (
          <div className="mb-3 px-1 flex items-center justify-between">
            <div className="flex items-center gap-1.5 opacity-80">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pool Stake</span>
              <span className="text-[11px] font-black">{formatStake(roomStakeTier)}</span>
            </div>
            
            {selected && state !== "resolved" && estimatedShare !== null && (
              <div className="flex items-center gap-1.5 opacity-80">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Est. Share</span>
                <span className="text-[11px] font-black text-primary">+{formatRs(estimatedShare - roomStakeAmount)}</span>
              </div>
            )}
            
            {state === "resolved" && actualNet !== null && !expired && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Result</span>
                <span className={`text-[12px] font-black ${actualNet >= 0 ? "text-neon" : "text-destructive"}`}>
                  {actualNet >= 0 ? "+" : ""}{formatRs(actualNet)}
                </span>
              </div>
            )}
            
            {state === "resolved" && expired && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Result</span>
                <span className="text-[10px] font-bold text-muted-foreground">Expired</span>
              </div>
            )}
          </div>
        ) : !isPracticeMode && (
          <div className="mb-2.5 rounded-xl border border-secondary bg-secondary/40 px-3 py-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold">
              <span className="text-foreground">Prediction-only mode</span>
              <span className="text-muted-foreground">More humans needed to unlock Pitch Paisa</span>
            </div>
          </div>
        )}



        {predictionDisabled && predictionDisabledReason && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-2 px-3 py-1.5 rounded-lg bg-secondary/70 text-muted-foreground text-[11px] font-medium text-center"
          >
            {predictionDisabledReason}
          </motion.div>
        )}

        {showHint && !predictionDisabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-2 px-3 py-1.5 rounded-lg bg-neon/10 text-neon text-[11px] font-medium text-center"
          >
            {hintText}
          </motion.div>
        )}

        {(state === "idle" || state === "locked") && (
          <>
            {(() => {
              const battingFavored = new Set(["Boundary", "Six", "Single"]);
              const bowlingFavored = new Set(["Wicket", "Dot"]);

              const getMainSize = (label: string): "lg" | "md" | "sm" => {
                if (myTeamBatting === undefined) return "md";
                if (myTeamBatting) {
                  if (battingFavored.has(label)) return "lg";
                  if (bowlingFavored.has(label)) return "sm";
                  return "md";
                }
                if (bowlingFavored.has(label)) return "lg";
                if (battingFavored.has(label)) return "sm";
                return "md";
              };

              const getSecSize = (label: string): "lg" | "md" | "sm" => {
                if (myTeamBatting === undefined) return "md";
                if (myTeamBatting && (label === "Wide" || label === "No Ball")) return "lg";
                if (!myTeamBatting && (label === "Wide" || label === "No Ball")) return "sm";
                return "md";
              };

              const mainSizeClasses: Record<string, string> = {
                lg: "py-3.5 px-2 rounded-xl text-[12px] shadow-sm",
                md: "py-3 px-1.5 rounded-xl text-[11px] shadow-sm",
                sm: "py-2.5 px-1 rounded-xl text-[10px] opacity-80 shadow-sm",
              };

              const mainIconSize: Record<string, number> = { lg: 17, md: 15, sm: 13 };

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
                    {sortedMain.map((outcome) => {
                      const isSelected = selected === outcome.label;
                      const size = getMainSize(outcome.label);
                      return (
                        <motion.button
                          key={outcome.label}
                          type="button"
                          whileTap={{ scale: 0.92 }}
                          onClick={() => handleOutcomeClick(outcome.label)}
                          disabled={state === "locked"}
                          className={`flex flex-col items-center gap-0.5 font-semibold uppercase transition-all duration-200 ${mainSizeClasses[size]} ${
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-[1.02]"
                              : state === "locked"
                              ? `opacity-35 ${outcome.color}`
                            : predictionDisabled
                            ? `${outcome.color} opacity-35 cursor-not-allowed`
                            : `${outcome.color} active:bg-muted`
                          }`}
                        >
                          <outcome.icon size={mainIconSize[size]} strokeWidth={1.8} />
                          {outcome.label}
                        </motion.button>
                      );
                    })}
                  </div>
                  <div className="flex gap-1.5 mb-2">
                    {secondaryOutcomes.map((outcome) => {
                      const isSelected = selected === outcome.label;
                      const size = getSecSize(outcome.label);
                      return (
                        <motion.button
                          key={outcome.label}
                          type="button"
                          whileTap={{ scale: 0.92 }}
                          onClick={() => handleOutcomeClick(outcome.label)}
                          disabled={state === "locked"}
                          className={`flex items-center gap-1 font-semibold uppercase transition-all duration-200 ${secSizeClasses[size]} ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : state === "locked"
                              ? "opacity-35 bg-secondary text-muted-foreground"
                              : predictionDisabled
                              ? "bg-secondary/60 text-muted-foreground opacity-35 cursor-not-allowed"
                              : "bg-secondary/60 text-muted-foreground active:bg-muted"
                          }`}
                        >
                          <outcome.icon size={size === "lg" ? 12 : 10} />
                          {outcome.label}
                        </motion.button>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </>
        )}

        {(() => {
          // Combine friend picks and your own pick into one list
          const myPickContext = selected ? [{
            name: "You",
            avatar: "🙋",
            pick: selected,
            won,
            netWinnings: actualNet ?? undefined,
          }] : [];
          
          const allPicks = [...myPickContext, ...friendPicks];
          if (allPicks.length === 0) return null;

          return (
            <div className="flex flex-col gap-1.5 mt-2.5 border-t border-border/50 pt-3">
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1 px-1">Squad Picks ({allPicks.length})</span>
              {allPicks.map((pickEntry, i) => {
                const totalNet = userScores[pickEntry.name]?.netWinnings ?? 0;
                
                return (
                  <motion.div
                    key={`${pickEntry.name}-${i}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", damping: 20 }}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-medium shadow-sm border ${
                      state === "resolved" && pickEntry.won !== undefined
                        ? pickEntry.won
                          ? pickEntry.name === "You" ? "bg-neon/15 border-neon/30 text-neon ring-2 ring-neon/20 shadow-neon/10" : "bg-neon/10 border-neon/20 text-neon"
                          : pickEntry.name === "You" ? "bg-destructive/10 border-destructive/20 text-destructive opacity-90 ring-1 ring-destructive/10" : "bg-destructive/5 border-destructive/10 text-destructive opacity-90"
                        : pickEntry.name === "You"
                          ? "bg-secondary text-foreground border-border/70 shadow-md ring-1 ring-border/50"
                          : "bg-secondary/40 text-foreground border-transparent"
                    }`}
                  >
                    <div className="flex flex-col justify-center min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] flex-shrink-0">{pickEntry.avatar}</span>
                        {getRankBadge(pickEntry.name) && <span className="text-[10px] flex-shrink-0">{getRankBadge(pickEntry.name)}</span>}
                        <span className={`font-semibold text-[13px] truncate ${pickEntry.name === "You" ? "font-bold tracking-wide" : ""}`}>
                          {pickEntry.name}
                        </span>
                        {wagerMode && (
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded pl-1 ${totalNet >= 0 ? "bg-neon/10 text-neon" : "bg-destructive/10 text-destructive"}`}>
                            {totalNet >= 0 ? "+" : ""}{formatRs(totalNet)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className={`font-bold text-[12px] ${state === "resolved" && pickEntry.won === false ? "line-through opacity-70" : "opacity-90"}`}>
                        {pickEntry.pick}
                      </span>
                      {state === "resolved" && pickEntry.won !== undefined && (
                        <span className="font-black text-[12px] w-3 text-center">{pickEntry.won ? "✓" : "✕"}</span>
                      )}
                      {wagerMode && pickEntry.netWinnings !== undefined && state === "resolved" && (
                        <span className={`text-[11px] font-black w-8 text-right ${pickEntry.netWinnings > 0 ? "text-neon" : "text-destructive"}`}>
                          {pickEntry.netWinnings > 0 ? "+" : ""}{formatRs(pickEntry.netWinnings)}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </motion.div>
  );
};

function getStakeLabel(roomStakeTier: WagerTier): string {
  return `${roomStakeTier === "small" ? "Chai" : roomStakeTier === "medium" ? "Martini" : "Patiala"} ${formatStake(roomStakeTier)}`;
}

export default PredictionCard;
