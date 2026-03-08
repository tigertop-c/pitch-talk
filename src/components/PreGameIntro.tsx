import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, ChevronRight, MessageCircle, Clock } from "lucide-react";
import dcLogo from "@/assets/dc-logo.png";
import miLogo from "@/assets/mi-logo.png";
import type { TeamId } from "./ChatInput";

interface PreGameIntroProps {
  onStart: (team: TeamId) => void;
  matchStartTime: Date;
  team1: { name: string; short: string };
  team2: { name: string; short: string };
  matchNumber: number;
  roomId: string;
}

type Stage = "welcome" | "toss" | "target" | "starting";

const RUN_TARGETS = ["140–160", "160–180", "180–200", "200+"];

const spring = { type: "spring" as const, damping: 25, stiffness: 350 };

function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, targetDate.getTime() - Date.now()));
  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(Math.max(0, targetDate.getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
  return { hours, minutes, seconds, isLive: timeLeft <= 0 };
}

const PreGameIntro = ({ onStart, matchStartTime, team1, team2, matchNumber, roomId }: PreGameIntroProps) => {
  const [stage, setStage] = useState<Stage>("welcome");
  const [userTeam, setUserTeam] = useState<TeamId | null>(null);
  const [tossWinner, setTossWinner] = useState<string | null>(null);
  const [tossResult, setTossResult] = useState<string | null>(null);
  const [runTarget, setRunTarget] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { hours, minutes, seconds, isLive } = useCountdown(matchStartTime);
  const TEAMS = [team1.name, team2.name] as const;

  // After team pick + toss pick, animate the toss
  useEffect(() => {
    if (userTeam && tossWinner && stage === "welcome") {
      const timer = setTimeout(() => {
        const winner = Math.random() > 0.5 ? team1.name : team2.name;
        setTossResult(winner);
        setStage("toss");
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [userTeam, tossWinner, stage, team1.name, team2.name]);

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
    if (stage === "starting" && countdown === 0 && userTeam) {
      const t = setTimeout(() => onStart(userTeam), 400);
      return () => clearTimeout(t);
    }
  }, [stage, countdown, onStart, userTeam]);

  useEffect(() => {
    if (stage === "starting") {
      let horn: HTMLAudioElement | null = null;
      try {
        horn = new Audio("/sounds/ipl_horn.mp3");
        horn.volume = 0.7;
        horn.play();
      } catch (e) {}
      return () => {
        if (horn) { horn.pause(); horn.currentTime = 0; }
      };
    }
  }, [stage]);

  const handleInviteWhatsApp = () => {
    const text = `🏏 Join my Pitch Talk room for ${team1.short} vs ${team2.short}! Predict every ball, banter with the squad 🧠🔥\n\nRoom: ${roomId}\n${window.location.origin}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const PickButton = ({
    label, selected, onPick,
  }: { label: string; selected: boolean; onPick: () => void }) => (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onPick}
      transition={spring}
      className={`py-3.5 px-4 rounded-2xl text-[15px] font-semibold transition-all duration-200 ${
        selected
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
          : "bg-secondary text-foreground active:bg-muted"
      }`}
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
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ ...spring, delay: 0.2 }}
            className="flex items-center justify-center gap-4 mb-3"
          >
            <img src={dcLogo} alt={team1.short} className="w-20 h-20 object-contain" />
            <span className="text-2xl font-black text-muted-foreground tracking-tight">vs</span>
            <img src={miLogo} alt={team2.short} className="w-20 h-20 object-contain" />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...spring, delay: 0.3 }}
            className="text-3xl font-black tracking-tight text-foreground"
          >
            {team1.short} vs {team2.short}
          </motion.h1>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...spring, delay: 0.4 }}
            className="text-sm text-muted-foreground mt-1"
          >
            IPL 2025 • Match {matchNumber}
          </motion.p>

          {/* Countdown */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...spring, delay: 0.45 }}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-secondary"
          >
            <Clock size={13} className="text-muted-foreground" />
            {isLive ? (
              <span className="text-[13px] font-bold text-destructive flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75 animate-live-pulse" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                </span>
                LIVE NOW
              </span>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground font-medium">Starts in</span>
                <div className="flex items-center gap-0.5">
                  {hours > 0 && (
                    <span className="bg-card px-1.5 py-0.5 rounded-md text-[14px] font-bold text-foreground tabular-nums">{hours}h</span>
                  )}
                  <span className="bg-card px-1.5 py-0.5 rounded-md text-[14px] font-bold text-foreground tabular-nums">{String(minutes).padStart(2, '0')}m</span>
                  <span className="bg-card px-1.5 py-0.5 rounded-md text-[14px] font-bold text-foreground tabular-nums">{String(seconds).padStart(2, '0')}s</span>
                </div>
              </div>
            )}
          </motion.div>
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
            { emoji: "🗣️", text: "Banter with your squad" },
            { emoji: "📊", text: "Track your record" },
          ].map((s, i) => (
            <div key={i} className="flex-1 py-3 px-2 rounded-xl bg-secondary/50">
              <div className="text-lg mb-0.5 text-center">{s.emoji}</div>
              <p className="text-[10px] text-muted-foreground leading-tight font-medium text-center">{s.text}</p>
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
              {/* Team selection */}
              <div className="p-4 ios-card">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-medium">🏟️ Pick Your Side</p>
                <p className="text-[15px] font-semibold text-foreground mb-3">Who are you rooting for?</p>
                <div className="grid grid-cols-2 gap-2">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setUserTeam("DC")}
                    className={`flex flex-col items-center gap-2 py-4 px-3 rounded-2xl transition-all duration-200 ${
                      userTeam === "DC"
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-2 ring-primary"
                        : "bg-secondary text-foreground active:bg-muted"
                    }`}
                  >
                    <img src={dcLogo} alt="DC" className="w-12 h-12 object-contain" />
                    <span className="text-[14px] font-bold">{team1.name}</span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setUserTeam("MI")}
                    className={`flex flex-col items-center gap-2 py-4 px-3 rounded-2xl transition-all duration-200 ${
                      userTeam === "MI"
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-2 ring-primary"
                        : "bg-secondary text-foreground active:bg-muted"
                    }`}
                  >
                    <img src={miLogo} alt="MI" className="w-12 h-12 object-contain" />
                    <span className="text-[14px] font-bold">{team2.name}</span>
                  </motion.button>
                </div>
                {userTeam && (
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={spring}
                    className="text-[11px] text-primary mt-2.5 text-center font-medium"
                  >
                    {userTeam === "DC" ? `💙 ${team1.short} gang locked in!` : `💙 ${team2.short} gang locked in!`}
                  </motion.p>
                )}
              </div>

              {/* Toss prediction — shows after team pick */}
              {userTeam && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={spring}
                  className="p-4 ios-card"
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
              )}
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
                    You called it! Receipt kept 🧾🔥
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
                    <PickButton key={t} label={t} selected={runTarget === t} onPick={() => setRunTarget(t)} />
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
              >🗣️</motion.div>
              <p className="text-xl font-bold text-foreground tracking-tight">
                Sledging starts NOW...
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
              Invite friends
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
                  <div className="p-4 ios-card space-y-2">
                    <p className="text-[12px] text-muted-foreground mb-1 font-medium">Share via WhatsApp 👇</p>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleInviteWhatsApp}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-[13px] text-primary-foreground"
                      style={{ backgroundColor: "hsl(142, 70%, 45%)" }}
                    >
                      <MessageCircle size={16} />
                      Invite on WhatsApp
                    </motion.button>
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
