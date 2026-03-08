import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PredictionCard from "./PredictionCard";

interface ChatMessage {
  id: number;
  user: string;
  avatar: string;
  text: string;
  event?: string;
  isPrediction: boolean;
  timestamp: string;
}

const USERS = [
  { name: "Rahul", avatar: "🔥" },
  { name: "Priya", avatar: "💅" },
  { name: "Arjun", avatar: "🏏" },
  { name: "Sneha", avatar: "⚡" },
  { name: "Vikram", avatar: "🎯" },
];

const BANTER = [
  "Bumrah is in BEAST mode today 🔥",
  "This pitch is a highway, boundaries loading...",
  "That was plumb! Umpire sleeping? 😴",
  "Kohli would've chased this in 15 overs 👑",
  "Bro that was a no-ball for sure 💀",
  "Gill's cover drive > your relationship 😤",
  "Need 36 off 12... we've seen worse 👀",
  "That fielding was criminal, arrest him 🚔",
  "Pant would've reverse-scooped that for six 🤡",
  "The dew is doing more work than their bowlers",
  "Sky is inevitable. Accept it.",
  "This over is going for 20+ mark my words",
];

const EVENTS = [
  "After FOUR 🟢",
  "After SIX 🔵",
  "After WICKET 🔴",
  "Over break",
  "Drinks break",
  "After DOT BALL",
];

const BanterStream = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [shakeScreen, setShakeScreen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef(0);

  const addMessage = useCallback(() => {
    counterRef.current += 1;
    const count = counterRef.current;
    const user = USERS[Math.floor(Math.random() * USERS.length)];
    const isPrediction = count % 5 === 0;
    const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];

    // Simulate haptic on wicket/six events
    if (event.includes("WICKET") || event.includes("SIX")) {
      setShakeScreen(true);
      setTimeout(() => setShakeScreen(false), 600);
    }

    const msg: ChatMessage = {
      id: count,
      user: user.name,
      avatar: user.avatar,
      text: BANTER[Math.floor(Math.random() * BANTER.length)],
      event,
      isPrediction,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev.slice(-30), msg]);
  }, []);

  useEffect(() => {
    // Seed initial messages
    for (let i = 0; i < 4; i++) {
      setTimeout(() => addMessage(), i * 300);
    }
    const interval = setInterval(addMessage, 30000);
    return () => clearInterval(interval);
  }, [addMessage]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  return (
    <div className={`flex-1 overflow-hidden ${shakeScreen ? "animate-shake" : ""}`}>
      <div ref={scrollRef} className="h-full overflow-y-auto pb-4 scrollbar-hide">
        <AnimatePresence initial={false}>
          {messages.map((msg) =>
            msg.isPrediction ? (
              <PredictionCard
                key={msg.id}
                id={msg.id}
                user={msg.user}
                event={msg.event || ""}
              />
            ) : (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="px-4 py-2"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 flex items-center justify-center rounded-md bg-muted border-2 border-foreground text-sm flex-shrink-0"
                    style={{ boxShadow: "2px 2px 0px hsl(0 0% 0%)" }}
                  >
                    {msg.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-neon">{msg.user}</span>
                      {msg.event && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {msg.event}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-muted-foreground ml-auto flex-shrink-0">
                        {msg.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mt-0.5 leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BanterStream;
