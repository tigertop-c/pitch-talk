import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Send } from "lucide-react";

export type TeamId = "DC" | "MI";
export type UserChatStyle = "hype" | "expert" | "troll" | "neutral";

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
  userStyle?: UserChatStyle;
}

// Categorized picks by personality style
const STYLE_PICKS: Record<UserChatStyle, Record<string, string[]>> = {
  hype: {
    six: ["YESSS! MASSIVE! 🚀🔥", "INTO THE STANDS! 🏟️💥", "WHAT A HIT! 😤🔥"],
    four: ["SHOT! Beautiful! 🔥", "CLASS! 😍⚡", "BOUNDARY! Let's GO! 💥"],
    wicket_my: ["We'll bounce back! 💪🔥", "Still got this! 🙌", "Next one FIRES UP! 🔥"],
    wicket_opp: ["YESSS! BIG WICKET! 🎯🔥", "SEE YA! 👋💀", "Let's GOOO! 🤩"],
    dot: ["Come ON boys! 💪", "Find the gaps! ⚡", "Next ball's the one! 🔥"],
    default: ["Let's GO! 🔥💪", "ENERGY! ⚡🏏", "Come on squad! 🙌"],
  },
  expert: {
    six: ["Set up shot, great execution 🧠", "Targeted the short side, smart 📐", "Knew the bowler would go full 🎯"],
    four: ["Gap identified, clinical finish 🧠", "Weight of shot was perfect 📊", "Read the field, found the gap 🎯"],
    wicket_my: ["Bad shot selection, should've rotated 🧠", "Needed to respect that spell 📋", "Wrong approach for this phase 🤔"],
    wicket_opp: ["Bowler set that up over 3 balls 🧠", "Change of pace did the trick 📊", "Field placement was key there 🎯"],
    dot: ["Building pressure, need to rotate 🧠", "Target the shorter boundary next 📐", "Time for a change of approach 🤔"],
    default: ["Interesting tactical phase 🧠", "Match situation demands patience 📊", "Key over coming up 🎯"],
  },
  troll: {
    six: ["Sit down! Your bowler's DONE 🪑😂", "Ball's left the stadium AND the city 💀", "Bowler questioning life choices 😭"],
    four: ["Your bowler's getting a LESSON 📚😏", "Fielding? Never heard of her 😂", "That ball had a FAMILY 💀"],
    wicket_my: ["Just one wicket, RELAX 🙄", "Still gonna win, stay salty 😏", "Your bowler got lucky, that's all 🤷"],
    wicket_opp: ["Bye bye! Walk of shame time 🚶💀", "Pack your bags fam 👋😂", "Screenshot this, I called it 📸"],
    dot: ["Is that all they've got? 😏", "My nan bats better 👵💀", "Wake me up when something happens 😴"],
    default: ["Rent free 😎💀", "Your team's a meme 😂", "Bold talk, weak team 🤷"],
  },
  neutral: {
    six: ["Great hit! 🏏", "What a shot! 👏", "That's massive! 🙌"],
    four: ["Nice shot! 👏", "Well played! 🏏", "Good timing! 👌"],
    wicket_my: ["We'll come back 💪", "Still in the game 🙌", "Long way to go 🏏"],
    wicket_opp: ["Good wicket! 🎯", "Well bowled! 👏", "Big moment! ⚡"],
    dot: ["Tight bowling 🎯", "Good ball 👏", "Pressure building 🏏"],
    default: ["Good cricket! 🏏", "Interesting! 🤔", "Let's see! 👀"],
  },
};

// Banter messages for general use (not result-specific)
const BANTER_PICKS = [
  "This is our game! 💪",
  "Trust the process 🙏",
  "Here we go! 🚀",
  "Big moment incoming! ⚡",
  "Squad energy! 🔥",
];

// Encouraging picks
const ENCOURAGING_PICKS = [
  "Great call last time! 🎯",
  "Your predictions are fire 🔥",
  "Keep it up! 💪",
  "You're on a roll! 🎲",
  "Sharp reads! 🧠",
];

