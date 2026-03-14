import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LiveHeader from "@/components/LiveHeader";
import BanterStream from "@/components/BanterStream";
import type { FriendDef } from "@/components/BanterStream";
import GamePicker, { type UpcomingMatch } from "@/components/GamePicker";
import BottomNav, { type TabId } from "@/components/BottomNav";
import ReceiptsScreen from "@/components/ReceiptsScreen";
import Leaderboard, { type LeaderboardEntry } from "@/components/Leaderboard";
import PreGameIntro from "@/components/PreGameIntro";
import HypeOverlay from "@/components/HypeOverlay";
import NameEntry from "@/components/NameEntry";
import { useMatchState } from "@/hooks/useMatchState";
import { useLiveMatchState } from "@/hooks/useLiveMatchState";
import { useMultiplayer, type GameSnapshot } from "@/hooks/useMultiplayer";
import { type PredictionRecord, type ReceiptData } from "@/components/ShareableReceipt";
import { setSoundMuted, playMatchWinSound, playMatchLossSound, playInningsBreakSound } from "@/lib/sounds";
import type { TeamId } from "@/components/ChatInput";
import SquadStandingsBar, { type SquadEntry } from "@/components/SquadStandingsBar";
import { AI_PLAYERS } from "@/lib/aiPlayers";

// When VITE_USE_MOCK_DATA=true, all matches run as simulations (no real API polling).
const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === "true";

// Commentator match summaries
const getMatchCommentary = (winnerShort: string, loserShort: string, winMargin: string, chasingTeamWon: boolean, firstInningsScore: number, secondInningsScore: number): string => {
  const summaries = chasingTeamWon
    ? [
        `"What a chase! ${winnerShort} have done it ${winMargin}! The dressing room is ERUPTING! ${loserShort} thought ${firstInningsScore} was enough, but ${winnerShort} had other plans!"`,
        `"INCREDIBLE scenes! ${winnerShort} cross the line ${winMargin}! ${loserShort} will be kicking themselves — they let this one slip right through their fingers!"`,
        `"${winnerShort} complete the chase with authority! ${winMargin}! The fans are on their feet — what a magnificent run chase under pressure!"`,
      ]
    : [
        `"${winnerShort} WIN ${winMargin}! Their bowlers were simply OUTSTANDING! ${loserShort} never got going and the target of ${firstInningsScore + 1} proved too much on this track!"`,
        `"Dominant performance from ${winnerShort}! They win ${winMargin} and ${loserShort} have a LOT to think about. The bowling attack was just relentless!"`,
        `"It's all over! ${winnerShort} defend their total ${winMargin}! ${loserShort} managed just ${secondInningsScore} — the bowlers were absolutely ON FIRE today!"`,
      ];
  return summaries[Math.floor(Math.random() * summaries.length)];
};

