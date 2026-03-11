import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HypeOverlayProps {
  type: "four" | "six" | "wicket" | null;
  onDismiss?: () => void;
  onMute?: () => void;
  isDuck?: boolean;
}

const HYPE: Record<string, { emoji: string; text: string; color: string }> = {
  four:   { emoji: "🏏💨", text: "FOUR!",    color: "from-primary/30 to-transparent" },
  six:    { emoji: "🚀",   text: "SIX!",     color: "from-neon/30 to-transparent" },
  wicket: { emoji: "☝️",  text: "WICKET!",  color: "from-destructive/30 to-transparent" },
};

const HypeOverlay = ({ type, onDismiss, onMute, isDuck }: HypeOverlayProps) => {
  const data = type ? HYPE[type] : null;
  const displayEmoji = (type === "wicket" && isDuck) ? "🦆" : data?.emoji ?? "";
  const isDuckMode = type === "wicket" && isDuck;

  const [countdown, setCountdown] = useState(3);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!type) { setCountdown(3); return; }
    setCountdown(3);
    let remaining = 3;
    const id = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(id);
        onDismissRef.current?.();
      } else {
        setCountdown(remaining);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [type]);

  return (
    <AnimatePresence>
      {data && type && (
        <motion.div
          key={type + (isDuck ? "-duck" : "")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className={`absolute inset-0 z-[100] pointer-events-auto flex flex-col items-center justify-center bg-gradient-to-b ${data.color}`}
          style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        >
          {/* Main emoji */}
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 10, stiffness: 300 }}
            className="text-8xl mb-2"
          >
            {displayEmoji}
          </motion.div>

          {/* Main label */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ type: "spring", damping: 15, delay: 0.08 }}
            className={`text-4xl font-bold tracking-tight ${
              type === "four"   ? "text-primary" :
              type === "six"    ? "text-neon" :
              "text-destructive"
            }`}
          >
            {data.text}
          </motion.p>

          {/* Duck badge */}
          {isDuckMode && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", damping: 12, stiffness: 280, delay: 0.18 }}
              className="mt-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30"
            >
              <span className="text-[13px] font-bold text-amber-400 tracking-wide">🦆 OUT FOR DUCK!</span>
            </motion.div>
          )}

          {/* Countdown + Mute */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col items-center gap-3 mt-6"
          >
            <motion.span
              key={countdown}
              initial={{ scale: 1.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="text-4xl font-black text-white/70 tabular-nums"
            >
              {countdown}
            </motion.span>
            <button
              onClick={() => onMute?.()}
              className="px-4 py-2 rounded-full text-[12px] font-semibold bg-background/40 text-muted-foreground active:scale-95 transition-transform"
            >
              🔇 Mute hype
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HypeOverlay;
