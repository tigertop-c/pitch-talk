import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, ChevronRight, MessageCircle, Clock, UserPlus, Zap, Play, Bot, X } from "lucide-react";
import type { TeamId } from "./ChatInput";
import { isAiPlayer, AI_PLAYERS } from "@/lib/aiPlayers";

// Team logos
import cskLogo from "@/assets/teams/csk.png";
import dcLogo from "@/assets/teams/dc.png";
import gtLogo from "@/assets/teams/gt.png";
import kkrLogo from "@/assets/teams/kkr.png";
import lsgLogo from "@/assets/teams/lsg.png";
import miLogo from "@/assets/teams/mi.png";
import pbksLogo from "@/assets/teams/pbks.png";
import rcbLogo from "@/assets/teams/rcb.png";
import rrLogo from "@/assets/teams/rr.png";
import srhLogo from "@/assets/teams/srh.png";

const ALL_TEAMS: { id: TeamId; name: string; short: string; logo: string }[] = [
  { id: "CSK", name: "Chennai Super Kings", short: "CSK", logo: cskLogo },
  { id: "DC", name: "Delhi Capitals", short: "DC", logo: dcLogo },
  { id: "GT", name: "Gujarat Titans", short: "GT", logo: gtLogo },
  { id: "KKR", name: "Kolkata Knight Riders", short: "KKR", logo: kkrLogo },
  { id: "LSG", name: "Lucknow Super Giants", short: "LSG", logo: lsgLogo },
  { id: "MI", name: "Mumbai Indians", short: "MI", logo: miLogo },
  { id: "PBKS", name: "Punjab Kings", short: "PBKS", logo: pbksLogo },
  { id: "RCB", name: "Royal Challengers Bengaluru", short: "RCB", logo: rcbLogo },
  { id: "RR", name: "Rajasthan Royals", short: "RR", logo: rrLogo },
  { id: "SRH", name: "Sunrisers Hyderabad", short: "SRH", logo: srhLogo },
];

interface MultiplayerPlayer {
  name: string;
  avatar: string;
  teamPicked?: string | null;
}

interface PreGameIntroProps {
  onStart: (team: TeamId) => void;
  matchStartTime: Date;
  team1: { name: string; short: string };
  team2: { name: string; short: string };
  matchNumber: number;
  roomId: string;
  isSimulation?: boolean;
  players?: MultiplayerPlayer[];
  onInvite?: () => void;
}

type Stage = "welcome" | "toss" | "target" | "starting";

const RUN_TARGETS = ["140–160", "160–180", "180–200", "200+"];

const spring = { type: "spring" as const, damping: 25, stiffness: 350 };

const BOT_SQUAD = [
  { name: "Virat_Fan99", avatar: "🔥" },
  { name: "DhoniFTW", avatar: "💛" },
  { name: "BumrahArmy", avatar: "🎯" },
  { name: "SixerKing", avatar: "💥" },
];

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

