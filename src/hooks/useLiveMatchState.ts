/**
 * useLiveMatchState
 *
 * Polls the CricAPI `match_info` endpoint every 5 seconds for a specific match
 * and derives ball-by-ball events by diffing consecutive score snapshots.
 *
 * Exposes the same interface as `useMatchState` so it can be used as a
 * drop-in replacement in Index.tsx for real (non-simulation) matches.
 *
 * Ball event inference from score diffs:
 *   runs+6            → six
 *   runs+4            → four
 *   runs+3, legal     → triple
 *   runs+2, legal     → double
 *   runs+1, legal     → single
 *   runs+0, legal     → dot
 *   runs+1, illegal   → wide
 *   wickets+1         → wicket  (takes priority)
 *
 * "Legal delivery" = the over.ball count incremented between polls.
 * "Illegal delivery" = runs changed but over.ball count did NOT increment.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import type { MatchState, BallEvent, Batsman } from "@/hooks/useMatchState";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScoreSnapshot {
  runs: number;
  wickets: number;
  overs: number;   // full overs completed
  balls: number;   // balls in the current over (0-5)
  innings: 1 | 2;
}

interface CricApiScoreEntry {
  r: number;  // runs
  w: number;  // wickets
  o: number;  // overs in "9.4" format (= 9 overs + 4 balls, NOT decimal)
  inning: string;
}

interface CricApiMatchInfoData {
  id: string;
  matchStarted?: boolean;
  matchEnded?: boolean;
  score?: CricApiScoreEntry[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Parse CricAPI's over format: 9.4 → { overs: 9, balls: 4 } */
function parseOvers(o: number): { overs: number; balls: number } {
  const overs = Math.floor(o);
  const balls = Math.round((o - overs) * 10);
  return { overs, balls };
}

/** Total legal balls delivered (used to detect legal vs illegal deliveries) */
function totalBalls(snap: ScoreSnapshot): number {
  return snap.overs * 6 + snap.balls;
}

/** Derive a BallEvent from the diff between two consecutive score snapshots */
function inferBallEvent(prev: ScoreSnapshot, curr: ScoreSnapshot): BallEvent | null {
  const runsDiff = curr.runs - prev.runs;
  const wicketsDiff = curr.wickets - prev.wickets;
  const legalDelivery = totalBalls(curr) > totalBalls(prev);

  // No measurable change yet
  if (runsDiff === 0 && wicketsDiff === 0 && !legalDelivery) return null;

  const over = curr.overs;
  const ball = curr.balls;

  // Wicket always takes priority
  if (wicketsDiff >= 1) {
    return { over, ball, result: "wicket", runs: 0, label: "WICKET! 🔴" };
  }
  if (runsDiff === 6) {
    return { over, ball, result: "six", runs: 6, label: "SIX! 🔵" };
  }
  if (runsDiff === 4) {
    return { over, ball, result: "four", runs: 4, label: "FOUR! 🟢" };
  }
  if (runsDiff === 3 && legalDelivery) {
    return { over, ball, result: "triple", runs: 3, label: "THREE RUNS" };
  }
  if (runsDiff === 2 && legalDelivery) {
    return { over, ball, result: "double", runs: 2, label: "TWO RUNS" };
  }
  if (runsDiff === 1 && legalDelivery) {
    return { over, ball, result: "single", runs: 1, label: "SINGLE" };
  }
  if (runsDiff === 0 && legalDelivery) {
    return { over, ball, result: "dot", runs: 0, label: "DOT BALL" };
  }
  // Illegal delivery (over count unchanged, runs changed by +1)
  if (!legalDelivery && runsDiff === 1) {
    return { over, ball, result: "wide", runs: 1, label: "WIDE" };
  }
  return null;
}

function makeBatsmen(name1 = "Batsman 1", name2 = "Batsman 2"): [Batsman, Batsman] {
  return [
    { name: name1, runs: 0, balls: 0, isOnStrike: true },
    { name: name2, runs: 0, balls: 0, isOnStrike: false },
  ];
}

function makeInitialState(innings: 1 | 2 = 1, firstInningsScore: number | null = null): MatchState {
  return {
    runs: 0,
    wickets: 0,
    overs: 0,
    balls: 0,
    currentBowler: "–",
    ballEvents: [],
    batsmen: makeBatsmen(),
    target: innings === 2 && firstInningsScore !== null ? firstInningsScore + 1 : null,
    innings,
    inningsComplete: false,
    matchOver: false,
    firstInningsScore,
  };
}

// ─── Poll interval ─────────────────────────────────────────────────────────
const POLL_MS = 5_000;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseLiveMatchStateReturn {
  match: MatchState;
  nextBall: () => BallEvent;
  crr: string;
  startSecondInnings: () => void;
  /** true when the API confirms the match is live */
  isLive: boolean;
}

