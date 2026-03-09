import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Reply } from "lucide-react";
import PredictionCard, { type PredictionState, type BallResult, type FriendPick } from "./PredictionCard";
import OverSummary, { type OverSummaryData } from "./OverSummary";
import { type PredictionRecord } from "./ShareableReceipt";
import ChatInput, { type TeamId, type UserChatStyle } from "./ChatInput";
import { type MatchState, type BallEvent, formatBall } from "@/hooks/useMatchState";
import { playBallActiveSound, isSoundMuted } from "@/lib/sounds";

interface BallBlock {
  id: number;
  ballLabel: string;
  predictionState: PredictionState;
  countdown: number;
  selected: string | null;
  result: BallResult | null;
  friendPicks: FriendPick[];
}

interface ChatItem {
  id: number;
  parentBallId: number;
  user: string;
  avatar: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
  replyTo?: { user: string; text: string };
  team?: TeamId;
  isCommentaryGuess?: boolean;
  commentaryGuessData?: {
    correctStyle: string;
    options: string[];
    answered: boolean;
    wasCorrect: boolean | null;
    selectedOption: string | null;
  };
}

export interface FriendDef {
  name: string;
  avatar: string;
  team?: TeamId;
}

const PICK_LABELS = ["Dot", "Single", "Boundary", "Six", "Wicket", "Wide", "No Ball"];

// Friendly squad reactions (not toxic banter)
const SQUAD_REACTIONS: Record<string, string[]> = {
  dot: ["Dot ball! Keep it tight 🎯", "Pressure building! 🔒", "Nothing doing there 🏏", "Good bowling, tough to score 💪"],
  single: ["Tick it over! Smart running 🏃", "Rotating the strike 🔄", "Every run matters here 👌"],
  double: ["Quick two! Hustling 🏃‍♂️💨", "Great running between wickets!", "Pushed for two, good call 🙌"],
  triple: ["THREE! What running! 🏃‍♂️💨💨", "Great hustle, that's quality cricket!"],
  four: ["SHOT! To the boundary! 💥", "Class act right there 🔥", "Beautiful timing! ⚡", "What placement! 👏"],
  six: ["SIX! HUGE! Into the crowd! 🚀", "That's OUT OF HERE! 🏟️", "MASSIVE hit! What power! 💪🔥"],
  wicket: ["GONE! Big wicket! 🎯", "What a delivery! That changes things 🔴", "Huge moment in the match! ⚡", "That's the breakthrough! 👏"],
  wide: ["Wide ball! Free runs 🎁", "Loose delivery, need to tighten up 🎯", "Extras leaking here 😬"],
  noball: ["NO BALL! Free hit coming up! 🎯", "Overstepped! Gifted delivery 🎁", "FREE HIT! This is exciting! ⚡"],
};

// Smart reply suggestions based on what the original message says
const REPLY_SUGGESTIONS: Record<string, string[]> = {
  positive: ["Haha jinx it 😂", "Keep that energy!", "Agreed! 🔥", "Let's see 😏"],
  negative: ["Relax, long game 🏏", "It's one ball!", "Still early 🙌", "Wait and watch 😎"],
  neutral: ["Facts 💯", "Good point 🤝", "Hmm maybe 🤔", "True that 👌"],
  cheeky: ["Bold prediction 😂", "Saving this for later 📸", "We'll see about that 😏", "Talk is cheap! 🏏"],
};

function getSmartReplies(originalText: string, myTeam: TeamId, theirTeam?: TeamId): string[] {
  const text = originalText.toLowerCase();
  const isRivalTeam = theirTeam && theirTeam !== myTeam;
  
  if (text.includes("six") || text.includes("shot") || text.includes("boundary") || text.includes("🚀") || text.includes("💥")) {
    return isRivalTeam 
      ? ["One ball at a time 😏", "Respect the shot 👏", "Wait for next over 🏏"]
      : ["YESSS! More please! 🔥", "That's what we came for!", "Take a bow! 🙌"];
  }
  if (text.includes("wicket") || text.includes("out") || text.includes("gone") || text.includes("💀") || text.includes("👋")) {
    return isRivalTeam
      ? ["Big moment! 🎯", "Game changer ⚡", "More of that please 🙏"]
      : ["We'll come back stronger 💪", "Still believe!", "Long game 🏏"];
  }
  
  return isRivalTeam 
    ? REPLY_SUGGESTIONS.cheeky.slice(0, 3)
    : REPLY_SUGGESTIONS.neutral.slice(0, 3);
}

// Context-aware waiting messages based on last ball result
const WAITING_MESSAGES: Record<string, { emoji: string; messages: string[] }> = {
  six: { emoji: "🏟️", messages: ["Searching for the ball in Row Z...", "Fan keeping the souvenir 🎁", "That ball's in the parking lot!", "Ball boy climbing the stands..."] },
  four: { emoji: "🏃", messages: ["Fielder chasing it to the rope...", "Ball racing to the boundary 💨", "Sweeper cover retrieving the ball...", "Outfield collecting that one..."] },
  wicket: { emoji: "🚶", messages: ["New batsman taking guard...", "Long walk back to the pavilion 😔", "Dressing room door opening...", "Batsman reviewing life choices..."] },
  dot: { emoji: "🏏", messages: ["Bowler walking back...", "Keeper tossing the ball around...", "Field adjustments happening...", "Captain having a word with the bowler..."] },
  single: { emoji: "🔄", messages: ["Strike rotated, fielders resetting...", "Bowler back to the mark...", "Quick chat between the batsmen...", "Umpire signaling one run..."] },
  double: { emoji: "🏃‍♂️", messages: ["Good running between the wickets!", "Batsmen catching their breath...", "Fielder's throw just missed!", "Quick two, fielders reshuffling..."] },
  wide: { emoji: "😤", messages: ["Captain's not happy with that!", "Bowler wiping the ball on his trousers...", "Keeper fetching the wide one...", "Extra run gifted, pressure on..."] },
  noball: { emoji: "⚠️", messages: ["Free hit coming up! 🎯", "Batsman licking his lips...", "Bowler checking his run-up...", "Stadium buzzing for the free hit!"] },
  overBreak: { emoji: "🔄", messages: ["Field changing ends...", "New bowler getting the ball...", "Drinks being carried out 🥤", "Strategic timeout chat happening...", "Captain setting the field..."] },
};

