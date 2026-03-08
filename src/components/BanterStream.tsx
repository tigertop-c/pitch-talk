import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PredictionCard from "./PredictionCard";
import { type MatchState, type BallEvent, formatBall } from "@/hooks/useMatchState";

interface StreamItem {
  id: number;
  type: "ball-header" | "chat" | "prediction";
  ballLabel?: string;
  ballResult?: string;
  ballResultType?: BallEvent["result"];
  user?: string;
  avatar?: string;
  text?: string;
  timestamp?: string;
  nextBallLabel?: string;
}

const USERS = [
  { name: "Rahul", avatar: "🔥" },
  { name: "Priya", avatar: "💅" },
  { name: "Arjun", avatar: "🏏" },
  { name: "Sneha", avatar: "⚡" },
  { name: "Vikram", avatar: "🎯" },
];

const BANTER_BY_RESULT: Record<string, string[]> = {
  dot: [
    "Dot ball. Pressure building 🫣",
    "Maiden territory... boring but effective",
    "That's tight bowling 🎯",
    "Batsman looked clueless there 😴",
  ],
  single: [
    "Just rotating strike, smart cricket",
    "Easy single, keep the board ticking",
    "Good running between the wickets 🏃",
  ],
  double: [
    "Quick two! Good running 🏃‍♂️",
    "Placed it perfectly for two",
    "That's intelligent batting right there",
  ],
  four: [
    "SHOT! That's a boundary 💥",
    "Creamed through the covers! CLASS 🔥",
    "Fielder didn't even move, what a hit!",
    "That went like a tracer bullet 🚀",
    "Textbook cover drive, gorgeous 😤",
  ],
  six: [
    "INTO THE STANDS! MASSIVE 🏟️",
    "That ball is still in orbit 🚀",
    "WHAT A HIT! That's out of the ground!",
    "SIX! The crowd is going MENTAL 🤯",
    "Pant would be proud of that one 💀",
  ],
  wicket: [
    "GONE! Walking back to the pavilion 💀",
    "TIMBER! Stumps destroyed 🔥",
    "HUGE WICKET! Game changer!",
    "That's the end of that innings for him 😭",
    "OUT! The celebration says it all 🎉",
  ],
};

const RESULT_STYLES: Record<string, string> = {
  dot: "bg-muted text-muted-foreground",
  single: "bg-surface-elevated text-foreground",
  double: "bg-surface-elevated text-foreground",
  four: "bg-primary text-primary-foreground",
  six: "bg-neon text-neon-foreground",
  wicket: "bg-destructive text-destructive-foreground",
};

interface BanterStreamProps {
  match: MatchState;
  onNextBall: () => BallEvent;
}

const BanterStream = ({ match, onNextBall }: BanterStreamProps) => {
  const [items, setItems] = useState<StreamItem[]>([]);
  const [shakeScreen, setShakeScreen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const ballCountRef = useRef(0);

  const generateBallBlock = useCallback(() => {
    const event = onNextBall();
    ballCountRef.current += 1;

    // Use latest match state for ball label (we compute it from ballCount)
    const overNum = Math.floor((ballCountRef.current - 1) / 6) + 18;
    const ballNum = ((ballCountRef.current - 1) % 6) + 3; // starting from 18.3
    const adjustedOver = ballNum > 6 ? overNum + Math.floor((ballNum - 1) / 6) : overNum;
    const adjustedBall = ballNum > 6 ? ((ballNum - 1) % 6) + 1 : ballNum;

    const newItems: StreamItem[] = [];

    // Ball header/delineator
    idRef.current += 1;
    newItems.push({
      id: idRef.current,
      type: "ball-header",
      ballLabel: formatBall(adjustedOver, adjustedBall),
      ballResult: event.label,
      ballResultType: event.result,
    });

    // Haptic shake for big events
    if (event.result === "wicket" || event.result === "six") {
      setShakeScreen(true);
      setTimeout(() => setShakeScreen(false), 600);
    }

    // 2-3 banter messages reacting to the ball
    const banterPool = BANTER_BY_RESULT[event.result] || BANTER_BY_RESULT.dot;
    const numMessages = 2 + Math.floor(Math.random() * 2);
    const shuffled = [...banterPool].sort(() => Math.random() - 0.5);

    for (let i = 0; i < numMessages; i++) {
      const user = USERS[Math.floor(Math.random() * USERS.length)];
      idRef.current += 1;
      newItems.push({
        id: idRef.current,
        type: "chat",
        user: user.name,
        avatar: user.avatar,
        text: shuffled[i % shuffled.length],
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      });
    }

    // Every 3rd ball, add a prediction card
    if (ballCountRef.current % 3 === 0) {
      const user = USERS[Math.floor(Math.random() * USERS.length)];
      idRef.current += 1;
      newItems.push({
        id: idRef.current,
        type: "prediction",
        user: user.name,
      });
    }

    setItems((prev) => [...prev.slice(-50), ...newItems]);
  }, [onNextBall]);

  useEffect(() => {
    // Seed with first ball immediately
    generateBallBlock();
    const interval = setInterval(generateBallBlock, 30000);
    return () => clearInterval(interval);
  }, [generateBallBlock]);

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 100);
  }, [items]);

  return (
    <div className={`flex-1 overflow-hidden ${shakeScreen ? "animate-shake" : ""}`}>
      <div ref={scrollRef} className="h-full overflow-y-auto pb-4">
        <AnimatePresence initial={false}>
          {items.map((item) => {
            if (item.type === "ball-header") {
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scaleX: 0.8 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  className="mx-4 mt-4 mb-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-[3px] flex-1 bg-border" />
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 font-mono font-bold text-sm bg-card border-[3px] border-foreground rounded-md"
                        style={{ boxShadow: "2px 2px 0px hsl(0 0% 0%)" }}
                      >
                        {item.ballLabel}
                      </span>
                      <span className={`px-2 py-1 font-mono font-bold text-xs rounded-md border-2 border-foreground ${RESULT_STYLES[item.ballResultType || "dot"]}`}
                        style={{ boxShadow: "2px 2px 0px hsl(0 0% 0%)" }}
                      >
                        {item.ballResult}
                      </span>
                    </div>
                    <div className="h-[3px] flex-1 bg-border" />
                  </div>
                </motion.div>
              );
            }

            if (item.type === "prediction") {
              return (
                <PredictionCard
                  key={item.id}
                  id={item.id}
                  user={item.user || ""}
                  event="What happens next ball?"
                />
              );
            }

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="px-4 py-1.5"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 flex items-center justify-center rounded-md bg-muted border-2 border-foreground text-sm flex-shrink-0"
                    style={{ boxShadow: "2px 2px 0px hsl(0 0% 0%)" }}
                  >
                    {item.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-neon">{item.user}</span>
                      <span className="text-[10px] font-mono text-muted-foreground ml-auto flex-shrink-0">
                        {item.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mt-0.5 leading-relaxed">{item.text}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BanterStream;
