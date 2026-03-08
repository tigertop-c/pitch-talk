import { useState } from "react";
import LiveHeader from "@/components/LiveHeader";
import BanterStream from "@/components/BanterStream";
import BottomNav from "@/components/BottomNav";
import ReceiptsScreen from "@/components/ReceiptsScreen";
import PreGameIntro from "@/components/PreGameIntro";
import { useMatchState } from "@/hooks/useMatchState";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"arena" | "receipts">("arena");
  const [gameStarted, setGameStarted] = useState(false);
  const { match, nextBall, crr } = useMatchState();

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background overflow-hidden">
      <LiveHeader match={match} crr={crr} />
      {!gameStarted ? (
        <PreGameIntro onStart={() => setGameStarted(true)} />
      ) : activeTab === "arena" ? (
        <BanterStream match={match} onNextBall={nextBall} />
      ) : (
        <ReceiptsScreen />
      )}
      {gameStarted && <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />}
    </div>
  );
};

export default Index;