// Commentary lines tagged with style for the guessing game
type CommentaryStyle = "british" | "aussie" | "windies" | "indian";
interface CommentaryLine { text: string; style: CommentaryStyle; }

const COMMENTARY_LINES: Record<string, CommentaryLine[]> = {
  six: [
    { text: "🎙️ THAT'S GONE INTO THE PEOPLE! MASSIVE! Absolutely ENORMOUS! 🚀", style: "indian" },
    { text: "🎙️ Like a tracer bullet into the stands! The crowd is BERSERK!", style: "indian" },
    { text: "🎙️ A six is like a smile — it lights up the whole ground! ☀️", style: "indian" },
    { text: "🎙️ That ball didn't just cross the rope, it left the ZIP CODE! 📮", style: "indian" },
    { text: "🎙️ Oh my word. That is simply… extraordinary. Into row Z, I believe. 🫖", style: "british" },
    { text: "🎙️ Well, that's been dispatched with utter contempt. Quite magnificent.", style: "british" },
    { text: "🎙️ He's picked that up off middle stump and deposited it into the car park. Dear oh dear.", style: "british" },
    { text: "🎙️ That, ladies and gentlemen, is what we call agricultural… but rather effective. 🌾", style: "british" },
    { text: "🎙️ BANG! That's been absolutely TONKED! See ya later! 🏏💥", style: "aussie" },
    { text: "🎙️ That's out of the ground, mate! Grab yer passports, that ball's TRAVELLING!", style: "aussie" },
    { text: "🎙️ Flat bat, full face, gone like a rocket. You BEAUTY! 🇦🇺", style: "aussie" },
    { text: "🎙️ That's not cricket, that's DEMOLITION! The bowler needs a cuddle after that one.", style: "aussie" },
    { text: "🎙️ OH YESSS! Into the PEOPLE dem! That's CALYPSO cricket, baby! 🎶", style: "windies" },
    { text: "🎙️ Big man hit BIG shot! The ball gone clear outta di stadium! 🌴", style: "windies" },
    { text: "🎙️ That's ENTERTAINMENT! The crowd on their feet, music in the air! 🥁", style: "windies" },
  ],
  four: [
    { text: "🎙️ SHOT! That's gone like a tracer bullet to the boundary! 🔥", style: "indian" },
    { text: "🎙️ Timing so sweet, even the bowler had to admire that one!", style: "indian" },
    { text: "🎙️ A good shot is like poetry — and that was Shakespeare! 📖", style: "indian" },
    { text: "🎙️ The ball kissed the bat and said GOODBYE! Glorious stroke! ✨", style: "indian" },
    { text: "🎙️ Exquisitely done. Threaded through the covers like silk. Lovely. 🧵", style: "british" },
    { text: "🎙️ That is a PROPER cricket shot. Textbook. Coaching manual stuff.", style: "british" },
    { text: "🎙️ Oh, how pleasing to the eye. The fielder didn't even bother chasing.", style: "british" },
    { text: "🎙️ Played with soft hands and gorgeous wrists. Just delightful. ☕", style: "british" },
    { text: "🎙️ CRACKED to the fence! No messing about, that's four all day! 💪", style: "aussie" },
    { text: "🎙️ Mate, the fielder just watched that go by like a bus! 🚌", style: "aussie" },
    { text: "🎙️ Punched off the back foot with AUTHORITY. That's class, right there.", style: "aussie" },
    { text: "🎙️ LASH through the covers! Style, elegance, POWER! 🔥", style: "windies" },
    { text: "🎙️ That's a FLICK of the wrists and four runs! Make it look easy, nah! 💫", style: "windies" },
  ],
  wicket: [
    { text: "🎙️ HE'S GONE! And the bowler is PUMPED! That's the moment of the match!", style: "indian" },
    { text: "🎙️ Wickets fall like autumn leaves when the pressure mounts! 🍂", style: "indian" },
    { text: "🎙️ CLEANED HIM UP! The stumps are doing cartwheels! 🎯", style: "indian" },
    { text: "🎙️ That's the end of the road. Long walk back. Cricket is CRUEL! 😈", style: "indian" },
    { text: "🎙️ Oh, he's gone. And he knows it. That was a terrible shot, really. 😬", style: "british" },
    { text: "🎙️ Bowled 'im! What a JAFFA! Absolute peach of a delivery. 🍑", style: "british" },
    { text: "🎙️ Well, that's rather ruined his afternoon, hasn't it? Off you pop.", style: "british" },
    { text: "🎙️ Stone dead. Even the batsman started walking. Nothing to see here.", style: "british" },
    { text: "🎙️ SEE YA LATER, MATE! That's absolutely PLUMB! Walk of shame! 🚶", style: "aussie" },
    { text: "🎙️ Got 'im! The bowler's giving him a SEND-OFF! Love the aggression! 🔥", style: "aussie" },
    { text: "🎙️ RIPPED through the gate! That's knocked back middle stump, you RIPPER!", style: "aussie" },
    { text: "🎙️ HE GONE! Pack yuh bags! The bowler ROARING! 🦁", style: "windies" },
    { text: "🎙️ Timber! Stumps flying everywhere like Carnival decorations! 🎊", style: "windies" },
  ],
  dot: [
    { text: "🎙️ DOT BALL! Pressure building like a pressure cooker without a whistle! 😤", style: "indian" },
    { text: "🎙️ Nothing doing! The bowler is on TOP here!", style: "indian" },
    { text: "🎙️ Defended solidly. Nothing on offer there. Good, disciplined bowling.", style: "british" },
    { text: "🎙️ Dot ball. The squeeze is ON. Scoreboard pressure is a real thing, you know.", style: "british" },
    { text: "🎙️ NOTHING! Can't lay bat on ball! The pressure is ON, mate! 🔒", style: "aussie" },
    { text: "🎙️ Nuttin' doin'! The bowler got him TIED UP in knots! 🪢", style: "windies" },
  ],
  noball: [
    { text: "🎙️ NO BALL! And it's a FREE HIT! The crowd smells BLOOD! 🩸", style: "indian" },
    { text: "🎙️ Overstepped! That's a gift wrapped with a bow! 🎁", style: "indian" },
    { text: "🎙️ Oh no no no, he's overstepped! FREE HIT coming up and the batsman is LICKING his lips! 😋", style: "indian" },
    { text: "🎙️ That's sloppy, very sloppy. And now it's a free hit. The batsman will fancy this.", style: "british" },
    { text: "🎙️ NO BALL, mate! That's a freebie! Bowler's done his hammy AND overstepped! 🤦", style: "aussie" },
  ],
};

