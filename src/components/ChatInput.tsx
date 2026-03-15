import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { getBanterPicks, type BanterContext } from "@/lib/banterEngine";

export type TeamId = "CSK" | "DC" | "GT" | "KKR" | "LSG" | "MI" | "PBKS" | "RCB" | "RR" | "SRH";
export type UserChatStyle = "hype" | "expert" | "troll" | "neutral";
export type ChatItemType = "text" | "prediction" | "flex" | "taunt";

export interface MatchContext {
  lastBallResult: string | null;
  runs: number;
  wickets: number;
  target: number | null;
  overs: number;
  balls: number;
  // Extended context for banter engine
  battingTeam?: TeamId | null;
  bowlingTeam?: TeamId | null;
  striker?: string | null;
  bowler?: string | null;
  innings?: 1 | 2;
}

interface ChatInputProps {
  onSend: (text: string, type?: ChatItemType, meta?: any) => void;
  userTeam: TeamId;
  matchContext: MatchContext;
  userStyle?: UserChatStyle;
  currentNetWinnings?: number;
}

const ChatInput = ({ onSend, userTeam, matchContext, userStyle = "neutral", currentNetWinnings = 0 }: ChatInputProps) => {
  const [text, setText] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  // Item 2: Use ref instead of state so setting it doesn't trigger a picks re-render
  const lastChosenRef = useRef<string | null>(null);
  const seedRef = useRef(Math.random());

  // Reset seed (and picks) ONLY on new ball result — not on user tap
  useEffect(() => {
    seedRef.current = Math.random();
    lastChosenRef.current = null; // allow same pick on next ball
  }, [matchContext.lastBallResult, matchContext.overs, matchContext.balls]);

  const banterCtx: BanterContext = useMemo(() => ({
    lastBallResult: matchContext.lastBallResult,
    runs:           matchContext.runs,
    wickets:        matchContext.wickets,
    target:         matchContext.target,
    overs:          matchContext.overs,
    balls:          matchContext.balls,
    battingTeam:    matchContext.battingTeam ?? null,
    bowlingTeam:    matchContext.bowlingTeam ?? null,
    striker:        matchContext.striker ?? null,
    bowler:         matchContext.bowler ?? null,
    innings:        matchContext.innings ?? 1,
    userTeam,
  }), [
    userTeam,
    matchContext.lastBallResult,
    matchContext.runs,
    matchContext.wickets,
    matchContext.target,
    matchContext.overs,
    matchContext.balls,
    matchContext.battingTeam,
    matchContext.bowlingTeam,
    matchContext.striker,
    matchContext.bowler,
    matchContext.innings,
  ]);

  // Item 2: quickPicks only re-computes when ball state changes (banterCtx),
  // NOT when the user taps a pick (lastChosenRef is a ref, not state).
  const quickPicks = useMemo(
    () => getBanterPicks(banterCtx, lastChosenRef.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [banterCtx]
  );

  // Item 2: setting lastChosenRef doesn't trigger re-render → picks stay stable
  const handleQuickPick = useCallback((pick: string) => {
    lastChosenRef.current = pick;
    onSend(pick);
  }, [onSend]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed, "text");
    setText("");
    setShowTextInput(false);
  }, [text, onSend]);

  const handleFlex = useCallback(() => {
    const amount = currentNetWinnings;
    if (amount <= 0) {
      onSend("Still waiting for my big payout... 🏏", "text");
    } else {
      onSend(`Currently up ₹${amount}! Who's catching me? 🤑`, "flex", { amount });
    }
  }, [currentNetWinnings, onSend]);

  return (
    <div className="ios-glass px-3 py-2" style={{ borderTop: "0.5px solid hsl(0 0% 0% / 0.1)" }}>
      {/* Item 3: Quick picks only — emoji buttons removed */}
      <div className="flex flex-wrap gap-1.5 items-center">
        {quickPicks.map((pick, idx) => (
          <button
            key={`${pick}-${idx}`}
            onClick={() => handleQuickPick(pick)}
            className="px-3.5 py-2 rounded-full bg-secondary text-foreground text-[12px] font-semibold hover:bg-muted active:scale-95 transition-all duration-150 leading-tight"
          >
            {pick}
          </button>
        ))}
        {!showTextInput && (
          <button
            onClick={() => setShowTextInput(true)}
            className="px-3.5 py-2 rounded-full bg-primary/10 text-primary text-[12px] font-semibold active:scale-95 transition-all duration-150"
          >
            ✏️ Type
          </button>
        )}
        <button
          onClick={handleFlex}
          className="px-3.5 py-2 rounded-full bg-neon/10 text-neon text-[12px] font-semibold active:scale-95 transition-all duration-150 ml-auto border border-neon/20"
        >
          Flex 💰
        </button>
      </div>

      {/* Free-text input — only when expanded */}
      {showTextInput && (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Say something..."
            autoFocus
            className="flex-1 px-4 py-2 rounded-full bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
          />
          <button
            onClick={handleSend}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-primary text-primary-foreground active:scale-90 transition-transform duration-150"
          >
            <Send size={16} />
          </button>
          <button
            onClick={() => { setShowTextInput(false); setText(""); }}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary text-muted-foreground active:scale-90 transition-transform duration-150"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatInput;
