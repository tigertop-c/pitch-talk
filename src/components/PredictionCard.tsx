import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Zap, CircleDot, AlertTriangle, Clock } from "lucide-react";
import { playWinSound, playFailSound, playClickSound } from "@/lib/sounds";

type PredictionState = "idle" | "locked" | "pending" | "winner" | "failed";

interface PredictionCardProps {
  id: number;
  ballLabel: string;
}

interface FriendPick {
  name: string;
  avatar: string;
  pick: string;
}

const outcomes = [
  { label: "Dot", icon: CircleDot, color: "bg-muted text-foreground border-foreground" },
  { label: "Boundary", icon: Zap, color: "bg-primary text-primary-foreground border-foreground" },
  { label: "Single", icon: Target, color: "bg-surface-elevated text-foreground border-foreground" },
  { label: "Wicket", icon: AlertTriangle, color: "bg-destructive text-destructive-foreground border-foreground" },
];

const FRIENDS = [
  { name: "Rahul", avatar: "🔥" },
  { name: "Priya", avatar: "💅" },
  { name: "Arjun", avatar: "🏏" },
  { name: "Sneha", avatar: "⚡" },
  { name: "Vikram", avatar: "🎯" },
];

const PredictionCard = ({ id, ballLabel }: PredictionCardProps) => {
  const [state, setState] = useState<PredictionState>("idle");
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<"winner" | "failed" | null>(null);
  const [countdown, setCountdown] = useState(25);
  const [friendPicks, setFriendPicks] = useState<FriendPick[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Countdown timer
  useEffect(() => {
    if (state !== "idle") return;
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Auto-lock if not picked
          setState("pending");
          setTimeout(() => {
            const won = Math.random() > 0.5;
            setState(won ? "winner" : "failed");
            setResult(won ? "winner" : "failed");
          }, 2000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [state]);

  // Simulate friends picking over time
  useEffect(() => {
    if (state === "winner" || state === "failed") return;
    const available = [...FRIENDS];
    const delays = [2000, 5000, 9000, 14000];
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    
    delays.forEach((delay, i) => {
      if (i >= available.length) return;
      const t = setTimeout(() => {
        const friend = available[i];
        const pick = outcomes[Math.floor(Math.random() * outcomes.length)].label;
        setFriendPicks((prev) => [...prev, { name: friend.name, avatar: friend.avatar, pick }]);
      }, delay);
      timeouts.push(t);
    });

    return () => timeouts.forEach(clearTimeout);
  }, [state]);

  const handlePredict = (label: string) => {
    if (state !== "idle") return;
    playClickSound();
    setSelected(label);
    setState("locked");
    clearInterval(timerRef.current);

    // Wait a bit then resolve
    setTimeout(() => {
      setState("pending");
      setTimeout(() => {
        const won = Math.random() > 0.5;
        setState(won ? "winner" : "failed");
        setResult(won ? "winner" : "failed");
        if (won) playWinSound();
        else playFailSound();
      }, 2000);
    }, Math.max((countdown - 2) * 1000, 1500));
  };

  const urgency = countdown <= 5;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-4 my-1"
    >
      <div
        className={`p-4 bg-card border-[3px] border-foreground rounded-lg ${urgency && state === "idle" ? "animate-glow-pulse" : ""}`}
        style={{
          boxShadow:
            result === "winner"
              ? "4px 4px 0px hsl(78 100% 50%), 0 0 20px hsl(78 100% 50% / 0.3)"
              : result === "failed"
              ? "4px 4px 0px hsl(0 72% 51%)"
              : "4px 4px 0px hsl(0 0% 0%)",
        }}
      >
        {/* Header with ball number and timer */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-neon font-bold">
              ⚡ Predict Ball {ballLabel}
            </span>
          </div>
          {(state === "idle") && (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border-2 font-mono text-xs font-bold ${
              urgency 
                ? "border-destructive bg-destructive/20 text-destructive" 
                : "border-foreground bg-muted text-foreground"
            }`}>
              <Clock size={12} />
              <span>{countdown}s to lock</span>
            </div>
          )}
          {state === "locked" && (
            <span className="text-xs font-mono text-neon font-bold px-2 py-1 bg-neon/10 rounded-md border border-neon/30">
              🔒 Locked in
            </span>
          )}
        </div>

        {/* Prediction buttons */}
        {(state === "idle" || state === "locked") && (
          <div className="grid grid-cols-4 gap-2 mb-3">
            {outcomes.map((o) => {
              const isSelected = selected === o.label;
              return (
                <button
                  key={o.label}
                  onClick={() => handlePredict(o.label)}
                  disabled={state === "locked"}
                  className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-md border-2 border-foreground text-xs font-bold font-mono uppercase transition-all ${
                    isSelected
                      ? "bg-neon text-neon-foreground scale-105 ring-2 ring-neon"
                      : state === "locked"
                      ? "opacity-40 " + o.color
                      : o.color + " active:scale-95 hover:scale-105"
                  }`}
                  style={{ boxShadow: isSelected ? "2px 2px 0px hsl(78 100% 40%)" : "2px 2px 0px hsl(0 0% 0%)" }}
                >
                  <o.icon size={18} />
                  {o.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Friend picks */}
        {friendPicks.length > 0 && state !== "winner" && state !== "failed" && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {friendPicks.map((fp, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-[10px] font-mono border border-border"
              >
                <span>{fp.avatar}</span>
                <span className="text-muted-foreground">{fp.name}:</span>
                <span className="font-bold text-foreground">{fp.pick}</span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pending state */}
        {state === "pending" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-3"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-md border-2 border-foreground font-mono text-sm font-bold"
              style={{ boxShadow: "2px 2px 0px hsl(0 0% 0%)" }}
            >
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="inline-block"
              >
                🏏
              </motion.span>
              {selected ? (
                <>Pending... You picked <span className="text-neon">{selected}</span></>
              ) : (
                <>Ball incoming... You didn't pick!</>
              )}
            </div>
          </motion.div>
        )}

        {/* Result */}
        <AnimatePresence>
          {(state === "winner" || state === "failed") && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div
                className={`text-center py-3 rounded-md border-2 border-foreground font-mono font-bold text-lg mb-2 ${
                  state === "winner"
                    ? "bg-neon text-neon-foreground"
                    : "bg-destructive text-destructive-foreground"
                }`}
                style={{ boxShadow: "2px 2px 0px hsl(0 0% 0%)" }}
              >
                {state === "winner" ? "🎯 WINNER!" : "💀 FAILED"}
                {selected && (
                  <div className="text-xs mt-1 opacity-80">You picked: {selected}</div>
                )}
              </div>

              {/* Show all picks with results */}
              {friendPicks.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {friendPicks.map((fp, i) => {
                    const friendWon = Math.random() > 0.5;
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono border ${
                          friendWon ? "border-neon/50 bg-neon/10" : "border-destructive/50 bg-destructive/10"
                        }`}
                      >
                        <span>{fp.avatar}</span>
                        <span className="text-muted-foreground">{fp.name}:</span>
                        <span className="font-bold">{fp.pick}</span>
                        <span>{friendWon ? "✅" : "❌"}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default PredictionCard;
