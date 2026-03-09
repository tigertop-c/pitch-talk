import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const AVATARS = ["🦁", "🐯", "🦊", "🏏", "⚡", "🔥", "💪", "🎯", "🚀", "💅", "🦅", "🐼"];

interface NameEntryProps {
  onComplete: (name: string, avatar: string) => void;
}

const spring = { type: "spring" as const, damping: 25, stiffness: 350 };

const NameEntry = ({ onComplete }: NameEntryProps) => {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("🏏");

  const canContinue = name.trim().length >= 2;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ ...spring, delay: 0.1 }}
        className="text-6xl mb-4"
      >
        🏏
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...spring, delay: 0.2 }}
        className="text-2xl font-black tracking-tight text-foreground mb-1"
      >
        Pitch Talk
      </motion.h1>

      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...spring, delay: 0.3 }}
        className="text-sm text-muted-foreground mb-8"
      >
        Predict every ball with your squad
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...spring, delay: 0.4 }}
        className="w-full max-w-xs space-y-5"
      >
        {/* Name input */}
        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1.5 block">
            Your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 15))}
            placeholder="Enter your name..."
            maxLength={15}
            className="w-full px-4 py-3.5 rounded-2xl bg-secondary text-foreground text-[15px] font-semibold placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            autoFocus
          />
        </div>

        {/* Avatar picker */}
        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1.5 block">
            Pick Your Vibe
          </label>
          <div className="grid grid-cols-6 gap-2">
            {AVATARS.map((a) => (
              <motion.button
                key={a}
                whileTap={{ scale: 0.9 }}
                onClick={() => setAvatar(a)}
                className={`w-11 h-11 flex items-center justify-center rounded-xl text-lg transition-all ${
                  avatar === a
                    ? "bg-primary text-primary-foreground ring-2 ring-primary shadow-lg shadow-primary/25"
                    : "bg-secondary active:bg-muted"
                }`}
              >
                {a}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Selected preview */}
        <div className="flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-secondary/50">
          <span className="text-2xl">{avatar}</span>
          <span className="text-[15px] font-bold text-foreground">
            {name.trim() || "Your Name"}
          </span>
        </div>

        {/* Continue button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => canContinue && onComplete(name.trim(), avatar)}
          disabled={!canContinue}
          className={`w-full py-4 rounded-2xl text-[15px] font-bold transition-all ${
            canContinue
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 active:shadow-md"
              : "bg-secondary text-muted-foreground opacity-50"
          }`}
        >
          Let's Play 🏏
        </motion.button>
      </motion.div>
    </div>
  );
};

export default NameEntry;
