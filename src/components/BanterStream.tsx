import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PredictionCard, { type PredictionState, type BallResult, type FriendPick } from "./PredictionCard";
import OverSummary, { type OverSummaryData } from "./OverSummary";
import { type PredictionRecord } from "./ShareableReceipt";
import ChatInput, { type TeamId } from "./ChatInput";
import { type MatchState, type BallEvent, formatBall } from "@/hooks/useMatchState";
import { isSoundMuted } from "@/lib/sounds";

interface BallBlock {
  id: number;
  ballLabel: string;
  predictionState: PredictionState;
  countdown: number;
  selected: string | null;
  result: BallResult | null;
  friendPicks: FriendPick[];
}

interface ChatItem {
  id: number;
  parentBallId: number;
  user: string;
  avatar: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
}

export interface FriendDef {
  name: string;
  avatar: string;
}

const PICK_LABELS = ["Dot", "Single", "Boundary", "Six", "Wicket", "Wide", "No Ball"];

const BANTER_BY_RESULT: Record<string, string[]> = {
  dot: ["Dot ball. Pressure building 🫣", "Tight bowling 🎯", "Batsman looked clueless 😴"],
  single: ["Rotating strike, smart cricket", "Keep the board ticking", "Good running 🏃"],
  double: ["Quick two! 🏃‍♂️", "Placed it perfectly for two"],
  triple: ["THREE RUNS! Great running 🏃‍♂️🏃‍♂️", "Pushing hard for three!", "That's excellent hustle"],
  four: ["SHOT! Boundary 💥", "Creamed through covers! 🔥", "Tracer bullet 🚀"],
  six: ["INTO THE STANDS! 🏟️", "That's out of the ground! 🚀", "MENTAL 🤯"],
  wicket: ["GONE! 💀", "TIMBER! 🔥", "HUGE WICKET!", "The celebration says it all 🎉"],
  wide: ["Wide! Free runs 😅", "That's going down leg", "Bowler losing his line"],
  noball: ["NO BALL! Free hit coming 🎁", "Overstepped! 😤", "That's sloppy bowling"],
};

const LOCK_TIME = 15;
const spring = { type: "spring" as const, damping: 25, stiffness: 350 };

interface BanterStreamProps {
  match: MatchState;
  onNextBall: () => BallEvent;
  onHype?: (type: "four" | "six" | "wicket") => void;
  onPredictionResolved?: (record: PredictionRecord) => void;
  onFriendScoresUpdate?: (scores: Record<string, { wins: number; total: number; streak: number }>) => void;
  soundMuted: boolean;
  activeFriends: FriendDef[];
  onOverComplete?: (overNum: number, participation: Record<string, boolean>) => void;
  allPlayerStandings: OverSummaryData["standings"];
  userTeam: TeamId;
  activePlayers: number;
  maxPlayers: number;
  roomId: string;
  onInvite?: () => void;
}

