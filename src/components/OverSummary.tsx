import { motion } from "framer-motion";

export interface OverSummaryData {
  overNumber: number;
  overMvp: { name: string; avatar: string; correct: number; total: number } | null;
  standings: {
    name: string;
    avatar: string;
    wins: number;
    total: number;
    accuracy: number;
    streak: number;
    bestStreak: number;
  }[];
}

const spring = { type: "spring" as const, damping: 25, stiffness: 350 };

const getStreakBadge = (streak: number) => {
  if (streak >= 5) return { label: "🔥 On Fire", style: "bg-destructive/15 text-destructive" };
  if (streak >= 3) return { label: "⚡ Hot", style: "bg-neon/15 text-neon" };
  return null;
};

const getTitle = (accuracy: number, total: number) => {
  if (total < 2) return null;
  if (accuracy >= 80) return { title: "Nostradamus 🔮", style: "text-neon" };
  if (accuracy >= 60) return { title: "Cricket Brain 🧠", style: "text-primary" };
  if (accuracy >= 40) return { title: "Decent Read", style: "text-muted-foreground" };
  if (accuracy >= 20) return { title: "Village Cricketer", style: "text-muted-foreground" };
  return { title: "Certified Clown 🤡", style: "text-destructive" };
};

const OverSummary = ({ data }: { data: OverSummaryData }) => {
  const activeStandings = data.standings
    .filter(s => s.total > 0)
    .sort((a, b) => b.accuracy - a.accuracy || b.wins - a.wins);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={spring}
      className="mx-4 my-2"
    >
      <div className="ios-card p-4 border-l-4" style={{ borderLeftColor: "hsl(var(--primary))" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">📊</span>
            <span className="text-[13px] font-bold text-foreground">End of Over {data.overNumber}</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium px-2 py-0.5 bg-secondary rounded-full">
            Summary
          </span>
        </div>

        {/* Over MVP */}
        {data.overMvp && data.overMvp.correct > 0 && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-neon/10">
            <span className="text-lg">{data.overMvp.avatar}</span>
            <div>
              <p className="text-[12px] font-bold text-neon">
                {data.overMvp.name} owned this over!
              </p>
              <p className="text-[10px] text-muted-foreground">
                {data.overMvp.correct}/{data.overMvp.total} correct
              </p>
            </div>
          </div>
        )}

        {/* Standings with streaks & titles */}
        {activeStandings.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
              🏆 Leaderboard
            </p>
            <div className="space-y-2">
              {activeStandings.map((s, i) => {
                const streakBadge = getStreakBadge(s.streak);
                const title = getTitle(s.accuracy, s.total);
                return (
                  <div key={s.name} className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 text-center text-[11px] font-bold text-muted-foreground">
                          {i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                        </span>
                        <span className="text-[12px]">{s.avatar}</span>
                        <span className={`text-[12px] font-semibold ${s.name === "You" ? "text-primary" : "text-foreground"}`}>
                          {s.name}
                        </span>
                        {streakBadge && (
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${streakBadge.style}`}>
                            {streakBadge.label}
                          </span>
                        )}
                        {s.bestStreak >= 3 && (
                          <span className="text-[8px] text-muted-foreground">
                            best: 🔥{s.bestStreak}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground">
                          {s.wins}/{s.total}
                        </span>
                        <div className="w-14 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${s.accuracy}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-primary w-8 text-right">
                          {s.accuracy}%
                        </span>
                      </div>
                    </div>
                    {title && (
                      <div className="pl-[26px]">
                        <span className={`text-[9px] font-semibold ${title.style}`}>
                          {title.title}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default OverSummary;