function getQuickPicks(
  userTeam: TeamId,
  ctx: MatchContext,
  style: UserChatStyle,
  lastChosen: string | null
): string[] {
  const battingTeam: TeamId = "DC";
  const isMyTeamBatting = userTeam === battingTeam;
  const result = ctx.lastBallResult;

  const stylePicks = STYLE_PICKS[style];
  const picks: string[] = [];

  // Determine which category the user last chose from
  let lastWasHype = false;
  let lastWasExpert = false;
  let lastWasTroll = false;
  
  if (lastChosen) {
    for (const [s, cats] of Object.entries(STYLE_PICKS)) {
      for (const msgs of Object.values(cats)) {
        if (msgs.includes(lastChosen)) {
          if (s === "hype") lastWasHype = true;
          else if (s === "expert") lastWasExpert = true;
          else if (s === "troll") lastWasTroll = true;
        }
      }
    }
  }

  if (!result) {
    picks.push(...(stylePicks.default || []));
    if (style !== "hype") picks.push("Let's GO! 🔥");
    if (style !== "expert") picks.push("Key match-up coming 🧠");
  } else {
    // Build from primary style first
    const resultKey = result === "wicket" ? (isMyTeamBatting ? "wicket_my" : "wicket_opp") : result;
    
    switch (result) {
      case "six":
        picks.push(...(isMyTeamBatting ? stylePicks.six : (style === "troll" ? stylePicks.six : STYLE_PICKS.neutral.six)));
        break;
      case "four":
        picks.push(...(isMyTeamBatting ? stylePicks.four : (style === "troll" ? stylePicks.four : STYLE_PICKS.neutral.four)));
        break;
      case "wicket":
        picks.push(...(isMyTeamBatting ? stylePicks.wicket_my : stylePicks.wicket_opp));
        break;
      case "dot":
        picks.push(...stylePicks.dot);
        break;
      default:
        picks.push(...stylePicks.default);
    }

    // Add situational picks
    if (ctx.target) {
      const remaining = ctx.target - ctx.runs;
      const ballsLeft = Math.max(1, (20 * 6) - (ctx.overs * 6 + ctx.balls));
      const rrr = (remaining / ballsLeft) * 6;
      if (remaining <= 20 && isMyTeamBatting) picks.push("Almost there! 🤫🏆");
      if (rrr > 12 && isMyTeamBatting) picks.push("Need big overs NOW! 💥");
      if (rrr > 12 && !isMyTeamBatting) picks.push("Rate's climbing! 📈😏");
    }

    // Add from different styles for variety based on what user last chose
    const styles: UserChatStyle[] = ["hype", "expert", "troll"];
    // Prioritize styles user hasn't used recently
    const prioritizedStyles = styles.sort((a, b) => {
      const aUsed = (a === "hype" && lastWasHype) || (a === "expert" && lastWasExpert) || (a === "troll" && lastWasTroll);
      const bUsed = (b === "hype" && lastWasHype) || (b === "expert" && lastWasExpert) || (b === "troll" && lastWasTroll);
      return aUsed ? 1 : bUsed ? -1 : 0;
    });
    
    const otherStyles = prioritizedStyles.filter(s => s !== style);
    
    // Add 1 pick from each of 2 other styles
    otherStyles.slice(0, 2).forEach(otherStyle => {
      const otherPicks = STYLE_PICKS[otherStyle];
      if (otherPicks[resultKey]) {
        // Pick a random message from the other style
        const randIdx = Math.floor(Math.random() * otherPicks[resultKey].length);
        picks.push(otherPicks[resultKey][randIdx]);
      }
    });

    // Add encouraging/banter variety
    if (picks.length < 5 && Math.random() > 0.6) {
      const banterPick = BANTER_PICKS[Math.floor(Math.random() * BANTER_PICKS.length)];
      picks.push(banterPick);
    }
    if (picks.length < 5 && Math.random() > 0.7) {
      const encouragePick = ENCOURAGING_PICKS[Math.floor(Math.random() * ENCOURAGING_PICKS.length)];
      picks.push(encouragePick);
    }
  }

  // Filter out the last chosen to avoid immediate repetition
  const filtered = picks.filter(p => p !== lastChosen);
  
  // Deduplicate and cap at exactly 5
  const unique = [...new Set(filtered)];
  
  // If we have fewer than 5, add more from other styles or banter
  while (unique.length < 5) {
    const filler = [...BANTER_PICKS, ...ENCOURAGING_PICKS].filter(p => !unique.includes(p) && p !== lastChosen);
    if (filler.length === 0) break;
    unique.push(filler[Math.floor(Math.random() * filler.length)]);
  }
  
  return unique.slice(0, 5);
}

function getQuickEmojis(userTeam: TeamId, ctx: MatchContext): string[] {
  const battingTeam: TeamId = "DC";
  const isMyTeamBatting = userTeam === battingTeam;
  const result = ctx.lastBallResult;

  if (!result) return ["🔥", "💪", "🏏"];

  if (isMyTeamBatting) {
    switch (result) {
      case "six": return ["🙌", "🔥", "🤩"];
      case "four": return ["🤚", "👏", "⚡"];
      case "wicket": return ["😭", "🤦‍♂️", "💔"];
      case "dot": return ["🥺", "🙏", "💪"];
      default: return ["🏏", "🏃", "⚡"];
    }
  } else {
    switch (result) {
      case "six": return ["😭", "🤦‍♂️", "😡"];
      case "four": return ["😠", "🙄", "🤐"];
      case "wicket": return ["☝️", "🎯", "🔥"];
      case "dot": return ["👏", "🔥", "🎯"];
      default: return ["🏏", "👀", "🎯"];
    }
  }
}

const ChatInput = ({ onSend, userTeam, matchContext, userStyle = "neutral" }: ChatInputProps) => {
  const [text, setText] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [lastChosen, setLastChosen] = useState<string | null>(null);
  const seedRef = useRef(Math.random()); // Stable seed for consistent picks within same render

  // Reset seed when match context changes to get new random picks
  useEffect(() => {
    seedRef.current = Math.random();
  }, [matchContext.lastBallResult, matchContext.overs, matchContext.balls]);

  const quickPicks = useMemo(
    () => getQuickPicks(userTeam, matchContext, userStyle, lastChosen),
    [userTeam, matchContext.lastBallResult, matchContext.runs, matchContext.wickets, matchContext.overs, matchContext.balls, userStyle, lastChosen]
  );

  const handleQuickPick = useCallback((pick: string) => {
    setLastChosen(pick);
    onSend(pick);
  }, [onSend]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
    setShowTextInput(false);
  }, [text, onSend]);

  return (
    <div className="ios-glass px-3 py-2" style={{ borderTop: "0.5px solid hsl(0 0% 0% / 0.1)" }}>
      {/* Dynamic quick picks - wrapping layout for visibility */}
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
        {/* Expand to type */}
        {!showTextInput && (
          <button
            onClick={() => setShowTextInput(true)}
            className="px-3.5 py-2 rounded-full bg-primary/10 text-primary text-[12px] font-semibold active:scale-95 transition-all duration-150"
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
