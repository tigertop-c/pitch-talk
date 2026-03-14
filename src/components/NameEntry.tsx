import { useState } from "react";
import { motion } from "framer-motion";

const AVATARS = ["🦁", "🐯", "🦊", "🏏", "⚡", "🔥", "💪", "🎯", "🚀", "💅", "🦅", "🐼"];

const TAGLINES = [
  "Every ball is a prediction. Every prediction is a flex.",
  "Think you know cricket? Prove it, ball by ball.",
  "Your squad. Your predictions. Your bragging rights.",
  "Predict. Compete. Talk trash. Repeat.",
];

interface NameEntryProps {
  onComplete: (name: string, avatar: string) => void;
}

const spring = { type: "spring" as const, damping: 25, stiffness: 350 };

const NameEntry = ({ onComplete }: NameEntryProps) => {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("🏏");

  const canContinue = name.trim().length >= 2;
  const tagline = TAGLINES[Math.floor(Date.now() / 60000) % TAGLINES.length];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 relative overflow-hidden">
      {/* Animated background accents */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-80px] right-[-80px] w-64 h-64 rounded-full bg-primary/5 pointer-events-none"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-60px] left-[-60px] w-48 h-48 rounded-full bg-neon/5 pointer-events-none"
      />

      {/* Logo area */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ ...spring, delay: 0.1 }}
        className="text-7xl mb-3 relative"
      >
        🏏
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: "spring", damping: 10 }}
          className="absolute -top-1 -right-3 text-2xl"
        >
          ⚡
        </motion.span>
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...spring, delay: 0.2 }}
        className="text-3xl font-black tracking-tight text-foreground mb-1"
      >
        Pitch Talk
      </motion.h1>

      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...spring, delay: 0.3 }}
        className="text-[13px] text-muted-foreground mb-1 font-medium"
      >
        Predict every ball with your squad
      </motion.p>

      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...spring, delay: 0.4 }}
        className="text-[11px] text-primary/70 mb-7 font-semibold italic text-center px-4"
      >
        {tagline}
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...spring, delay: 0.5 }}
        className="w-full max-w-xs space-y-5 relative z-10"
      >
        {/* Name input */}
        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1.5 block">
            Your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 15))}
            placeholder="What should we call you?"
            maxLength={15}
            className="w-full px-4 py-3.5 rounded-2xl bg-secondary text-foreground text-[15px] font-semibold placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-card transition-all"
            autoFocus
          />
        </div>

        {/* Avatar picker */}
        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1.5 block">
            Pick Your Vibe
          </label>
          <div className="grid grid-cols-6 gap-2">
            {AVATARS.map((a) => (
              <motion.button
                key={a}
                whileTap={{ scale: 0.85 }}
                onClick={() => setAvatar(a)}
                className={`w-11 h-11 flex items-center justify-center rounded-xl text-lg transition-all duration-200 ${
                  avatar === a
                    ? "bg-primary text-primary-foreground ring-2 ring-primary shadow-lg shadow-primary/30 scale-110"
                    : "bg-secondary active:bg-muted hover:bg-muted"
                }`}
              >
                {a}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Selected preview — more prominent */}
        <motion.div
          key={avatar + name}
          initial={{ scale: 0.98 }}
          animate={{ scale: 1 }}
          className="flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-secondary/80 via-secondary/50 to-secondary/80 ring-1 ring-border/50"
        >
          <span className="text-3xl">{avatar}</span>
          <span className="text-[15px] font-black text-foreground tracking-tight">
            {name.trim() || "Your Name"}
          </span>
        </motion.div>

        {/* Continue button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => canContinue && onComplete(name.trim(), avatar)}
          disabled={!canContinue}
          className={`w-full py-4 rounded-2xl text-[15px] font-black tracking-wide transition-all ${
            canContinue
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 active:shadow-md"
              : "bg-secondary text-muted-foreground opacity-50"
          }`}
        >
          {canContinue ? "Let's Go! 🏏🔥" : "Enter your name to start"}
        </motion.button>
      </motion.div>
    </div>
  );
};

export default NameEntry;
