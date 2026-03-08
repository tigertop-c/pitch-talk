import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PredictionCard, { type PredictionState, type BallResult, type FriendPick } from "./PredictionCard";
import ChatInput from "./ChatInput";
import { type MatchState, type BallEvent, formatBall } from "@/hooks/useMatchState";

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
}

const USERS = [
  { name: "Rahul", avatar: "🔥" },
  { name: "Priya", avatar: "💅" },
  { name: "Arjun", avatar: "🏏" },
  { name: "Sneha", avatar: "⚡" },
  { name: "Vikram", avatar: "🎯" },
];

const PICK_LABELS = ["Dot", "Single", "Boundary", "Six", "Wicket", "Wide", "No Ball"];

const BANTER_BY_RESULT: Record<string, string[]> = {
  dot: ["Dot ball. Pressure building 🫣", "Tight bowling 🎯", "Batsman looked clueless 😴"],
  single: ["Rotating strike, smart cricket", "Keep the board ticking", "Good running 🏃"],
  double: ["Quick two! 🏃‍♂️", "Placed it perfectly for two"],
  four: ["SHOT! Boundary 💥", "Creamed through covers! 🔥", "Tracer bullet 🚀"],
  six: ["INTO THE STANDS! 🏟️", "That's out of the ground! 🚀", "MENTAL 🤯"],
  wicket: ["GONE! 💀", "TIMBER! 🔥", "HUGE WICKET!", "The celebration says it all 🎉"],
  wide: ["Wide! Free runs 😅", "That's going down leg", "Bowler losing his line"],
  noball: ["NO BALL! Free hit coming 🎁", "Overstepped! 😤", "That's sloppy bowling"],
};

const LOCK_TIME = 10;

interface BanterStreamProps {
  match: MatchState;
  onNextBall: () => BallEvent;
}

