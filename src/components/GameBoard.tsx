import { motion } from "framer-motion";
import { UserPlus, MessageCircle } from "lucide-react";

export interface GameBoardPlayer {
  name: string;
  avatar: string;
  accuracy: number;
  totalPredictions: number;
  active: boolean;
  warned: boolean;
  isYou?: boolean;
}

interface GameBoardProps {
  players: GameBoardPlayer[];
  maxPlayers: number;
  onInvite: () => void;
}

const GameBoard = ({ players, maxPlayers, onInvite }: GameBoardProps) => {
  const activePlayers = players.filter(p => p.active);
  const spotsLeft = maxPlayers - activePlayers.length;

  return (
    <div className="px-4 py-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-foreground">🎮 Game Board</span>
          <span className="text-[10px] text-muted-foreground">
            {activePlayers.length}/{maxPlayers}
          </span>
        </div>
        {spotsLeft > 0 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onInvite}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-neon/15 text-neon"
          >
            <UserPlus size={10} />
            Invite ({spotsLeft} spots)
          </motion.button>
        )}
      </div>

      {/* Player chips - horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {activePlayers.map((p) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] ${
              p.warned
                ? "bg-destructive/10 ring-1 ring-destructive/30"
                : p.isYou
                ? "bg-primary/10 ring-1 ring-primary/30"
                : "bg-secondary"
            }`}
          >
            <span className="text-sm">{p.avatar}</span>
            <div className="flex flex-col">
              <span className={`font-semibold leading-tight ${p.isYou ? "text-primary" : "text-foreground"}`}>
                {p.name}
              </span>
              {p.totalPredictions > 0 && (
                <span className="text-[9px] text-muted-foreground leading-tight">
                  {p.accuracy}%
                </span>
              )}
            </div>
            {p.warned && <span className="text-[10px]">⚠️</span>}
          </motion.div>
        ))}

        {/* Invite slot placeholders */}
        {spotsLeft > 0 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onInvite}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-dashed border-muted-foreground/20 text-muted-foreground"
          >
            <UserPlus size={12} />
            <span className="text-[10px] font-medium">Invite</span>
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default GameBoard;
