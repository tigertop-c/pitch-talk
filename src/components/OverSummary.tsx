import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";

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
    team?: string;
  }[];
  activePlayers: number;
  maxPlayers: number;
  roomId: string;
  matchRuns: number;
  matchWickets: number;
  matchOvers: string;
  matchTarget: number | null;
  overRuns?: number;
  overWickets?: number;
  overBoundaries?: number;
  overExtras?: number;
  teamAllegiances?: { team1: string; team1Count: number; team2: string; team2Count: number };
}

interface OverSummaryProps {
  data: OverSummaryData;
  onInvite?: () => void;
}

const spring = { type: "spring" as const, damping: 25, stiffness: 350 };

const getStreakBadge = (streak: number) => {
  if (streak >= 5) return { label: "🔥 On Fire", style: "bg-destructive/15 text-destructive" };
  if (streak >= 3) return { label: "⚡ Hot", style: "bg-amber-400/15 text-amber-400" };
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

const getAccuracyColor = (accuracy: number) => {
  if (accuracy >= 70) return "text-neon";
  if (accuracy >= 50) return "text-primary";
  if (accuracy >= 30) return "text-amber-400";
  return "text-muted-foreground";
};

const OverSummary = ({ data, onInvite }: OverSummaryProps) => {
  const activeStandings = data.standings
    .filter(s => s.total > 0)
    .sort((a, b) => b.accuracy - a.accuracy || b.wins - a.wins)
    .slice(0, 5);

  const totalPlayers = data.standings.filter(s => s.total > 0).length;
  const needsMore = data.activePlayers < data.maxPlayers;

  const matchSummary = data.matchTarget
    ? `${data.matchRuns}/${data.matchWickets} (${data.matchOvers}) • Need ${data.matchTarget - data.matchRuns} off ${120 - (parseInt(data.matchOvers) * 6 + parseInt(data.matchOvers.split('.')[1] || '0'))} balls`
    : `${data.matchRuns}/${data.matchWickets} (${data.matchOvers})`;

  // Determine over quality
  const isExplosiveOver = (data.overRuns ?? 0) >= 15;
  const isQuietOver = (data.overRuns ?? 0) <= 4 && (data.overWickets ?? 0) === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={spring}
      className="mx-4 my-2"
    >
      <div className={`ios-card p-4 relative overflow-hidden ${
        isExplosiveOver ? "border-l-4 border-l-neon" : "border-l-4 border-l-primary"
      }`}>
        {/* Decorative gradient for explosive overs */}
        {isExplosiveOver && (
          <div className="absolute top-0 right-0 w-32 h-32 bg-neon/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        )}

        {/* Header + Match Score */}
        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-sm">{isExplosiveOver ? "🔥" : isQuietOver ? "🤫" : "📊"}</span>
            <span className="text-[13px] font-black text-foreground">End of Over {data.overNumber}</span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isExplosiveOver ? "bg-neon/15 text-neon" : "bg-secondary text-muted-foreground"
          }`}>
            {isExplosiveOver ? "Explosive!" : "Summary"}
          </span>
        </div>

        {/* Match score */}
        <div className="px-3 py-2 mb-2.5 rounded-xl bg-secondary/70 text-center relative z-10">
          <span className="text-[12px] font-bold text-foreground">{matchSummary}</span>
        </div>

        {/* Over highlights - hype stats */}
        <div className="flex flex-wrap gap-1.5 mb-3 relative z-10">
          {(data.overRuns !== undefined && data.overRuns > 0) && (
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
              data.overRuns >= 15 ? "bg-neon/15 text-neon ring-1 ring-neon/20" :
              data.overRuns >= 10 ? "bg-primary/15 text-primary" :
              "bg-secondary text-muted-foreground"
            }`}>
              {data.overRuns >= 15 ? "🔥" : "🏏"} {data.overRuns} runs
            </span>
          )}
          {(data.overWickets !== undefined && data.overWickets > 0) && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-destructive/15 text-destructive ring-1 ring-destructive/15">
              💀 {data.overWickets} wicket{data.overWickets > 1 ? "s" : ""}
            </span>
          )}
          {(data.overBoundaries !== undefined && data.overBoundaries > 0) && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-primary/15 text-primary">
              💥 {data.overBoundaries} boundar{data.overBoundaries > 1 ? "ies" : "y"}
            </span>
          )}
          {(data.overExtras !== undefined && data.overExtras > 0) && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-muted text-muted-foreground">
              😬 {data.overExtras} extra{data.overExtras > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Team allegiances */}
        {data.teamAllegiances && (
          <div className="flex items-center justify-center gap-3 mb-3 px-3 py-2 rounded-xl bg-secondary/40 relative z-10">
            <span className="text-[10px] font-bold text-primary">
              {data.teamAllegiances.team1} 💙 ×{data.teamAllegiances.team1Count}
            </span>
            <span className="text-[10px] text-muted-foreground font-semibold">vs</span>
            <span className="text-[10px] font-bold text-primary">
              {data.teamAllegiances.team2} 💙 ×{data.teamAllegiances.team2Count}
            </span>
          </div>
        )}

        {/* Over MVP — enhanced callout */}
        {data.overMvp && data.overMvp.correct > 0 && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 15, delay: 0.1 }}
            className="flex items-center gap-3 mb-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-yellow-400/10 to-amber-500/15 ring-1 ring-amber-400/25 relative overflow-hidden"
          >
            {/* Shimmer */}
            <div className="absolute inset-0 animate-gold-shimmer pointer-events-none" />
            <span className="text-2xl relative z-10">{data.overMvp.avatar}</span>
            <div className="relative z-10">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">Over MVP</span>
                <span className="text-sm">👑</span>
              </div>
              <p className="text-[12px] font-bold text-foreground">
                {data.overMvp.name}
              </p>
              <p className="text-[10px] text-muted-foreground font-medium">
                {data.overMvp.correct}/{data.overMvp.total} correct this over
              </p>
            </div>
          </motion.div>
        )}

        {/* Top 5 Standings */}
        {activeStandings.length > 0 && (
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
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
                  <div key={s.name} className="flex items-center justify-between py-0.5">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="w-4 text-center text-[10px] font-bold text-muted-foreground flex-shrink-0">
                        {i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                      </span>
                      <span className="text-[11px]">{s.avatar}</span>
                      <span className={`text-[11px] font-bold truncate ${s.name === "You" ? "text-primary" : "text-foreground"}`}>
                        {s.name}
                      </span>
                      {s.team && (
                        <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-secondary text-muted-foreground flex-shrink-0">
                          {s.team}
                        </span>
                      )}
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
                      <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${s.accuracy}%` }}
                          transition={{ duration: 0.6, delay: i * 0.08 }}
                          className={`h-full rounded-full ${
                            s.accuracy >= 70 ? "bg-neon" :
                            s.accuracy >= 50 ? "bg-primary" :
                            s.accuracy >= 30 ? "bg-amber-400" :
                            "bg-muted-foreground"
                          }`}
                        />
                      </div>
                      <span className={`text-[10px] font-black w-7 text-right ${getAccuracyColor(s.accuracy)}`}>
                        {s.accuracy}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Invite CTA */}
        {needsMore && onInvite && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onInvite}
            className="w-full mt-3 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold bg-neon/10 text-neon active:bg-neon/20 transition-colors ring-1 ring-neon/15 relative z-10"
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
