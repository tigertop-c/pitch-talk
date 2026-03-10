import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, ChevronDown, ChevronUp, UserPlus } from "lucide-react";

export interface SquadEntry {
  name: string;
  avatar: string;
  wins: number;
  total: number;
  streak: number;
  isYou?: boolean;
}

interface SquadStandingsBarProps {
  entries: SquadEntry[];
  onOpenLeaderboard?: () => void;
  onInvite?: () => void;
  spotsLeft?: number;
}

const spring = { type: "spring" as const, damping: 25, stiffness: 350 };

const SquadStandingsBar = ({ entries, onOpenLeaderboard, onInvite, spotsLeft }: SquadStandingsBarProps) => {
  const [expanded, setExpanded] = useState(false);

  // Sort by wins desc, then accuracy desc
  const sorted = [...entries].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    const accA = a.total > 0 ? a.wins / a.total : 0;
    const accB = b.total > 0 ? b.wins / b.total : 0;
    return accB - accA;
  });

  const top3 = sorted.slice(0, 3);
  const rankEmojis = ["🥇", "🥈", "🥉"];

  if (entries.length < 2) return null;

  return (
    <div className="border-b border-border bg-secondary/30">
      {/* Compact bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-1.5 active:bg-secondary/50 transition-colors"
      >
        <Trophy size={12} className="text-primary flex-shrink-0" />
        <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {top3.map((entry, i) => (
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
              <span className="text-muted-foreground tabular-nums">{entry.wins}W</span>
              {entry.streak > 0 && (
                <span className="text-[9px] text-neon">🔥{entry.streak}</span>
              )}
            </div>
          ))}
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

      {/* Expanded view */}
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
                    <span className="text-muted-foreground tabular-nums">{entry.wins}/{entry.total}</span>
                    <span className="text-muted-foreground tabular-nums w-8 text-right">{accuracy}%</span>
                    {entry.streak > 0 && (
                      <span className="text-[9px] text-neon font-semibold">🔥{entry.streak}</span>
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
