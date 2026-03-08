import { motion } from "framer-motion";
import { UserPlus, MessageCircle } from "lucide-react";

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
  activePlayers: number;
  maxPlayers: number;
  roomId: string;
  matchRuns: number;
  matchWickets: number;
  matchOvers: string;
  matchTarget: number | null;
}

interface OverSummaryProps {
  data: OverSummaryData;
  onInvite?: () => void;
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
  if (accuracy >= 40) return { title: "Decent Read 👌", style: "text-muted-foreground" };
  if (accuracy >= 20) return { title: "Still Learning 📚", style: "text-muted-foreground" };
  return { title: "Bold Guesser 🎲", style: "text-muted-foreground" };
};

const OverSummary = ({ data, onInvite }: OverSummaryProps) => {
  const activeStandings = data.standings
    .filter(s => s.total > 0)
    .sort((a, b) => b.accuracy - a.accuracy || b.wins - a.wins)
    .slice(0, 5); // Top 5 only

  const totalPlayers = data.standings.filter(s => s.total > 0).length;
  const needsMore = data.activePlayers < data.maxPlayers;

  // Game summary stats
  const matchSummary = data.matchTarget
    ? `${data.matchRuns}/${data.matchWickets} (${data.matchOvers}) • Need ${data.matchTarget - data.matchRuns} off ${120 - (parseInt(data.matchOvers) * 6 + parseInt(data.matchOvers.split('.')[1] || '0'))} balls`
    : `${data.matchRuns}/${data.matchWickets} (${data.matchOvers})`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={spring}
      className="mx-4 my-2"
    >
      <div className="ios-card p-4 border-l-4" style={{ borderLeftColor: "hsl(var(--primary))" }}>
        {/* Header + Match Score */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">📊</span>
            <span className="text-[13px] font-bold text-foreground">End of Over {data.overNumber}</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium px-2 py-0.5 bg-secondary rounded-full">
            Summary
          </span>
        </div>

        {/* Match score line */}
        <div className="px-2 py-1.5 mb-3 rounded-lg bg-secondary/60 text-center">
          <span className="text-[11px] font-semibold text-foreground">{matchSummary}</span>
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

        {/* Top 5 Standings */}
        {activeStandings.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                🏆 Top {Math.min(5, activeStandings.length)}
              </p>
              {totalPlayers > 5 && (
                <span className="text-[9px] text-muted-foreground">
                  +{totalPlayers - 5} more playing
                </span>
              )}
            </div>
            <div className="space-y-1.5">
              {activeStandings.map((s, i) => {
                const streakBadge = getStreakBadge(s.streak);
                const title = getTitle(s.accuracy, s.total);
                return (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="w-4 text-center text-[10px] font-bold text-muted-foreground flex-shrink-0">
                        {i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                      </span>
                      <span className="text-[11px]">{s.avatar}</span>
                      <span className={`text-[11px] font-semibold truncate ${s.name === "You" ? "text-primary" : "text-foreground"}`}>
                        {s.name}
                      </span>
                      {streakBadge && (
                        <span className={`text-[7px] font-bold px-1 py-0.5 rounded-full flex-shrink-0 ${streakBadge.style}`}>
                          {streakBadge.label}
                        </span>
                      )}
                      {title && (
                        <span className={`text-[8px] font-semibold flex-shrink-0 ${title.style}`}>
                          {title.title}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <div className="w-10 h-1 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${s.accuracy}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-primary w-7 text-right">
                        {s.accuracy}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Invite CTA if room not full */}
        {needsMore && onInvite && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onInvite}
            className="w-full mt-3 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold bg-neon/10 text-neon active:bg-neon/20 transition-colors"
          >
            <UserPlus size={12} />
            Room has {data.maxPlayers - data.activePlayers} spots — Invite friends
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default OverSummary;
