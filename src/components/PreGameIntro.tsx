import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Users, Copy, Check, Sparkles } from "lucide-react";

interface PreGameIntroProps {
  onStart: () => void;
}

const STEPS = [
  {
    emoji: "🏏",
    title: "Predict Every Ball",
    desc: "Dot? Boundary? Wicket? Lock in your call before the bowler delivers.",
  },
  {
    emoji: "🔥",
    title: "Compete With Friends",
    desc: "See who's got the best cricket brain. Streaks & leaderboards included.",
  },
  {
    emoji: "🎯",
    title: "Earn Receipts",
    desc: "Called a six before it happened? We keep the receipts. Flex on everyone.",
  },
];

const PreGameIntro = ({ onStart }: PreGameIntroProps) => {
  const [copied, setCopied] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const inviteLink = "pitchtalk.app/join/IND-vs-AUS";

  const handleCopy = () => {
    navigator.clipboard.writeText(`Join me on PitchTalk! Predict every ball live 🏏🔥 ${inviteLink}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-6 pt-8 pb-4 text-center"
        >
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 10, delay: 0.2 }}
            className="text-6xl mb-4"
          >
            🏏
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-bold font-mono tracking-tight text-foreground mb-1"
          >
            IND vs AUS
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm font-mono text-muted-foreground"
          >
            2nd T20I • About to go live
          </motion.p>
        </motion.div>

        {/* How it works */}
        <div className="px-5 py-4">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3"
          >
            How it works
          </motion.p>

          <div className="space-y-2.5">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8 + i * 0.15 }}
                className="flex items-start gap-3 p-3 bg-card border-2 border-foreground rounded-lg"
                style={{ boxShadow: "3px 3px 0px hsl(0 0% 0%)" }}
              >
                <span className="text-2xl flex-shrink-0">{step.emoji}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold font-mono text-foreground">{step.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Invite section */}
        <AnimatePresence>
          {showInvite && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-5 overflow-hidden"
            >
              <div
                className="p-3 bg-card border-2 border-foreground rounded-lg mb-4"
                style={{ boxShadow: "3px 3px 0px hsl(0 0% 0%)" }}
              >
                <p className="text-xs font-mono text-muted-foreground mb-2">Share this link 👇</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-muted rounded-md border border-border font-mono text-xs text-foreground truncate">
                    {inviteLink}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="px-3 py-2 bg-neon text-neon-foreground rounded-md border-2 border-foreground font-mono text-xs font-bold flex items-center gap-1 active:scale-95 transition-transform"
                    style={{ boxShadow: "2px 2px 0px hsl(0 0% 0%)" }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Waiting vibe */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="px-5 py-2"
        >
          <div className="flex items-center justify-center gap-2 py-3 px-4 bg-card/50 rounded-lg border border-border">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-neon opacity-75 animate-live-pulse" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-neon" />
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              5 friends already here • Toss in 2 min
            </span>
          </div>
        </motion.div>
      </div>

      {/* Bottom actions */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2, type: "spring", damping: 15 }}
        className="px-5 pb-5 pt-3 space-y-2.5 border-t border-border bg-background"
      >
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="w-full py-3 px-4 bg-card border-2 border-foreground rounded-lg font-mono text-sm font-bold text-foreground flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          style={{ boxShadow: "3px 3px 0px hsl(0 0% 0%)" }}
        >
          <Users size={16} />
          Invite Friends
        </button>

        <button
          onClick={onStart}
          className="w-full py-4 px-4 bg-neon border-[3px] border-foreground rounded-lg font-mono text-base font-bold text-neon-foreground flex items-center justify-center gap-2 active:scale-[0.98] transition-transform animate-glow-pulse"
          style={{ boxShadow: "4px 4px 0px hsl(0 0% 0%)" }}
        >
          <Sparkles size={18} />
          LET'S GO — Start Predicting
        </button>
      </motion.div>
    </div>
  );
};

export default PreGameIntro;