// Match Over Screen Component
const MatchOverScreen = ({ winnerShort, loserShort, winMargin, myTeamWon, correctPredictions, totalPredictions, accuracy, bestStreak, chasingTeamWon, firstInningsScore, secondInningsScore, secondInningsWickets, soundMuted }: {
  winnerShort: string;
  loserShort: string;
  winMargin: string;
  myTeamWon: boolean;
  correctPredictions: number;
  totalPredictions: number;
  accuracy: number;
  bestStreak: number;
  chasingTeamWon: boolean;
  firstInningsScore: number;
  secondInningsScore: number;
  secondInningsWickets: number;
  soundMuted: boolean;
  onPlayAgain?: () => void;
}) => {
  const [commentary] = useState(() => getMatchCommentary(winnerShort, loserShort, winMargin, chasingTeamWon, firstInningsScore, secondInningsScore));

  // Play sound on mount
  useEffect(() => {
    if (!soundMuted) {
      if (myTeamWon) {
        playMatchWinSound();
      } else {
        playMatchLossSound();
      }
    }
  }, []);

  const performanceEmoji = accuracy >= 60 ? "🏆" : accuracy >= 40 ? "👏" : accuracy >= 20 ? "💪" : "🎮";
  const performanceText = accuracy >= 60 ? "Cricket genius!" : accuracy >= 40 ? "Solid predictions!" : accuracy >= 20 ? "Not bad at all!" : "Better luck next time!";

  return (
    <div className={`flex-1 flex flex-col items-center justify-center px-6 py-6 overflow-y-auto ${
      myTeamWon
        ? "bg-gradient-to-b from-neon/25 via-neon/10 to-background"
        : "bg-gradient-to-b from-destructive/15 via-destructive/5 to-background"
    }`}>
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 12, stiffness: 180 }}
        className="text-center w-full max-w-sm"
      >
        {/* Celebration / Commiseration emoji */}
        <motion.div
          animate={myTeamWon
            ? { scale: [1, 1.3, 1], rotate: [0, 15, -15, 0] }
            : { scale: [1, 1.1, 1] }
          }
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-6xl mb-2"
        >
          {myTeamWon ? "🏆" : "😔"}
        </motion.div>

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-3xl font-black text-foreground mb-1 tracking-tight"
        >
          MATCH OVER
        </motion.h2>

        {/* Winner announcement */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className={`rounded-2xl px-5 py-4 mt-3 mb-3 ${
            myTeamWon ? "bg-neon/15" : "bg-secondary/60"
          }`}
        >
          <p className={`text-xl font-black ${myTeamWon ? "text-neon" : "text-foreground"}`}>
            {winnerShort} WIN! 🎉
          </p>
          <p className={`text-sm font-semibold mt-1 ${myTeamWon ? "text-neon/80" : "text-muted-foreground"}`}>
            {winMargin}
          </p>
          {myTeamWon ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-xs text-neon mt-2 font-bold"
            >
              🎊 YOUR TEAM DID IT! 🎊
            </motion.p>
          ) : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-xs text-muted-foreground mt-2"
            >
              Better luck next time for {loserShort} 💙
            </motion.p>
          )}
        </motion.div>

        {/* Commentator summary */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-secondary/40 rounded-xl px-4 py-3 mb-3 text-left"
        >
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1.5">🎙️ Final Word</p>
          <p className="text-[12px] text-foreground leading-relaxed italic">
            {commentary}
          </p>
        </motion.div>

        {/* Your prediction stats */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-secondary/50 rounded-2xl px-5 py-4 mb-3"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">{performanceEmoji}</span>
            <p className="text-sm font-bold text-foreground">{performanceText}</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xl font-black text-foreground">{correctPredictions}/{totalPredictions}</p>
              <p className="text-[9px] text-muted-foreground uppercase">Correct</p>
            </div>
            <div>
              <p className="text-xl font-black text-primary">{accuracy}%</p>
              <p className="text-[9px] text-muted-foreground uppercase">Accuracy</p>
            </div>
            <div>
              <p className="text-xl font-black text-neon">{bestStreak}</p>
              <p className="text-[9px] text-muted-foreground uppercase">Best Streak</p>
            </div>
          </div>
        </motion.div>

        {/* Play Again */}
        <motion.button
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          whileTap={{ scale: 0.95 }}
          onClick={onPlayAgain || (() => window.location.reload())}
          className="mt-2 px-8 py-3.5 bg-primary text-primary-foreground rounded-full font-bold text-[15px] shadow-lg shadow-primary/25 active:scale-95 transition-transform"
        >
          🏏 Play Again
        </motion.button>
      </motion.div>
    </div>
  );
};

const MAX_PLAYERS = 10;

// Flow: picker → name (if needed) → pregame (auto-create/join room) → game
type AppStage = "picker" | "name" | "pregame" | "game";

