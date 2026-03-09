import { useState, useCallback, useRef } from "react";

export interface BallEvent {
  over: number;
  ball: number;
  result: "dot" | "single" | "double" | "triple" | "four" | "six" | "wicket" | "wide" | "noball";
  runs: number;
  label: string;
}

export interface Batsman {
  name: string;
  runs: number;
  balls: number;
  isOnStrike: boolean;
}

export interface MatchState {
  runs: number;
  wickets: number;
  overs: number;
  balls: number;
  currentBowler: string;
  ballEvents: BallEvent[];
  batsmen: [Batsman, Batsman];
  target: number | null;
}

const BOWLERS = ["Bumrah", "Archer", "Boult", "Nortje", "Kuldeep"];
const BATSMEN_POOL = ["Shaw", "Pant", "Warner", "Marsh", "Axar", "Powell", "Stubbs", "Agarwal", "Salt", "Hope"];

const BALL_OUTCOMES: { result: BallEvent["result"]; runs: number; label: string; weight: number; legal: boolean }[] = [
  { result: "dot", runs: 0, label: "DOT BALL", weight: 32, legal: true },
  { result: "single", runs: 1, label: "SINGLE", weight: 23, legal: true },
  { result: "double", runs: 2, label: "TWO RUNS", weight: 8, legal: true },
  { result: "triple", runs: 3, label: "THREE RUNS", weight: 2, legal: true },
  { result: "four", runs: 4, label: "FOUR! 🟢", weight: 14, legal: true },
  { result: "six", runs: 6, label: "SIX! 🔵", weight: 8, legal: true },
  { result: "wicket", runs: 0, label: "WICKET! 🔴", weight: 5, legal: true },
  { result: "wide", runs: 1, label: "WIDE", weight: 5, legal: false },
  { result: "noball", runs: 1, label: "NO BALL", weight: 3, legal: false },
];

function weightedRandom() {
  const total = BALL_OUTCOMES.reduce((s, o) => s + o.weight, 0);
  let r = Math.random() * total;
  for (const outcome of BALL_OUTCOMES) {
    r -= outcome.weight;
    if (r <= 0) return outcome;
  }
  return BALL_OUTCOMES[0];
}

export function formatBall(overs: number, balls: number) {
  return `${overs}.${balls}`;
}

export function useMatchState() {
  const nextBatsmanIdx = useRef(2);
  const [match, setMatch] = useState<MatchState>({
    runs: 0,
    wickets: 0,
    overs: 0,
    balls: 0,
    currentBowler: "Bumrah",
    ballEvents: [],
    batsmen: [
      { name: BATSMEN_POOL[0], runs: 0, balls: 0, isOnStrike: true },
      { name: BATSMEN_POOL[1], runs: 0, balls: 0, isOnStrike: false },
    ],
    target: 185,
  });

  const ballIdRef = useRef(0);

  const nextBall = useCallback((): BallEvent => {
    const outcome = weightedRandom();
    ballIdRef.current += 1;

    setMatch((prev) => {
      const isLegal = outcome.result !== "wide" && outcome.result !== "noball";
      let newBalls = isLegal ? prev.balls + 1 : prev.balls;
      let newOvers = prev.overs;
      let newBowler = prev.currentBowler;

      if (newBalls > 6) {
        newBalls = 1;
        newOvers += 1;
        newBowler = BOWLERS[Math.floor(Math.random() * BOWLERS.length)];
      }

      const event: BallEvent = {
        over: newOvers,
        ball: newBalls,
        result: outcome.result,
        runs: outcome.runs,
        label: outcome.label,
      };

      // Update batsmen
      let newBatsmen: [Batsman, Batsman] = [{ ...prev.batsmen[0] }, { ...prev.batsmen[1] }];
      const strikerIdx = newBatsmen[0].isOnStrike ? 0 : 1;

      if (outcome.result === "wicket") {
        // New batsman comes in
        const newName = BATSMEN_POOL[nextBatsmanIdx.current % BATSMEN_POOL.length];
        nextBatsmanIdx.current += 1;
        newBatsmen[strikerIdx] = { name: newName, runs: 0, balls: 0, isOnStrike: true };
        if (isLegal) newBatsmen[strikerIdx].balls = 1;
      } else {
        newBatsmen[strikerIdx].runs += outcome.runs;
        if (isLegal) newBatsmen[strikerIdx].balls += 1;
        // Rotate strike on odd runs or end of over
        const oddRuns = outcome.runs % 2 === 1;
        const endOfOver = newBalls === 6 && isLegal;
        if (oddRuns !== endOfOver) {
          // XOR: swap strike
          newBatsmen[0].isOnStrike = !newBatsmen[0].isOnStrike;
          newBatsmen[1].isOnStrike = !newBatsmen[1].isOnStrike;
        }
      }

      return {
        runs: prev.runs + outcome.runs,
        wickets: prev.wickets + (outcome.result === "wicket" ? 1 : 0),
        overs: newOvers,
        balls: newBalls,
        currentBowler: newBowler,
        ballEvents: [...prev.ballEvents.slice(-20), event],
        batsmen: newBatsmen,
        target: prev.target,
      };
    });

    return {
      over: 0, // actual value set in state
      ball: 0,
      result: outcome.result,
      runs: outcome.runs,
      label: outcome.label,
    };
  }, []);

  const crr = match.overs + match.balls / 6 > 0
    ? (match.runs / (match.overs + match.balls / 6)).toFixed(2)
    : "0.00";

  return { match, nextBall, crr };
}