const BanterStream = ({
  match, onNextBall, onHype, onPredictionResolved, onFriendScoresUpdate,
  soundMuted, activeFriends, onOverComplete, allPlayerStandings, userTeam,
}: BanterStreamProps) => {
  const [balls, setBalls] = useState<BallBlock[]>([]);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [shakeScreen, setShakeScreen] = useState(false);
  const [waitingForNext, setWaitingForNext] = useState(false);
  const [overSummaries, setOverSummaries] = useState<{ afterBallId: number; data: OverSummaryData }[]>([]);
  const [lastBallResult, setLastBallResult] = useState<string | null>(null);
  const [userScores, setUserScores] = useState<Record<string, { wins: number; total: number; streak: number }>>(
    () => Object.fromEntries(activeFriends.map(u => [u.name, { wins: 0, total: 0, streak: 0 }]))
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const ballCountRef = useRef(0);
  const countdownRef = useRef<ReturnType<typeof setInterval>>();
  const activeBallIdRef = useRef<number | null>(null);

  // Over tracking
  const legalBallsThisOver = useRef(0);
  const currentOverNum = useRef(0);
  const overFriendResults = useRef<Record<string, { correct: number; total: number }>>({});
  const overParticipation = useRef<Record<string, boolean>>({});

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    setUserScores(prev => {
      const next = { ...prev };
      activeFriends.forEach(f => {
        if (!next[f.name]) next[f.name] = { wins: 0, total: 0, streak: 0 };
      });
      return next;
    });
  }, [activeFriends]);

  const addFriendPicks = useCallback((ballId: number) => {
    const friends = [...activeFriends].sort(() => Math.random() - 0.5).slice(0, Math.min(activeFriends.length, 3 + Math.floor(Math.random() * 2)));
    const delays = [1500, 3000, 5000, 7000, 8500];

    friends.forEach((user, i) => {
      setTimeout(() => {
        const pick = PICK_LABELS[Math.floor(Math.random() * PICK_LABELS.length)];
        setBalls(prev => prev.map(b =>
          b.id === ballId
            ? { ...b, friendPicks: [...b.friendPicks, { name: user.name, avatar: user.avatar, pick }] }
            : b
        ));
        overParticipation.current[user.name] = true;
        scrollToBottom();
      }, delays[i] || 2000);
    });
  }, [activeFriends]);

  const checkPickWon = (pick: string, result: string) =>
    (pick === "Dot" && result === "dot") ||
    (pick === "Boundary" && result === "four") ||
    (pick === "Six" && result === "six") ||
    (pick === "Single" && result === "single") ||
    (pick === "Two" && result === "double") ||
    (pick === "Three" && result === "triple") ||
    (pick === "Wicket" && result === "wicket") ||
    (pick === "Wide" && result === "wide") ||
    (pick === "No Ball" && result === "noball");

  const resolveBall = useCallback((ballId: number) => {
    const event = onNextBall();
    ballCountRef.current += 1;
    const isLegal = event.result !== "wide" && event.result !== "noball";

    setLastBallResult(event.result);

    if (!isSoundMuted()) {
      try {
        const audio = new Audio("/sounds/cricket_bat.mp3");
        audio.volume = 0.5;
        audio.play();
      } catch (e) {}
    }

    const result: BallResult = { label: event.label, type: event.result };

    if (event.result === "wicket" || event.result === "six" || event.result === "four") {
      setShakeScreen(true);
      setTimeout(() => setShakeScreen(false), 600);
      onHype?.(event.result as "four" | "six" | "wicket");

      if (!isSoundMuted()) {
        try {
          const horn = new Audio("/sounds/ipl_horn.mp3");
          horn.volume = 0.6;
          horn.play();
          setTimeout(() => {
            let step = 0;
            const interval = setInterval(() => {
              step++;
              horn.volume = Math.max(0, 0.6 * (1 - step / 20));
              if (step >= 20) { clearInterval(interval); horn.pause(); horn.currentTime = 0; }
            }, 50);
          }, 2000);
        } catch (e) {}
      }
    }

    let userWon: boolean | null = null;
    setBalls(prev => {
      const ball = prev.find(b => b.id === ballId);
      if (ball?.selected) {
        userWon = checkPickWon(ball.selected, event.result);
      }
      return prev;
    });

    setBalls(prev => prev.map(b => {
      if (b.id === ballId) {
        const updatedPicks = b.friendPicks.map(fp => ({
          ...fp,
          won: checkPickWon(fp.pick, event.result),
        }));
        return { ...b, predictionState: "resolved" as PredictionState, result, friendPicks: updatedPicks };
      }
      return b;
    }));

    setBalls(prev => {
      const ball = prev.find(b => b.id === ballId);
      if (ball) {
        const scoreUpdates: Record<string, { won: boolean }> = {};
        ball.friendPicks.forEach(fp => {
          const won = checkPickWon(fp.pick, event.result);
          scoreUpdates[fp.name] = { won };
          if (!overFriendResults.current[fp.name]) {
            overFriendResults.current[fp.name] = { correct: 0, total: 0 };
          }
          overFriendResults.current[fp.name].total += 1;
          if (won) overFriendResults.current[fp.name].correct += 1;
        });
        setUserScores(prev => {
          const next = { ...prev };
          Object.entries(scoreUpdates).forEach(([name, { won }]) => {
            if (next[name]) {
              next[name] = {
                wins: next[name].wins + (won ? 1 : 0),
                total: next[name].total + 1,
                streak: won ? next[name].streak + 1 : 0,
              };
            }
          });
          onFriendScoresUpdate?.(next);
          return next;
        });
      }
      return prev;
    });

    setBalls(prev => {
      const ball = prev.find(b => b.id === ballId);
      onPredictionResolved?.({
        ballLabel: ball?.ballLabel || "",
        predicted: ball?.selected || null,
        result: event.label,
        resultType: event.result,
        won: ball?.selected ? userWon : null,
      });
      return prev;
    });

    if (isLegal) {
      legalBallsThisOver.current += 1;
      if (legalBallsThisOver.current >= 6) {
        currentOverNum.current += 1;
        const overNum = currentOverNum.current;

        const friendResults = { ...overFriendResults.current };
        let mvp: OverSummaryData["overMvp"] = null;
        let maxCorrect = 0;
        Object.entries(friendResults).forEach(([name, r]) => {
          if (r.correct > maxCorrect) {
            maxCorrect = r.correct;
            const friend = activeFriends.find(f => f.name === name);
            mvp = { name, avatar: friend?.avatar || "🏏", correct: r.correct, total: r.total };
          }
        });

        const summaryData: OverSummaryData = {
          overNumber: overNum,
          overMvp: mvp,
          standings: allPlayerStandings,
        };

        setOverSummaries(prev => [...prev, { afterBallId: ballId, data: summaryData }]);
        onOverComplete?.(overNum, { ...overParticipation.current });

        legalBallsThisOver.current = 0;
        overFriendResults.current = {};
        overParticipation.current = {};
      }
    }

    const banterPool = BANTER_BY_RESULT[event.result] || BANTER_BY_RESULT.dot;
    const numMessages = 1 + Math.floor(Math.random() * 2);
    const shuffled = [...banterPool].sort(() => Math.random() - 0.5);

    for (let i = 0; i < numMessages; i++) {
      const user = activeFriends[Math.floor(Math.random() * activeFriends.length)];
      idRef.current += 1;
      const chatId = idRef.current;
      setTimeout(() => {
        setChats(prev => [...prev, {
          id: chatId,
          parentBallId: ballId,
          user: user.name,
          avatar: user.avatar,
          text: shuffled[i % shuffled.length],
          timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        }]);
        scrollToBottom();
      }, 500 + i * 800);
    }

    setTimeout(() => { setWaitingForNext(true); scrollToBottom(); }, numMessages * 800 + 1500);
    setTimeout(() => { setWaitingForNext(false); startNewBall(); }, numMessages * 800 + 5000);
  }, [onNextBall, activeFriends, allPlayerStandings]);

  const startNewBall = useCallback(() => {
    idRef.current += 1;
    const ballId = idRef.current;
    activeBallIdRef.current = ballId;

    const tempBallCount = ballCountRef.current + 1;
    const overNum = Math.floor((tempBallCount - 1) / 6);
    const ballNum = ((tempBallCount - 1) % 6) + 1;
    const label = formatBall(overNum, ballNum);

    const newBall: BallBlock = {
      id: ballId,
      ballLabel: label,
      predictionState: "idle",
      countdown: LOCK_TIME,
      selected: null,
      result: null,
      friendPicks: [],
    };

    setBalls(prev => [...prev.slice(-20), newBall]);
    scrollToBottom();
    addFriendPicks(ballId);

    clearInterval(countdownRef.current);
    let count = LOCK_TIME;
    countdownRef.current = setInterval(() => {
      count -= 1;
      setBalls(prev => prev.map(b =>
        b.id === ballId ? { ...b, countdown: count } : b
      ));
      if (count <= 0) {
        clearInterval(countdownRef.current);
        setBalls(prev => prev.map(b =>
          b.id === ballId && b.predictionState === "idle"
            ? { ...b, predictionState: "pending" as PredictionState }
            : b
        ));
        setTimeout(() => resolveBall(ballId), 1500);
      }
    }, 1000);
  }, [addFriendPicks, resolveBall]);

  const handlePredict = useCallback((ballId: number, pick: string) => {
    setBalls(prev => prev.map(b =>
      b.id === ballId
        ? { ...b, selected: pick, predictionState: "locked" as PredictionState }
        : b
    ));
    clearInterval(countdownRef.current);
    setTimeout(() => {
      setBalls(prev => prev.map(b =>
        b.id === ballId ? { ...b, predictionState: "pending" as PredictionState } : b
      ));
      setTimeout(() => resolveBall(ballId), 1500);
    }, 2000);
  }, [resolveBall]);

  const handleUserChat = useCallback((text: string) => {
    idRef.current += 1;
    const currentBallId = activeBallIdRef.current || 0;
    setChats(prev => [...prev, {
      id: idRef.current,
      parentBallId: currentBallId,
      user: "You",
      avatar: "🙋",
      text,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    }]);
    scrollToBottom();
  }, []);

  useEffect(() => {
    idRef.current += 1;
    setChats([{
      id: idRef.current,
      parentBallId: 0,
      user: "PitchTalk",
      avatar: "🏏",
      text: "🔊 Sound effects are ON! Use the 🔇 button in the header to mute anytime.",
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      isSystem: true,
    }]);
    startNewBall();
    return () => clearInterval(countdownRef.current);
  }, []);

  // Build render items
  const renderItems: { type: "ball" | "chat" | "over-summary"; ball?: BallBlock; chat?: ChatItem; overSummary?: OverSummaryData }[] = [];
  
  chats.filter(c => c.parentBallId === 0).forEach(chat => {
    renderItems.push({ type: "chat", chat });
  });

  balls.forEach(ball => {
    renderItems.push({ type: "ball", ball });
    chats.filter(c => c.parentBallId === ball.id).forEach(chat => {
      renderItems.push({ type: "chat", chat });
    });
    const summary = overSummaries.find(s => s.afterBallId === ball.id);
    if (summary) {
      renderItems.push({ type: "over-summary", overSummary: summary.data });
    }
  });

  const matchContext = {
    lastBallResult: lastBallResult,
    runs: match.runs,
    wickets: match.wickets,
    target: match.target,
    overs: match.overs,
    balls: match.balls,
  };

  return (
    <div className={`flex-1 flex flex-col overflow-hidden ${shakeScreen ? "animate-shake" : ""}`}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto pb-2">
        <AnimatePresence initial={false}>
          {renderItems.map((item) => {
            if (item.type === "ball" && item.ball) {
              const b = item.ball;
              return (
                <PredictionCard
                  key={`ball-${b.id}`}
                  id={b.id}
                  ballLabel={b.ballLabel}
                  countdown={b.countdown}
                  state={b.predictionState}
                  result={b.result}
                  selected={b.selected}
                  friendPicks={b.friendPicks}
                  userScores={userScores}
                  onPredict={(pick) => handlePredict(b.id, pick)}
                />
              );
            }

            if (item.type === "over-summary" && item.overSummary) {
              return <OverSummary key={`over-${item.overSummary.overNumber}`} data={item.overSummary} />;
            }

            if (item.type === "chat" && item.chat) {
              const c = item.chat;
              const isYou = c.user === "You";
              const isSystem = c.isSystem;
              return (
                <motion.div
                  key={`chat-${c.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring }}
                  className="px-5 py-1"
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`w-7 h-7 flex items-center justify-center rounded-full text-[11px] flex-shrink-0 ${
                      isSystem ? "bg-primary/15" : "bg-secondary"
                    }`}>
                      {c.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[12px] font-semibold ${
                          isSystem ? "text-primary" : isYou ? "text-primary" : "text-foreground"
                        }`}>{c.user}</span>
                        {!isYou && !isSystem && userScores[c.user]?.total > 0 && (
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
                            {userScores[c.user].wins}/{userScores[c.user].total}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground ml-auto flex-shrink-0">
                          {c.timestamp}
                        </span>
                      </div>
                      <p className={`text-[14px] mt-0.5 leading-relaxed ${
                        isSystem ? "text-muted-foreground italic text-[12px]" : "text-foreground"
                      }`}>{c.text}</p>
                    </div>
                  </div>
                </motion.div>
              );
            }
            return null;
          })}
        </AnimatePresence>

        <AnimatePresence>
          {waitingForNext && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center gap-2 py-4 px-4"
            >
              <div className="flex items-center gap-2">
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="text-sm"
                >🏏</motion.span>
                <span className="text-[12px] text-muted-foreground font-medium">
                  Bowler walking back...
                </span>
                <motion.span
                  className="flex gap-1"
                  initial={{ opacity: 0.4 }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                  <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                  <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                </motion.span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <ChatInput onSend={handleUserChat} userTeam={userTeam} matchContext={matchContext} />
    </div>
  );
};

export default BanterStream;
