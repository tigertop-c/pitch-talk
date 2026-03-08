import { useState } from "react";
import LiveHeader from "@/components/LiveHeader";
import BanterStream from "@/components/BanterStream";
import BottomNav from "@/components/BottomNav";
import ReceiptsScreen from "@/components/ReceiptsScreen";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"arena" | "receipts">("arena");

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background overflow-hidden">
      <LiveHeader />
      {activeTab === "arena" ? <BanterStream /> : <ReceiptsScreen />}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