export function useLiveMatchState(matchId: string | null): UseLiveMatchStateReturn {
  const [match, setMatch] = useState<MatchState>(makeInitialState());
  const [isLive, setIsLive] = useState(false);

  // Event queue: ball events detected from score diffs, consumed by nextBall()
  const queueRef = useRef<BallEvent[]>([]);

  // Last known score snapshot for diffing
  const lastSnapRef = useRef<ScoreSnapshot | null>(null);

  // Track innings to detect the switch from 1 → 2
  const firstInningsScoreRef = useRef<number | null>(null);
  const currentInningsRef = useRef<1 | 2>(1);

  // Build edge-function URL for match_info
  const buildUrl = useCallback((id: string) => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    return {
      url: `https://${projectId}.supabase.co/functions/v1/cricket-matches?endpoint=match_info&id=${encodeURIComponent(id)}`,
      headers: {
        apikey: anonKey,
        "Content-Type": "application/json",
      },
    };
  }, []);

  useEffect(() => {
    if (!matchId) return;

    async function poll() {
      try {
        const { url, headers } = buildUrl(matchId!);
        const res = await fetch(url, { headers });
        if (!res.ok) return;

        const json = await res.json();
        const data: CricApiMatchInfoData = json.data;
        if (!data) return;

        if (!data.matchStarted || data.matchEnded) {
          setIsLive(false);
          return;
        }

        setIsLive(true);

        const scores: CricApiScoreEntry[] = data.score || [];

        // CricAPI returns inning entries like:
        //   "Mumbai Indians Inning 1" → innings 1
        //   "Chennai Super Kings Inning 1" → innings 2 (chasing team's first inning = game's 2nd)
        const inning1Entry = scores[0] ?? null;
        const inning2Entry = scores[1] ?? null;

        const isSecondInnings = !!inning2Entry;
        const activeInnings: 1 | 2 = isSecondInnings ? 2 : 1;
        const activeEntry = isSecondInnings ? inning2Entry : inning1Entry;
        if (!activeEntry) return;

        const { overs, balls } = parseOvers(activeEntry.o);
        const snap: ScoreSnapshot = {
          runs: activeEntry.r,
          wickets: activeEntry.w,
          overs,
          balls,
          innings: activeInnings,
        };

        // ── Innings switch ──────────────────────────────────────────────────
        if (currentInningsRef.current === 1 && activeInnings === 2) {
          firstInningsScoreRef.current = inning1Entry?.r ?? null;
          currentInningsRef.current = 2;
          lastSnapRef.current = null;
          queueRef.current = [];
          setMatch(makeInitialState(2, firstInningsScoreRef.current));
          return;
        }

        // ── First poll: record baseline, no events yet ──────────────────────
        if (!lastSnapRef.current) {
          lastSnapRef.current = snap;
          setMatch((prev) => ({
            ...prev,
            runs: snap.runs,
            wickets: snap.wickets,
            overs: snap.overs,
            balls: snap.balls,
            innings: activeInnings,
            target:
              activeInnings === 2 && firstInningsScoreRef.current !== null
                ? firstInningsScoreRef.current + 1
                : null,
            firstInningsScore: firstInningsScoreRef.current,
          }));
          return;
        }

        // ── Subsequent polls: diff and queue events ─────────────────────────
        const prev = lastSnapRef.current;
        const changed =
          snap.runs !== prev.runs ||
          snap.wickets !== prev.wickets ||
          totalBalls(snap) !== totalBalls(prev);

        if (changed) {
          const event = inferBallEvent(prev, snap);
          if (event) queueRef.current.push(event);

          lastSnapRef.current = snap;

          setMatch((prev) => {
            const targetChased =
              activeInnings === 2 && prev.target !== null && snap.runs >= prev.target;
            const allOut = snap.wickets >= 10;
            const oversComplete = snap.overs >= 20 && snap.balls === 0;
            const inningsComplete = oversComplete || allOut || targetChased;
            const matchOver = activeInnings === 2 && inningsComplete;

            return {
              ...prev,
              runs: snap.runs,
              wickets: snap.wickets,
              overs: snap.overs,
              balls: snap.balls,
              innings: activeInnings,
              inningsComplete,
              matchOver,
              target:
                activeInnings === 2 && firstInningsScoreRef.current !== null
                  ? firstInningsScoreRef.current + 1
                  : prev.target,
              firstInningsScore: firstInningsScoreRef.current,
            };
          });
        }
      } catch (err) {
        console.error("[useLiveMatchState] poll error:", err);
      }
    }

    poll();
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  }, [matchId, buildUrl]);

  /**
   * Called by BanterStream after each prediction window closes.
   * Dequeues the next real ball event if one arrived during polling,
   * otherwise falls back to a dot ball (game is between deliveries).
   */
  const nextBall = useCallback((): BallEvent => {
    const real = queueRef.current.shift();
    const event = real ?? {
      over: lastSnapRef.current?.overs ?? 0,
      ball: lastSnapRef.current?.balls ?? 0,
      result: "dot" as const,
      runs: 0,
      label: "DOT BALL",
    };

    setMatch((prev) => ({
      ...prev,
      ballEvents: [...prev.ballEvents.slice(-19), event],
    }));

    return event;
  }, []);

  const crr =
    match.overs + match.balls / 6 > 0
      ? (match.runs / (match.overs + match.balls / 6)).toFixed(2)
      : "0.00";

  const startSecondInnings = useCallback(() => {
    currentInningsRef.current = 2;
    lastSnapRef.current = null;
    queueRef.current = [];
    setMatch(makeInitialState(2, firstInningsScoreRef.current));
  }, []);

  return { match, nextBall, crr, startSecondInnings, isLive };
}