const PreGameIntro = ({ onStart, matchStartTime, team1, team2, matchNumber, roomId, isSimulation, players, onInvite }: PreGameIntroProps) => {
  const [stage, setStage] = useState<Stage>("welcome");
  const [userTeam, setUserTeam] = useState<TeamId | null>(null);
  const [tossWinner, setTossWinner] = useState<string | null>(null);
  const [tossResult, setTossResult] = useState<string | null>(null);
  const [runTarget, setRunTarget] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollContainerRef.current?.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: "smooth" });
    }, 200);
  };

  useEffect(() => { if (userTeam) scrollToBottom(); }, [userTeam]);
  useEffect(() => { if (tossResult) scrollToBottom(); }, [tossResult]);
  useEffect(() => { if (stage === "starting") scrollToBottom(); }, [stage]);

  const { hours, minutes, seconds, isLive } = useCountdown(matchStartTime);
  const TEAMS = [team1.name, team2.name] as const;

  // Real players from multiplayer (excluding bots)
  const realPlayers = players?.filter(p => !BOT_SQUAD.some(b => b.name === p.name)) || [];
  // Show bots as AI players in simulation
  const squadMembers = isSimulation
    ? [...realPlayers.map(p => ({ name: p.name, avatar: p.avatar, isBot: false })), ...BOT_SQUAD.map(b => ({ ...b, isBot: true }))]
    : realPlayers.map(p => ({ name: p.name, avatar: p.avatar, isBot: false }));

  // Toss animation for non-simulation
  useEffect(() => {
    if (userTeam && tossWinner && stage === "welcome" && !isSimulation) {
      const timer = setTimeout(() => {
        const winner = Math.random() > 0.5 ? team1.name : team2.name;
        setTossResult(winner);
        setStage("toss");
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [userTeam, tossWinner, stage, team1.name, team2.name, isSimulation]);

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
      return () => { if (horn) { horn.pause(); horn.currentTime = 0; } };
    }
  }, [stage]);

  const handleInviteWhatsApp = () => {
    if (onInvite) {
      onInvite();
    } else {
      const text = `🏏 Join my Pitch Talk room for ${team1.short} vs ${team2.short}! Predict every ball, play with the squad 🧠🔥\n\nRoom: ${roomId}\n${window.location.origin}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  const handleStartSimulation = () => {
    const team = userTeam || (team1.short as TeamId);
    setUserTeam(team);
    setStage("starting");
    setCountdown(5);
  };

  const PickButton = ({ label, selected, onPick }: { label: string; selected: boolean; onPick: () => void }) => (
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

  // ─── SIMULATION MODE ───
  if (isSimulation) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-5 pt-4 pb-6 space-y-4">

          {/* Header */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="text-center pb-2">
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring, delay: 0.2 }}
              className="flex items-center justify-center gap-2 mb-3"
            >
              <Zap size={24} className="text-primary" />
              <span className="text-2xl font-black tracking-tight text-foreground">Simulation Mode</span>
            </motion.div>
            <motion.p
              initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...spring, delay: 0.3 }}
              className="text-sm text-muted-foreground"
            >
              IPL 2025 • 5-Over Match
            </motion.p>
          </motion.div>

          {/* How simulation works */}
          <motion.div
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.4 }}
            className="ios-card p-4 space-y-2"
          >
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">⚡ How Simulation Works</p>
            <div className="space-y-1.5">
              {[
                { emoji: "🎲", text: "Every delivery is randomly generated — no scripted outcomes" },
                { emoji: "🏏", text: "5 overs, 30 deliveries — quick-fire cricket action" },
                { emoji: "🎯", text: "Predict each ball before it's bowled — Dot, Boundary, Six, Wicket & more" },
                { emoji: "🤖", text: "Play with friends or AI opponents who predict alongside you" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-sm flex-shrink-0">{item.emoji}</span>
                  <p className="text-[12px] text-muted-foreground leading-snug">{item.text}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Pick which team you support (only the 2 match teams) */}
          <AnimatePresence mode="wait">
            {stage === "welcome" && (
              <motion.div
                key="sim-welcome"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
                transition={{ ...spring, delay: 0.5 }}
                className="space-y-3"
              >
                {/* Matchup display */}
                <div className="ios-card p-4">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-medium">🏟️ {team1.short} vs {team2.short}</p>
                  <p className="text-[15px] font-semibold text-foreground mb-3">Who are you supporting?</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: team1.short as TeamId, name: team1.name, short: team1.short, logo: ALL_TEAMS.find(t => t.short === team1.short)?.logo },
                      { id: team2.short as TeamId, name: team2.name, short: team2.short, logo: ALL_TEAMS.find(t => t.short === team2.short)?.logo },
                    ].map(t => (
                      <motion.button
                        key={t.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setUserTeam(t.id)}
                        className={`flex flex-col items-center gap-2 py-4 px-3 rounded-2xl transition-all duration-200 ${
                          userTeam === t.id
                            ? "bg-primary/15 ring-2 ring-primary shadow-sm"
                            : "bg-secondary/50 active:bg-muted"
                        }`}
                      >
                        {t.logo && <img src={t.logo} alt={t.short} className="w-14 h-14 object-contain" />}
                        <span className={`text-[13px] font-bold ${userTeam === t.id ? "text-primary" : "text-foreground"}`}>{t.short}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Squad / Friends + Invite section — show immediately */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.1 }}
                  className="ios-card p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">👥 Your Squad</p>
                      <p className="text-[13px] font-semibold text-foreground mt-0.5">
                        {squadMembers.length} {squadMembers.length === 1 ? "player" : "players"} in the room
                      </p>
                    </div>
                    <button
                      onClick={handleInviteWhatsApp}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-[hsl(142,70%,35%)] bg-[hsl(142,70%,45%,0.12)] active:bg-[hsl(142,70%,45%,0.2)] transition-all active:scale-95"
                    >
                      <UserPlus size={12} />
                      Invite
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {squadMembers.map((m, i) => (
                      <motion.div
                        key={m.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ ...spring, delay: 0.05 * i }}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-secondary/40"
                      >
                        <span className="text-base">{m.avatar}</span>
                        <span className="text-[13px] font-semibold text-foreground flex-1">{m.name}</span>
                        {m.isBot ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent/20 text-muted-foreground">🤖 AI</span>
                        ) : (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary">JOINED</span>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  <p className="text-[10px] text-muted-foreground text-center">
                    Invite more friends or start anytime — AI players fill the gaps!
                  </p>
                </motion.div>

                {/* Room code */}
                <div className="ios-card p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-medium">Room Code</p>
                    <p className="text-lg font-black tracking-[0.15em] text-foreground">{roomId}</p>
                  </div>
                  <button
                    onClick={handleInviteWhatsApp}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold bg-[hsl(142,70%,45%,0.12)] text-[hsl(142,70%,35%)] active:scale-95 transition-transform"
                  >
                    <MessageCircle size={14} />
                    Share
                  </button>
                </div>

                {/* Start simulation button — always visible */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.2 }}
                  className="pt-1"
                >
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={handleStartSimulation}
                    className="w-full py-4 rounded-2xl bg-primary text-primary-foreground text-[16px] font-bold shadow-lg shadow-primary/25 active:bg-primary/90 transition-all flex items-center justify-center gap-2"
                  >
                    <Play size={18} />
                    Start 5-Over Simulation
                  </motion.button>
                  {!userTeam && (
                    <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                      Pick a team above, or we'll default to {team1.short} 🏏
                    </p>
                  )}
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
                  Game ON! 🔥
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
                  5 overs of pure prediction chaos 🎲
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ─── LIVE MATCH MODE (existing flow) ───
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-5 pt-4 pb-6 space-y-4">

        {/* Hero */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="text-center pb-2">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring, delay: 0.2 }}
            className="flex items-center justify-center gap-4 mb-3"
          >
            <img src={dcLogo} alt={team1.short} className="w-20 h-20 object-contain" />
            <span className="text-2xl font-black text-muted-foreground tracking-tight">vs</span>
            <img src={miLogo} alt={team2.short} className="w-20 h-20 object-contain" />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...spring, delay: 0.3 }}
            className="text-3xl font-black tracking-tight text-foreground"
          >
            {team1.short} vs {team2.short}
          </motion.h1>
          <motion.p
            initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...spring, delay: 0.4 }}
            className="text-sm text-muted-foreground mt-1"
          >
            IPL 2025 • Match {matchNumber}
          </motion.p>

          {/* Countdown */}
          <motion.div
            initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...spring, delay: 0.45 }}
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
                  {hours > 0 && <span className="bg-card px-1.5 py-0.5 rounded-md text-[14px] font-bold text-foreground tabular-nums">{hours}h</span>}
                  <span className="bg-card px-1.5 py-0.5 rounded-md text-[14px] font-bold text-foreground tabular-nums">{String(minutes).padStart(2, '0')}m</span>
                  <span className="bg-card px-1.5 py-0.5 rounded-md text-[14px] font-bold text-foreground tabular-nums">{String(seconds).padStart(2, '0')}s</span>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* How it works + invite */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.5 }} className="space-y-2.5">
          <div className="flex gap-2 text-center">
            {[
              { emoji: "🎯", text: "Predict every ball" },
              { emoji: "🗣️", text: "Play with your squad" },
              { emoji: "📊", text: "Track your record" },
            ].map((s, i) => (
              <div key={i} className="flex-1 py-3 px-2 rounded-xl bg-secondary/50">
                <div className="text-lg mb-0.5 text-center">{s.emoji}</div>
                <p className="text-[10px] text-muted-foreground leading-tight font-medium text-center">{s.text}</p>
              </div>
            ))}
          </div>

          {stage !== "starting" && (
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-secondary/50">
              <div className="flex -space-x-1.5 flex-shrink-0">
                {squadMembers.slice(0, 3).map(m => (
                  <div key={m.name} className="w-6 h-6 flex items-center justify-center rounded-full bg-card text-[10px] ring-2 ring-background">
                    {m.avatar}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground flex-1 leading-snug">
                <span className="font-semibold text-foreground">{squadMembers.length} players</span> are here
              </p>
              <button
                onClick={handleInviteWhatsApp}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-[hsl(142,70%,35%)] bg-[hsl(142,70%,45%,0.12)] active:bg-[hsl(142,70%,45%,0.2)] transition-all active:scale-95"
              >
                <MessageCircle size={12} />
                Invite
              </button>
            </div>
          )}
        </motion.div>

        {/* Game Stages */}
        <AnimatePresence mode="wait">
          {stage === "welcome" && (
            <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ ...spring, delay: 0.6 }} className="space-y-3">
              {/* Team selection (2 teams for live) */}
              <div className="p-4 ios-card">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-medium">🏟️ Pick Your Side</p>
                <p className="text-[15px] font-semibold text-foreground mb-3">Who are you rooting for?</p>
                <div className="grid grid-cols-2 gap-2">
                  <motion.button whileTap={{ scale: 0.96 }} onClick={() => setUserTeam(team1.short as TeamId)}
                    className={`flex flex-col items-center gap-2 py-4 px-3 rounded-2xl transition-all duration-200 ${
                      userTeam === team1.short ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-2 ring-primary" : "bg-secondary text-foreground active:bg-muted"
                    }`}>
                    <img src={dcLogo} alt="DC" className="w-12 h-12 object-contain" />
                    <span className="text-[14px] font-bold">{team1.name}</span>
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={() => setUserTeam(team2.short as TeamId)}
                    className={`flex flex-col items-center gap-2 py-4 px-3 rounded-2xl transition-all duration-200 ${
                      userTeam === team2.short ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-2 ring-primary" : "bg-secondary text-foreground active:bg-muted"
                    }`}>
                    <img src={miLogo} alt="MI" className="w-12 h-12 object-contain" />
                    <span className="text-[14px] font-bold">{team2.name}</span>
                  </motion.button>
                </div>
                {userTeam && (
                  <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={spring}
                    className="text-[11px] text-primary mt-2.5 text-center font-medium">
                    💙 {userTeam} gang locked in!
                  </motion.p>
                )}
              </div>

              {/* Toss prediction */}
              {userTeam && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="p-4 ios-card">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-medium">🪙 Toss call</p>
                  <p className="text-[15px] font-semibold text-foreground mb-3">Who wins the toss?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {TEAMS.map(t => (
                      <PickButton key={t} label={t} selected={tossWinner === t} onPick={() => setTossWinner(t)} />
                    ))}
                  </div>
                  {tossWinner && !tossResult && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2 mt-3">
                      <motion.span animate={{ rotateY: [0, 180, 360] }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="text-lg">🪙</motion.span>
                      <span className="text-[12px] text-muted-foreground font-medium">Coin in the air...</span>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          {stage === "toss" && tossResult && (
            <motion.div key="toss" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={spring} className="space-y-3">
              <div className="p-5 ios-card text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring, delay: 0.1 }} className="text-4xl mb-2">🪙</motion.div>
                <p className="text-[15px] font-semibold text-foreground">{tossResult} wins the toss!</p>
                <p className="text-[13px] text-muted-foreground mt-1">Elected to bat first</p>
                {tossWinner === tossResult && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring, delay: 0.2 }}
                    className="inline-block mt-2.5 text-[11px] font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                    You called it! Receipt kept 🧾🔥
                  </motion.span>
                )}
              </div>

              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.4 }} className="p-4 ios-card">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-medium">📊 First innings</p>
                <p className="text-[15px] font-semibold text-foreground mb-3">How many will {tossResult.split(" ")[0]} set?</p>
                <div className="grid grid-cols-2 gap-2">
                  {RUN_TARGETS.map(t => (
                    <PickButton key={t} label={t} selected={runTarget === t} onPick={() => setRunTarget(t)} />
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {stage === "starting" && (
            <motion.div key="starting" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={spring}
              className="flex flex-col items-center justify-center py-10 space-y-4">
              <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }} className="text-5xl">🗣️</motion.div>
              <p className="text-xl font-bold text-foreground tracking-tight">Game ON! 🔥</p>
              <motion.div key={countdown} initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring} className="text-5xl font-bold text-primary">
                {countdown > 0 ? countdown : "GO!"}
              </motion.div>
              <p className="text-[13px] text-muted-foreground font-medium">Ball-by-ball predictions incoming</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PreGameIntro;
