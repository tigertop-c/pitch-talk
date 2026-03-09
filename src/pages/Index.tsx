import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import LiveHeader from "@/components/LiveHeader";
import BanterStream from "@/components/BanterStream";
import type { FriendDef } from "@/components/BanterStream";
import GameBoard, { type GameBoardPlayer } from "@/components/GameBoard";
import GamePicker, { type UpcomingMatch } from "@/components/GamePicker";
import BottomNav, { type TabId } from "@/components/BottomNav";
import ReceiptsScreen from "@/components/ReceiptsScreen";
import Leaderboard, { type LeaderboardEntry } from "@/components/Leaderboard";
import PreGameIntro from "@/components/PreGameIntro";
import HypeOverlay from "@/components/HypeOverlay";
import NameEntry from "@/components/NameEntry";
import { useMatchState } from "@/hooks/useMatchState";
import { useMultiplayer, type GameSnapshot } from "@/hooks/useMultiplayer";
import { type PredictionRecord, type ReceiptData } from "@/components/ShareableReceipt";
import { setSoundMuted } from "@/lib/sounds";
import type { TeamId } from "@/components/ChatInput";
import SquadStandingsBar, { type SquadEntry } from "@/components/SquadStandingsBar";

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
  const [hypeType, setHypeType] = useState<"four" | "six" | "wicket" | null>(null);
  const [mutedHypeTypes, setMutedHypeTypes] = useState<Set<string>>(new Set());
  const [showGameBoard, setShowGameBoard] = useState(true);
  const { match, nextBall, crr, startSecondInnings } = useMatchState();

  const [playerName, setPlayerName] = useState("");
  const [playerAvatar, setPlayerAvatar] = useState("🏏");
  const [pendingJoinCode, setPendingJoinCode] = useState<string | null>(roomCodeFromUrl);

  const mp = useMultiplayer();

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

  // Handle innings completion
  const handleInningsComplete = useCallback(() => {
    if (match.innings === 1 && match.inningsComplete && !match.matchOver) {
      setShowInningsBreak(true);
      // Auto-start second innings after 5 seconds
      setTimeout(() => {
        startSecondInnings();
        setShowInningsBreak(false);
      }, 5000);
    }
  }, [match.innings, match.inningsComplete, match.matchOver, startSecondInnings]);

  // Watch for innings completion
  useEffect(() => {
    if (match.inningsComplete && match.innings === 1 && !showInningsBreak) {
      handleInningsComplete();
    }
  }, [match.inningsComplete, match.innings, showInningsBreak, handleInningsComplete]);

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

  // For solo/host mode, use simulated friends from multiplayer players
  const activeFriends: FriendDef[] = useMemo(() => {
    if (mp.roomId && mp.players.length > 1) {
      return mp.players
        .filter(p => p.name !== playerName)
        .map(p => ({ name: p.name, avatar: p.avatar, team: (p.teamPicked as TeamId) || "DC" }));
    }
    return [];
  }, [mp.roomId, mp.players, playerName]);

  const [friendScores, setFriendScores] = useState<Record<string, { wins: number; total: number; streak: number; bestStreak: number }>>({});

  const handleHype = useCallback((type: "four" | "six" | "wicket") => {
    if (mutedHypeTypes.has(type)) return;
    setHypeType(type);
    setTimeout(() => setHypeType(null), 5000);
  }, [mutedHypeTypes]);

  const handleMuteHype = useCallback((type: string) => {
    setMutedHypeTypes(prev => new Set(prev).add(type));
    setHypeType(null);
  }, []);

  const handleDismissHype = useCallback(() => {
    setHypeType(null);
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
      await mp.createRoom(name, avatar);
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
      await mp.createRoom(name, avatar);
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

  const handleGameStart = useCallback((team: TeamId) => {
    setUserTeam(team);
    mp.updateMyTeam(team);
    setStage("game");
    if (mp.isHost) {
      mp.startGame();
    }
  }, [mp]);

  const handleFirstOverComplete = useCallback(() => {
    setShowGameBoard(false);
  }, []);

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
  if (isNonHostInGame) {
    setTimeout(() => setStage("game"), 0);
  }

  // Build standings for leaderboard
  const gameBoardPlayers: GameBoardPlayer[] = useMemo(() => [
    {
      name: playerName || "You",
      avatar: playerAvatar,
      accuracy: predictions.filter(p => p.won !== null).length > 0
        ? Math.round((predictions.filter(p => p.won === true).length / predictions.filter(p => p.won !== null).length) * 100)
        : 0,
      totalPredictions: predictions.filter(p => p.won !== null).length,
      active: true,
      warned: false,
      isYou: true,
    },
    ...activeFriends.map(f => ({
      name: f.name,
      avatar: f.avatar,
      accuracy: friendScores[f.name]?.total > 0
        ? Math.round((friendScores[f.name].wins / friendScores[f.name].total) * 100)
        : 0,
      totalPredictions: friendScores[f.name]?.total || 0,
      active: true,
      warned: false,
    })),
  ], [predictions, activeFriends, friendScores, playerName, playerAvatar]);

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
          <HypeOverlay type={hypeType} onDismiss={handleDismissHype} onMute={handleMuteHype} />

          {/* Stage: Match Picker (first screen) */}
          {stage === "picker" && (
            <GamePicker onSelectMatch={handleSelectMatch} />
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
              players={mp.players}
              onInvite={handleInvite}
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
                {mp.players.map(p => (
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
          {isGameActive && !showInningsBreak && !match.matchOver && (
            <>
              <LiveHeader match={!mp.isHost && mp.gameSnapshot?.match ? { ...match, runs: mp.gameSnapshot.match.runs, wickets: mp.gameSnapshot.match.wickets, overs: mp.gameSnapshot.match.overs, balls: mp.gameSnapshot.match.balls, currentBowler: mp.gameSnapshot.match.currentBowler, target: mp.gameSnapshot.match.target } : match} crr={(() => { const m = !mp.isHost && mp.gameSnapshot?.match ? mp.gameSnapshot.match : match; const t = m.overs + m.balls / 6; return t > 0 ? (m.runs / t).toFixed(2) : "0.00"; })()} soundMuted={soundMuted} onToggleSound={toggleSound} battingTeam={match.innings === 1 ? (selectedMatch?.team1.short || "DC") : (selectedMatch?.team2.short || "MI")} isChasing={match.innings === 2} />
              <SquadStandingsBar
                entries={squadEntries}
                onOpenLeaderboard={() => setActiveTab("leaderboard")}
              />
              {activeTab === "arena" ? (
                <>
                  {showGameBoard && (
                    <GameBoard
                      players={gameBoardPlayers}
                      maxPlayers={MAX_PLAYERS}
                      onInvite={handleInvite}
                    />
                  )}
                  <BanterStream
                    match={!mp.isHost && mp.gameSnapshot?.match ? { ...match, runs: mp.gameSnapshot.match.runs, wickets: mp.gameSnapshot.match.wickets, overs: mp.gameSnapshot.match.overs, balls: mp.gameSnapshot.match.balls, currentBowler: mp.gameSnapshot.match.currentBowler, target: mp.gameSnapshot.match.target } : match}
                    onNextBall={nextBall}
                    onHype={handleHype}
                    onPredictionResolved={handlePredictionResolved}
                    onFriendScoresUpdate={handleFriendScoresUpdate}
                    soundMuted={soundMuted}
                    activeFriends={activeFriends}
                    onOverComplete={handleOverComplete}
                    allPlayerStandings={allPlayerStandings}
                    userTeam={userTeam}
                    activePlayers={mp.players.length}
                    maxPlayers={MAX_PLAYERS}
                    roomId={mp.roomId || "SOLO"}
                    onInvite={handleInvite}
                    onToggleSound={toggleSound}
                    onFirstOverComplete={handleFirstOverComplete}
                    onBallStateChange={handleBallStateChange}
                    isHost={mp.isHost}
                    gameSnapshot={mp.gameSnapshot}
                    onInningsComplete={handleInningsComplete}
                    battingTeamShort={match.innings === 1 ? (selectedMatch?.team1.short || "DC") : (selectedMatch?.team2.short || "MI")}
                  />
                </>
              ) : activeTab === "receipts" ? (
                <ReceiptsScreen receiptData={receiptData} />
              ) : (
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

          {/* Innings Break Screen */}
          {isGameActive && showInningsBreak && (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 bg-gradient-to-b from-primary/20 to-background">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 15 }}
                className="text-center"
              >
                <span className="text-5xl mb-4 block">🏏</span>
                <h2 className="text-2xl font-black text-foreground mb-2">INNINGS BREAK</h2>
                <p className="text-lg font-bold text-primary mb-4">
                  {selectedMatch?.team1.short || "DC"}: {match.runs}/{match.wickets}
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  {selectedMatch?.team2.short || "MI"} need <span className="text-foreground font-bold">{match.runs + 1}</span> to win
                </p>
                <p className="text-xs text-muted-foreground animate-pulse mt-6">
                  2nd innings starting in a few seconds...
                </p>
              </motion.div>
            </div>
          )}

          {/* Match Over Screen */}
          {isGameActive && match.matchOver && (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 bg-gradient-to-b from-neon/20 to-background">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 15 }}
                className="text-center"
              >
                <span className="text-5xl mb-4 block">🏆</span>
                <h2 className="text-2xl font-black text-foreground mb-2">MATCH OVER</h2>
                {match.target && match.runs >= match.target ? (
                  <p className="text-lg font-bold text-neon mb-4">
                    {selectedMatch?.team2.short || "MI"} wins by {10 - match.wickets} wickets!
                  </p>
                ) : (
                  <p className="text-lg font-bold text-primary mb-4">
                    {selectedMatch?.team1.short || "DC"} wins by {match.firstInningsScore! - match.runs} runs!
                  </p>
                )}
                <div className="bg-secondary/50 rounded-2xl px-6 py-4 mt-4">
                  <p className="text-[11px] text-muted-foreground mb-2">Your Predictions</p>
                  <p className="text-lg font-bold text-foreground">
                    {predictions.filter(p => p.won === true).length}/{predictions.filter(p => p.won !== null).length} correct
                  </p>
                  {bestStreak > 0 && (
                    <p className="text-sm text-neon mt-1">🔥 Best streak: {bestStreak}</p>
                  )}
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.reload()}
                  className="mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-full font-bold text-sm"
                >
                  Play Again
                </motion.button>
              </motion.div>
            </div>
          )}

          <div className="hidden sm:flex absolute bottom-1.5 left-1/2 -translate-x-1/2 z-[200] w-[120px] h-[4px] bg-foreground/20 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default Index;
