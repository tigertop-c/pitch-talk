import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";
import { formatRs } from "@/lib/wagers";

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
    netWinnings: number;
    amountWagered: number;
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
  overNetChange?: number;
  teamAllegiances?: { team1: string; team1Count: number; team2: string; team2Count: number };
  biggestHit?: { name: string; avatar: string; net: number } | null;
  bravestMiss?: { name: string; avatar: string; net: number } | null;
  overNetWinner?: { name: string; avatar: string; net: number } | null;
  roomStakeTier?: string;
}

interface OverSummaryProps {
  data: OverSummaryData;
  onInvite?: () => void;
}

const spring = { type: "spring" as const, damping: 25, stiffness: 350 };

const getAccuracyColor = (accuracy: number) => {
  if (accuracy >= 70) return "text-neon";
  if (accuracy >= 50) return "text-primary";
  if (accuracy >= 30) return "text-amber-400";
  return "text-muted-foreground";
};

const OverSummary = ({ data, onInvite }: OverSummaryProps) => {
  const activeStandings = data.standings
    .filter(s => s.total > 0 || s.amountWagered > 0)
    .sort((a, b) => b.netWinnings - a.netWinnings || b.accuracy - a.accuracy || b.wins - a.wins)
    .slice(0, 5);

  const totalPlayers = data.standings.filter(s => s.total > 0 || s.amountWagered > 0).length;
  const needsMore = data.activePlayers < data.maxPlayers;

  const matchSummary = data.matchTarget
    ? `${data.matchRuns}/${data.matchWickets} (${data.matchOvers}) • Need ${data.matchTarget - data.matchRuns}`
    : `${data.matchRuns}/${data.matchWickets} (${data.matchOvers})`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={spring}
      className="mx-4 my-2"
    >
      <div className="ios-card p-4 relative overflow-hidden border-l-4 border-l-primary">
        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-sm">📊</span>
            <span className="text-[13px] font-black text-foreground">End of Over {data.overNumber}</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
            Slip recap
          </span>
        </div>

        <div className="px-3 py-2 mb-2.5 rounded-xl bg-secondary/70 text-center relative z-10">
          <span className="text-[12px] font-bold text-foreground">{matchSummary}</span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3 relative z-10">
          {(data.overRuns ?? 0) > 0 && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-secondary text-muted-foreground">
              🏏 {data.overRuns} runs
            </span>
          )}
          {(data.overWickets ?? 0) > 0 && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-destructive/15 text-destructive ring-1 ring-destructive/15">
              💀 {data.overWickets} wicket{data.overWickets! > 1 ? "s" : ""}
            </span>
          )}
          {data.overNetChange !== undefined && (
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${data.overNetChange >= 0 ? "bg-neon/10 text-neon" : "bg-destructive/10 text-destructive"}`}>
              {data.overNetChange >= 0 ? "💸" : "🥶"} {formatRs(data.overNetChange)}
            </span>
          )}
        </div>

        {data.teamAllegiances && (
          <div className="flex items-center justify-center gap-3 mb-3 px-3 py-2 rounded-xl bg-secondary/40 relative z-10">
            <span className="text-[10px] font-bold text-primary">
              {data.teamAllegiances.team1} ×{data.teamAllegiances.team1Count}
            </span>
            <span className="text-[10px] text-muted-foreground font-semibold">vs</span>
            <span className="text-[10px] font-bold text-primary">
              {data.teamAllegiances.team2} ×{data.teamAllegiances.team2Count}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 mb-3 relative z-10">
          {data.biggestHit && (
            <div className="rounded-xl bg-neon/10 border border-neon/15 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-neon font-bold">Biggest hit</p>
              <p className="text-[12px] font-semibold text-foreground">{data.biggestHit.avatar} {data.biggestHit.name}</p>
              <p className="text-[10px] text-neon font-bold">{formatRs(data.biggestHit.net)}</p>
            </div>
          )}
          {data.bravestMiss && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/15 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-destructive font-bold">Bravest miss</p>
              <p className="text-[12px] font-semibold text-foreground">{data.bravestMiss.avatar} {data.bravestMiss.name}</p>
              <p className="text-[10px] text-destructive font-bold">{formatRs(data.bravestMiss.net)}</p>
            </div>
          )}
          {data.overNetWinner && (
            <div className="rounded-xl bg-primary/10 border border-primary/15 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-primary font-bold">Net winner</p>
              <p className="text-[12px] font-semibold text-foreground">{data.overNetWinner.avatar} {data.overNetWinner.name}</p>
              <p className="text-[10px] text-primary font-bold">{formatRs(data.overNetWinner.net)}</p>
            </div>
          )}
        </div>

        {activeStandings.length > 0 && (
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                🏆 Top {Math.min(5, activeStandings.length)}
              </p>
              {totalPlayers > 5 && (
                <span className="text-[9px] text-muted-foreground">+{totalPlayers - 5} more</span>
              )}
            </div>
            <div className="space-y-1.5">
              {activeStandings.map((s, i) => (
                <div key={s.name} className="flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="w-4 text-center text-[10px] font-bold text-muted-foreground flex-shrink-0">
                      {i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                    </span>
                    <span className="text-[11px]">{s.avatar}</span>
                    <span className="text-[11px] font-bold truncate text-foreground">{s.name}</span>
                    <span className={`text-[9px] font-bold ${s.netWinnings >= 0 ? "text-neon" : "text-destructive"}`}>
                      {formatRs(s.netWinnings)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`text-[10px] font-black w-7 text-right ${getAccuracyColor(s.accuracy)}`}>
                      {s.accuracy}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
