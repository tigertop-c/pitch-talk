import { useState, useCallback, useRef } from "react";

export interface BallEvent {
  over: number;
  ball: number;
  result: "dot" | "single" | "double" | "four" | "six" | "wicket";
  runs: number;
  label: string;
}

export interface MatchState {
  runs: number;
  wickets: number;
  overs: number;
  balls: number;
  currentBowler: string;
  ballEvents: BallEvent[];
}

const BOWLERS = ["Bumrah", "Starc", "Cummins", "Hazlewood", "Zampa"];

const BALL_OUTCOMES: { result: BallEvent["result"]; runs: number; label: string; weight: number }[] = [
  { result: "dot", runs: 0, label: "DOT BALL", weight: 35 },
  { result: "single", runs: 1, label: "SINGLE", weight: 25 },
  { result: "double", runs: 2, label: "TWO RUNS", weight: 12 },
  { result: "four", runs: 4, label: "FOUR! 🟢", weight: 15 },
  { result: "six", runs: 6, label: "SIX! 🔵", weight: 8 },
  { result: "wicket", runs: 0, label: "WICKET! 🔴", weight: 5 },
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
  const [match, setMatch] = useState<MatchState>({
    runs: 184,
    wickets: 4,
    overs: 18,
    balls: 2,
    currentBowler: "Bumrah",
    ballEvents: [],
  });

  const ballIdRef = useRef(0);

  const nextBall = useCallback((): BallEvent => {
    const outcome = weightedRandom();
    ballIdRef.current += 1;

    setMatch((prev) => {
      let newBalls = prev.balls + 1;
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

      return {
        runs: prev.runs + outcome.runs,
        wickets: prev.wickets + (outcome.result === "wicket" ? 1 : 0),
        overs: newOvers,
        balls: newBalls,
        currentBowler: newBowler,
        ballEvents: [...prev.ballEvents.slice(-20), event],
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
