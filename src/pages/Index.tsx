import { useState, useCallback } from "react";
import LiveHeader from "@/components/LiveHeader";
import BanterStream from "@/components/BanterStream";
import BottomNav, { type TabId } from "@/components/BottomNav";
import ReceiptsScreen from "@/components/ReceiptsScreen";
import Leaderboard, { type LeaderboardEntry } from "@/components/Leaderboard";
import PreGameIntro from "@/components/PreGameIntro";
import HypeOverlay from "@/components/HypeOverlay";
import { useMatchState } from "@/hooks/useMatchState";
import { type PredictionRecord, type ReceiptData } from "@/components/ShareableReceipt";

const USERS = [
  { name: "Rahul", avatar: "🔥" },
  { name: "Priya", avatar: "💅" },
  { name: "Arjun", avatar: "🏏" },
  { name: "Sneha", avatar: "⚡" },
  { name: "Vikram", avatar: "🎯" },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>("arena");
  const [gameStarted, setGameStarted] = useState(false);
  const [hypeType, setHypeType] = useState<"four" | "six" | "wicket" | null>(null);
  const { match, nextBall, crr } = useMatchState();

  // Track user predictions for receipts
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [bestStreak, setBestStreak] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  // Track friend scores for leaderboard
  const [friendScores, setFriendScores] = useState<Record<string, { wins: number; total: number; streak: number; bestStreak: number }>>(
    () => Object.fromEntries(USERS.map(u => [u.name, { wins: 0, total: 0, streak: 0, bestStreak: 0 }]))
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
    // "You" entry
    {
      name: "You",
      avatar: "🙋",
      wins: predictions.filter(p => p.won === true).length,
      total: predictions.filter(p => p.won !== null).length,
      streak: currentStreak,
      bestStreak,
    },
    // Friend entries
    ...USERS.map(u => ({
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
      {/* iPhone frame */}
      <div className="relative w-full max-w-md mx-auto h-screen sm:h-[812px] sm:my-4 sm:rounded-[3rem] sm:border-[6px] sm:border-[hsl(0,0%,20%)] sm:shadow-[0_0_0_2px_hsl(0,0%,30%),0_20px_60px_-10px_hsl(0,0%,0%/0.5)] overflow-hidden bg-background">
        {/* Notch */}
        <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 z-[200] w-[120px] h-[28px] bg-[hsl(0,0%,0%)] rounded-b-2xl" />
        {/* Dynamic Island pill */}
        <div className="hidden sm:block absolute top-[8px] left-1/2 -translate-x-1/2 z-[201] w-[90px] h-[24px] bg-[hsl(0,0%,5%)] rounded-full" />
        
        {/* App content */}
        <div className="flex flex-col h-full relative overflow-hidden sm:pt-[2px]">
          <HypeOverlay type={hypeType} />
          <LiveHeader match={match} crr={crr} />
          {!gameStarted ? (
            <PreGameIntro onStart={() => setGameStarted(true)} />
          ) : activeTab === "arena" ? (
            <BanterStream
              match={match}
              onNextBall={nextBall}
              onHype={handleHype}
              onPredictionResolved={handlePredictionResolved}
              onFriendScoresUpdate={handleFriendScoresUpdate}
            />
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
          
          {/* Home indicator */}
          <div className="hidden sm:flex absolute bottom-1.5 left-1/2 -translate-x-1/2 z-[200] w-[120px] h-[4px] bg-foreground/20 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default Index;
