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
      ? ["Let's go DC! 💙", "Bring the heat 🗣️", "🔥", "DC supremacy!", "Bring it on!"]
      : ["MI owns this 💙", "Let's gooo! 🔥", "Paltan! 💪", "Time to bully 😤"];
  }

  switch (result) {
    case "six":
      if (isMyTeamBatting) {
        picks.push("SIX! Sit down! 🪑", "BOOM! Where's your bowler? 💀", "DC DC DC! 🚀", "That's GONE! 🏟️");
        // Armchair expert
        picks.push("Told you, play the lofted shot 🧠", "This is textbook T20 batting");
      } else {
        picks.push("Lucky! Your batsman can't do that again 🙄", "One six doesn't win matches 😏", "Bowler set him up, relax 🎣", "Ugh, curse that bowler 🤬");
      }
      break;
    case "four":
      if (isMyTeamBatting) {
        picks.push("SHOT! 🏏💥", "Too easy! 😎", "Your bowler's getting schooled!", "CLASS! 🔥");
        picks.push("Gap ball, should've packed the off side 🧠");
      } else {
        picks.push("Bad line, bad length 🤦", "Won't save them from losing", "Even I could've hit that 🥱", "Your bowler's cooked 😤");
      }
      break;
    case "wicket":
      if (isMyTeamBatting) {
        picks.push("Ugh come on! 😤", "Still got this 💪", "Next one's gonna smash it", "Whatever, we're still winning 😤");
        picks.push("Should've left that alone, bad shot selection");
      } else {
        picks.push("YESSS GET OUT! 👋💀", "BYE BYE! Walk of shame! 🚶", "Pack your bags! 😂", "Your team's FINISHED! 💀");
        picks.push("Bowler's been setting that up for 3 balls 🧠");
      }
      break;
    case "dot":
      if (isMyTeamBatting) {
        picks.push("Play some shots! 😤", "Stop parking the bus 🚌", "Rotate strike at least!", "This is painful 💀");
        picks.push("Need to target the shorter boundary 🧠");
      } else {
        picks.push("Can't even score? 😂", "Dot ball merchant! 💀", "Pressure mounting! Love it 😈", "Your batsman's scared 🫣");
      }
      break;
    case "wide":
    case "noball":
      if (isMyTeamBatting) {
        picks.push("Free runs LMAO 😂", "Thanks for the gift 🎁", "Can't even bowl straight 💀", "More of this please! 😂");
        picks.push("Smart to leave that, take the free runs");
      } else {
        picks.push("What is our bowler doing?! 🤬", "GET HIM OFF! 😤", "My grandma bowls better 👵", "This is embarrassing 🤦");
        picks.push("Need to adjust the line, bowling too wide");
      }
      break;
    default: // single, double, triple
      if (isMyTeamBatting) {
        picks.push("Smart cricket 🧠", "Ticking along nicely", "Good placement 👌", "Building the innings");
      } else {
        picks.push("Singles won't save you 😏", "Running like scared cats 🐱", "Is that all you got? 🥱", "Tick tick... BOOM soon 💣");
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
          placeholder="Say something..."
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
