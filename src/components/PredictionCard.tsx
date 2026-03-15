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
        className={`p-3.5 ios-card transition-all duration-300 ${
          state === "idle" && !selected
            ? "animate-prediction-glow"
            : state === "resolved" && won && !expired
            ? "ring-2 ring-neon/40 animate-win-ring"
            : state === "resolved" && selected && !won
            ? "ring-2 ring-destructive/30 opacity-90"
            : ""
        } ${urgency && state === "idle" ? "ring-2 ring-destructive/20" : ""}`}
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 font-semibold text-xs bg-secondary rounded-lg">
              {ballLabel}
            </span>
            {state === "idle" && !selected && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] font-semibold text-neon">
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
              >
                🏏
              </motion.span>{" "}
              Bowling...
            </span>
          )}
        </div>

        {wagerMode ? (
          <div className="mb-2.5 rounded-xl border border-primary/10 bg-primary/5 px-3 py-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold">
              <span className="text-foreground">Stake {formatStake(roomStakeTier)}</span>
              {selected && estimatedShare !== null && state !== "resolved" && (
                <span className="text-primary">Est. share {formatRs(estimatedShare - roomStakeAmount)}</span>
              )}
              {state === "resolved" && actualNet !== null && !expired && (
                <span className={actualNet >= 0 ? "text-neon" : "text-destructive"}>
                  Net {formatRs(actualNet)}
                </span>
              )}
              {state === "resolved" && expired && (
                <span className="text-muted-foreground">No winning slips this ball</span>
              )}
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground leading-snug">
              Each ball is its own pool. Correct picks split that ball&apos;s pool. Harder picks earn more.
            </p>
          </div>
        ) : (
          <div className="mb-2.5 rounded-xl border border-secondary bg-secondary/40 px-3 py-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold">
              <span className="text-foreground">Prediction-only mode</span>
              {onInviteMore ? (
                <button
                  type="button"
                  onClick={onInviteMore}
                  className="text-primary underline underline-offset-2 active:opacity-70"
                >
                  Invite one more human to unlock Pitch Paisa
                </button>
              ) : (
                <span className="text-muted-foreground">Invite one more human to unlock Pitch Paisa</span>
              )}
            </div>
          </div>
        )}

        {state === "resolved" && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", damping: 20, delay: 0.1 }}
            className={`flex items-center gap-2 mb-2 px-3 py-2 rounded-xl ${
              expired
                ? "bg-secondary/50 border border-secondary"
                : won
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
                  won && !expired
                    ? "text-neon"
                    : expired
                    ? "text-foreground"
                    : "text-muted-foreground line-through decoration-destructive/60"
                }`}>
                  {selected}
                </span>
                <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                  {getStakeLabel(roomStakeTier)}
                </span>
                {expired ? (
                  <span className="text-xs text-muted-foreground">Pool expired. No one owes anyone.</span>
                ) : won ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 10, delay: 0.3 }}
                    className="text-xs text-neon font-bold"
                  >
                    🎯 {actualNet !== null ? `Net ${formatRs(actualNet)}` : "Nailed it!"}
                  </motion.span>
                ) : (
                  <span className="text-xs text-destructive">
                    ❌ {actualNet !== null ? `Net ${formatRs(actualNet)}` : "Miss"}
                  </span>
                )}
              </>
            ) : (
              <span className="text-[10px] text-muted-foreground/60 italic">⏭️ No prediction made</span>
            )}
          </motion.div>
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
                lg: "py-3 px-1.5 rounded-xl text-[11px]",
                md: "py-2.5 px-1 rounded-xl text-[10px]",
                sm: "py-2 px-1 rounded-xl text-[9px] opacity-80",
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

        {friendPicks.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {friendPicks.map((friendPick, i) => (
              <motion.div
                key={`${friendPick.name}-${i}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", damping: 20 }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium ${
                  state === "resolved" && friendPick.won !== undefined
                    ? friendPick.won
                      ? "bg-neon/10 text-neon"
                      : "bg-destructive/10 text-destructive"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                <span>{friendPick.avatar}</span>
                {getRankBadge(friendPick.name) && <span className="text-[8px]">{getRankBadge(friendPick.name)}</span>}
                <span className="font-semibold">{friendPick.name}</span>
                <span className="opacity-50">→</span>
                <span className="font-semibold">{friendPick.pick}</span>
                {state === "resolved" && friendPick.won !== undefined && (
                  <span>{friendPick.won ? "✓" : "✕"}</span>
                )}
                {wagerMode && friendPick.netWinnings !== undefined && (
                  <span className="text-[8px] opacity-50">{formatRs(friendPick.netWinnings)}</span>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

function getStakeLabel(roomStakeTier: WagerTier): string {
  return `${roomStakeTier === "small" ? "Chai" : roomStakeTier === "medium" ? "Martini" : "Patiala"} ${formatStake(roomStakeTier)}`;
}

export default PredictionCard;
