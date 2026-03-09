import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, UserPlus, MessageCircle, Loader2 } from "lucide-react";
import type { MultiplayerPlayer } from "@/hooks/useMultiplayer";

interface RoomLobbyProps {
  playerName: string;
  playerAvatar: string;
  isHost: boolean;
  roomId: string | null;
  players: MultiplayerPlayer[];
  isLoading: boolean;
  error: string | null;
  onCreateRoom: () => Promise<void>;
  onJoinRoom: (code: string) => Promise<void>;
  onStartGame: () => void;
}

const spring = { type: "spring" as const, damping: 25, stiffness: 350 };

const RoomLobby = ({
  playerName, playerAvatar, isHost, roomId, players,
  isLoading, error, onCreateRoom, onJoinRoom, onStartGame,
}: RoomLobbyProps) => {
  const [mode, setMode] = useState<"choose" | "create" | "join">(roomId ? (isHost ? "create" : "join") : "choose");
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInviteWhatsApp = () => {
    if (!roomId) return;
    const text = `🏏 Join my Pitch Talk room! Code: ${roomId}\n\nPredict every ball, play with the squad 🧠🔥\n${window.location.origin}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  // If we have a roomId, show the waiting room
  if (roomId) {
    return (
      <div className="flex-1 flex flex-col px-5 pt-6 pb-4 overflow-y-auto">
        {/* Room Code */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={spring}
          className="text-center mb-6"
        >
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-2">Room Code</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl font-black tracking-[0.2em] text-foreground">{roomId}</span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleCopy}
              className="p-2 rounded-xl bg-secondary active:bg-muted"
            >
              {copied ? <Check size={18} className="text-neon" /> : <Copy size={18} className="text-muted-foreground" />}
            </motion.button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">Share this code with your friends!</p>
        </motion.div>

        {/* Invite button */}
        <motion.button
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...spring, delay: 0.1 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleInviteWhatsApp}
          className="flex items-center justify-center gap-2 w-full py-3.5 mb-5 rounded-2xl text-[14px] font-semibold bg-[hsl(142,70%,45%,0.12)] text-[hsl(142,70%,35%)] active:bg-[hsl(142,70%,45%,0.2)]"
        >
          <MessageCircle size={16} />
          Invite via WhatsApp
        </motion.button>

        {/* Players */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...spring, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-semibold text-foreground">
              Players ({players.length})
            </p>
            <span className="text-[10px] text-muted-foreground">
              {isHost ? "You're the host 👑" : "Waiting for host..."}
            </span>
          </div>

          <div className="space-y-2 mb-6">
            <AnimatePresence>
              {players.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ ...spring, delay: i * 0.05 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${
                    p.name === playerName ? "bg-primary/10 ring-1 ring-primary/20" : "bg-secondary"
                  }`}
                >
                  <span className="text-xl">{p.avatar}</span>
                  <span className="text-[14px] font-semibold text-foreground flex-1">{p.name}</span>
                  {p.isHost && <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Host</span>}
                  {p.name === playerName && !p.isHost && <span className="text-[10px] text-muted-foreground">You</span>}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Empty slots */}
            {Array.from({ length: Math.max(0, 3 - players.length) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-dashed border-muted-foreground/15"
              >
                <UserPlus size={16} className="text-muted-foreground/30" />
                <span className="text-[12px] text-muted-foreground/40 font-medium">Waiting for player...</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Start button (host only) */}
        {isHost && players.length >= 1 && (
          <motion.button
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...spring, delay: 0.3 }}
            whileTap={{ scale: 0.97 }}
            onClick={onStartGame}
            className="w-full py-4 rounded-2xl text-[15px] font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/25 active:shadow-md mt-auto"
          >
            Start Game 🏏
          </motion.button>
        )}

        {!isHost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-auto text-center py-4"
          >
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-[13px] text-muted-foreground font-medium"
            >
              Waiting for host to start the game...
            </motion.span>
          </motion.div>
        )}
      </div>
    );
  }

  // Choose mode
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ ...spring, delay: 0.1 }}
        className="flex items-center gap-2 mb-2"
      >
        <span className="text-3xl">{playerAvatar}</span>
        <span className="text-xl font-bold text-foreground">{playerName}</span>
      </motion.div>

      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...spring, delay: 0.2 }}
        className="text-sm text-muted-foreground mb-8"
      >
        Ready to play!
      </motion.p>

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-destructive text-[12px] font-medium mb-4 px-4 py-2 rounded-xl bg-destructive/10"
        >
          {error}
        </motion.p>
      )}

      <AnimatePresence mode="wait">
        {mode === "choose" && (
          <motion.div
            key="choose"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={spring}
            className="w-full max-w-xs space-y-3"
          >
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={async () => {
                setMode("create");
                await onCreateRoom();
              }}
              disabled={isLoading}
              className="w-full py-4 rounded-2xl text-[15px] font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/25 active:shadow-md flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Create Room 🏟️"}
            </motion.button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[11px] text-muted-foreground font-medium">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setMode("join")}
              className="w-full py-4 rounded-2xl text-[15px] font-bold bg-secondary text-foreground active:bg-muted"
            >
              Join Room 🤝
            </motion.button>
          </motion.div>
        )}

        {mode === "join" && (
          <motion.div
            key="join"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={spring}
            className="w-full max-w-xs space-y-4"
          >
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1.5 block">
                Room Code
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="ABCDEF"
                maxLength={6}
                className="w-full px-4 py-3.5 rounded-2xl bg-secondary text-foreground text-center text-2xl font-black tracking-[0.2em] placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                autoFocus
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => joinCode.length >= 4 && onJoinRoom(joinCode)}
              disabled={joinCode.length < 4 || isLoading}
              className={`w-full py-4 rounded-2xl text-[15px] font-bold flex items-center justify-center gap-2 ${
                joinCode.length >= 4
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-secondary text-muted-foreground opacity-50"
              }`}
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Join Room"}
            </motion.button>

            <button
              onClick={() => { setMode("choose"); setJoinCode(""); }}
              className="w-full text-center text-[12px] text-muted-foreground font-medium py-2"
            >
              ← Back
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoomLobby;