const Index = () => {
  // Check URL for room code to join
  const urlParams = new URLSearchParams(window.location.search);
  const roomCodeFromUrl = urlParams.get("room")?.toUpperCase().trim() || null;

  const [stage, setStage] = useState<AppStage>(roomCodeFromUrl ? "name" : "picker");
  const [activeTab, setActiveTab] = useState<TabId>("arena");
  const [selectedMatch, setSelectedMatch] = useState<UpcomingMatch | null>(null);
  const [userTeam, setUserTeam] = useState<TeamId>("DC");
  const [hypeState, setHypeState] = useState<{
    type: "four" | "six" | "wicket";
    isDuck?: boolean;
  } | null>(null);
  const [mutedHypeTypes, setMutedHypeTypes] = useState<Set<string>>(new Set());
  const [selectedOvers, setSelectedOvers] = useState(1); // Item 5: default 1 over
  // Always call both hooks (rules of hooks — no conditional calls).
  // We pick which result to expose based on whether the selected match is real.
  const sim = useMatchState(selectedOvers);
  const { resetWithTeams: resetSimWithTeams } = sim;
  const isRealMatch = !!(selectedMatch && !selectedMatch.isSimulation && !USE_MOCK);
  const live = useLiveMatchState(isRealMatch ? selectedMatch.id : null);
  const { match, nextBall, crr, startSecondInnings } = isRealMatch ? live : sim;

  const [playerName, setPlayerName] = useState("");
  const [playerAvatar, setPlayerAvatar] = useState("🏏");
  const [pendingJoinCode, setPendingJoinCode] = useState<string | null>(roomCodeFromUrl);

  const mp = useMultiplayer();
  const { reconnect, isReconnecting, leaveRoom } = mp;

  const [soundMuted, setSoundMutedState] = useState(false);
  const toggleSound = useCallback(() => {
    setSoundMutedState(prev => {
      const next = !prev;
      setSoundMuted(next);
      return next;
    });
  }, []);

  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);

  const [bestStreak, setBestStreak] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [showInningsBreak, setShowInningsBreak] = useState(false);
  const [inningsBreakCountdown, setInningsBreakCountdown] = useState(15); // Item 9
  const inningsBreakTimerRef = useRef<ReturnType<typeof setInterval> | null>(null); // Item 9

  // Handle innings completion — Item 9: 15s countdown with Skip button (sim only)
  const handleInningsComplete = useCallback(() => {
    if (match.innings === 1 && match.inningsComplete && !match.matchOver) {
      playInningsBreakSound();
      setShowInningsBreak(true);
      setInningsBreakCountdown(15);
      if (inningsBreakTimerRef.current) clearInterval(inningsBreakTimerRef.current);
      inningsBreakTimerRef.current = setInterval(() => {
        setInningsBreakCountdown(prev => {
          if (prev <= 1) {
            clearInterval(inningsBreakTimerRef.current!);
            inningsBreakTimerRef.current = null;
            startSecondInnings();
            setShowInningsBreak(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [match.innings, match.inningsComplete, match.matchOver, startSecondInnings]);

  // Item 9: Skip innings break
  const handleSkipInningsBreak = useCallback(() => {
    if (inningsBreakTimerRef.current) clearInterval(inningsBreakTimerRef.current);
    inningsBreakTimerRef.current = null;
    startSecondInnings();
    setShowInningsBreak(false);
  }, [startSecondInnings]);

  // Watch for innings completion — delay if hype overlay is showing
  useEffect(() => {
    if (match.inningsComplete && match.innings === 1 && !showInningsBreak && !hypeState) {
      handleInningsComplete();
    }
  }, [match.inningsComplete, match.innings, showInningsBreak, handleInningsComplete, hypeState]);

  // Check for saved profile on mount
  const [profileLoaded, setProfileLoaded] = useState(false);
  const savedProfileRef = useRef<{ name: string; avatar: string } | null>(null);
  
  useEffect(() => {
    const saved = localStorage.getItem("pitchtalk_profile");
    if (saved) {
      try {
        const { name, avatar } = JSON.parse(saved);
        if (name?.trim().length >= 2) {
          savedProfileRef.current = { name: name.trim(), avatar: avatar || "🏏" };
          setPlayerName(name.trim());
          setPlayerAvatar(avatar || "🏏");
        }
      } catch {}
    }
    setProfileLoaded(true);
  }, []);

  // For solo/host mode, use other players from multiplayer (includes AI bots)
  const fallbackAiFriends: FriendDef[] = useMemo(() => {
    if (mp.players.length > 0 || !selectedMatch) return [];
    const fallbackTeams = [selectedMatch.team1.short as TeamId, selectedMatch.team2.short as TeamId];
    return AI_PLAYERS.map((ai, index) => ({
      name: ai.name,
      avatar: ai.avatar,
      team: fallbackTeams[index % fallbackTeams.length],
    }));
  }, [mp.players.length, selectedMatch]);

  const activeFriends: FriendDef[] = useMemo(() => {
    if (mp.players.length === 0) {
      return fallbackAiFriends;
    }
    return mp.players
      .filter(p => p.name !== playerName)
      .map(p => ({ name: p.name, avatar: p.avatar, team: (p.teamPicked as TeamId) || "DC" }));
  }, [mp.players, playerName, fallbackAiFriends]);

  const displayPlayers = useMemo(() => {
    if (mp.players.length > 0) return mp.players;
    const localPlayerName = playerName || "You";
    return [
      {
        id: "local-player",
        name: localPlayerName,
        avatar: playerAvatar,
        isHost: true,
        wins: 0,
        total: 0,
        streak: 0,
        teamPicked: userTeam,
      },
      ...fallbackAiFriends.map((friend, index) => ({
        id: `local-ai-${index}`,
        name: friend.name,
        avatar: friend.avatar,
        isHost: false,
        wins: 0,
        total: 0,
        streak: 0,
        teamPicked: friend.team,
      })),
    ];
  }, [mp.players, playerName, playerAvatar, userTeam, fallbackAiFriends]);

  const displayedActivePlayers = displayPlayers.length;

  const [friendScores, setFriendScores] = useState<Record<string, { wins: number; total: number; streak: number; bestStreak: number }>>({});

  const handleHype = useCallback((
    type: "four" | "six" | "wicket",
    isDuck?: boolean,
  ) => {
    if (mutedHypeTypes.has(type)) return;
    setHypeState({ type, isDuck });
  }, [mutedHypeTypes]);

  // Muting any hype silences all hype types for the rest of the session
  const handleMuteHype = useCallback(() => {
    setMutedHypeTypes(new Set(["four", "six", "wicket"]));
    setHypeState(null);
  }, []);

  const handleDismissHype = useCallback(() => {
    setHypeState(null);
  }, []);

  // After picking a match, check if we have a name; if yes, auto-create room and go to pregame
  const handleSelectMatch = useCallback(async (m: UpcomingMatch) => {
    setSelectedMatch(m);
    if (savedProfileRef.current) {
      // Already have a name, auto-create room and go to pregame
      const name = savedProfileRef.current.name;
      const avatar = savedProfileRef.current.avatar;
      setPlayerName(name);
      setPlayerAvatar(avatar);
      try {
        await mp.createRoom(name, avatar, m);
      } catch (error) {
        // Local quick games should still work without multiplayer if room creation fails.
        if (!m.isSimulation) throw error;
      }
      setStage("pregame");
    } else {
      // Need name first
      setStage("name");
    }
  }, [mp]);

  // Name entry complete — then create/join room and go to pregame
  const handleNameComplete = useCallback(async (name: string, avatar: string) => {
    setPlayerName(name);
    setPlayerAvatar(avatar);
    localStorage.setItem("pitchtalk_profile", JSON.stringify({ name, avatar }));
    savedProfileRef.current = { name, avatar };

    if (pendingJoinCode) {
      // Joining via URL deep link
      const success = await mp.joinRoom(pendingJoinCode, name, avatar);
      if (success) {
        setPendingJoinCode(null);
        // Clean URL
        window.history.replaceState({}, "", window.location.pathname);
        setStage("pregame");
      }
    } else if (selectedMatch) {
      // Creating room after picking match
      try {
        await mp.createRoom(name, avatar, selectedMatch);
      } catch (error) {
        if (!selectedMatch.isSimulation) throw error;
      }
      setStage("pregame");
    }
  }, [mp, pendingJoinCode, selectedMatch]);

  // For deep-link joiners who already have a saved profile
  useEffect(() => {
    if (profileLoaded && pendingJoinCode && savedProfileRef.current && stage === "name") {
      const { name, avatar } = savedProfileRef.current;
      (async () => {
        const success = await mp.joinRoom(pendingJoinCode, name, avatar);
        if (success) {
          setPendingJoinCode(null);
          window.history.replaceState({}, "", window.location.pathname);
          setStage("pregame");
        }
      })();
    }
  }, [profileLoaded, pendingJoinCode, stage]);

  // Attempt to reconnect to a previous session on mount
  useEffect(() => {
    if (!profileLoaded || roomCodeFromUrl) return;

    const savedRoomId = localStorage.getItem("pitchtalk_room_id");
    if (!savedRoomId) return;

    (async () => {
      const data = await reconnect();
      if (data) {
        const { room, player } = data;
        
        // Restore selectedMatch from room metadata
        if (room.match_team1_short) {
          setSelectedMatch({
            id: room.id.startsWith("SIM-") ? room.id.toLowerCase() : room.id,
            team1: { name: room.match_team1_name, short: room.match_team1_short, logo: "" },
            team2: { name: room.match_team2_name, short: room.match_team2_short, logo: "" },
            startTime: new Date(room.created_at),
            venue: room.match_venue,
            matchNumber: room.match_number,
            liveRooms: 0,
            isSimulation: room.id.startsWith("SIM-"),
          });
        }
        
        if (player.team_picked) {
          setUserTeam(player.team_picked as TeamId);
        }

        setStage("game"); 
      }
    })();
  }, [profileLoaded, reconnect, roomCodeFromUrl]);

  const handleGameStart = useCallback((team: TeamId, overs: number = 1) => {
    setUserTeam(team);
    setSelectedOvers(overs);
    mp.updateMyTeam(team);
    // Reset the simulation with the correct team rosters before the game starts
    const t1 = selectedMatch?.team1.short ?? "MI";
    const t2 = selectedMatch?.team2.short ?? "DC";
    resetSimWithTeams(t1, t2);
    setStage("game");
    if (mp.isHost) {
      mp.startGame();
    }
  }, [mp, selectedMatch, resetSimWithTeams]);

  const handleFirstOverComplete = useCallback(() => {}, []);

  const handlePredictionResolved = useCallback((record: PredictionRecord) => {
    setPredictions(prev => [...prev, record]);
    if (record.won === true) {
      setCurrentStreak(prev => {
        const next = prev + 1;
        setBestStreak(b => Math.max(b, next));
        return next;
      });
    } else if (record.won === false) {
      setCurrentStreak(0);
    }
  }, []);

  const handleFriendScoresUpdate = useCallback((scores: Record<string, { wins: number; total: number; streak: number }>) => {
    setFriendScores(prev => {
      const next = { ...prev };
      Object.entries(scores).forEach(([name, s]) => {
        next[name] = {
          ...s,
          bestStreak: Math.max(prev[name]?.bestStreak || 0, s.streak),
        };
      });
      return next;
    });
  }, []);

  const handlePlayAgain = useCallback(() => {
    leaveRoom();
    setSelectedMatch(null);
    setPredictions([]);
    setStage("picker");
  }, [leaveRoom]);

  const handleOverComplete = useCallback((overNum: number, participation: Record<string, boolean>) => {
    // No friend drop-off logic needed for multiplayer
  }, []);

  const handleInvite = useCallback(() => {
    const matchLabel = selectedMatch ? `${selectedMatch.team1.short} vs ${selectedMatch.team2.short}` : "the match";
    const roomCode = mp.roomId || "";
    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    const text = `🏏 Join my Pitch Talk room for ${matchLabel}!\n\nPredict every ball, play with the squad 🧠🔥\n\n👉 ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }, [selectedMatch, mp.roomId]);

  // Host syncs ball state to multiplayer
  const handleBallStateChange = useCallback((
    ball: { id: number; label: string; state: "idle" | "pending" | "resolved"; openedAt: number; result: { label: string; type: string } | null },
    matchState: { runs: number; wickets: number; overs: number; balls: number; currentBowler: string; target: number | null }
  ) => {
    if (!mp.isHost || !mp.roomId) return;
    const snapshot: GameSnapshot = {
      phase: "game",
      ball: {
        id: ball.id,
        label: ball.label,
        state: ball.state,
        openedAt: ball.openedAt,
        result: ball.result,
      },
      match: matchState,
    };
    mp.updateGameSnapshot(snapshot);
  }, [mp]);

  // Listen for host starting game (non-host)
  const gamePhase = mp.gameSnapshot?.phase;
  const isNonHostInGame = !mp.isHost && gamePhase === "game" && stage === "pregame";
  const isLocalSoloGame = !mp.roomId;
  const effectiveIsHost = isLocalSoloGame || mp.isHost;
  useEffect(() => {
    if (!isNonHostInGame) return;
    const id = setTimeout(() => setStage("game"), 0);
    return () => clearTimeout(id);
  }, [isNonHostInGame]);

  const allPlayerStandings = useMemo(() => [
    {
      name: playerName || "You",
      avatar: playerAvatar,
      wins: predictions.filter(p => p.won === true).length,
      total: predictions.filter(p => p.won !== null).length,
      accuracy: predictions.filter(p => p.won !== null).length > 0
        ? Math.round((predictions.filter(p => p.won === true).length / predictions.filter(p => p.won !== null).length) * 100)
        : 0,
      streak: currentStreak,
      bestStreak,
    },
    ...activeFriends.map(f => ({
      name: f.name,
      avatar: f.avatar,
      wins: friendScores[f.name]?.wins || 0,
      total: friendScores[f.name]?.total || 0,
      accuracy: friendScores[f.name]?.total > 0
        ? Math.round((friendScores[f.name].wins / friendScores[f.name].total) * 100)
        : 0,
      streak: friendScores[f.name]?.streak || 0,
      bestStreak: friendScores[f.name]?.bestStreak || 0,
    })),
  ], [predictions, activeFriends, friendScores, currentStreak, bestStreak, playerName, playerAvatar]);

  const receiptData: ReceiptData | undefined = predictions.length > 0 ? {
    predictions,
    totalBalls: predictions.filter(p => p.won !== null).length,
    correctPicks: predictions.filter(p => p.won === true).length,
    accuracy: Math.round(
      (predictions.filter(p => p.won === true).length /
        Math.max(1, predictions.filter(p => p.won !== null).length)) * 100
    ),
    bestStreak,
    matchTitle: selectedMatch
      ? `${selectedMatch.team1.short} vs ${selectedMatch.team2.short} • IPL 2025`
      : "IPL 2025",
  } : undefined;

  const leaderboardEntries: LeaderboardEntry[] = [
    {
      name: playerName || "You",
      avatar: playerAvatar,
      wins: predictions.filter(p => p.won === true).length,
      total: predictions.filter(p => p.won !== null).length,
      streak: currentStreak,
      bestStreak,
    },
    ...activeFriends.map(u => ({
      name: u.name,
      avatar: u.avatar,
      wins: friendScores[u.name]?.wins || 0,
      total: friendScores[u.name]?.total || 0,
      streak: friendScores[u.name]?.streak || 0,
      bestStreak: friendScores[u.name]?.bestStreak || 0,
    })),
  ];

  const squadEntries: SquadEntry[] = useMemo(() => [
    {
      name: playerName || "You",
      avatar: playerAvatar,
      wins: predictions.filter(p => p.won === true).length,
      total: predictions.filter(p => p.won !== null).length,
      streak: currentStreak,
      isYou: true,
    },
    ...activeFriends.map(f => ({
      name: f.name,
      avatar: f.avatar,
      wins: friendScores[f.name]?.wins || 0,
      total: friendScores[f.name]?.total || 0,
      streak: friendScores[f.name]?.streak || 0,
    })),
  ], [predictions, activeFriends, friendScores, currentStreak, playerName, playerAvatar]);

  const isGameActive = stage === "game";

  // Don't render until profile check is done
  if (!profileLoaded) return null;

  return (
    <div className="flex items-center justify-center min-h-screen bg-[hsl(220,15%,12%)]">
      <div className="relative w-full max-w-md mx-auto h-screen sm:h-[812px] sm:my-4 sm:rounded-[3rem] sm:border-[6px] sm:border-[hsl(0,0%,20%)] sm:shadow-[0_0_0_2px_hsl(0,0%,30%),0_20px_60px_-10px_hsl(0,0%,0%/0.5)] overflow-hidden bg-background">
        <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 z-[200] w-[120px] h-[28px] bg-[hsl(0,0%,0%)] rounded-b-2xl" />
        <div className="hidden sm:block absolute top-[8px] left-1/2 -translate-x-1/2 z-[201] w-[90px] h-[24px] bg-[hsl(0,0%,5%)] rounded-full" />

        <div className="flex flex-col h-full relative overflow-hidden sm:pt-[2px]">
          <HypeOverlay
            type={hypeState?.type ?? null}
            onDismiss={handleDismissHype}
            onMute={handleMuteHype}
            isDuck={hypeState?.isDuck}
          />

          {/* Stage: Match Picker (first screen) */}
          {stage === "picker" && (
            <GamePicker onSelectMatch={handleSelectMatch} isReconnecting={isReconnecting} />
          )}

          {/* Stage: Name Entry (if not saved) */}
          {stage === "name" && (
            <NameEntry onComplete={handleNameComplete} />
          )}

          {/* Stage: Pre-game intro (team pick + squad + invite) */}
          {stage === "pregame" && selectedMatch && (
            <PreGameIntro
              onStart={handleGameStart}
              matchStartTime={selectedMatch.startTime}
              team1={{ name: selectedMatch.team1.name, short: selectedMatch.team1.short }}
              team2={{ name: selectedMatch.team2.name, short: selectedMatch.team2.short }}
              matchNumber={selectedMatch.matchNumber}
              roomId={mp.roomId || "SOLO"}
              isSimulation={selectedMatch.isSimulation}
              players={displayPlayers}
              onInvite={handleInvite}
              onRemoveAI={mp.removeAIPlayers}
            />
          )}

          {/* Stage: Pre-game for joiners (no match selected yet, waiting for host) */}
          {stage === "pregame" && !selectedMatch && mp.roomId && (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="text-4xl mb-4"
              >🏏</motion.span>
              <p className="text-lg font-bold text-foreground mb-2">You're in! 🎉</p>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Room <span className="font-bold text-foreground">{mp.roomId}</span> — waiting for host to start the game...
              </p>
              <div className="space-y-2 w-full max-w-xs">
                {displayPlayers.map(p => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-secondary">
                    <span className="text-lg">{p.avatar}</span>
                    <span className="text-[13px] font-semibold text-foreground flex-1">{p.name}</span>
                    {p.isHost && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">Host</span>}
                    {p.name === playerName && !p.isHost && <span className="text-[9px] text-muted-foreground">You</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stage: Game (same UI for host and non-host) */}
          {isGameActive && !showInningsBreak && (!match.matchOver || !!hypeState) && (
            <>
              <LiveHeader match={!effectiveIsHost && mp.gameSnapshot?.match ? { ...match, runs: mp.gameSnapshot.match.runs, wickets: mp.gameSnapshot.match.wickets, overs: mp.gameSnapshot.match.overs, balls: mp.gameSnapshot.match.balls, currentBowler: mp.gameSnapshot.match.currentBowler, target: mp.gameSnapshot.match.target } : match} crr={(() => { const m = !effectiveIsHost && mp.gameSnapshot?.match ? mp.gameSnapshot.match : match; const t = m.overs + m.balls / 6; return t > 0 ? (m.runs / t).toFixed(2) : "0.00"; })()} soundMuted={soundMuted} onToggleSound={toggleSound} battingTeam={match.innings === 1 ? (selectedMatch?.team1.short || "DC") : (selectedMatch?.team2.short || "MI")} isChasing={match.innings === 2} maxOvers={selectedOvers} team1={selectedMatch ? { short: selectedMatch.team1.short, logo: selectedMatch.team1.logo } : undefined} team2={selectedMatch ? { short: selectedMatch.team2.short, logo: selectedMatch.team2.logo } : undefined} />
              <SquadStandingsBar
                entries={squadEntries}
                onOpenLeaderboard={() => setActiveTab("leaderboard")}
                onInvite={handleInvite}
                spotsLeft={MAX_PLAYERS - displayedActivePlayers}
              />
              {/* Arena tab — always kept mounted so BanterStream never loses its ball counter state */}
              <div className={activeTab === "arena" ? "flex flex-col flex-1 min-h-0 overflow-hidden" : "hidden"}>
                <BanterStream
                  match={!effectiveIsHost && mp.gameSnapshot?.match ? { ...match, runs: mp.gameSnapshot.match.runs, wickets: mp.gameSnapshot.match.wickets, overs: mp.gameSnapshot.match.overs, balls: mp.gameSnapshot.match.balls, currentBowler: mp.gameSnapshot.match.currentBowler, target: mp.gameSnapshot.match.target } : match}
                  onNextBall={nextBall}
                  onHype={handleHype}
                  onPredictionResolved={handlePredictionResolved}
                  onFriendScoresUpdate={handleFriendScoresUpdate}
                  soundMuted={soundMuted}
                  activeFriends={activeFriends}
                  onOverComplete={handleOverComplete}
                  allPlayerStandings={allPlayerStandings}
                  userTeam={userTeam}
                  activePlayers={displayedActivePlayers}
                  maxPlayers={MAX_PLAYERS}
                  roomId={mp.roomId || "SOLO"}
                  onInvite={handleInvite}
                  onToggleSound={toggleSound}
                  onFirstOverComplete={handleFirstOverComplete}
                  onBallStateChange={handleBallStateChange}
                  isHost={effectiveIsHost}
                  gameSnapshot={mp.gameSnapshot}
                  onInningsComplete={handleInningsComplete}
                  battingTeamShort={match.innings === 1 ? (selectedMatch?.team1.short || "DC") : (selectedMatch?.team2.short || "MI")}
                  bowlingTeamShort={match.innings === 1 ? (selectedMatch?.team2.short || "MI") : (selectedMatch?.team1.short || "DC")}
                  team1Short={selectedMatch?.team1.short || "DC"}
                  team2Short={selectedMatch?.team2.short || "MI"}
                  onAiPick={(ballId, pick, name) => mp.submitPick(ballId, pick, name)}
                />
              </div>
              {/* Receipts tab */}
              {activeTab === "receipts" && (
                <ReceiptsScreen receiptData={receiptData} />
              )}
              {/* Leaderboard tab */}
              {activeTab === "leaderboard" && (
                <div className="flex-1 overflow-y-auto pt-4 pb-2">
                  <div className="px-4 mb-4">
                    <h2 className="text-lg font-bold text-foreground tracking-tight">🏆 Leaderboard</h2>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Who's got the best cricket brain?</p>
                  </div>
                  <Leaderboard entries={leaderboardEntries} />
                </div>
              )}
              <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
            </>
          )}

          {/* Innings Break Screen — dramatic with commentary summary */}
          {isGameActive && showInningsBreak && (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 bg-gradient-to-b from-primary/25 via-primary/10 to-background overflow-y-auto">
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 12, stiffness: 200 }}
                className="text-center w-full max-w-sm"
              >
                {/* Animated emoji */}
                <motion.span
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="text-6xl mb-3 block"
                >🏏</motion.span>

                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-black text-foreground mb-1 tracking-tight"
                >INNINGS BREAK</motion.h2>

                {/* Score card */}
                <motion.div
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="bg-secondary/60 rounded-2xl px-5 py-4 mt-3 mb-4"
                >
                  <p className="text-2xl font-black text-primary">
                    {selectedMatch?.team1.short || "DC"}: {match.runs}/{match.wickets}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    in {match.overs}.{match.balls} overs
                  </p>
                </motion.div>

                {/* Target call-out */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="bg-primary/15 rounded-xl px-4 py-3 mb-4"
                >
                  <p className="text-sm font-medium text-muted-foreground">🎯 Target</p>
                  <p className="text-xl font-black text-foreground">
                    {selectedMatch?.team2.short || "MI"} need <span className="text-primary">{match.runs + 1}</span> to win
                  </p>
                </motion.div>

                {/* Commentator summary */}
                <motion.div
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="bg-secondary/40 rounded-xl px-4 py-3 mb-4 text-left"
                >
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1.5">🎙️ Commentary Box</p>
                  <p className="text-[12px] text-foreground leading-relaxed italic">
                    {match.runs >= 180
                      ? `"What a first innings! ${selectedMatch?.team1.short || "DC"} have put up a MASSIVE total of ${match.runs}. ${selectedMatch?.team2.short || "MI"} will need to bat out of their skins to chase this down!"`
                      : match.runs >= 150
                      ? `"A solid effort from ${selectedMatch?.team1.short || "DC"} — ${match.runs} on the board. It's a competitive total, and ${selectedMatch?.team2.short || "MI"} will fancy their chances, but they'll need to be clinical!"`
                      : match.runs >= 120
                      ? `"${selectedMatch?.team1.short || "DC"} have managed ${match.runs}. Not the biggest total, but on this wicket? It could be tricky to chase. The bowlers will be rubbing their hands!"`
                      : `"Only ${match.runs} from ${selectedMatch?.team1.short || "DC"} — the bowlers have dominated! ${selectedMatch?.team2.short || "MI"} will be confident, but cricket can be unpredictable!"`
                    }
                  </p>
                </motion.div>

                {/* Your prediction stats so far */}
                <motion.div
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.85 }}
                  className="bg-secondary/40 rounded-xl px-4 py-3 mb-5"
                >
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1">📊 Your 1st Innings</p>
                  <p className="text-lg font-bold text-foreground">
                    {predictions.filter(p => p.won === true).length}/{predictions.filter(p => p.won !== null).length} correct
                  </p>
                  {bestStreak > 0 && (
                    <p className="text-xs text-neon mt-0.5">🔥 Best streak: {bestStreak}</p>
                  )}
                </motion.div>

                {/* Countdown + skip */}
                {!isRealMatch && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <motion.div
                      key={inningsBreakCountdown}
                      initial={{ scale: 1.3, opacity: 0.6 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="text-4xl font-black text-primary tabular-nums"
                    >
                      {inningsBreakCountdown}
                    </motion.div>
                    <p className="text-xs text-muted-foreground">2nd innings in {inningsBreakCountdown}s</p>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSkipInningsBreak}
                      className="mt-1 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-[13px] font-bold shadow-lg shadow-primary/25 active:scale-95 transition-transform"
                    >
                      Skip → Let's Go!
                    </motion.button>
                  </motion.div>
                )}
                {isRealMatch && (
                  <p className="text-xs text-muted-foreground animate-pulse mt-4">
                    2nd innings starting soon...
                  </p>
                )}
              </motion.div>
            </div>
          )}

          {/* Match Over Screen — dramatic with commentary + sound effects */}
          {isGameActive && match.matchOver && !hypeState && (() => {
            const chasingTeamWon = match.target && match.runs >= match.target;
            const winnerShort = chasingTeamWon ? (selectedMatch?.team2.short || "MI") : (selectedMatch?.team1.short || "DC");
            const loserShort = chasingTeamWon ? (selectedMatch?.team1.short || "DC") : (selectedMatch?.team2.short || "MI");
            const winMargin = chasingTeamWon
              ? `by ${10 - match.wickets} wicket${10 - match.wickets !== 1 ? "s" : ""}`
              : `by ${(match.firstInningsScore || 0) - match.runs} run${((match.firstInningsScore || 0) - match.runs) !== 1 ? "s" : ""}`;
            const myTeamWon = userTeam === winnerShort;
            const totalPredictions = predictions.filter(p => p.won !== null).length;
            const correctPredictions = predictions.filter(p => p.won === true).length;
            const accuracy = totalPredictions > 0 ? Math.round((correctPredictions / totalPredictions) * 100) : 0;

            return (
              <MatchOverScreen
                winnerShort={winnerShort}
                loserShort={loserShort}
                winMargin={winMargin}
                myTeamWon={myTeamWon}
                correctPredictions={correctPredictions}
                totalPredictions={totalPredictions}
                accuracy={accuracy}
                bestStreak={bestStreak}
                chasingTeamWon={!!chasingTeamWon}
                firstInningsScore={match.firstInningsScore || 0}
                secondInningsScore={match.runs}
                secondInningsWickets={match.wickets}
                soundMuted={soundMuted}
                onPlayAgain={handlePlayAgain}
              />
            );
          })()}

          <div className="hidden sm:flex absolute bottom-1.5 left-1/2 -translate-x-1/2 z-[200] w-[120px] h-[4px] bg-foreground/20 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default Index;
