import { motion, AnimatePresence } from "framer-motion";

interface HypeOverlayProps {
  type: "four" | "six" | "wicket" | null;
}

const HYPE: Record<string, { emoji: string; text: string; color: string }> = {
  four: { emoji: "💥", text: "FOUR!", color: "from-primary/30 to-transparent" },
  six: { emoji: "🚀", text: "SIX!", color: "from-neon/30 to-transparent" },
  wicket: { emoji: "💀", text: "WICKET!", color: "from-destructive/30 to-transparent" },
};

const HypeOverlay = ({ type }: HypeOverlayProps) => {
  const data = type ? HYPE[type] : null;

  return (
    <AnimatePresence>
      {data && (
        <motion.div
          key={type}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className={`absolute inset-0 z-[100] pointer-events-none flex flex-col items-center justify-center bg-gradient-to-b ${data.color}`}
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
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HypeOverlay;