const STYLE_LABELS: Record<CommentaryStyle, string> = {
  british: "British 🫖",
  aussie: "Aussie 🦘",
  windies: "Caribbean 🌴",
  indian: "Indian 🇮🇳",
};

const ALL_STYLES: CommentaryStyle[] = ["british", "aussie", "windies", "indian"];

function getCommentaryOptions(correct: CommentaryStyle): string[] {
  const others = ALL_STYLES.filter(s => s !== correct).sort(() => Math.random() - 0.5).slice(0, 2);
  const options = [STYLE_LABELS[correct], ...others.map(s => STYLE_LABELS[s])];
  return options.sort(() => Math.random() - 0.5);
}

const LOCK_TIME = 15; // 15s prediction window — real T20 pace ~40s/ball
const spring = { type: "spring" as const, damping: 25, stiffness: 350 };

interface BanterStreamProps {
  match: MatchState;
  onNextBall: () => BallEvent;
  onHype?: (type: "four" | "six" | "wicket") => void;
  onPredictionResolved?: (record: PredictionRecord) => void;
  onFriendScoresUpdate?: (scores: Record<string, { wins: number; total: number; streak: number }>) => void;
  soundMuted: boolean;
  activeFriends: FriendDef[];
  onOverComplete?: (overNum: number, participation: Record<string, boolean>) => void;
  allPlayerStandings: OverSummaryData["standings"];
  userTeam: TeamId;
  activePlayers: number;
  maxPlayers: number;
  roomId: string;
  onInvite?: () => void;
  onToggleSound?: () => void;
  onFirstOverComplete?: () => void;
  onBallStateChange?: (ball: { id: number; label: string; state: "idle" | "pending" | "resolved"; openedAt: number; result: { label: string; type: string } | null }, matchState: { runs: number; wickets: number; overs: number; balls: number; currentBowler: string; target: number | null }) => void;
}

