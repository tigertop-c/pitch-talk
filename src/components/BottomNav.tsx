import { motion } from "framer-motion";
import { Flame, ScrollText } from "lucide-react";

interface BottomNavProps {
  activeTab: "arena" | "receipts";
  onTabChange: (tab: "arena" | "receipts") => void;
}

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <div className="border-t-[3px] border-foreground bg-card">
      <div className="flex">
        {[
          { id: "arena" as const, label: "Live Arena", icon: Flame },
          { id: "receipts" as const, label: "Receipts", icon: ScrollText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 relative font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === tab.id ? "text-neon" : "text-muted-foreground"
            }`}
          >
            <tab.icon size={20} />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute top-0 left-0 right-0 h-[3px] bg-neon"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
