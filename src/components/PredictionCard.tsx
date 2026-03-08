import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Zap, CircleDot, AlertTriangle, Clock } from "lucide-react";
import { playWinSound, playFailSound, playClickSound } from "@/lib/sounds";

export type PredictionState = "idle" | "locked" | "pending" | "resolved";

export interface BallResult {
  label: string;
  type: "dot" | "single" | "double" | "four" | "six" | "wicket";
}

interface PredictionCardProps {
  id: number;
  ballLabel: string;
  countdown: number;
  state: PredictionState;
  result: BallResult | null;
  selected: string | null;
  onPredict: (pick: string) => void;
}

const outcomes = [
  { label: "Dot", icon: CircleDot, color: "bg-muted text-foreground border-foreground" },
  { label: "Boundary", icon: Zap, color: "bg-primary text-primary-foreground border-foreground" },
  { label: "Single", icon: Target, color: "bg-surface-elevated text-foreground border-foreground" },
  { label: "Wicket", icon: AlertTriangle, color: "bg-destructive text-destructive-foreground border-foreground" },
];

const RESULT_STYLES: Record<string, string> = {
  dot: "bg-muted text-muted-foreground",
  single: "bg-surface-elevated text-foreground",
  double: "bg-surface-elevated text-foreground",
  four: "bg-primary text-primary-foreground",
  six: "bg-neon text-neon-foreground",
  wicket: "bg-destructive text-destructive-foreground",
};

const PredictionCard = ({ id, ballLabel, countdown, state, result, selected, onPredict }: PredictionCardProps) => {
  const urgency = countdown <= 5;
  const won = result && selected && (
    (selected === "Dot" && result.type === "dot") ||
    (selected === "Boundary" && (result.type === "four" || result.type === "six")) ||
    (selected === "Single" && (result.type === "single" || result.type === "double")) ||
    (selected === "Wicket" && result.type === "wicket")
  );

  useEffect(() => {
    if (state === "resolved" && selected) {
      if (won) playWinSound();
      else playFailSound();
    }
  }, [state]);

  const handleClick = (label: string) => {
    if (state !== "idle") return;
    playClickSound();
    onPredict(label);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-4 my-1"
    >
      <div
        className={`p-3 bg-card border-[3px] border-foreground rounded-lg ${urgency && state === "idle" ? "animate-glow-pulse" : ""}`}
        style={{
          boxShadow:
            state === "resolved" && won
              ? "4px 4px 0px hsl(78 100% 50%), 0 0 20px hsl(78 100% 50% / 0.3)"
              : state === "resolved" && selected && !won
              ? "4px 4px 0px hsl(0 72% 51%)"
              : "4px 4px 0px hsl(0 0% 0%)",
        }}
      >
        {/* Header: ball label + timer/result */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 font-mono font-bold text-sm bg-muted border-2 border-foreground rounded-md"
              style={{ boxShadow: "2px 2px 0px hsl(0 0% 0%)" }}
            >
              {ballLabel}
            </span>
            {state === "resolved" && result && (
              <span className={`px-2 py-0.5 font-mono font-bold text-xs rounded-md border-2 border-foreground ${RESULT_STYLES[result.type]}`}
                style={{ boxShadow: "2px 2px 0px hsl(0 0% 0%)" }}
              >
                {result.label}
              </span>
            )}
            {state === "resolved" && selected && (
              <span className={`text-xs font-mono font-bold ${won ? "text-neon" : "text-destructive"}`}>
                {won ? "🎯 YOU WON" : "💀 MISS"}
              </span>
            )}
          </div>
          {state === "idle" && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md border-2 font-mono text-xs font-bold ${
              urgency 
                ? "border-destructive bg-destructive/20 text-destructive" 
                : "border-foreground bg-muted text-foreground"
            }`}>
              <Clock size={10} />
              <span>{countdown}s</span>
            </div>
          )}
          {state === "locked" && (
            <span className="text-xs font-mono text-neon font-bold px-2 py-0.5 bg-neon/10 rounded-md border border-neon/30">
              🔒 Locked
            </span>
          )}
          {state === "pending" && (
            <span className="text-xs font-mono text-muted-foreground font-bold px-2 py-0.5">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="inline-block"
              >🏏</motion.span>
              {" "}Bowling...
            </span>
          )}
        </div>

        {/* Prediction buttons - only show when idle or locked */}
        {(state === "idle" || state === "locked") && (
          <div className="grid grid-cols-4 gap-1.5">
            {outcomes.map((o) => {
              const isSelected = selected === o.label;
              return (
                <button
                  key={o.label}
                  onClick={() => handleClick(o.label)}
                  disabled={state === "locked"}
                  className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-md border-2 border-foreground text-[10px] font-bold font-mono uppercase transition-all ${
                    isSelected
                      ? "bg-neon text-neon-foreground scale-105 ring-2 ring-neon"
                      : state === "locked"
                      ? "opacity-40 " + o.color
                      : o.color + " active:scale-95 hover:scale-105"
                  }`}
                  style={{ boxShadow: isSelected ? "2px 2px 0px hsl(78 100% 40%)" : "2px 2px 0px hsl(0 0% 0%)" }}
                >
                  <o.icon size={16} />
                  {o.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PredictionCard;
