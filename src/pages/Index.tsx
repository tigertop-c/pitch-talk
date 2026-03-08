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
import { useMatchState } from "@/hooks/useMatchState";
import { type PredictionRecord, type ReceiptData } from "@/components/ShareableReceipt";
import { setSoundMuted } from "@/lib/sounds";
import type { TeamId } from "@/components/ChatInput";

const MAX_PLAYERS = 10;

const INITIAL_FRIENDS: FriendDef[] = [
  { name: "Rahul", avatar: "🔥", team: "DC" },
  { name: "Priya", avatar: "💅", team: "MI" },
  { name: "Arjun", avatar: "🏏", team: "DC" },
  { name: "Sneha", avatar: "⚡", team: "MI" },
  { name: "Vikram", avatar: "🎯", team: "DC" },
];

const INVITE_POOL: FriendDef[] = [
  { name: "Deepak", avatar: "💪", team: "MI" },
  { name: "Kavya", avatar: "✨", team: "DC" },
  { name: "Rohit", avatar: "🌟", team: "MI" },
  { name: "Ananya", avatar: "🎶", team: "DC" },
  { name: "Karthik", avatar: "🦁", team: "MI" },
];

interface FriendState {
  friend: FriendDef;
  active: boolean;
  warned: boolean;
  lastActiveOver: number;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>("arena");
  const [selectedMatch, setSelectedMatch] = useState<UpcomingMatch | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [userTeam, setUserTeam] = useState<TeamId>("DC");
  const [hypeType, setHypeType] = useState<"four" | "six" | "wicket" | null>(null);
  const [showGameBoard, setShowGameBoard] = useState(true);
  const { match, nextBall, crr } = useMatchState();

  const roomId = useRef(`room-${Math.random().toString(36).slice(2, 8)}`).current;

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

  const [friends, setFriends] = useState<FriendState[]>(
    () => INITIAL_FRIENDS.map(f => ({ friend: f, active: true, warned: false, lastActiveOver: 0 }))
  );
  const invitePoolRef = useRef([...INVITE_POOL]);

  const [friendScores, setFriendScores] = useState<Record<string, { wins: number; total: number; streak: number; bestStreak: number }>>(
    () => Object.fromEntries(INITIAL_FRIENDS.map(u => [u.name, { wins: 0, total: 0, streak: 0, bestStreak: 0 }]))
  );

  const handleHype = (type: "four" | "six" | "wicket") => {
    setHypeType(type);
    setTimeout(() => setHypeType(null), 2500);
  };

  const handleSelectMatch = useCallback((m: UpcomingMatch) => {
    setSelectedMatch(m);
  }, []);

