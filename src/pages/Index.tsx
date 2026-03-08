import { useState } from "react";
import LiveHeader from "@/components/LiveHeader";
import BanterStream from "@/components/BanterStream";
import BottomNav from "@/components/BottomNav";
import ReceiptsScreen from "@/components/ReceiptsScreen";
import PreGameIntro from "@/components/PreGameIntro";
import HypeOverlay from "@/components/HypeOverlay";
import { useMatchState } from "@/hooks/useMatchState";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"arena" | "receipts">("arena");
  const [gameStarted, setGameStarted] = useState(false);
  const [hypeType, setHypeType] = useState<"four" | "six" | "wicket" | null>(null);
  const { match, nextBall, crr } = useMatchState();

  const handleHype = (type: "four" | "six" | "wicket") => {
    setHypeType(type);
    setTimeout(() => setHypeType(null), 1200);
  };

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
            <BanterStream match={match} onNextBall={nextBall} onHype={handleHype} />
          ) : (
            <ReceiptsScreen />
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
