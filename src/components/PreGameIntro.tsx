import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Copy, Check, ChevronRight } from "lucide-react";
import dcLogo from "@/assets/dc-logo.png";
import miLogo from "@/assets/mi-logo.png";

interface PreGameIntroProps {
  onStart: () => void;
}

type Stage = "welcome" | "toss" | "target" | "starting";

const TEAMS = ["India 🇮🇳", "Australia 🇦🇺"];
const RUN_TARGETS = ["140–160", "160–180", "180–200", "200+"];

const spring = { type: "spring" as const, damping: 25, stiffness: 350 };

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
      // Play IPL horn sound when game starts
      try {
        const horn = new Audio("/sounds/ipl_horn.mp3");
        horn.volume = 0.7;
        horn.play();
      } catch (e) { /* audio not supported */ }
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
      whileTap={{ scale: 0.96 }}
      onClick={onPick}
      transition={spring}
      className={`
        py-3.5 px-4 rounded-2xl text-[15px] font-semibold transition-all duration-200
        ${selected
          ? accent
            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
            : "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
          : "bg-secondary text-foreground active:bg-muted"
        }
      `}
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
          transition={{ duration: 0.6 }}
          className="text-center pb-2"
        >
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ ...spring, delay: 0.2 }}
            className="text-5xl mb-3"
          >
            🏏
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...spring, delay: 0.3 }}
            className="text-2xl font-bold tracking-tight text-foreground"
          >
            IND vs AUS
          </motion.h1>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...spring, delay: 0.4 }}
            className="text-sm text-muted-foreground mt-1"
          >
            2nd T20I • Predict while you wait
          </motion.p>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.5 }}
          className="flex gap-2 text-center"
        >
          {[
            { emoji: "🎯", text: "Predict every ball" },
            { emoji: "👀", text: "Compete with friends" },
            { emoji: "🧾", text: "Keep the receipts" },
          ].map((s, i) => (
            <div key={i} className="flex-1 py-3 px-2 ios-card">
              <div className="text-lg mb-0.5">{s.emoji}</div>
              <p className="text-[10px] text-muted-foreground leading-tight font-medium">{s.text}</p>
            </div>
          ))}
        </motion.div>

        {/* Stages */}
        <AnimatePresence mode="wait">
          {stage === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ ...spring, delay: 0.6 }}
              className="space-y-3"
            >
              {/* Match winner */}
              <div className="p-4 ios-card">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-medium">🏆 Pre-match</p>
                <p className="text-[15px] font-semibold text-foreground mb-3">Who wins today?</p>
                <div className="grid grid-cols-2 gap-2">
                  {TEAMS.map(t => (
                    <PickButton key={t} label={t} selected={matchWinner === t} onPick={() => setMatchWinner(t)} accent />
                  ))}
                </div>
                {matchWinner && (
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={spring}
                    className="text-[11px] text-primary mt-2.5 text-center font-medium"
                  >
                    Locked in ✓
                  </motion.p>
                )}
              </div>

              {/* Toss */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: matchWinner ? 1 : 0.4, y: 0 }}
                transition={spring}
                className="p-4 ios-card"
                style={{ pointerEvents: matchWinner ? "auto" : "none" }}
              >
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-medium">🪙 Toss call</p>
                <p className="text-[15px] font-semibold text-foreground mb-3">Who wins the toss?</p>
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
                    >🪙</motion.span>
                    <span className="text-[12px] text-muted-foreground font-medium">Coin in the air...</span>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}

          {stage === "toss" && tossResult && (
            <motion.div
              key="toss"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={spring}
              className="space-y-3"
            >
              <div className="p-5 ios-card text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ ...spring, delay: 0.1 }}
                  className="text-4xl mb-2"
                >🪙</motion.div>
                <p className="text-[15px] font-semibold text-foreground">
                  {tossResult} wins the toss!
                </p>
                <p className="text-[13px] text-muted-foreground mt-1">
                  Elected to bat first
                </p>
                {tossWinner === tossResult && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ ...spring, delay: 0.2 }}
                    className="inline-block mt-2.5 text-[11px] font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full"
                  >
                    You called it! 🔥
                  </motion.span>
                )}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.4 }}
                className="p-4 ios-card"
              >
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-medium">📊 First innings</p>
                <p className="text-[15px] font-semibold text-foreground mb-3">
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

          {stage === "starting" && (
            <motion.div
              key="starting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={spring}
              className="flex flex-col items-center justify-center py-10 space-y-4"
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                className="text-5xl"
              >🔥</motion.div>
              <p className="text-xl font-bold text-foreground tracking-tight">
                Match starting...
              </p>
              <motion.div
                key={countdown}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={spring}
                className="text-5xl font-bold text-primary"
              >
                {countdown > 0 ? countdown : "GO!"}
              </motion.div>
              <p className="text-[13px] text-muted-foreground font-medium">
                Ball-by-ball predictions incoming
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Social + invite */}
        {stage !== "starting" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="space-y-2.5"
          >
            <div className="flex items-center justify-center gap-2 py-2.5 px-4 bg-secondary/50 rounded-2xl">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-neon opacity-75 animate-live-pulse" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon" />
              </span>
              <span className="text-[12px] text-muted-foreground font-medium">
                5 friends already here
              </span>
            </div>

            <button
              onClick={() => setShowInvite(!showInvite)}
              className="w-full py-3 px-4 bg-secondary rounded-2xl text-[13px] font-semibold text-muted-foreground flex items-center justify-center gap-2 active:bg-muted transition-all duration-200"
            >
              <Users size={15} />
              Invite more friends
              <ChevronRight size={13} className={`transition-transform duration-300 ${showInvite ? "rotate-90" : ""}`} />
            </button>

            <AnimatePresence>
              {showInvite && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                  className="overflow-hidden"
                >
                  <div className="p-4 ios-card">
                    <p className="text-[12px] text-muted-foreground mb-2.5 font-medium">Share this link 👇</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3.5 py-2.5 bg-secondary rounded-xl text-[13px] text-foreground truncate font-medium">
                        {inviteLink}
                      </div>
                      <button
                        onClick={handleCopy}
                        className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-[13px] font-semibold flex items-center gap-1.5 active:scale-95 transition-transform duration-150"
                      >
                        {copied ? <Check size={15} /> : <Copy size={15} />}
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
