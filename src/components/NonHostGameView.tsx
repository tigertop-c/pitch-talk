import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PredictionCard, { type PredictionState, type FriendPick } from "./PredictionCard";
import { type GameSnapshot, type MultiplayerPlayer, type RoomPrediction } from "@/hooks/useMultiplayer";
import { checkPickWon, LOCK_TIME } from "@/lib/cricket";
import { playBallActiveSound, playWinSound, playFailSound, playClickSound, playHypeHorn, isSoundMuted } from "@/lib/sounds";
import { getStakeForTier, type WagerTier } from "@/lib/wagers";

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
  const roomStakeTier = gameSnapshot?.roomStakeTier || "small";
  const roomStakeAmount = gameSnapshot?.roomStakeAmount || getStakeForTier(roomStakeTier);

  useEffect(() => {
    if (ball?.state === "idle" && ball.id !== prevBallIdRef.current) {
      prevBallIdRef.current = ball.id;
      setMyPick(null);
      setMyPickBallId(null);
      setWaiting(false);
      if (!isSoundMuted()) playBallActiveSound();
    }
  }, [ball?.id, ball?.state]);

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

  useEffect(() => {
    if (ball?.state === "resolved" && ball.result && ball.id !== lastResolvedBallId) {
      setLastResolvedBallId(ball.id);

      if (myPick && myPickBallId === ball.id) {
        const won = checkPickWon(myPick, ball.result.type);
        setMyScore((prev) => {
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

      const type = ball.result.type;
      if (type === "six" || type === "four" || type === "wicket") {
        onHype?.(type as "four" | "six" | "wicket");
        if (!isSoundMuted()) playHypeHorn();
      }

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

  const friendPicks: FriendPick[] = currentPredictions
    .filter((prediction) => prediction.player_name !== playerName && ball && prediction.ball_id === ball.id)
    .map((prediction) => {
      const player = players.find((roomPlayer) => roomPlayer.name === prediction.player_name);
      return {
        name: prediction.player_name,
        avatar: player?.avatar || "🏏",
        pick: prediction.prediction,
        won: ball?.state === "resolved" && ball.result
          ? checkPickWon(prediction.prediction, ball.result.type)
          : undefined,
      };
    });

  let predState: PredictionState = "idle";
  if (myPick) predState = ball?.state === "resolved" ? "resolved" : "locked";
  else if (ball?.state === "resolved") predState = "resolved";
  else if (ball?.state === "pending") predState = "pending";

  const userScores: Record<string, { wins: number; total: number; streak: number; netWinnings?: number }> = {};
  players.forEach((player) => {
    userScores[player.name] = { wins: player.wins, total: player.total, streak: player.streak };
  });

  const matchInfo = gameSnapshot?.match;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
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
                roomStakeTier={roomStakeTier}
                roomStakeAmount={roomStakeAmount}
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
      </div>
    </div>
  );
};

export default NonHostGameView;
