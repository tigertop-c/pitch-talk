import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Copy, Check, ChevronRight } from "lucide-react";

interface PreGameIntroProps {
  onStart: () => void;
}

type Stage = "welcome" | "toss" | "target" | "starting";

const TEAMS = ["India 🇮🇳", "Australia 🇦🇺"];
const RUN_TARGETS = ["140–160", "160–180", "180–200", "200+"];

const PreGameIntro = ({ onStart }: PreGameIntroProps) => {
  const [stage, setStage] = useState<Stage>("welcome");
  const [matchWinner, setMatchWinner] = useState<string | null>(null);
  const [tossWinner, setTossWinner] = useState<string | null>(null);
  const [tossResult, setTossResult] = useState<string | null>(null);
  const [runTarget, setRunTarget] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const inviteLink = "pitchtalk.app/join/IND-vs-AUS";

  const handleCopy = () => {
    navigator.clipboard.writeText(`Join me on PitchTalk! Predict every ball live 🏏🔥 ${inviteLink}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // After both match winner & toss picks are in, simulate toss after a short delay
  useEffect(() => {
    if (matchWinner && tossWinner && stage === "welcome") {
      const timer = setTimeout(() => {
        const winner = Math.random() > 0.5 ? "India 🇮🇳" : "Australia 🇦🇺";
        setTossResult(winner);
        setStage("toss");
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [matchWinner, tossWinner, stage]);

  // After run target picked, auto-transition to starting after a brief pause
  useEffect(() => {
    if (runTarget && stage === "toss") {
      const timer = setTimeout(() => {
        setStage("starting");
        setCountdown(5);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [runTarget, stage]);

  useEffect(() => {
    if (stage === "starting" && countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
    if (stage === "starting" && countdown === 0) {
      const t = setTimeout(onStart, 400);
      return () => clearTimeout(t);
    }
  }, [stage, countdown, onStart]);

  const PickButton = ({
    label,
    selected,
    onPick,
    accent = false,
  }: {
    label: string;
    selected: boolean;
    onPick: () => void;
    accent?: boolean;
  }) => (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onPick}
      className={`
        py-3 px-4 rounded-lg border-2 font-mono text-sm font-bold transition-all
        ${selected
          ? accent
            ? "bg-neon text-neon-foreground border-foreground"
            : "bg-electric text-primary-foreground border-foreground"
          : "bg-card text-foreground border-border hover:border-foreground"
        }
      `}
      style={{
        boxShadow: selected ? "3px 3px 0px hsl(0 0% 0%)" : "2px 2px 0px hsl(0 0% 0% / 0.3)",
      }}
    >
      {label}
    </motion.button>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-4 space-y-5">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center pb-2"
        >
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 10, delay: 0.2 }}
            className="text-5xl mb-3"
          >
            🏏
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold font-mono tracking-tight text-foreground"
          >
            IND vs AUS
          </motion.h1>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xs font-mono text-muted-foreground mt-1"
          >
            2nd T20I • Predict while you wait
          </motion.p>
        </motion.div>

        {/* How it works - compact */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex gap-3 text-center"
        >
          {[
            { emoji: "🎯", text: "Predict every ball" },
            { emoji: "👀", text: "Compete with friends" },
            { emoji: "🧾", text: "Keep the receipts" },
          ].map((s, i) => (
            <div key={i} className="flex-1 py-2.5 px-2 bg-card rounded-lg border border-border">
              <div className="text-lg mb-0.5">{s.emoji}</div>
              <p className="text-[10px] font-mono text-muted-foreground leading-tight">{s.text}</p>
            </div>
          ))}
        </motion.div>

        {/* Stage: Match winner + Toss */}
        <AnimatePresence mode="wait">
          {stage === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ delay: 0.6 }}
              className="space-y-4"
            >
              {/* Match winner */}
              <div className="p-4 bg-card border-2 border-foreground rounded-lg" style={{ boxShadow: "3px 3px 0px hsl(0 0% 0%)" }}>
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">🏆 Pre-match</p>
                <p className="text-sm font-bold font-mono text-foreground mb-3">Who wins today?</p>
                <div className="grid grid-cols-2 gap-2">
                  {TEAMS.map(t => (
                    <PickButton key={t} label={t} selected={matchWinner === t} onPick={() => setMatchWinner(t)} accent />
                  ))}
                </div>
                {matchWinner && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[10px] font-mono text-neon mt-2 text-center"
                  >
                    Locked in ✓
                  </motion.p>
                )}
              </div>

              {/* Toss winner */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: matchWinner ? 1 : 0.4, y: 0 }}
                className="p-4 bg-card border-2 border-foreground rounded-lg"
                style={{ boxShadow: "3px 3px 0px hsl(0 0% 0%)", pointerEvents: matchWinner ? "auto" : "none" }}
              >
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">🪙 Toss call</p>
                <p className="text-sm font-bold font-mono text-foreground mb-3">Who wins the toss?</p>
                <div className="grid grid-cols-2 gap-2">
                  {TEAMS.map(t => (
                    <PickButton key={t} label={t} selected={tossWinner === t} onPick={() => setTossWinner(t)} />
                  ))}
                </div>
                {tossWinner && !tossResult && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center gap-2 mt-3"
                  >
                    <motion.span
                      animate={{ rotateY: [0, 180, 360] }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="text-lg"
                    >
                      🪙
                    </motion.span>
                    <span className="text-[11px] font-mono text-muted-foreground">Coin in the air...</span>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* Stage: Toss result + Run target */}
          {stage === "toss" && tossResult && (
            <motion.div
              key="toss"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-4"
            >
              {/* Toss result */}
              <div className="p-4 bg-card border-2 border-foreground rounded-lg text-center" style={{ boxShadow: "3px 3px 0px hsl(0 0% 0%)" }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 8 }}
                  className="text-3xl mb-2"
                >
                  🪙
                </motion.div>
                <p className="text-sm font-bold font-mono text-foreground">
                  {tossResult} wins the toss!
                </p>
                <p className="text-xs font-mono text-muted-foreground mt-1">
                  Elected to bat first
                </p>
                {tossWinner === tossResult && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-block mt-2 text-[10px] font-mono font-bold text-neon bg-neon/10 px-2 py-0.5 rounded"
                  >
                    You called it! 🔥
                  </motion.span>
                )}
              </div>

              {/* Run target prediction */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="p-4 bg-card border-2 border-foreground rounded-lg"
                style={{ boxShadow: "3px 3px 0px hsl(0 0% 0%)" }}
              >
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">📊 First innings</p>
                <p className="text-sm font-bold font-mono text-foreground mb-3">
                  How many will {tossResult.split(" ")[0]} set?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {RUN_TARGETS.map(t => (
                    <PickButton key={t} label={t} selected={runTarget === t} onPick={() => setRunTarget(t)} accent />
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Stage: Starting countdown */}
          {stage === "starting" && (
            <motion.div
              key="starting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-8 space-y-4"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-5xl"
              >
                🔥
              </motion.div>
              <p className="text-lg font-bold font-mono text-foreground">
                Match starting...
              </p>
              <motion.div
                key={countdown}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-bold font-mono text-neon"
              >
                {countdown > 0 ? countdown : "GO!"}
              </motion.div>
              <p className="text-[11px] font-mono text-muted-foreground">
                Ball-by-ball predictions are about to begin
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Social proof + invite */}
        {stage !== "starting" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-center gap-2 py-2.5 px-4 bg-card/50 rounded-lg border border-border">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-neon opacity-75 animate-live-pulse" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon" />
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                5 friends already here
              </span>
            </div>

            <button
              onClick={() => setShowInvite(!showInvite)}
              className="w-full py-2.5 px-4 bg-card border-2 border-border rounded-lg font-mono text-xs font-bold text-muted-foreground flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:border-foreground"
              style={{ boxShadow: "2px 2px 0px hsl(0 0% 0% / 0.3)" }}
            >
              <Users size={14} />
              Invite more friends
              <ChevronRight size={12} className={`transition-transform ${showInvite ? "rotate-90" : ""}`} />
            </button>

            <AnimatePresence>
              {showInvite && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 bg-card border-2 border-foreground rounded-lg" style={{ boxShadow: "3px 3px 0px hsl(0 0% 0%)" }}>
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
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PreGameIntro;
