import { motion, AnimatePresence } from "framer-motion";

interface HypeOverlayProps {
  type: "four" | "six" | "wicket" | null;
  onDismiss?: () => void;
  onMute?: (type: string) => void;
}

const HYPE: Record<string, { emoji: string; text: string; color: string }> = {
  four: { emoji: "🏏💨", text: "FOUR!", color: "from-primary/30 to-transparent" },
  six: { emoji: "🚀", text: "SIX!", color: "from-neon/30 to-transparent" },
  wicket: { emoji: "☝️", text: "WICKET!", color: "from-destructive/30 to-transparent" },
};

const HypeOverlay = ({ type, onDismiss, onMute }: HypeOverlayProps) => {
  const data = type ? HYPE[type] : null;

  return (
    <AnimatePresence>
      {data && type && (
        <motion.div
          key={type}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className={`absolute inset-0 z-[100] pointer-events-auto flex flex-col items-center justify-center bg-gradient-to-b ${data.color}`}
          style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 10, stiffness: 300 }}
            className="text-8xl mb-2"
          >
            {data.emoji}
          </motion.div>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ type: "spring", damping: 15, delay: 0.08 }}
            className={`text-4xl font-bold tracking-tight ${
              type === "four" ? "text-primary" :
              type === "six" ? "text-neon" :
              "text-destructive"
            }`}
          >
            {data.text}
          </motion.p>

          {/* Controls */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-3 mt-6"
          >
            <button
              onClick={onDismiss}
              className="px-4 py-2 rounded-full text-[12px] font-semibold bg-background/60 text-foreground active:scale-95 transition-transform"
            >
              Dismiss
            </button>
            <button
              onClick={() => { onMute?.(type); onDismiss?.(); }}
              className="px-4 py-2 rounded-full text-[12px] font-semibold bg-background/40 text-muted-foreground active:scale-95 transition-transform"
            >
              🔇 Mute {type}s
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HypeOverlay;
