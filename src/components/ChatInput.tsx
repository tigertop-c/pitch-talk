import { useState, useMemo } from "react";
import { Send } from "lucide-react";

export type TeamId = "DC" | "MI";

interface MatchContext {
  lastBallResult: string | null;
  runs: number;
  wickets: number;
  target: number | null;
  overs: number;
  balls: number;
}

interface ChatInputProps {
  onSend: (text: string) => void;
  userTeam: TeamId;
  matchContext: MatchContext;
}

function getQuickPicks(userTeam: TeamId, ctx: MatchContext): string[] {
  const battingTeam: TeamId = "DC"; // DC is batting in this simulation
  const isMyTeamBatting = userTeam === battingTeam;
  const result = ctx.lastBallResult;

  const picks: string[] = [];

  if (!result) {
    return isMyTeamBatting
      ? ["Come on DC! 💙", "Let's go!", "🔥", "DC all the way!", "💪"]
      : ["MI MI MI! 💙", "Let's go MI!", "Paltan! 🔥", "💪", "Rohit era!"];
  }

  switch (result) {
    case "six":
      if (isMyTeamBatting) {
        picks.push("SIX! 🚀", "MASSIVE! 🏟️", "DC DC DC! 💙", "That's my team! 🔥");
      } else {
        picks.push("Lucky shot 🙄", "Won't last", "Still losing 😏", "Fluke");
      }
      break;
    case "four":
      if (isMyTeamBatting) {
        picks.push("SHOT! 🏏", "Beautiful! 💫", "Class! 🔥", "Keep going DC!");
      } else {
        picks.push("Bad bowling 🎳", "Won't save them", "So? 🤷", "Meh");
      }
      break;
    case "wicket":
      if (isMyTeamBatting) {
        picks.push("No... 😰", "We're fine 💪", "Next man up!", "Still got this 🙏");
      } else {
        picks.push("YES! 💀", "Get out! 👋", "MI MI MI! 🎉", "Easy! 😏");
      }
      break;
    case "dot":
      if (isMyTeamBatting) {
        picks.push("Come on! 😤", "Play shots!", "Hit it! 🏏", "Be aggressive!");
      } else {
        picks.push("Pressure! 🫣", "Can't score 😂", "Tight! 🎯", "Love it!");
      }
      break;
    case "wide":
    case "noball":
      if (isMyTeamBatting) {
        picks.push("Free runs! 🎁", "Thanks bowler 😂", "Keep 'em coming!", "Sloppy! 😅");
      } else {
        picks.push("Focus! 😤", "Come on bowler!", "Get it together!", "🤦");
      }
      break;
    default: // single, double, triple
      if (isMyTeamBatting) {
        picks.push("Smart cricket 🧠", "Keep ticking!", "Good running 🏃", "Build it up!");
      } else {
        picks.push("That's nothing", "Need more than singles", "🥱", "Tick tick... 💣");
      }
  }

  // Situational picks based on match state
  if (ctx.target) {
    const remaining = ctx.target - ctx.runs;
    const ballsLeft = Math.max(1, (20 * 6) - (ctx.overs * 6 + ctx.balls));
    const rrr = (remaining / ballsLeft) * 6;

    if (remaining <= 20 && isMyTeamBatting) picks.push("Almost there! 🏁");
    if (remaining <= 20 && !isMyTeamBatting) picks.push("Getting nervous 😬");
    if (rrr > 12 && isMyTeamBatting) picks.push("Need boundaries! 💥");
    if (rrr > 12 && !isMyTeamBatting) picks.push("Game over soon 😎");
  }

  if (ctx.wickets >= 5) {
    if (isMyTeamBatting) picks.push("Believe! 💪");
    else picks.push("Collapse! 💀");
  }

  if (ctx.wickets <= 1 && ctx.overs >= 10) {
    if (isMyTeamBatting) picks.push("Set batsmen! 🔥");
    else picks.push("Too easy out there 😤");
  }

  return picks.slice(0, 6);
}

const ChatInput = ({ onSend, userTeam, matchContext }: ChatInputProps) => {
  const [text, setText] = useState("");

  const quickPicks = useMemo(
    () => getQuickPicks(userTeam, matchContext),
    [userTeam, matchContext.lastBallResult, matchContext.runs, matchContext.wickets, matchContext.overs]
  );

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <div className="ios-glass px-3 py-2" style={{ borderTop: "0.5px solid hsl(0 0% 0% / 0.1)" }}>
      {/* Dynamic quick picks */}
      <div className="flex gap-1.5 mb-2 overflow-x-auto no-scrollbar">
        {quickPicks.map((pick) => (
          <button
            key={pick}
            onClick={() => onSend(pick)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full bg-secondary text-foreground text-xs font-medium hover:bg-muted active:scale-95 transition-all duration-150"
          >
            {pick}
          </button>
        ))}
      </div>
      {/* Text input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Drop your take..."
          className="flex-1 px-4 py-2 rounded-full bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
        />
        <button
          onClick={handleSend}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-primary text-primary-foreground active:scale-90 transition-transform duration-150"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
