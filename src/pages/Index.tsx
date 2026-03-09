import { useState, useCallback, useRef, useMemo } from "react";
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
import RoomLobby from "@/components/RoomLobby";
import NonHostGameView from "@/components/NonHostGameView";
import { useMatchState } from "@/hooks/useMatchState";
import { useMultiplayer, type GameSnapshot } from "@/hooks/useMultiplayer";
import { type PredictionRecord, type ReceiptData } from "@/components/ShareableReceipt";
import { setSoundMuted } from "@/lib/sounds";
import type { TeamId } from "@/components/ChatInput";

const MAX_PLAYERS = 10;

type AppStage = "name" | "lobby" | "picker" | "pregame" | "game";

const Index = () => {
  const [stage, setStage] = useState<AppStage>("name");
  const [activeTab, setActiveTab] = useState<TabId>("arena");
  const [selectedMatch, setSelectedMatch] = useState<UpcomingMatch | null>(null);
  const [userTeam, setUserTeam] = useState<TeamId>("DC");
  const [hypeType, setHypeType] = useState<"four" | "six" | "wicket" | null>(null);
  const [mutedHypeTypes, setMutedHypeTypes] = useState<Set<string>>(new Set());
  const [showGameBoard, setShowGameBoard] = useState(true);
  const { match, nextBall, crr } = useMatchState();

  const [playerName, setPlayerName] = useState("");
  const [playerAvatar, setPlayerAvatar] = useState("🏏");

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

  // Name entry complete
  const handleNameComplete = useCallback((name: string, avatar: string) => {
    setPlayerName(name);
    setPlayerAvatar(avatar);
    localStorage.setItem("pitchtalk_profile", JSON.stringify({ name, avatar }));
    setStage("lobby");
  }, []);

  // Room actions
  const handleCreateRoom = useCallback(async () => {
    await mp.createRoom(playerName, playerAvatar);
  }, [mp, playerName, playerAvatar]);

  const handleJoinRoom = useCallback(async (code: string) => {
    await mp.joinRoom(code, playerName, playerAvatar);
  }, [mp, playerName, playerAvatar]);

  const handleStartGame = useCallback(() => {
    // Host moves to match picker
    setStage("picker");
  }, []);

  const handleSelectMatch = useCallback((m: UpcomingMatch) => {
    setSelectedMatch(m);
    setStage("pregame");
  }, []);

  const handleGameStart = useCallback((team: TeamId) => {
    setUserTeam(team);
    mp.updateMyTeam(team);
    setStage("game");
    // If host, start the game for everyone
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
    const text = `🏏 Join my Pitch Talk room! Code: ${mp.roomId}\n\nPredict every ball, play with the squad 🧠🔥\n${window.location.origin}`;
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

  // Non-host pick handler
  const handleNonHostPick = useCallback((ballId: number, pick: string) => {
    mp.submitPick(ballId, pick, playerName);
  }, [mp, playerName]);

  const handleNonHostScoreUpdate = useCallback((wins: number, total: number, streak: number) => {
    mp.updateMyScore(wins, total, streak);
  }, [mp]);

  // Listen for host starting game (non-host)
  const gamePhase = mp.gameSnapshot?.phase;
  const isNonHostInGame = !mp.isHost && gamePhase === "game" && stage === "lobby";
  if (isNonHostInGame) {
    // Auto-advance non-host to game when host starts
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

  const isGameActive = stage === "game";
  const isHostPlaying = mp.isHost && isGameActive;
  const isNonHostPlaying = !mp.isHost && isGameActive && mp.roomId;

  return (
    <div className="flex items-center justify-center min-h-screen bg-[hsl(220,15%,12%)]">
      <div className="relative w-full max-w-md mx-auto h-screen sm:h-[812px] sm:my-4 sm:rounded-[3rem] sm:border-[6px] sm:border-[hsl(0,0%,20%)] sm:shadow-[0_0_0_2px_hsl(0,0%,30%),0_20px_60px_-10px_hsl(0,0%,0%/0.5)] overflow-hidden bg-background">
        <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 z-[200] w-[120px] h-[28px] bg-[hsl(0,0%,0%)] rounded-b-2xl" />
        <div className="hidden sm:block absolute top-[8px] left-1/2 -translate-x-1/2 z-[201] w-[90px] h-[24px] bg-[hsl(0,0%,5%)] rounded-full" />

        <div className="flex flex-col h-full relative overflow-hidden sm:pt-[2px]">
          <HypeOverlay type={hypeType} onDismiss={handleDismissHype} onMute={handleMuteHype} />

          {/* Stage: Name Entry */}
          {stage === "name" && (
            <NameEntry onComplete={handleNameComplete} />
          )}

          {/* Stage: Room Lobby */}
          {stage === "lobby" && (
            <RoomLobby
              playerName={playerName}
              playerAvatar={playerAvatar}
              isHost={mp.isHost}
              roomId={mp.roomId}
              players={mp.players}
              isLoading={mp.isLoading}
              error={mp.error}
              onCreateRoom={handleCreateRoom}
              onJoinRoom={handleJoinRoom}
              onStartGame={handleStartGame}
            />
          )}

          {/* Stage: Match Picker (host only) */}
          {stage === "picker" && (
            <GamePicker onSelectMatch={handleSelectMatch} />
          )}

          {/* Stage: Pre-game intro (host picks team) */}
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

          {/* Stage: Game — Host View */}
          {isHostPlaying && (
            <>
              <LiveHeader match={match} crr={crr} soundMuted={soundMuted} onToggleSound={toggleSound} battingTeam={selectedMatch?.team1.short || "DC"} isChasing={match.target !== null} />
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
                    match={match}
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

          {/* Stage: Game — Non-Host View */}
          {isNonHostPlaying && (
            <NonHostGameView
              playerName={playerName}
              playerAvatar={playerAvatar}
              gameSnapshot={mp.gameSnapshot}
              players={mp.players}
              currentPredictions={mp.currentPredictions}
              onPick={handleNonHostPick}
              onScoreUpdate={handleNonHostScoreUpdate}
              onHype={handleHype}
            />
          )}

          <div className="hidden sm:flex absolute bottom-1.5 left-1/2 -translate-x-1/2 z-[200] w-[120px] h-[4px] bg-foreground/20 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default Index;
