import { motion } from "framer-motion";
import { Flame, ScrollText, Trophy } from "lucide-react";

export type TabId = "arena" | "receipts" | "leaderboard";

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <div className="ios-glass ios-separator border-t" style={{ borderTop: "0.5px solid hsl(0 0% 0% / 0.1)" }}>
      <div className="flex pb-[env(safe-area-inset-bottom,0px)]">
        {[
          { id: "arena" as const, label: "Live Arena", icon: Flame, activeColor: "text-destructive" },
          { id: "receipts" as const, label: "My Record", icon: ScrollText, activeColor: "text-primary" },
          { id: "leaderboard" as const, label: "Leaderboard", icon: Trophy, activeColor: "text-amber-400" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.92 }}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 relative text-[10px] font-bold tracking-wide transition-colors duration-200 ${
                isActive ? tab.activeColor : "text-muted-foreground"
              }`}
            >
              <motion.div
                animate={isActive ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <tab.icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
              </motion.div>
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className={`absolute -top-[0.5px] left-3 right-3 h-[2.5px] rounded-full ${
                    tab.id === "arena" ? "bg-destructive" :
                    tab.id === "leaderboard" ? "bg-amber-400" :
                    "bg-primary"
                  }`}
                  transition={{ type: "spring", damping: 25, stiffness: 400 }}
                />
              )}
              {/* Subtle glow under active tab */}
              {isActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`absolute -top-1 left-6 right-6 h-4 rounded-full blur-md pointer-events-none ${
                    tab.id === "arena" ? "bg-destructive/20" :
                    tab.id === "leaderboard" ? "bg-amber-400/20" :
                    "bg-primary/20"
                  }`}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
