import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PredictionCard, { type PredictionState, type BallResult, type FriendPick } from "./PredictionCard";
import { type GameSnapshot, type MultiplayerPlayer, type RoomPrediction } from "@/hooks/useMultiplayer";
import { checkPickWon, LOCK_TIME } from "@/lib/cricket";
import { playBallActiveSound, playWinSound, playFailSound, playClickSound, playHypeHorn, isSoundMuted } from "@/lib/sounds";

interface NonHostGameViewProps {
  playerName: string;
  playerAvatar: string;
  gameSnapshot: GameSnapshot | null;
  players: MultiplayerPlayer[];
  currentPredictions: RoomPrediction[];
  onPick: (ballId: number, pick: string) => void;
  onScoreUpdate: (wins: number, total: number, streak: number) => void;
  onHype?: (type: "four" | "six" | "wicket") => void;
}

const NonHostGameView = ({
  playerName, playerAvatar, gameSnapshot, players,
  currentPredictions, onPick, onScoreUpdate, onHype,
}: NonHostGameViewProps) => {
  const [myPick, setMyPick] = useState<string | null>(null);
  const [myPickBallId, setMyPickBallId] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [myScore, setMyScore] = useState({ wins: 0, total: 0, streak: 0 });
  const [lastResolvedBallId, setLastResolvedBallId] = useState<number | null>(null);
  const [waiting, setWaiting] = useState(true);
  const prevBallIdRef = useRef<number | null>(null);

  const ball = gameSnapshot?.ball;

  // When new ball opens, reset pick and play sound
  useEffect(() => {
    if (ball?.state === "idle" && ball.id !== prevBallIdRef.current) {
      prevBallIdRef.current = ball.id;
      setMyPick(null);
      setMyPickBallId(null);
      setWaiting(false);
      if (!isSoundMuted()) {
        playBallActiveSound();
      }
    }
  }, [ball?.id, ball?.state]);

  // Countdown timer
  useEffect(() => {
    if (ball?.state === "idle" && ball.openedAt) {
      const tick = () => {
        const elapsed = (Date.now() - ball.openedAt) / 1000;
        const remaining = Math.max(0, LOCK_TIME - elapsed);
        setCountdown(Math.ceil(remaining));
      };
      tick();
      const interval = setInterval(tick, 1000);
      return () => clearInterval(interval);
    }
  }, [ball?.id, ball?.state, ball?.openedAt]);

  // When ball resolves, score my pick
  useEffect(() => {
    if (ball?.state === "resolved" && ball.result && ball.id !== lastResolvedBallId) {
      setLastResolvedBallId(ball.id);

      if (myPick && myPickBallId === ball.id) {
        const won = checkPickWon(myPick, ball.result.type);
        setMyScore(prev => {
          const newWins = prev.wins + (won ? 1 : 0);
          const newTotal = prev.total + 1;
          const newStreak = won ? prev.streak + 1 : 0;
          onScoreUpdate(newWins, newTotal, newStreak);
          return { wins: newWins, total: newTotal, streak: newStreak };
        });

        if (!isSoundMuted()) {
          if (won) playWinSound();
          else playFailSound();
        }
      }

      // Hype for big moments
      const type = ball.result.type;
      if (type === "six" || type === "four" || type === "wicket") {
        onHype?.(type as "four" | "six" | "wicket");
        if (!isSoundMuted()) {
          playHypeHorn();
        }
      }

      // Show waiting after result
      setTimeout(() => setWaiting(true), 3000);
    }
  }, [ball?.state, ball?.id, ball?.result, myPick, myPickBallId, lastResolvedBallId, onScoreUpdate, onHype]);

  const handlePick = useCallback((pick: string) => {
    if (myPick || !ball || ball.state !== "idle") return;
    setMyPick(pick);
    setMyPickBallId(ball.id);
    onPick(ball.id, pick);
    if (!isSoundMuted()) playClickSound();
  }, [myPick, ball, onPick]);

  // Build friend picks from currentPredictions
  const friendPicks: FriendPick[] = currentPredictions
    .filter(p => p.player_name !== playerName && ball && p.ball_id === ball.id)
    .map(p => {
      const player = players.find(pl => pl.name === p.player_name);
      return {
        name: p.player_name,
        avatar: player?.avatar || "🏏",
        pick: p.prediction,
        won: ball?.state === "resolved" && ball.result
          ? checkPickWon(p.prediction, ball.result.type)
          : undefined,
      };
    });

  // Determine prediction state for the card
  let predState: PredictionState = "idle";
  if (myPick) {
    predState = ball?.state === "resolved" ? "resolved" : "locked";
  } else if (ball?.state === "resolved") {
    predState = "resolved";
  } else if (ball?.state === "pending") {
    predState = "pending";
  }

  const userScores: Record<string, { wins: number; total: number; streak: number }> = {};
  players.forEach(p => {
    userScores[p.name] = { wins: p.wins, total: p.total, streak: p.streak };
  });

  const matchInfo = gameSnapshot?.match;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Match score bar */}
      {matchInfo && (
        <div className="flex items-center justify-center gap-4 px-4 py-2 bg-secondary/50 border-b border-border">
          <span className="text-[13px] font-bold text-foreground tabular-nums">
            {matchInfo.runs}/{matchInfo.wickets}
          </span>
          <span className="text-[11px] text-muted-foreground">
            ({matchInfo.overs}.{matchInfo.balls} ov)
          </span>
          {matchInfo.target && (
            <span className="text-[11px] text-muted-foreground">
              Target: {matchInfo.target}
            </span>
          )}
        </div>
      )}

      {/* My score */}
      <div className="flex items-center justify-between px-4 py-2 bg-secondary/30">
        <div className="flex items-center gap-2">
          <span className="text-sm">{playerAvatar}</span>
          <span className="text-[12px] font-semibold text-foreground">{playerName}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground">
            {myScore.wins}/{myScore.total} correct
          </span>
          {myScore.streak > 0 && (
            <span className="text-[10px] font-semibold text-neon">🔥 {myScore.streak}</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        <AnimatePresence mode="wait">
          {ball && !waiting ? (
            <motion.div
              key={`ball-${ball.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <PredictionCard
                id={ball.id}
                ballLabel={ball.label}
                countdown={countdown}
                state={predState}
                result={ball.state === "resolved" && ball.result
                  ? { label: ball.result.label, type: ball.result.type as any }
                  : null}
                selected={myPick}
                friendPicks={friendPicks}
                userScores={userScores}
                onPredict={handlePick}
                totalUserPredictions={myScore.total}
              />
            </motion.div>
          ) : (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 px-6"
            >
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="text-3xl mb-3"
              >
                🏏
              </motion.span>
              <p className="text-[13px] text-muted-foreground font-medium text-center">
                {ball?.state === "resolved"
                  ? "Bowler walking back..."
                  : "Waiting for next delivery..."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Players in room */}
        <div className="px-4 mt-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-2">
            Players in Room
          </p>
          <div className="flex flex-wrap gap-1.5">
            {players.map(p => (
              <div
                key={p.id}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] ${
                  p.name === playerName
                    ? "bg-primary/10 ring-1 ring-primary/30"
                    : "bg-secondary"
                }`}
              >
                <span className="text-sm">{p.avatar}</span>
                <span className="font-semibold text-foreground">{p.name}</span>
                {p.wins > 0 && (
                  <span className="text-[9px] text-muted-foreground">{p.wins}W</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NonHostGameView;
