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
  const battingTeam: TeamId = "DC";
  const isMyTeamBatting = userTeam === battingTeam;
  const result = ctx.lastBallResult;

  const picks: string[] = [];

  if (!result) {
    return isMyTeamBatting
      ? ["Let's go DC! 💙", "Come on boys! 🔥", "Feeling good about this 🙌", "DC all the way!", "Positive vibes only ✨"]
      : ["MI all the way! 💙", "Let's gooo! 🔥", "Paltan energy! 💪", "Good feelings! 🙌"];
  }

  switch (result) {
    case "six":
      if (isMyTeamBatting) {
        // Positive first
        picks.push("YESSS! What a hit! 🚀", "That's what we came for! 🔥", "INTO THE STANDS! 🏟️");
        // Armchair expert
        picks.push("Told you, play the lofted shot 🧠", "Textbook T20 batting right there");
        // Teasy
        picks.push("Sit down! Your bowler's done 🪑");
      } else {
        picks.push("Good hit, credit where it's due 👏", "One six won't decide the match 🧠", "Bowler set him up, watch next ball 🎣");
      }
      break;
    case "four":
      if (isMyTeamBatting) {
        picks.push("Beautiful shot! 🏏🔥", "CLASS! Love to see it 😍", "What timing! ⚡");
        picks.push("Found the gap perfectly, reading the field 🧠");
        picks.push("Your bowler's getting a lesson 😏");
      } else {
        picks.push("Nice shot, but one boundary won't save them 🧠", "Bad line, needs adjustment 🤔", "Credit to the batsman on that one 👌");
      }
      break;
    case "wicket":
      if (isMyTeamBatting) {
        picks.push("We'll bounce back! 💪", "Still got this, loads of batting left 🙌", "Next one will fire 🔥");
        picks.push("Bad shot selection, should've left that 🧠");
        picks.push("Just one wicket, relax everyone 😤");
      } else {
        picks.push("YESSS! Massive wicket! 🎯🔥", "What a delivery! Deserved that! 👏", "Bowler's been planning that for 3 balls 🧠");
        picks.push("Bye bye! 👋😂");
      }
      break;
    case "dot":
      if (isMyTeamBatting) {
        picks.push("Keep going, build pressure your way 💪", "It's okay, find the gaps next ball 🙌", "Patience pays 🧘");
        picks.push("Need to target the shorter boundary side 🧠");
        picks.push("Rotate the strike at least! 😤");
      } else {
        picks.push("Great bowling! Building pressure 🎯", "Love the discipline! 💪", "Tight line and length 🧠");
        picks.push("Can't score off that? Levels 😂");
      }
      break;
    case "wide":
    case "noball":
      if (isMyTeamBatting) {
        picks.push("Free runs, we'll take it! 🎁", "Every run counts! 👌", "Smart to leave that 🧠");
        picks.push("Thanks for the gift 😂");
      } else {
        picks.push("Come on bowler, tighten up! 💪", "Needs to adjust the line 🧠", "It's okay, next ball 🙌");
        picks.push("That's embarrassing though 🤦");
      }
      break;
    default: // single, double, triple
      if (isMyTeamBatting) {
        picks.push("Smart cricket! 🧠", "Good running! Ticking along nicely 🙌", "Nice placement 👌");
        picks.push("Building a solid foundation 🏗️");
      } else {
        picks.push("Singles won't win it, need more than that 🧠", "Good bowling, keep them quiet 🎯", "Pressure building! 💪");
        picks.push("Is that all they've got? 😏");
      }
  }

  // Situational banter
  if (ctx.target) {
    const remaining = ctx.target - ctx.runs;
    const ballsLeft = Math.max(1, (20 * 6) - (ctx.overs * 6 + ctx.balls));
    const rrr = (remaining / ballsLeft) * 6;

    if (remaining <= 20 && isMyTeamBatting) picks.push("Almost there, stay quiet haters! 🤫");
    if (remaining <= 20 && !isMyTeamBatting) picks.push("Getting nervous yet? 😬");
    if (rrr > 12 && isMyTeamBatting) picks.push("Need big overs! Come on! 💥");
    if (rrr > 12 && !isMyTeamBatting) picks.push("Game's done, go home 😎");
  }

  if (ctx.wickets >= 5) {
    if (isMyTeamBatting) picks.push("We've got DEPTH! 💪");
    else picks.push("COLLAPSE! Love to see it 💀😂");
  }

  if (ctx.wickets <= 1 && ctx.overs >= 10) {
    if (isMyTeamBatting) picks.push("Set platform, now EXPLODE 🧨");
    else picks.push("Too comfortable, bowl better! 😤");
  }

  return picks.slice(0, 6);
}

const ChatInput = ({ onSend, userTeam, matchContext }: ChatInputProps) => {
  const [text, setText] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);

  const quickPicks = useMemo(
    () => getQuickPicks(userTeam, matchContext),
    [userTeam, matchContext.lastBallResult, matchContext.runs, matchContext.wickets, matchContext.overs]
  );

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
    setShowTextInput(false);
  };

  return (
    <div className="ios-glass px-3 py-2" style={{ borderTop: "0.5px solid hsl(0 0% 0% / 0.1)" }}>
      {/* Dynamic quick picks */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar items-center">
        {quickPicks.map((pick) => (
          <button
            key={pick}
            onClick={() => onSend(pick)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full bg-secondary text-foreground text-xs font-medium hover:bg-muted active:scale-95 transition-all duration-150"
          >
            {pick}
          </button>
        ))}
        {/* Expand to type */}
        {!showTextInput && (
          <button
            onClick={() => setShowTextInput(true)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium active:scale-95 transition-all duration-150"
          >
            ✏️ Type
          </button>
        )}
      </div>
      {/* Text input - only when expanded */}
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
