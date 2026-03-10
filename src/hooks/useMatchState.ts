import { useState, useCallback, useRef } from "react";
import { TEAM_ROSTERS } from "../data/iplRosters";

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

const MAX_WICKETS = 10;

// Weights tuned for T20 powerplay-style scoring: ~8–10 RPO, 60–100 runs in 5 overs.
// Expected runs per ball ≈ (0*20 + 1*22 + 2*10 + 3*4 + 4*18 + 6*12 + 0*5 + 1*5 + 1*4) / 100 ≈ 1.65
const BALL_OUTCOMES: { result: BallEvent["result"]; runs: number; label: string; weight: number; legal: boolean }[] = [
  { result: "dot",    runs: 0, label: "DOT BALL",    weight: 20, legal: true  },
  { result: "single", runs: 1, label: "SINGLE",      weight: 22, legal: true  },
  { result: "double", runs: 2, label: "TWO RUNS",    weight: 10, legal: true  },
  { result: "triple", runs: 3, label: "THREE RUNS",  weight: 4,  legal: true  },
  { result: "four",   runs: 4, label: "FOUR! 🟢",    weight: 18, legal: true  },
  { result: "six",    runs: 6, label: "SIX! 🔵",     weight: 12, legal: true  },
  { result: "wicket", runs: 0, label: "WICKET! 🔴",  weight: 5,  legal: true  },
  { result: "wide",   runs: 1, label: "WIDE",        weight: 5,  legal: false },
  { result: "noball", runs: 1, label: "NO BALL",     weight: 4,  legal: false },
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

/** Build team-specific player pools.
 *  Innings 1: team1 bats, team2 bowls.
 *  Innings 2: team2 bats, team1 bowls.
 */
function buildPools(team1Short: string, team2Short: string) {
  const t1 = TEAM_ROSTERS[team1Short] ?? TEAM_ROSTERS["MI"];
  const t2 = TEAM_ROSTERS[team2Short] ?? TEAM_ROSTERS["DC"];
  return {
    inning1Batsmen: t1.batsmen.map(p => p.shortName),
    inning1Bowlers: t2.bowlers.map(p => p.shortName),
    inning2Batsmen: t2.batsmen.map(p => p.shortName),
    inning2Bowlers: t1.bowlers.map(p => p.shortName),
  };
}

function makeInitialState(
  innings: 1 | 2,
  firstInningsScore: number | null,
  batsmen: string[],
  bowlers: string[]
): MatchState {
  return {
    runs: 0,
    wickets: 0,
    overs: 0,
    balls: 0,
    currentBowler: bowlers[0] ?? "Bowler",
    ballEvents: [],
    batsmen: [
      { name: batsmen[0] ?? "Batsman1", runs: 0, balls: 0, isOnStrike: true },
      { name: batsmen[1] ?? "Batsman2", runs: 0, balls: 0, isOnStrike: false },
    ],
    target: innings === 2 && firstInningsScore !== null ? firstInningsScore + 1 : null,
    innings,
    inningsComplete: false,
    matchOver: false,
    firstInningsScore,
  };
}

export function useMatchState(maxOvers = 5) {
  const maxOversRef = useRef(maxOvers);
  maxOversRef.current = maxOvers;

  // Team-specific player pools (refs so nextBall always reads latest values)
  const poolsRef = useRef(buildPools("MI", "DC"));

  const nextBatsmanIdx = useRef(2);
  const [match, setMatch] = useState<MatchState>(() => {
    const p = poolsRef.current;
    return makeInitialState(1, null, p.inning1Batsmen, p.inning1Bowlers);
  });

  const ballIdRef = useRef(0);

  /** Call this when the game is about to start so the correct team rosters are used. */
  const resetWithTeams = useCallback((team1Short: string, team2Short: string) => {
    poolsRef.current = buildPools(team1Short, team2Short);
    nextBatsmanIdx.current = 2;
    ballIdRef.current = 0;
    const p = poolsRef.current;
    setMatch(makeInitialState(1, null, p.inning1Batsmen, p.inning1Bowlers));
  }, []);

  const startSecondInnings = useCallback(() => {
    nextBatsmanIdx.current = 2;
    setMatch(prev => {
      const p = poolsRef.current;
      return makeInitialState(2, prev.runs, p.inning2Batsmen, p.inning2Bowlers);
    });
  }, []);

  const nextBall = useCallback((): BallEvent => {
    const outcome = weightedRandom();
    ballIdRef.current += 1;

    setMatch((prev) => {
      if (prev.inningsComplete || prev.matchOver) return prev;

      const pools = poolsRef.current;
      const bowlers = prev.innings === 1 ? pools.inning1Bowlers : pools.inning2Bowlers;
      const batsmenPool = prev.innings === 1 ? pools.inning1Batsmen : pools.inning2Batsmen;

      const isLegal = outcome.result !== "wide" && outcome.result !== "noball";
      let newBalls = isLegal ? prev.balls + 1 : prev.balls;
      let newOvers = prev.overs;
      let newBowler = prev.currentBowler;

      // Rotate bowler at the start of each new over (prev.balls === 0 after display normalization)
      if (isLegal && prev.balls === 0 && prev.overs > 0) {
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
      const oversComplete = (newBalls === 6 && newOvers + 1 >= maxOversRef.current);
      const allOut = newWickets >= MAX_WICKETS;

      // Second innings: target chased
      const targetChased = prev.innings === 2 && prev.target !== null && newRuns >= prev.target;

      const inningsComplete = oversComplete || allOut || targetChased;
      const matchOver = prev.innings === 2 && inningsComplete;

      // Normalize overs display: ball 6 is shown as next over, 0 balls
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

  return { match, nextBall, crr, startSecondInnings, resetWithTeams };
}
