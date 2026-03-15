import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, ChevronDown, ChevronUp, UserPlus } from "lucide-react";
import { formatRs } from "@/lib/wagers";

export interface SquadEntry {
  name: string;
  avatar: string;
  wins: number;
  total: number;
  streak: number;
  netWinnings: number;
  amountWagered: number;
  isYou?: boolean;
  isHuman?: boolean;
  status?: "watching" | "joining_next_ball" | "active";
}

interface SquadStandingsBarProps {
  entries: SquadEntry[];
  onOpenLeaderboard?: () => void;
  onInvite?: () => void;
  spotsLeft?: number;
  showFinancials?: boolean;
}

const spring = { type: "spring" as const, damping: 25, stiffness: 350 };
const rankEmojis = ["🥇", "🥈", "🥉"];

function getStatusLabel(status?: SquadEntry["status"]) {
  if (status === "watching") return "Watching";
  if (status === "joining_next_ball") return "Next ball";
  return null;
}

const SquadStandingsBar = ({ entries, onOpenLeaderboard, onInvite, spotsLeft, showFinancials = true }: SquadStandingsBarProps) => {
  const [expanded, setExpanded] = useState(false);

  const sorted = [...entries].sort((a, b) => {
    if (showFinancials && b.netWinnings !== a.netWinnings) return b.netWinnings - a.netWinnings;
    const accA = a.total > 0 ? a.wins / a.total : 0;
    const accB = b.total > 0 ? b.wins / b.total : 0;
    return accB - accA;
  });

  const top3 = sorted.slice(0, 3);

  if (entries.length < 2) return null;

  return (
    <div className="border-b border-border bg-secondary/30">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-1.5 active:bg-secondary/50 transition-colors"
      >
        <Trophy size={12} className="text-primary flex-shrink-0" />
        <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {top3.map((entry, i) => {
            const accuracy = entry.total > 0 ? Math.round((entry.wins / entry.total) * 100) : 0;
            const statusLabel = getStatusLabel(entry.status);
            return (
              <div
                key={entry.name}
                className={`flex items-center gap-1 flex-shrink-0 text-[10px] ${
                  entry.isYou ? "font-bold text-primary" : "text-foreground"
                }`}
              >
                <span className="text-[10px]">{rankEmojis[i]}</span>
                <span className="font-semibold truncate max-w-[60px]">
                  {entry.isYou ? "You" : entry.name}
                </span>
                {showFinancials ? (
                  <span className={entry.netWinnings >= 0 ? "text-neon" : "text-destructive"}>
                    {formatRs(entry.netWinnings)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">{accuracy}%</span>
                )}
                {entry.streak > 0 && (
                  <span className="text-[9px] text-neon">🔥{entry.streak}</span>
                )}
                {statusLabel && (
                  <span className="text-[9px] text-muted-foreground">{statusLabel}</span>
                )}
              </div>
            );
          })}
        </div>
        {onInvite && spotsLeft && spotsLeft > 0 && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onInvite(); }}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-neon/15 text-neon flex-shrink-0"
          >
            <UserPlus size={9} />
            Invite
          </motion.button>
        )}
        {expanded ? (
          <ChevronUp size={12} className="text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown size={12} className="text-muted-foreground flex-shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-2 space-y-1">
              {sorted.map((entry, i) => {
                const accuracy = entry.total > 0 ? Math.round((entry.wins / entry.total) * 100) : 0;
                const statusLabel = getStatusLabel(entry.status);
                return (
                  <motion.div
                    key={entry.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...spring, delay: i * 0.03 }}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[11px] ${
                      entry.isYou
                        ? "bg-primary/10 ring-1 ring-primary/20"
                        : "bg-secondary/50"
                    }`}
                  >
                    <span className="text-[11px] w-5 text-center font-bold text-muted-foreground">
                      {i < 3 ? rankEmojis[i] : `${i + 1}`}
                    </span>
                    <span className="text-sm">{entry.avatar}</span>
                    <span className={`font-semibold flex-1 truncate ${entry.isYou ? "text-primary" : "text-foreground"}`}>
                      {entry.isYou ? "You" : entry.name}
                    </span>
                    {showFinancials ? (
                      <span className={`tabular-nums ${entry.netWinnings >= 0 ? "text-neon" : "text-destructive"}`}>
                        {formatRs(entry.netWinnings)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground tabular-nums">{accuracy}%</span>
                    )}
                    <span className="text-muted-foreground tabular-nums w-8 text-right">{accuracy}%</span>
                    {entry.streak > 0 && (
                      <span className="text-[9px] text-neon font-semibold">🔥{entry.streak}</span>
                    )}
                    {statusLabel && (
                      <span className="text-[9px] text-muted-foreground font-medium">
                        {statusLabel}
                      </span>
                    )}
                  </motion.div>
                );
              })}

              {onOpenLeaderboard && (
                <button
                  onClick={onOpenLeaderboard}
                  className="w-full text-center text-[10px] font-semibold text-primary py-1.5 active:opacity-70"
                >
                  View Full Leaderboard →
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SquadStandingsBar;
