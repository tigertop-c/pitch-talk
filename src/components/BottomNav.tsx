import { motion } from "framer-motion";
import { Flame, ScrollText } from "lucide-react";

interface BottomNavProps {
  activeTab: "arena" | "receipts";
  onTabChange: (tab: "arena" | "receipts") => void;
}

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <div className="ios-glass ios-separator border-t" style={{ borderTop: "0.5px solid hsl(0 0% 0% / 0.1)" }}>
      <div className="flex pb-[env(safe-area-inset-bottom,0px)]">
        {[
          { id: "arena" as const, label: "Live Arena", icon: Flame },
          { id: "receipts" as const, label: "Receipts", icon: ScrollText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 relative text-[10px] font-medium tracking-wide transition-colors duration-200 ${
              activeTab === tab.id ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <tab.icon size={22} strokeWidth={activeTab === tab.id ? 2.2 : 1.5} />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute -top-[0.5px] left-4 right-4 h-[2px] bg-primary rounded-full"
                transition={{ type: "spring", damping: 25, stiffness: 400 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
