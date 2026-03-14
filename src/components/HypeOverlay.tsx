import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HypeOverlayProps {
  type: "four" | "six" | "wicket" | null;
  onDismiss?: () => void;
  onMute?: () => void;
  isDuck?: boolean;
}

const HYPE: Record<string, { emoji: string; text: string; bg: string; accent: string; particles: string[] }> = {
  four: {
    emoji: "🏏💨",
    text: "FOUR!",
    bg: "from-blue-900/90 via-primary/60 to-blue-950/90",
    accent: "text-sky-300",
    particles: ["💥", "⚡", "🔵", "✨"],
  },
  six: {
    emoji: "🚀",
    text: "SIX!",
    bg: "from-emerald-900/90 via-neon/50 to-green-950/90",
    accent: "text-emerald-300",
    particles: ["🌟", "⭐", "💫", "✨", "🔥"],
  },
  wicket: {
    emoji: "☝️",
    text: "WICKET!",
    bg: "from-red-900/90 via-destructive/50 to-red-950/90",
    accent: "text-red-300",
    particles: ["💀", "🔴", "☠️", "💔"],
  },
};

// Floating particle component
const FloatingParticle = ({ emoji, delay, index }: { emoji: string; delay: number; index: number }) => {
  const side = index % 2 === 0 ? -1 : 1;
  const startX = side * (40 + Math.random() * 60);
  return (
    <motion.span
      initial={{ opacity: 0, y: 80, x: startX, scale: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: [80, -20, -80, -140],
        x: [startX, startX + side * 20, startX - side * 10, startX + side * 30],
        scale: [0, 1.2, 1, 0.6],
        rotate: [0, side * 15, side * -10, side * 25],
      }}
      transition={{ duration: 2.5, delay, ease: "easeOut" }}
      className="absolute text-xl pointer-events-none"
      style={{ left: `${30 + Math.random() * 40}%`, top: "50%" }}
    >
      {emoji}
    </motion.span>
  );
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
          transition={{ duration: 0.2 }}
          className={`absolute inset-0 z-[100] pointer-events-auto flex flex-col items-center justify-center bg-gradient-to-b ${data.bg} overflow-hidden`}
          style={{ backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
        >
          {/* Radial glow behind emoji */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 1.2], opacity: [0, 0.6, 0.3] }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute w-60 h-60 rounded-full"
            style={{
              background: type === "six"
                ? "radial-gradient(circle, hsl(142 71% 45% / 0.4), transparent 70%)"
                : type === "four"
                ? "radial-gradient(circle, hsl(211 100% 50% / 0.4), transparent 70%)"
                : "radial-gradient(circle, hsl(0 84% 60% / 0.4), transparent 70%)",
            }}
          />

          {/* Floating particles */}
          {data.particles.map((p, i) => (
            <FloatingParticle key={i} emoji={p} delay={0.1 + i * 0.15} index={i} />
          ))}
          {data.particles.map((p, i) => (
            <FloatingParticle key={`b-${i}`} emoji={p} delay={0.6 + i * 0.12} index={i + data.particles.length} />
          ))}

          {/* Main emoji — bigger and bouncier */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: [0, 1.3, 1], rotate: [-20, 5, 0] }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: "spring", damping: 8, stiffness: 200 }}
            className="text-[96px] mb-2 relative z-10 drop-shadow-2xl"
          >
            {displayEmoji}
          </motion.div>

          {/* Main label — neon glow text */}
          <motion.p
            initial={{ y: 30, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -15, opacity: 0 }}
            transition={{ type: "spring", damping: 12, stiffness: 250, delay: 0.08 }}
            className={`text-5xl font-black tracking-tight relative z-10 ${data.accent} animate-neon-pulse`}
          >
            {data.text}
          </motion.p>

          {/* Sub-text flavor */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-[13px] font-semibold text-white/50 mt-1 relative z-10 tracking-wide uppercase"
          >
            {type === "six" ? "Into the stands!" : type === "four" ? "Racing to the boundary!" : isDuckMode ? "Golden duck!" : "Timber!"}
          </motion.p>

          {/* Duck badge */}
          {isDuckMode && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", damping: 12, stiffness: 280, delay: 0.2 }}
              className="mt-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 relative z-10"
            >
              <span className="text-[13px] font-bold text-amber-300 tracking-wide">🦆 OUT FOR DUCK!</span>
            </motion.div>
          )}

          {/* Countdown + Mute */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col items-center gap-3 mt-8 relative z-10"
          >
            <motion.span
              key={countdown}
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.5 }}
              transition={{ duration: 0.3 }}
              className="text-5xl font-black text-white/30 tabular-nums"
            >
              {countdown}
            </motion.span>
            <button
              onClick={() => onMute?.()}
              className="px-4 py-2 rounded-full text-[11px] font-semibold bg-white/10 text-white/50 active:scale-95 transition-all hover:bg-white/15 border border-white/10"
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
