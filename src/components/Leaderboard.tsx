import { motion } from "framer-motion";

export interface LeaderboardEntry {
  name: string;
  avatar: string;
  wins: number;
  total: number;
  streak: number;
  bestStreak: number;
}

const spring = { type: "spring" as const, damping: 25, stiffness: 350 };

const RANK_STYLES = [
  "bg-[hsl(45,100%,50%)]/10 ring-2 ring-[hsl(45,100%,50%)]/30",
  "bg-secondary ring-1 ring-border",
  "bg-secondary ring-1 ring-border",
];

const RANK_ICONS = ["👑", "🥈", "🥉"];

const getTitle = (accuracy: number, streak: number) => {
  if (accuracy >= 80) return "Nostradamus 🔮";
  if (streak >= 5) return "On Fire 🔥";
  if (accuracy >= 60) return "Cricket Brain 🧠";
  if (streak >= 3) return "Hot Streak ⚡";
  if (accuracy >= 40) return "Decent Read 👀";
  if (accuracy >= 20) return "Village Cricketer 🏏";
  return "Certified Clown 🤡";
};

const Leaderboard = ({ entries }: { entries: LeaderboardEntry[] }) => {
  const sorted = [...entries]
    .filter(e => e.total > 0)
    .sort((a, b) => {
      const accA = a.total > 0 ? a.wins / a.total : 0;
      const accB = b.total > 0 ? b.wins / b.total : 0;
      if (accB !== accA) return accB - accA;
      return b.bestStreak - a.bestStreak;
    });

  if (sorted.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-4xl mb-3">🏏</p>
        <p className="text-sm text-muted-foreground font-medium">No predictions yet. Start playing to see the leaderboard!</p>
      </div>
    );
  }

  return (
    <div className="px-4">
      <div className="space-y-2">
        {sorted.map((entry, i) => {
          const accuracy = entry.total > 0 ? Math.round((entry.wins / entry.total) * 100) : 0;
          const title = getTitle(accuracy, entry.bestStreak);
          const isTop3 = i < 3;

          return (
            <motion.div
              key={entry.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...spring, delay: i * 0.06 }}
              className={`ios-card p-3.5 flex items-center gap-3 ${isTop3 ? RANK_STYLES[i] : ""}`}
            >
              {/* Rank */}
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                {isTop3 ? (
                  <span className="text-xl">{RANK_ICONS[i]}</span>
                ) : (
                  <span className="text-sm font-bold text-muted-foreground">#{i + 1}</span>
                )}
              </div>

              {/* Avatar */}
              <div className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary text-lg flex-shrink-0">
                {entry.avatar}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-foreground truncate">{entry.name}</span>
                  {entry.streak >= 3 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive font-semibold">
                      🔥 {entry.streak}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{title}</p>
              </div>

              {/* Stats */}
              <div className="text-right flex-shrink-0">
                <p className={`text-lg font-black ${accuracy >= 50 ? "text-neon" : "text-foreground"}`}>
                  {accuracy}%
                </p>
                <p className="text-[9px] text-muted-foreground font-medium">
                  {entry.wins}/{entry.total} correct
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Leaderboard;