  const handleGameStart = useCallback((team: TeamId) => {
    setUserTeam(team);
    setGameStarted(true);
  }, []);

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
    setFriends(prev => {
      return prev.map(f => {
        if (!f.active) return f;
        const participated = participation[f.friend.name] === true;
        const lastActive = participated ? overNum : f.lastActiveOver;
        const oversInactive = overNum - lastActive;

        if (f.warned && oversInactive >= 3) {
          return { ...f, active: false, warned: false };
        }
        if (oversInactive >= 2 && !f.warned) {
          return { ...f, warned: true, lastActiveOver: lastActive };
        }
        if (participated && f.warned) {
          return { ...f, warned: false, lastActiveOver: lastActive };
        }
        return { ...f, lastActiveOver: lastActive };
      });
    });
  }, []);

  const handleInvite = useCallback(() => {
    const activeFriendCount = friends.filter(f => f.active).length;
    if (activeFriendCount >= MAX_PLAYERS) return;

    if (invitePoolRef.current.length > 0) {
      const newFriend = invitePoolRef.current.shift()!;
      setFriends(prev => [...prev, { friend: newFriend, active: true, warned: false, lastActiveOver: 0 }]);
      setFriendScores(prev => ({ ...prev, [newFriend.name]: { wins: 0, total: 0, streak: 0, bestStreak: 0 } }));
    }

    const matchLabel = selectedMatch ? `${selectedMatch.team1.short} vs ${selectedMatch.team2.short}` : "DC vs MI";
    const text = `🏏 Join my Pitch Talk room for ${matchLabel}! Predict every ball, play with the squad 🧠🔥\n\nRoom: ${roomId}\n${window.location.origin}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }, [friends, selectedMatch, roomId]);

  const activeFriends = friends.filter(f => f.active).map(f => f.friend);
  const activeFriendCount = friends.filter(f => f.active).length;

  const gameBoardPlayers: GameBoardPlayer[] = useMemo(() => [
    {
      name: "You",
      avatar: "🙋",
      accuracy: predictions.filter(p => p.won !== null).length > 0
        ? Math.round((predictions.filter(p => p.won === true).length / predictions.filter(p => p.won !== null).length) * 100)
        : 0,
      totalPredictions: predictions.filter(p => p.won !== null).length,
      active: true,
      warned: false,
      isYou: true,
    },
    ...friends.map(f => ({
      name: f.friend.name,
      avatar: f.friend.avatar,
      accuracy: friendScores[f.friend.name]?.total > 0
        ? Math.round((friendScores[f.friend.name].wins / friendScores[f.friend.name].total) * 100)
        : 0,
      totalPredictions: friendScores[f.friend.name]?.total || 0,
      active: f.active,
      warned: f.warned,
    })),
  ], [predictions, friends, friendScores]);

  const allPlayerStandings = useMemo(() => [
    {
      name: "You",
      avatar: "🙋",
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
  ], [predictions, activeFriends, friendScores, currentStreak, bestStreak]);

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
      : "DC vs MI • IPL 2025",
  } : undefined;

  const leaderboardEntries: LeaderboardEntry[] = [
    {
      name: "You",
      avatar: "🙋",
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

  // Team split for display
  const dcCount = activeFriends.filter(f => f.team === "DC").length + (userTeam === "DC" ? 1 : 0);
  const miCount = activeFriends.filter(f => f.team === "MI").length + (userTeam === "MI" ? 1 : 0);
  const showTeamSplit = (dcCount + miCount) >= 3;

  return (
    <div className="flex items-center justify-center min-h-screen bg-[hsl(220,15%,12%)]">
      <div className="relative w-full max-w-md mx-auto h-screen sm:h-[812px] sm:my-4 sm:rounded-[3rem] sm:border-[6px] sm:border-[hsl(0,0%,20%)] sm:shadow-[0_0_0_2px_hsl(0,0%,30%),0_20px_60px_-10px_hsl(0,0%,0%/0.5)] overflow-hidden bg-background">
        <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 z-[200] w-[120px] h-[28px] bg-[hsl(0,0%,0%)] rounded-b-2xl" />
        <div className="hidden sm:block absolute top-[8px] left-1/2 -translate-x-1/2 z-[201] w-[90px] h-[24px] bg-[hsl(0,0%,5%)] rounded-full" />
        
        <div className="flex flex-col h-full relative overflow-hidden sm:pt-[2px]">
          <HypeOverlay type={hypeType} />
          {(selectedMatch || gameStarted) && (
            <LiveHeader match={match} crr={crr} soundMuted={soundMuted} onToggleSound={toggleSound} battingTeam={selectedMatch?.team1.short || "DC"} isChasing={match.target !== null} />
          )}
          {!selectedMatch ? (
            <GamePicker onSelectMatch={handleSelectMatch} />
          ) : !gameStarted ? (
            <PreGameIntro
              onStart={handleGameStart}
              matchStartTime={selectedMatch.startTime}
              team1={{ name: selectedMatch.team1.name, short: selectedMatch.team1.short }}
              team2={{ name: selectedMatch.team2.name, short: selectedMatch.team2.short }}
              matchNumber={selectedMatch.matchNumber}
              roomId={roomId}
            />
          ) : activeTab === "arena" ? (
            <>
              {showGameBoard && (
                <GameBoard
                  players={gameBoardPlayers}
                  maxPlayers={MAX_PLAYERS}
                  onInvite={handleInvite}
                />
              )}
              {/* Team split banner */}
              {showTeamSplit && !showGameBoard && (
                <div className="flex items-center justify-center gap-3 px-4 py-1.5 bg-secondary/50">
                  <span className="text-[10px] font-bold text-primary">{dcCount} DC 💙</span>
                  <span className="text-[10px] text-muted-foreground">vs</span>
                  <span className="text-[10px] font-bold text-primary">{miCount} MI 💙</span>
                </div>
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
                activePlayers={activeFriendCount + 1}
                maxPlayers={MAX_PLAYERS}
                roomId={roomId}
                onInvite={handleInvite}
                onToggleSound={toggleSound}
                onFirstOverComplete={handleFirstOverComplete}
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
          {gameStarted && <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />}
          <div className="hidden sm:flex absolute bottom-1.5 left-1/2 -translate-x-1/2 z-[200] w-[120px] h-[4px] bg-foreground/20 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default Index;