const BanterStream = ({
  match, onNextBall, onHype, onPredictionResolved, onFriendScoresUpdate,
  soundMuted, activeFriends, onOverComplete, allPlayerStandings, userTeam,
  activePlayers, maxPlayers, roomId, onInvite, onToggleSound, onFirstOverComplete,
  onBallStateChange,
}: BanterStreamProps) => {
  const [balls, setBalls] = useState<BallBlock[]>([]);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [shakeScreen, setShakeScreen] = useState(false);
  const [waitingForNext, setWaitingForNext] = useState(false);
  const [waitingMessage, setWaitingMessage] = useState<{ emoji: string; text: string }>({ emoji: "🏏", text: "Bowler walking back..." });
  const [overSummaries, setOverSummaries] = useState<{ afterBallId: number; data: OverSummaryData }[]>([]);
  const [lastBallResult, setLastBallResult] = useState<string | null>(null);
  const isOverBreak = useRef(false);
  const [userScores, setUserScores] = useState<Record<string, { wins: number; total: number; streak: number }>>(
    () => Object.fromEntries(activeFriends.map(u => [u.name, { wins: 0, total: 0, streak: 0 }]))
  );
  const [replyingTo, setReplyingTo] = useState<ChatItem | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [commentaryScore, setCommentaryScore] = useState({ correct: 0, total: 0 });
  const [userChatStyle, setUserChatStyle] = useState<UserChatStyle>("neutral");
  const [totalUserPredictions, setTotalUserPredictions] = useState(0);

  // Track user message style
  const styleCountsRef = useRef<Record<UserChatStyle, number>>({ hype: 0, expert: 0, troll: 0, neutral: 0 });

  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const ballCountRef = useRef(0);
  const countdownRef = useRef<ReturnType<typeof setInterval>>();
  const activeBallIdRef = useRef<number | null>(null);
  const userIsScrolledUp = useRef(false);
  const firstOverFired = useRef(false);

  // Over tracking
  const legalBallsThisOver = useRef(0);
  const currentOverNum = useRef(0);
  const overFriendResults = useRef<Record<string, { correct: number; total: number }>>({});
  const overParticipation = useRef<Record<string, boolean>>({});
  const overRunsRef = useRef(0);
  const overWicketsRef = useRef(0);
  const overBoundariesRef = useRef(0);
  const overExtrasRef = useRef(0);

  const detectStyle = useCallback((text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes("🧠") || lower.includes("tactical") || lower.includes("should") || lower.includes("need to") || lower.includes("approach") || lower.includes("rotate")) {
      styleCountsRef.current.expert += 1;
    } else if (lower.includes("💀") || lower.includes("😂") || lower.includes("done") || lower.includes("shame") || lower.includes("meme") || lower.includes("sit down") || lower.includes("bye")) {
      styleCountsRef.current.troll += 1;
    } else if (lower.includes("🔥") || lower.includes("let's go") || lower.includes("yesss") || lower.includes("come on") || lower.includes("💪") || lower.includes("⚡")) {
      styleCountsRef.current.hype += 1;
    } else {
      styleCountsRef.current.neutral += 1;
    }

    // Set dominant style
    const counts = styleCountsRef.current;
    const max = Math.max(counts.hype, counts.expert, counts.troll, counts.neutral);
    if (max >= 2) {
      if (counts.hype === max) setUserChatStyle("hype");
      else if (counts.expert === max) setUserChatStyle("expert");
      else if (counts.troll === max) setUserChatStyle("troll");
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    if (userIsScrolledUp.current) {
      setShowScrollButton(true);
      return;
    }
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 100);
  }, []);

  const handleScrollToBottom = useCallback(() => {
    userIsScrolledUp.current = false;
    setShowScrollButton(false);
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distFromBottom > 100) {
      userIsScrolledUp.current = true;
    } else {
      userIsScrolledUp.current = false;
      setShowScrollButton(false);
    }
  }, []);

  useEffect(() => {
    setUserScores(prev => {
      const next = { ...prev };
      activeFriends.forEach(f => {
        if (!next[f.name]) next[f.name] = { wins: 0, total: 0, streak: 0 };
      });
      return next;
    });
  }, [activeFriends]);

  const addFriendPicks = useCallback((ballId: number) => {
    const friends = [...activeFriends].sort(() => Math.random() - 0.5).slice(0, Math.min(activeFriends.length, 3 + Math.floor(Math.random() * 2)));
    const delays = [1500, 3000, 5000, 7000, 8500];

    friends.forEach((user, i) => {
      setTimeout(() => {
        const pick = PICK_LABELS[Math.floor(Math.random() * PICK_LABELS.length)];
        setBalls(prev => prev.map(b =>
          b.id === ballId
            ? { ...b, friendPicks: [...b.friendPicks, { name: user.name, avatar: user.avatar, pick }] }
            : b
        ));
        overParticipation.current[user.name] = true;
        scrollToBottom();
      }, delays[i] || 2000);
    });
  }, [activeFriends, scrollToBottom]);

  const checkPickWon = (pick: string, result: string) =>
    (pick === "Dot" && result === "dot") ||
    (pick === "Boundary" && result === "four") ||
    (pick === "Six" && result === "six") ||
    (pick === "Single" && result === "single") ||
    (pick === "Two" && result === "double") ||
    (pick === "Three" && result === "triple") ||
    (pick === "Wicket" && result === "wicket") ||
    (pick === "Wide" && result === "wide") ||
    (pick === "No Ball" && result === "noball");

  const handleCommentaryGuess = useCallback((chatId: number, selectedOption: string) => {
    setChats(prev => prev.map(c => {
      if (c.id === chatId && c.commentaryGuessData && !c.commentaryGuessData.answered) {
        const isCorrect = selectedOption === STYLE_LABELS[c.commentaryGuessData.correctStyle as CommentaryStyle];
        setCommentaryScore(s => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
        return {
          ...c,
          commentaryGuessData: {
            ...c.commentaryGuessData,
            answered: true,
            wasCorrect: isCorrect,
            selectedOption,
          },
        };
      }
      return c;
    }));
  }, []);

  const resolveBall = useCallback((ballId: number) => {
    const event = onNextBall();
    ballCountRef.current += 1;
    const isLegal = event.result !== "wide" && event.result !== "noball";

    setLastBallResult(event.result);

    // Track over stats
    overRunsRef.current += event.runs;
    if (event.result === "wicket") overWicketsRef.current += 1;
    if (event.result === "four" || event.result === "six") overBoundariesRef.current += 1;
    if (event.result === "wide" || event.result === "noball") overExtrasRef.current += 1;

    if (!isSoundMuted()) {
      try {
        const audio = new Audio("/sounds/cricket_bat.mp3");
        audio.volume = 0.5;
        audio.play();
      } catch (e) {}
    }

    const result: BallResult = { label: event.label, type: event.result };

    // Sync resolved ball state to multiplayer
    onBallStateChange?.(
      { id: ballId, label: balls.find(b => b.id === ballId)?.ballLabel || "", state: "resolved", openedAt: 0, result: { label: event.label, type: event.result } },
      { runs: match.runs, wickets: match.wickets, overs: match.overs, balls: match.balls, currentBowler: match.currentBowler || "Bumrah", target: match.target }
    );

    if (event.result === "wicket" || event.result === "six" || event.result === "four") {
      setShakeScreen(true);
      setTimeout(() => setShakeScreen(false), 600);
      onHype?.(event.result as "four" | "six" | "wicket");

      if (!isSoundMuted()) {
        try {
          const horn = new Audio("/sounds/ipl_horn.mp3");
          horn.volume = 0.6;
          horn.play();
          setTimeout(() => {
            let step = 0;
            const interval = setInterval(() => {
              step++;
              horn.volume = Math.max(0, 0.6 * (1 - step / 20));
              if (step >= 20) { clearInterval(interval); horn.pause(); horn.currentTime = 0; }
            }, 50);
          }, 2000);
        } catch (e) {}
      }
    }

    let userWon: boolean | null = null;
    setBalls(prev => {
      const ball = prev.find(b => b.id === ballId);
      if (ball?.selected) {
        userWon = checkPickWon(ball.selected, event.result);
        setTotalUserPredictions(p => p + 1);
      }
      return prev;
    });

    setBalls(prev => prev.map(b => {
      if (b.id === ballId) {
        const updatedPicks = b.friendPicks.map(fp => ({
          ...fp,
          won: checkPickWon(fp.pick, event.result),
        }));
        return { ...b, predictionState: "resolved" as PredictionState, result, friendPicks: updatedPicks };
      }
      return b;
    }));

    setBalls(prev => {
      const ball = prev.find(b => b.id === ballId);
      if (ball) {
        const scoreUpdates: Record<string, { won: boolean }> = {};
        ball.friendPicks.forEach(fp => {
          const won = checkPickWon(fp.pick, event.result);
          scoreUpdates[fp.name] = { won };
          if (!overFriendResults.current[fp.name]) {
            overFriendResults.current[fp.name] = { correct: 0, total: 0 };
          }
          overFriendResults.current[fp.name].total += 1;
          if (won) overFriendResults.current[fp.name].correct += 1;
        });
        setUserScores(prev => {
          const next = { ...prev };
          Object.entries(scoreUpdates).forEach(([name, { won }]) => {
            if (next[name]) {
              next[name] = {
                wins: next[name].wins + (won ? 1 : 0),
                total: next[name].total + 1,
                streak: won ? next[name].streak + 1 : 0,
              };
            }
          });
          onFriendScoresUpdate?.(next);
          return next;
        });
      }
      return prev;
    });

    setBalls(prev => {
      const ball = prev.find(b => b.id === ballId);
      onPredictionResolved?.({
        ballLabel: ball?.ballLabel || "",
        predicted: ball?.selected || null,
        result: event.label,
        resultType: event.result,
        won: ball?.selected ? userWon : null,
      });
      return prev;
    });

    if (isLegal) {
      legalBallsThisOver.current += 1;
      if (legalBallsThisOver.current >= 6) {
        currentOverNum.current += 1;
        const overNum = currentOverNum.current;

        if (!firstOverFired.current) {
          firstOverFired.current = true;
          onFirstOverComplete?.();
        }

        const friendResults = { ...overFriendResults.current };
        let mvp: OverSummaryData["overMvp"] = null;
        let maxCorrect = 0;
        Object.entries(friendResults).forEach(([name, r]) => {
          if (r.correct > maxCorrect) {
            maxCorrect = r.correct;
            const friend = activeFriends.find(f => f.name === name);
            mvp = { name, avatar: friend?.avatar || "🏏", correct: r.correct, total: r.total };
          }
        });

        const oversStr = `${match.overs}.${match.balls}`;

        const team1Short = "DC";
        const team2Short = "MI";
        const team1Count = activeFriends.filter(f => f.team === team1Short).length + (userTeam === team1Short ? 1 : 0);
        const team2Count = activeFriends.filter(f => f.team === team2Short).length + (userTeam === team2Short ? 1 : 0);

        const summaryData: OverSummaryData = {
          overNumber: overNum,
          overMvp: mvp,
          standings: allPlayerStandings.map(s => ({
            ...s,
            team: s.name === "You" ? userTeam : activeFriends.find(f => f.name === s.name)?.team,
          })),
          activePlayers,
          maxPlayers,
          roomId,
          matchRuns: match.runs,
          matchWickets: match.wickets,
          matchOvers: oversStr,
          matchTarget: match.target,
          overRuns: overRunsRef.current,
          overWickets: overWicketsRef.current,
          overBoundaries: overBoundariesRef.current,
          overExtras: overExtrasRef.current,
          teamAllegiances: (team1Count + team2Count) >= 3 ? { team1: team1Short, team1Count, team2: team2Short, team2Count } : undefined,
        };

        setOverSummaries(prev => [...prev, { afterBallId: ballId, data: summaryData }]);
        onOverComplete?.(overNum, { ...overParticipation.current });
        isOverBreak.current = true;

        legalBallsThisOver.current = 0;
        overFriendResults.current = {};
        overParticipation.current = {};
        overRunsRef.current = 0;
        overWicketsRef.current = 0;
        overBoundariesRef.current = 0;
        overExtrasRef.current = 0;
      }
    }

    // Generate squad reactions
    const reactionPool = SQUAD_REACTIONS[event.result] || SQUAD_REACTIONS.dot;
    const numMessages = 1 + Math.floor(Math.random() * 2);
    const shuffled = [...reactionPool].sort(() => Math.random() - 0.5);

    for (let i = 0; i < numMessages; i++) {
      const user = activeFriends[Math.floor(Math.random() * activeFriends.length)];
      idRef.current += 1;
      const chatId = idRef.current;
      
      const shouldReply = i === 1 && Math.random() < 0.3;
      
      setTimeout(() => {
        setChats(prev => {
          let replyData: ChatItem["replyTo"] | undefined;
          if (shouldReply && prev.length > 0) {
            const recentChats = prev.filter(c => !c.isSystem && c.user !== user.name).slice(-5);
            if (recentChats.length > 0) {
              const target = recentChats[Math.floor(Math.random() * recentChats.length)];
              const replies = getSmartReplies(target.text, user.team || "DC", target.team);
              replyData = { user: target.user, text: target.text };
              return [...prev, {
                id: chatId,
                parentBallId: ballId,
                user: user.name,
                avatar: user.avatar,
                text: replies[Math.floor(Math.random() * replies.length)],
                timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
                replyTo: replyData,
                team: user.team,
              }];
            }
          }
          return [...prev, {
            id: chatId,
            parentBallId: ballId,
            user: user.name,
            avatar: user.avatar,
            text: shuffled[i % shuffled.length],
            timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
            team: user.team,
          }];
        });
        scrollToBottom();
      }, 500 + i * 800);
    }

    // Add commentary for key moments with guess-the-style game
    const commentaryPool = COMMENTARY_LINES[event.result];
    if (commentaryPool && (event.result === "six" || event.result === "four" || event.result === "wicket" || (event.result === "noball" && Math.random() < 0.5) || (event.result === "dot" && Math.random() < 0.15))) {
      const line = commentaryPool[Math.floor(Math.random() * commentaryPool.length)];
      idRef.current += 1;
      const commentaryId = idRef.current;
      
      // Create the guess card
      idRef.current += 1;
      const guessId = idRef.current;
      const options = getCommentaryOptions(line.style);

      setTimeout(() => {
        setChats(prev => [
          ...prev,
          {
            id: commentaryId,
            parentBallId: ballId,
            user: "Commentary Box",
            avatar: "🎙️",
            text: line.text,
            timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
            isSystem: true,
          },
          {
            id: guessId,
            parentBallId: ballId,
            user: "Commentary Box",
            avatar: "🎙️",
            text: "Guess the commentary style!",
            timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
            isSystem: true,
            isCommentaryGuess: true,
            commentaryGuessData: {
              correctStyle: line.style,
              options,
              answered: false,
              wasCorrect: null,
              selectedOption: null,
            },
          },
        ]);
        scrollToBottom();
      }, numMessages * 800 + 600);
    }

    // Set contextual waiting message
    const resultKey = isOverBreak.current ? "overBreak" : (event.result as string);
    const msgPool = WAITING_MESSAGES[resultKey] || WAITING_MESSAGES.dot;
    const pickedMsg = msgPool.messages[Math.floor(Math.random() * msgPool.messages.length)];

    setTimeout(() => { 
      setWaitingMessage({ emoji: msgPool.emoji, text: pickedMsg });
      setWaitingForNext(true); 
      scrollToBottom(); 
    }, numMessages * 800 + 1500);
    setTimeout(() => { 
      setWaitingForNext(false); 
      isOverBreak.current = false;
      startNewBall(); 
    }, numMessages * 800 + 18000); // ~40s total: 15s lock + 1.5s pending + ~3s messages + 18s wait ≈ real T20 pace
  }, [onNextBall, activeFriends, allPlayerStandings, scrollToBottom, onBallStateChange, match, balls]);

  const startNewBall = useCallback(() => {
    idRef.current += 1;
    const ballId = idRef.current;
    activeBallIdRef.current = ballId;

    const tempBallCount = ballCountRef.current + 1;
    const overNum = Math.floor((tempBallCount - 1) / 6);
    const ballNum = ((tempBallCount - 1) % 6) + 1;
    const label = formatBall(overNum, ballNum);

    const newBall: BallBlock = {
      id: ballId,
      ballLabel: label,
      predictionState: "idle",
      countdown: LOCK_TIME,
      selected: null,
      result: null,
      friendPicks: [],
    };

    setBalls(prev => [...prev.slice(-20), newBall]);
    scrollToBottom();
    addFriendPicks(ballId);

    // Sound: new prediction is active
    if (!isSoundMuted()) {
      playBallActiveSound();
    }

    // Sync ball state to multiplayer
    onBallStateChange?.(
      { id: ballId, label, state: "idle", openedAt: Date.now(), result: null },
      { runs: match.runs, wickets: match.wickets, overs: match.overs, balls: match.balls, currentBowler: match.currentBowler || "Bumrah", target: match.target }
    );

    clearInterval(countdownRef.current);
    let count = LOCK_TIME;
    countdownRef.current = setInterval(() => {
      count -= 1;
      setBalls(prev => prev.map(b =>
        b.id === ballId ? { ...b, countdown: count } : b
      ));
      if (count <= 0) {
        clearInterval(countdownRef.current);
        setBalls(prev => prev.map(b =>
          b.id === ballId && b.predictionState === "idle"
            ? { ...b, predictionState: "pending" as PredictionState }
            : b
        ));
        setTimeout(() => resolveBall(ballId), 1500);
      }
    }, 1000);
  }, [addFriendPicks, resolveBall, scrollToBottom, onBallStateChange, match]);

  const handlePredict = useCallback((ballId: number, pick: string) => {
    setBalls(prev => prev.map(b =>
      b.id === ballId
        ? { ...b, selected: pick, predictionState: "locked" as PredictionState }
        : b
    ));
    clearInterval(countdownRef.current);
    setTimeout(() => {
      setBalls(prev => prev.map(b =>
        b.id === ballId ? { ...b, predictionState: "pending" as PredictionState } : b
      ));
      setTimeout(() => resolveBall(ballId), 1500);
    }, 2000);
  }, [resolveBall]);

  const handleUserChat = useCallback((text: string) => {
    detectStyle(text);
    idRef.current += 1;
    const currentBallId = activeBallIdRef.current || 0;
    const newChat: ChatItem = {
      id: idRef.current,
      parentBallId: currentBallId,
      user: "You",
      avatar: "🙋",
      text,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      team: userTeam,
      replyTo: replyingTo ? { user: replyingTo.user, text: replyingTo.text } : undefined,
    };
    setChats(prev => [...prev, newChat]);
    setReplyingTo(null);
    scrollToBottom();
  }, [replyingTo, userTeam, scrollToBottom, detectStyle]);

  const handleReply = useCallback((chat: ChatItem) => {
    if (chat.isSystem || chat.user === "You") return;
    setReplyingTo(chat);
  }, []);

  const handleToggleSound = useCallback(() => {
    onToggleSound?.();
  }, [onToggleSound]);

  useEffect(() => {
    idRef.current += 1;
    setChats([{
      id: idRef.current,
      parentBallId: 0,
      user: "Pitch Talk",
      avatar: "🏏",
      text: "SOUND_TOGGLE",
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      isSystem: true,
    }]);
    startNewBall();
    return () => clearInterval(countdownRef.current);
  }, []);

  // Build render items
  // Build render items - track ball labels for chat context
  const ballLabelMap = new Map<number, string>();
  balls.forEach(b => ballLabelMap.set(b.id, b.ballLabel));

  const renderItems: { type: "ball" | "chat" | "over-summary" | "ball-divider"; ball?: BallBlock; chat?: ChatItem; overSummary?: OverSummaryData; dividerLabel?: string }[] = [];
  
  chats.filter(c => c.parentBallId === 0).forEach(chat => {
    renderItems.push({ type: "chat", chat });
  });

  balls.forEach(ball => {
    renderItems.push({ type: "ball", ball });
    const ballChats = chats.filter(c => c.parentBallId === ball.id);
    if (ballChats.length > 0 && ball.result) {
      renderItems.push({ type: "ball-divider", dividerLabel: `${ball.ballLabel} — ${ball.result?.label || ""}` });
    }
    ballChats.forEach(chat => {
      renderItems.push({ type: "chat", chat });
    });
    const summary = overSummaries.find(s => s.afterBallId === ball.id);
    if (summary) {
      renderItems.push({ type: "over-summary", overSummary: summary.data });
    }
  });

  const matchContext = {
    lastBallResult: lastBallResult,
    runs: match.runs,
    wickets: match.wickets,
    target: match.target,
    overs: match.overs,
    balls: match.balls,
  };

  const replySuggestions = replyingTo
    ? getSmartReplies(replyingTo.text, userTeam, replyingTo.team)
    : [];

  // Check if any ball prediction is currently actionable (idle state)
  const isPredictionActive = balls.some(b => b.predictionState === "idle" || b.predictionState === "locked");

  return (
    <div className={`flex-1 flex flex-col overflow-hidden ${shakeScreen ? "animate-shake" : ""}`}>
      <div className="relative flex-1 overflow-hidden">
        <div ref={scrollRef} onScroll={handleScroll} className="h-full overflow-y-auto pb-2">
          <AnimatePresence initial={false}>
            {renderItems.map((item) => {
              if (item.type === "ball" && item.ball) {
                const b = item.ball;
                return (
                  <PredictionCard
                    key={`ball-${b.id}`}
                    id={b.id}
                    ballLabel={b.ballLabel}
                    countdown={b.countdown}
                    state={b.predictionState}
                    result={b.result}
                    selected={b.selected}
                    friendPicks={b.friendPicks}
                    userScores={userScores}
                    onPredict={(pick) => handlePredict(b.id, pick)}
                    isFirstPrediction={ballCountRef.current === 0}
                    totalUserPredictions={totalUserPredictions}
                  />
                );
              }

              if (item.type === "ball-divider" && item.dividerLabel) {
                return (
                  <div key={`divider-${item.dividerLabel}`} className="flex items-center gap-2 px-5 pt-2 pb-0.5">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {item.dividerLabel}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                );
              }

              if (item.type === "over-summary" && item.overSummary) {
                return <OverSummary key={`over-${item.overSummary.overNumber}`} data={item.overSummary} onInvite={onInvite} />;
              }

              if (item.type === "chat" && item.chat) {
                const c = item.chat;
                const isYou = c.user === "You";
                const isSystem = c.isSystem;
                const isSoundToggle = isSystem && c.text === "SOUND_TOGGLE";
                const isCommentaryGuess = c.isCommentaryGuess && c.commentaryGuessData;

                // Commentary guess card
                // Hide commentary guess card when prediction is active
                if (isCommentaryGuess && c.commentaryGuessData && !isPredictionActive) {
                  const gd = c.commentaryGuessData;
                  return (
                    <motion.div
                      key={`chat-${c.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...spring }}
                      className="px-5 py-1.5"
                    >
                      <div className="ml-9 p-2.5 rounded-xl bg-primary/5 border border-primary/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-semibold text-primary">🎙️ Guess the style!</span>
                          {commentaryScore.total > 0 && (
                            <span className="text-[10px] text-muted-foreground font-medium">
                              {commentaryScore.correct}/{commentaryScore.total} correct
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1.5">
                          {gd.options.map(opt => {
                            const isSelected = gd.selectedOption === opt;
                            const isCorrectAnswer = gd.answered && opt === STYLE_LABELS[gd.correctStyle as CommentaryStyle];
                            return (
                              <motion.button
                                key={opt}
                                whileTap={gd.answered ? {} : { scale: 0.95 }}
                                onClick={() => !gd.answered && handleCommentaryGuess(c.id, opt)}
                                disabled={gd.answered}
                                className={`flex-1 py-2 px-2 rounded-lg text-[11px] font-semibold transition-all ${
                                  gd.answered
                                    ? isCorrectAnswer
                                      ? "bg-neon/15 text-neon ring-1 ring-neon/30"
                                      : isSelected && !gd.wasCorrect
                                      ? "bg-destructive/10 text-destructive ring-1 ring-destructive/30"
                                      : "bg-secondary/50 text-muted-foreground opacity-50"
                                    : "bg-secondary text-foreground active:bg-muted"
                                }`}
                              >
                                {opt}
                                {gd.answered && isCorrectAnswer && " ✅"}
                                {gd.answered && isSelected && !gd.wasCorrect && " ❌"}
                              </motion.button>
                            );
                          })}
                        </div>
                        {gd.answered && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`text-[10px] mt-1.5 font-medium ${gd.wasCorrect ? "text-neon" : "text-muted-foreground"}`}
                          >
                            {gd.wasCorrect ? "🎯 Nice ear! You know your commentary!" : `It was ${STYLE_LABELS[gd.correctStyle as CommentaryStyle]} style!`}
                          </motion.p>
                        )}
                      </div>
                    </motion.div>
                  );
                }

                const teamColor = c.team === "DC" ? "text-[hsl(211,100%,50%)]" : c.team === "MI" ? "text-[hsl(211,80%,40%)]" : "";
                return (
                  <motion.div
                    key={`chat-${c.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring }}
                    className="px-5 py-1 group"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`w-7 h-7 flex items-center justify-center rounded-full text-[11px] flex-shrink-0 ${
                        isSystem ? "bg-primary/15" : "bg-secondary"
                      }`}>
                        {c.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[12px] font-semibold ${
                            isSystem ? "text-primary" : isYou ? "text-primary" : "text-foreground"
                          }`}>{c.user}</span>
                          {c.team && !isSystem && (
                            <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${
                              c.team === "DC" ? "bg-primary/10 text-primary" : "bg-primary/10 text-primary"
                            }`}>{c.team}</span>
                          )}
                          {!isYou && !isSystem && userScores[c.user]?.total > 0 && (
                            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
                              {userScores[c.user].wins}/{userScores[c.user].total}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground ml-auto flex-shrink-0">
                            {c.timestamp}
                          </span>
                        </div>
                        {c.replyTo && (
                          <div className="mt-0.5 mb-0.5 pl-2 border-l-2 border-primary/30">
                            <p className="text-[10px] text-muted-foreground truncate">
                              <span className="font-semibold">{c.replyTo.user}:</span> {c.replyTo.text}
                            </p>
                          </div>
                        )}
                        {isSoundToggle ? (
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[12px] text-muted-foreground italic">
                              {soundMuted ? "🔇 Sounds are OFF." : "🔊 Sounds are ON — enjoy the vibe!"}
                            </p>
                            <button
                              onClick={handleToggleSound}
                              className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-foreground active:scale-95 transition-transform"
                            >
                              {soundMuted ? "🔊 Turn On" : "🔇 Mute"}
                            </button>
                          </div>
                        ) : (
                          <p className={`text-[14px] mt-0.5 leading-relaxed ${
                            isSystem ? "text-muted-foreground italic text-[12px]" : "text-foreground"
                          }`}>{c.text}</p>
                        )}
                        {!isSystem && !isYou && (
                          <button
                            onClick={() => handleReply(c)}
                            className="mt-0.5 flex items-center gap-0.5 text-[10px] text-muted-foreground active:text-primary transition-all"
                          >
                            <Reply size={10} />
                            Reply
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              }
              return null;
            })}
          </AnimatePresence>

          <AnimatePresence>
            {waitingForNext && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center gap-2 py-4 px-4"
              >
                <div className="flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    className="text-sm"
                  >{waitingMessage.emoji}</motion.span>
                  <span className="text-[12px] text-muted-foreground font-medium">
                    {waitingMessage.text}
                  </span>
                  <motion.span
                    className="flex gap-1"
                    initial={{ opacity: 0.4 }}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                    <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                    <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                  </motion.span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showScrollButton && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={handleScrollToBottom}
              className="absolute bottom-2 left-0 right-0 mx-auto w-fit z-10 flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold shadow-lg shadow-primary/25"
            >
              <ChevronDown size={14} />
              New updates
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Reply bar */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-2 bg-secondary/50 border-t border-border">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <Reply size={12} className="text-primary flex-shrink-0" />
                  <p className="text-[11px] text-muted-foreground truncate">
                    Replying to <span className="font-semibold text-foreground">{replyingTo.user}</span>: {replyingTo.text}
                  </p>
                </div>
                <button onClick={() => setReplyingTo(null)} className="text-[12px] text-muted-foreground px-1.5">✕</button>
              </div>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {replySuggestions.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => { handleUserChat(reply); }}
                    className="flex-shrink-0 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold active:scale-95 transition-all"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ChatInput onSend={handleUserChat} userTeam={userTeam} matchContext={matchContext} userStyle={userChatStyle} />
    </div>
  );
};

export default BanterStream;
