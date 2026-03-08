import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Zap, CircleDot, AlertTriangle } from "lucide-react";

type PredictionState = "idle" | "pending" | "winner" | "failed";

interface PredictionCardProps {
  id: number;
  user: string;
  event: string;
}

const outcomes = [
  { label: "Dot", icon: CircleDot, color: "bg-muted text-foreground border-foreground" },
  { label: "Boundary", icon: Zap, color: "bg-primary text-primary-foreground border-foreground" },
  { label: "Single", icon: Target, color: "bg-surface-elevated text-foreground border-foreground" },
  { label: "Wicket", icon: AlertTriangle, color: "bg-destructive text-destructive-foreground border-foreground" },
];

const PredictionCard = ({ id, user, event }: PredictionCardProps) => {
  const [state, setState] = useState<PredictionState>("idle");
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<"winner" | "failed" | null>(null);

  const handlePredict = (label: string) => {
    if (state !== "idle") return;
    setSelected(label);
    setState("pending");

    setTimeout(() => {
      const won = Math.random() > 0.5;
      setState(won ? "winner" : "failed");
      setResult(won ? "winner" : "failed");
    }, 2000);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`mx-4 my-3 p-4 bg-card border-[3px] border-foreground rounded-lg ${
        result === "winner" ? "neon-glow" : result === "failed" ? "" : ""
      }`}
      style={{
        boxShadow:
          result === "winner"
            ? "4px 4px 0px hsl(78 100% 50%), 0 0 20px hsl(78 100% 50% / 0.3)"
            : result === "failed"
            ? "4px 4px 0px hsl(0 72% 51%)"
            : "4px 4px 0px hsl(0 0% 0%)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono uppercase tracking-wider text-neon font-bold">
          ⚡ Prediction #{id}
        </span>
        <span className="text-xs font-mono text-muted-foreground">{event}</span>
      </div>

      <p className="text-sm text-muted-foreground mb-3 font-mono">
        <span className="text-foreground font-semibold">{user}</span> — What happens next?
      </p>

      {state === "idle" && (
        <div className="grid grid-cols-4 gap-2">
          {outcomes.map((o) => (
            <button
              key={o.label}
              onClick={() => handlePredict(o.label)}
              className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-md border-2 border-foreground text-xs font-bold font-mono uppercase transition-transform active:scale-95 hover:scale-105 ${o.color}`}
              style={{ boxShadow: "2px 2px 0px hsl(0 0% 0%)" }}
            >
              <o.icon size={18} />
              {o.label}
            </button>
          ))}
        </div>
      )}

      {state === "pending" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-4"
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
            Pending... You picked <span className="text-neon">{selected}</span>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {(state === "winner" || state === "failed") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center py-4 rounded-md border-2 border-foreground font-mono font-bold text-lg ${
              state === "winner"
                ? "bg-neon text-neon-foreground"
                : "bg-destructive text-destructive-foreground"
            }`}
            style={{ boxShadow: "2px 2px 0px hsl(0 0% 0%)" }}
          >
            {state === "winner" ? "🎯 WINNER!" : "💀 FAILED"}
            <div className="text-xs mt-1 opacity-80">
              You picked: {selected}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PredictionCard;
