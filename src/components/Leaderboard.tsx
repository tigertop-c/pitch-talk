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
  // 1st — gold glow
  "bg-gradient-to-r from-amber-500/15 via-yellow-400/10 to-amber-500/15 ring-2 ring-amber-400/40",
  // 2nd — silver subtle
  "bg-gradient-to-r from-slate-400/10 via-slate-300/5 to-slate-400/10 ring-1 ring-slate-400/30",
  // 3rd — bronze subtle
  "bg-gradient-to-r from-orange-700/10 via-orange-600/5 to-orange-700/10 ring-1 ring-orange-600/25",
];

const RANK_ICONS = ["👑", "🥈", "🥉"];

const getTitle = (accuracy: number, streak: number) => {
  if (accuracy >= 80) return { text: "Nostradamus 🔮", style: "text-neon font-bold" };
  if (streak >= 5) return { text: "On Fire 🔥", style: "text-destructive font-bold" };
  if (accuracy >= 60) return { text: "Cricket Brain 🧠", style: "text-primary font-bold" };
  if (streak >= 3) return { text: "Hot Streak ⚡", style: "text-amber-400 font-bold" };
  if (accuracy >= 40) return { text: "Decent Read 👀", style: "text-foreground" };
  if (accuracy >= 20) return { text: "Village Cricketer 🏏", style: "text-muted-foreground" };
  return { text: "Certified Clown 🤡", style: "text-muted-foreground" };
};

const getAccuracyColor = (accuracy: number) => {
  if (accuracy >= 70) return "text-neon";
  if (accuracy >= 50) return "text-primary";
  if (accuracy >= 30) return "text-amber-400";
  return "text-muted-foreground";
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
        <p className="text-5xl mb-3">🏏</p>
        <p className="text-sm text-muted-foreground font-medium">No predictions yet. Start playing to see the leaderboard!</p>
      </div>
    );
  }

  return (
    <div className="px-4">
      {/* Title bar */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏆</span>
          <span className="text-[13px] font-black text-foreground uppercase tracking-wide">Leaderboard</span>
        </div>
        <span className="text-[10px] text-muted-foreground font-medium">
          {sorted.length} player{sorted.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-2">
        {sorted.map((entry, i) => {
          const accuracy = entry.total > 0 ? Math.round((entry.wins / entry.total) * 100) : 0;
          const { text: title, style: titleStyle } = getTitle(accuracy, entry.bestStreak);
          const isTop3 = i < 3;
          const isFirst = i === 0;

          return (
            <motion.div
              key={entry.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...spring, delay: i * 0.06 }}
              className={`ios-card p-3.5 flex items-center gap-3 relative overflow-hidden ${isTop3 ? RANK_STYLES[i] : ""}`}
            >
              {/* Gold shimmer overlay for #1 */}
              {isFirst && (
                <div className="absolute inset-0 animate-gold-shimmer pointer-events-none" />
              )}

              {/* Rank */}
              <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-full ${
                isFirst ? "bg-amber-400/20" : isTop3 ? "bg-secondary" : ""
              }`}>
                {isTop3 ? (
                  <span className={`${isFirst ? "text-2xl" : "text-xl"}`}>{RANK_ICONS[i]}</span>
                ) : (
                  <span className="text-sm font-bold text-muted-foreground">#{i + 1}</span>
                )}
              </div>

              {/* Avatar */}
              <div className={`w-10 h-10 flex items-center justify-center rounded-full text-lg flex-shrink-0 ${
                isFirst ? "bg-amber-400/15 ring-2 ring-amber-400/30" : "bg-secondary"
              }`}>
                {entry.avatar}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 relative z-10">
                <div className="flex items-center gap-2">
                  <span className={`text-[13px] font-bold truncate ${isFirst ? "text-amber-300" : "text-foreground"}`}>
                    {entry.name}
                  </span>
                  {entry.streak >= 3 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive font-bold"
                    >
                      🔥 {entry.streak}
                    </motion.span>
                  )}
                </div>
                <p className={`text-[10px] font-medium mt-0.5 ${titleStyle}`}>{title}</p>
              </div>

              {/* Stats */}
              <div className="text-right flex-shrink-0 relative z-10">
                <p className={`text-lg font-black ${getAccuracyColor(accuracy)}`}>
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
