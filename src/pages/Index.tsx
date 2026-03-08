import { useState, useCallback, useRef } from "react";
import LiveHeader from "@/components/LiveHeader";
import BanterStream from "@/components/BanterStream";
import type { FriendDef } from "@/components/BanterStream";
import GameBoard, { type GameBoardPlayer } from "@/components/GameBoard";
import BottomNav, { type TabId } from "@/components/BottomNav";
import ReceiptsScreen from "@/components/ReceiptsScreen";
import Leaderboard, { type LeaderboardEntry } from "@/components/Leaderboard";
import PreGameIntro from "@/components/PreGameIntro";
import HypeOverlay from "@/components/HypeOverlay";
import { useMatchState } from "@/hooks/useMatchState";
import { type PredictionRecord, type ReceiptData } from "@/components/ShareableReceipt";
import { setSoundMuted } from "@/lib/sounds";

const MAX_PLAYERS = 10;

const INITIAL_FRIENDS: FriendDef[] = [
  { name: "Rahul", avatar: "🔥" },
  { name: "Priya", avatar: "💅" },
  { name: "Arjun", avatar: "🏏" },
  { name: "Sneha", avatar: "⚡" },
  { name: "Vikram", avatar: "🎯" },
];

const INVITE_POOL: FriendDef[] = [
  { name: "Deepak", avatar: "💪" },
  { name: "Kavya", avatar: "✨" },
  { name: "Rohit", avatar: "🌟" },
  { name: "Ananya", avatar: "🎶" },
  { name: "Karthik", avatar: "🦁" },
];

interface FriendState {
  friend: FriendDef;
  active: boolean;
  warned: boolean;
  lastActiveOver: number;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>("arena");
  const [gameStarted, setGameStarted] = useState(false);
  const [hypeType, setHypeType] = useState<"four" | "six" | "wicket" | null>(null);
  const { match, nextBall, crr } = useMatchState();

  // Sound mute
  const [soundMuted, setSoundMutedState] = useState(false);
  const toggleSound = useCallback(() => {
    setSoundMutedState(prev => {
      const next = !prev;
      setSoundMuted(next);
      return next;
    });
  }, []);

  // Predictions
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [bestStreak, setBestStreak] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  // Friends / Game board
  const [friends, setFriends] = useState<FriendState[]>(
    () => INITIAL_FRIENDS.map(f => ({ friend: f, active: true, warned: false, lastActiveOver: 0 }))
  );
  const invitePoolRef = useRef([...INVITE_POOL]);

  // Friend scores
  const [friendScores, setFriendScores] = useState<Record<string, { wins: number; total: number; streak: number; bestStreak: number }>>(
    () => Object.fromEntries(INITIAL_FRIENDS.map(u => [u.name, { wins: 0, total: 0, streak: 0, bestStreak: 0 }]))
  );

  const handleHype = (type: "four" | "six" | "wicket") => {
    setHypeType(type);
    setTimeout(() => setHypeType(null), 2500);
  };

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

  // Inactivity tracking: called at end of each over
  const handleOverComplete = useCallback((overNum: number, participation: Record<string, boolean>) => {
    setFriends(prev => {
      return prev.map(f => {
        if (!f.active) return f;
        const participated = participation[f.friend.name] === true;
        const lastActive = participated ? overNum : f.lastActiveOver;
        const oversInactive = overNum - lastActive;

        // Drop after 3 overs inactive (warned for 2, then 1 more)
        if (f.warned && oversInactive >= 3) {
          return { ...f, active: false, warned: false };
        }
        // Warn after 2 overs inactive
        if (oversInactive >= 2 && !f.warned) {
          return { ...f, warned: true, lastActiveOver: lastActive };
        }
        // Clear warning if they participated
        if (participated && f.warned) {
          return { ...f, warned: false, lastActiveOver: lastActive };
        }
        return { ...f, lastActiveOver: lastActive };
      });
    });
  }, []);

  // Invite via WhatsApp
  const handleInvite = useCallback(() => {
    const activeFriendCount = friends.filter(f => f.active).length;
    if (activeFriendCount >= MAX_PLAYERS) return;

    // Simulate adding a friend from pool
    if (invitePoolRef.current.length > 0) {
      const newFriend = invitePoolRef.current.shift()!;
      setFriends(prev => [...prev, { friend: newFriend, active: true, warned: false, lastActiveOver: 0 }]);
      setFriendScores(prev => ({ ...prev, [newFriend.name]: { wins: 0, total: 0, streak: 0, bestStreak: 0 } }));
    }

    // Open WhatsApp invite
    const text = "🏏 Join me on PitchTalk! Predict every ball, talk trash, and see who's the real cricket brain 🧠🔥\n\n" + window.location.origin;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }, [friends]);

  const activeFriends = friends.filter(f => f.active).map(f => f.friend);

  // Game board players
  const gameBoardPlayers: GameBoardPlayer[] = [
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
  ];

  // All player standings for over summaries
  const allPlayerStandings = [
    {
      name: "You",
      avatar: "🙋",
      wins: predictions.filter(p => p.won === true).length,
      total: predictions.filter(p => p.won !== null).length,
      accuracy: predictions.filter(p => p.won !== null).length > 0
        ? Math.round((predictions.filter(p => p.won === true).length / predictions.filter(p => p.won !== null).length) * 100)
        : 0,
    },
    ...activeFriends.map(f => ({
      name: f.name,
      avatar: f.avatar,
      wins: friendScores[f.name]?.wins || 0,
      total: friendScores[f.name]?.total || 0,
      accuracy: friendScores[f.name]?.total > 0
        ? Math.round((friendScores[f.name].wins / friendScores[f.name].total) * 100)
        : 0,
    })),
  ];

  const receiptData: ReceiptData | undefined = predictions.length > 0 ? {
    predictions,
    totalBalls: predictions.filter(p => p.won !== null).length,
    correctPicks: predictions.filter(p => p.won === true).length,
    accuracy: Math.round(
      (predictions.filter(p => p.won === true).length /
        Math.max(1, predictions.filter(p => p.won !== null).length)) * 100
    ),
    bestStreak,
    matchTitle: "DC vs MI • IPL 2025",
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-[hsl(220,15%,12%)]">
      <div className="relative w-full max-w-md mx-auto h-screen sm:h-[812px] sm:my-4 sm:rounded-[3rem] sm:border-[6px] sm:border-[hsl(0,0%,20%)] sm:shadow-[0_0_0_2px_hsl(0,0%,30%),0_20px_60px_-10px_hsl(0,0%,0%/0.5)] overflow-hidden bg-background">
        <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 z-[200] w-[120px] h-[28px] bg-[hsl(0,0%,0%)] rounded-b-2xl" />
        <div className="hidden sm:block absolute top-[8px] left-1/2 -translate-x-1/2 z-[201] w-[90px] h-[24px] bg-[hsl(0,0%,5%)] rounded-full" />
        
        <div className="flex flex-col h-full relative overflow-hidden sm:pt-[2px]">
          <HypeOverlay type={hypeType} />
          <LiveHeader match={match} crr={crr} soundMuted={soundMuted} onToggleSound={toggleSound} />
          {!gameStarted ? (
            <PreGameIntro onStart={() => setGameStarted(true)} />
          ) : activeTab === "arena" ? (
            <>
              <GameBoard
                players={gameBoardPlayers}
                maxPlayers={MAX_PLAYERS}
                onInvite={handleInvite}
              />
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