const BanterStream = ({ match, onNextBall }: BanterStreamProps) => {
  const [balls, setBalls] = useState<BallBlock[]>([]);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [shakeScreen, setShakeScreen] = useState(false);
  const [userScores, setUserScores] = useState<Record<string, { wins: number; total: number; streak: number }>>(
    () => Object.fromEntries(USERS.map(u => [u.name, { wins: 0, total: 0, streak: 0 }]))
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const ballCountRef = useRef(0);
  const countdownRef = useRef<ReturnType<typeof setInterval>>();
  const activeBallIdRef = useRef<number | null>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 100);
  };

  // Add friend picks (stored on ball, NOT as chat)
  const addFriendPicks = useCallback((ballId: number) => {
    const shuffledUsers = [...USERS].sort(() => Math.random() - 0.5).slice(0, 3 + Math.floor(Math.random() * 2));
    const delays = [1500, 3000, 5000, 7000, 8500];

    shuffledUsers.forEach((user, i) => {
      setTimeout(() => {
        const pick = PICK_LABELS[Math.floor(Math.random() * PICK_LABELS.length)];
        setBalls(prev => prev.map(b =>
          b.id === ballId
            ? { ...b, friendPicks: [...b.friendPicks, { name: user.name, avatar: user.avatar, pick }] }
            : b
        ));
        scrollToBottom();
      }, delays[i] || 2000);
    });
  }, []);

  const resolveBall = useCallback((ballId: number) => {
    const event = onNextBall();
    ballCountRef.current += 1;

    const result: BallResult = { label: event.label, type: event.result };

    if (event.result === "wicket" || event.result === "six") {
      setShakeScreen(true);
      setTimeout(() => setShakeScreen(false), 600);
    }

    // Update ball to resolved + determine friend results
    setBalls(prev => prev.map(b => {
      if (b.id === ballId) {
        const updatedPicks = b.friendPicks.map(fp => ({
          ...fp,
          won: (fp.pick === "Dot" && event.result === "dot") ||
               (fp.pick === "Boundary" && event.result === "four") ||
               (fp.pick === "Six" && event.result === "six") ||
               (fp.pick === "Single" && (event.result === "single" || event.result === "double")) ||
               (fp.pick === "Wicket" && event.result === "wicket") ||
               (fp.pick === "Wide" && event.result === "wide") ||
               (fp.pick === "No Ball" && event.result === "noball"),
        }));
        return { ...b, predictionState: "resolved" as PredictionState, result, friendPicks: updatedPicks };
      }
      return b;
    }));

    // Update scores
    setBalls(prev => {
      const ball = prev.find(b => b.id === ballId);
      if (ball) {
        const scoreUpdates: Record<string, { won: boolean }> = {};
        ball.friendPicks.forEach(fp => {
          const won = (fp.pick === "Dot" && event.result === "dot") ||
                      (fp.pick === "Boundary" && event.result === "four") ||
                      (fp.pick === "Six" && event.result === "six") ||
                      (fp.pick === "Single" && (event.result === "single" || event.result === "double")) ||
                      (fp.pick === "Wicket" && event.result === "wicket") ||
                      (fp.pick === "Wide" && event.result === "wide") ||
                      (fp.pick === "No Ball" && event.result === "noball");
          scoreUpdates[fp.name] = { won };
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
          return next;
        });
      }
      return prev;
    });

    // Add banter chats (reactions only, not picks)
    const banterPool = BANTER_BY_RESULT[event.result] || BANTER_BY_RESULT.dot;
    const numMessages = 1 + Math.floor(Math.random() * 2);
    const shuffled = [...banterPool].sort(() => Math.random() - 0.5);

    for (let i = 0; i < numMessages; i++) {
      const user = USERS[Math.floor(Math.random() * USERS.length)];
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

    // Start next ball
    setTimeout(() => {
      startNewBall();
    }, numMessages * 800 + 2000);
  }, [onNextBall]);

  const startNewBall = useCallback(() => {
    idRef.current += 1;
    const ballId = idRef.current;
    activeBallIdRef.current = ballId;

    const tempBallCount = ballCountRef.current + 1;
    const overNum = Math.floor((tempBallCount - 1) / 6) + 18;
    const ballNum = ((tempBallCount - 1) % 6) + 3;
    const adjustedOver = ballNum > 6 ? overNum + Math.floor((ballNum - 1) / 6) : overNum;
    const adjustedBall = ballNum > 6 ? ((ballNum - 1) % 6) + 1 : ballNum;
    const label = formatBall(adjustedOver, adjustedBall);

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
    startNewBall();
    return () => clearInterval(countdownRef.current);
  }, []);

  // Build interleaved render list
  const renderItems: { type: "ball" | "chat"; ball?: BallBlock; chat?: ChatItem }[] = [];
  balls.forEach(ball => {
    renderItems.push({ type: "ball", ball });
    chats.filter(c => c.parentBallId === ball.id).forEach(chat => {
      renderItems.push({ type: "chat", chat });
    });
  });

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

            if (item.type === "chat" && item.chat) {
              const c = item.chat;
              const isYou = c.user === "You";
              return (
                <motion.div
                  key={`chat-${c.id}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-4 py-1"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 flex items-center justify-center rounded-md bg-muted border-2 border-foreground text-[10px] flex-shrink-0"
                      style={{ boxShadow: "1px 1px 0px hsl(0 0% 0%)" }}
                    >
                      {c.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold font-mono ${isYou ? "text-electric" : "text-neon"}`}>{c.user}</span>
                        {!isYou && userScores[c.user]?.total > 0 && (
                          <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-muted border border-border text-muted-foreground">
                            {userScores[c.user].wins}/{userScores[c.user].total}
                          </span>
                        )}
                        <span className="text-[9px] font-mono text-muted-foreground ml-auto flex-shrink-0">
                          {c.timestamp}
                        </span>
                      </div>
                      <p className="text-sm mt-0.5 leading-relaxed text-foreground">{c.text}</p>
                    </div>
                  </div>
                </motion.div>
              );
            }
            return null;
          })}
        </AnimatePresence>
      </div>
      <ChatInput onSend={handleUserChat} />
    </div>
  );
};

export default BanterStream;
