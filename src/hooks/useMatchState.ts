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
  innings: 1 | 2;
  inningsComplete: boolean;
  matchOver: boolean;
  firstInningsScore: number | null;
}

const MAX_OVERS = 5;
const MAX_WICKETS = 10;

const BOWLERS_1 = ["Bumrah", "Archer", "Boult", "Nortje", "Kuldeep"];
const BOWLERS_2 = ["Starc", "Rabada", "Rashid", "Shami", "Chahal"];
const BATSMEN_POOL_1 = ["Shaw", "Pant", "Warner", "Marsh", "Axar", "Powell", "Stubbs", "Agarwal", "Salt", "Hope", "Fraser-McGurk"];
const BATSMEN_POOL_2 = ["Rohit", "Ishan", "SKY", "Hardik", "Tim David", "Brevis", "Tilak", "Nehal", "Jofra", "Coetzee", "Kumar"];

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

function makeInitialState(innings: 1 | 2, firstInningsScore: number | null): MatchState {
  const pool = innings === 1 ? BATSMEN_POOL_1 : BATSMEN_POOL_2;
  const bowlers = innings === 1 ? BOWLERS_1 : BOWLERS_2;
  return {
    runs: 0,
    wickets: 0,
    overs: 0,
    balls: 0,
    currentBowler: bowlers[0],
    ballEvents: [],
    batsmen: [
      { name: pool[0], runs: 0, balls: 0, isOnStrike: true },
      { name: pool[1], runs: 0, balls: 0, isOnStrike: false },
    ],
    target: innings === 2 && firstInningsScore !== null ? firstInningsScore + 1 : null,
    innings,
    inningsComplete: false,
    matchOver: false,
    firstInningsScore,
  };
}

export function useMatchState() {
  const nextBatsmanIdx = useRef(2);
  const [match, setMatch] = useState<MatchState>(() => makeInitialState(1, null));

  const ballIdRef = useRef(0);

  const startSecondInnings = useCallback(() => {
    nextBatsmanIdx.current = 2;
    setMatch(prev => makeInitialState(2, prev.runs));
  }, []);

  const nextBall = useCallback((): BallEvent => {
    const outcome = weightedRandom();
    ballIdRef.current += 1;

    setMatch((prev) => {
      if (prev.inningsComplete || prev.matchOver) return prev;

      const bowlers = prev.innings === 1 ? BOWLERS_1 : BOWLERS_2;
      const batsmenPool = prev.innings === 1 ? BATSMEN_POOL_1 : BATSMEN_POOL_2;

      const isLegal = outcome.result !== "wide" && outcome.result !== "noball";
      let newBalls = isLegal ? prev.balls + 1 : prev.balls;
      let newOvers = prev.overs;
      let newBowler = prev.currentBowler;

      if (newBalls > 6) {
        newBalls = 1;
        newOvers += 1;
        newBowler = bowlers[Math.floor(Math.random() * bowlers.length)];
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

      const newWickets = prev.wickets + (outcome.result === "wicket" ? 1 : 0);
      const newRuns = prev.runs + outcome.runs;

      if (outcome.result === "wicket") {
        const newName = batsmenPool[nextBatsmanIdx.current % batsmenPool.length];
        nextBatsmanIdx.current += 1;
        newBatsmen[strikerIdx] = { name: newName, runs: 0, balls: 0, isOnStrike: true };
        if (isLegal) newBatsmen[strikerIdx].balls = 1;
      } else {
        newBatsmen[strikerIdx].runs += outcome.runs;
        if (isLegal) newBatsmen[strikerIdx].balls += 1;
        const oddRuns = outcome.runs % 2 === 1;
        const endOfOver = newBalls === 6 && isLegal;
        if (oddRuns !== endOfOver) {
          newBatsmen[0].isOnStrike = !newBatsmen[0].isOnStrike;
          newBatsmen[1].isOnStrike = !newBatsmen[1].isOnStrike;
        }
      }

      // Check innings completion
      const totalOvers = newOvers + (newBalls === 6 ? 1 : 0);
      const actualOvers = newBalls === 6 ? totalOvers : newOvers;
      const actualBalls = newBalls === 6 ? 0 : newBalls;
      
      // Overs done when we complete 6 legal balls of the last over
      const oversComplete = (newBalls === 6 && newOvers + 1 >= MAX_OVERS);
      const allOut = newWickets >= MAX_WICKETS;
      
      // Second innings: target chased
      const targetChased = prev.innings === 2 && prev.target !== null && newRuns >= prev.target;

      const inningsComplete = oversComplete || allOut || targetChased;
      const matchOver = prev.innings === 2 && inningsComplete;

      // Normalize overs display
      let displayOvers = newOvers;
      let displayBalls = newBalls;
      if (newBalls === 6) {
        displayOvers = newOvers + 1;
        displayBalls = 0;
      }

      return {
        runs: newRuns,
        wickets: newWickets,
        overs: displayOvers,
        balls: displayBalls,
        currentBowler: newBowler,
        ballEvents: [...prev.ballEvents.slice(-20), event],
        batsmen: newBatsmen,
        target: prev.target,
        innings: prev.innings,
        inningsComplete,
        matchOver,
        firstInningsScore: prev.firstInningsScore,
      };
    });

    return {
      over: 0,
      ball: 0,
      result: outcome.result,
      runs: outcome.runs,
      label: outcome.label,
    };
  }, []);

  const crr = match.overs + match.balls / 6 > 0
    ? (match.runs / (match.overs + match.balls / 6)).toFixed(2)
    : "0.00";

  return { match, nextBall, crr, startSecondInnings };
}
