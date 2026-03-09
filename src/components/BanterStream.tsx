import { useEffect, useRef, useState, useCallback } from "react";
import { isAiPlayer } from "@/lib/aiPlayers";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ThumbsUp, ThumbsDown } from "lucide-react";
import PredictionCard, { type PredictionState, type BallResult, type FriendPick } from "./PredictionCard";
import OverSummary, { type OverSummaryData } from "./OverSummary";
import { type PredictionRecord } from "./ShareableReceipt";
import ChatInput, { type TeamId, type UserChatStyle } from "./ChatInput";
import { type MatchState, type BallEvent, formatBall } from "@/hooks/useMatchState";
import { type GameSnapshot } from "@/hooks/useMultiplayer";
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

const RESULT_RUNS: Record<string, number> = {
  dot: 0, single: 1, double: 2, triple: 3, four: 4, six: 6, wicket: 0, wide: 1, noball: 1,
};

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
    { text: "🎙️ The boys just need to bat well, bowl well, and field well to stop THAT! 😂", style: "indian" },
    { text: "🎙️ Dhoni finishes off in style! A magnificent strike! Oh wait, wrong match! 😅", style: "indian" },
    { text: "🎙️ Into the second tier! He's just murdered that ball and the crowd is the witness! 🔥", style: "indian" },
    { text: "🎙️ Oh my word. That is simply… extraordinary. Into row Z, I believe. 🫖", style: "british" },
    { text: "🎙️ Well, that's been dispatched with utter contempt. Quite magnificent.", style: "british" },
    { text: "🎙️ He's picked that up off middle stump and deposited it into the car park. Dear oh dear.", style: "british" },
    { text: "🎙️ It's been absolutely marvellous! That ball is never coming back! 🫖", style: "british" },
    { text: "🎙️ That, ladies and gentlemen, is what we call agricultural… but rather effective. 🌾", style: "british" },
    { text: "🎙️ BANG! That's been absolutely TONKED! See ya later! 🏏💥", style: "aussie" },
    { text: "🎙️ That's out of the ground, mate! Grab yer passports, that ball's TRAVELLING!", style: "aussie" },
    { text: "🎙️ Flat bat, full face, gone like a rocket. You BEAUTY! 🇦🇺", style: "aussie" },
    { text: "🎙️ That's not cricket, that's DEMOLITION! The bowler needs a cuddle after that one.", style: "aussie" },
    { text: "🎙️ If you need 24 to avoid the follow on, why not get it in four hits? He's doing just that! 😤", style: "aussie" },
    { text: "🎙️ OH YESSS! Into the PEOPLE dem! That's CALYPSO cricket, baby! 🎶", style: "windies" },
    { text: "🎙️ Big man hit BIG shot! The ball gone clear outta di stadium! 🌴", style: "windies" },
    { text: "🎙️ That's ENTERTAINMENT! The crowd on their feet, music in the air! 🥁", style: "windies" },
    { text: "🎙️ That went straight into the confectionery stall and out again! 🍬", style: "windies" },
  ],
  four: [
    { text: "🎙️ SHOT! That's gone like a tracer bullet to the boundary! 🔥", style: "indian" },
    { text: "🎙️ Timing so sweet, even the bowler had to admire that one!", style: "indian" },
    { text: "🎙️ A good shot is like poetry — and that was Shakespeare! 📖", style: "indian" },
    { text: "🎙️ The ball kissed the bat and said GOODBYE! Glorious stroke! ✨", style: "indian" },
    { text: "🎙️ The boys just need to field well! But that went through 3 of them! 😂", style: "indian" },
    { text: "🎙️ That's gone to the boundary faster than my commentary! Brilliant! 🏏", style: "indian" },
    { text: "🎙️ Exquisitely done. Threaded through the covers like silk. Lovely. 🧵", style: "british" },
    { text: "🎙️ That is a PROPER cricket shot. Textbook. Coaching manual stuff.", style: "british" },
    { text: "🎙️ Oh, how pleasing to the eye. The fielder didn't even bother chasing.", style: "british" },
    { text: "🎙️ Played with soft hands and gorgeous wrists. Just delightful. ☕", style: "british" },
    { text: "🎙️ Staggering gamble! And it's come off beautifully! 🎩", style: "british" },
    { text: "🎙️ That's what we in the business call — ridiculous running, oh wait, ridiculous BATTING! 🫖", style: "british" },
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
    { text: "🎙️ The boys needed to bat well. That was NOT batting well! 💀", style: "indian" },
    { text: "🎙️ The key to winning is not losing wickets. Well, that didn't go to plan! 😂", style: "indian" },
    { text: "🎙️ He didn't read that at ALL! Looked like he was reading the Mahabharata out there! 📚", style: "indian" },
    { text: "🎙️ Oh, he's gone. And he knows it. That was a terrible shot, really. 😬", style: "british" },
    { text: "🎙️ Bowled 'im! What a JAFFA! Absolute peach of a delivery. 🍑", style: "british" },
    { text: "🎙️ Well, that's rather ruined his afternoon, hasn't it? Off you pop.", style: "british" },
    { text: "🎙️ Stone dead. Even the batsman started walking. Nothing to see here.", style: "british" },
    { text: "🎙️ Not so for the batsman! It's been marvellous, but not for HIM! 🫖", style: "british" },
    { text: "🎙️ SEE YA LATER, MATE! That's absolutely PLUMB! Walk of shame! 🚶", style: "aussie" },
    { text: "🎙️ Got 'im! The bowler's giving him a SEND-OFF! Love the aggression! 🔥", style: "aussie" },
    { text: "🎙️ RIPPED through the gate! That's knocked back middle stump, you RIPPER!", style: "aussie" },
    { text: "🎙️ With a slower ball — ONE OF THE GREAT BALLS! The batsman's bamboozled! 🤯", style: "aussie" },
    { text: "🎙️ HE GONE! Pack yuh bags! The bowler ROARING! 🦁", style: "windies" },
    { text: "🎙️ Timber! Stumps flying everywhere like Carnival decorations! 🎊", style: "windies" },
    { text: "🎙️ You dig a hole, you fill it, mate! And that batsman just dug his OWN grave! ⚰️", style: "windies" },
  ],
  dot: [
    { text: "🎙️ DOT BALL! Pressure building like a pressure cooker without a whistle! 😤", style: "indian" },
    { text: "🎙️ Nothing doing! The bowler is on TOP here!", style: "indian" },
    { text: "🎙️ The key to scoring is hitting the ball. He forgot that part! 🙃", style: "indian" },
    { text: "🎙️ The boys need to bat well. Batting well requires HITTING the ball, bhai! 😅", style: "indian" },
    { text: "🎙️ Defended solidly. Nothing on offer there. Good, disciplined bowling.", style: "british" },
    { text: "🎙️ Dot ball. The squeeze is ON. Scoreboard pressure is a real thing, you know.", style: "british" },
    { text: "🎙️ Morning, everyone. Nothing happening here. Absolutely nothing. Marvellous. ☕", style: "british" },
    { text: "🎙️ NOTHING! Can't lay bat on ball! The pressure is ON, mate! 🔒", style: "aussie" },
    { text: "🎙️ He's got as much chance of scoring off that as I have of fitting into my old playing whites! 😂", style: "aussie" },
    { text: "🎙️ Nuttin' doin'! The bowler got him TIED UP in knots! 🪢", style: "windies" },
  ],
  noball: [
    { text: "🎙️ NO BALL! And it's a FREE HIT! The crowd smells BLOOD! 🩸", style: "indian" },
    { text: "🎙️ Overstepped! That's a gift wrapped with a bow! 🎁", style: "indian" },
    { text: "🎙️ Oh no no no, he's overstepped! FREE HIT coming up and the batsman is LICKING his lips! 😋", style: "indian" },
    { text: "🎙️ The boys just needed to bowl well. That was NOT bowling well! Front foot, please! 🦶", style: "indian" },
    { text: "🎙️ That's sloppy, very sloppy. And now it's a free hit. The batsman will fancy this.", style: "british" },
    { text: "🎙️ NO BALL, mate! That's a freebie! Bowler's done his hammy AND overstepped! 🤦", style: "aussie" },
    { text: "🎙️ Free hit! The batsman just need to bat well here! Should be straightforward! 😂", style: "aussie" },
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

const LOCK_TIME = 10; // 10s prediction window — ~30% faster than real T20 pace
const WAIT_AFTER_BALL = 12000; // 12s wait between balls (30% faster than 18s)
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
  isHost: boolean;
  gameSnapshot?: GameSnapshot | null;
  onInningsComplete?: () => void;
  battingTeamShort?: string;
  onAiPick?: (ballId: number, pick: string, playerName: string) => void;
}

const BanterStream = ({
  match, onNextBall, onHype, onPredictionResolved, onFriendScoresUpdate,
  soundMuted, activeFriends, onOverComplete, allPlayerStandings, userTeam,
  activePlayers, maxPlayers, roomId, onInvite, onToggleSound, onFirstOverComplete,
  onBallStateChange, isHost, gameSnapshot, onInningsComplete, battingTeamShort, onAiPick,
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
  const [chatReactions, setChatReactions] = useState<Record<number, { up: number; down: number; myVote?: "up" | "down" }>>({});
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
  const resolveBallRef = useRef<(ballId: number, hostResult?: { label: string; type: string }) => void>(() => {});
  const startNewBallRef = useRef<() => void>(() => {});

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
        // Store AI/friend pick in DB for cross-client consistency
        onAiPick?.(ballId, pick, user.name);
        scrollToBottom();
      }, delays[i] || 2000);
    });
  }, [activeFriends, scrollToBottom, onAiPick]);

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

  const resolveBall = useCallback((ballId: number, hostResult?: { label: string; type: string }) => {
    let event: BallEvent;
    if (hostResult) {
      // Non-host: use host's result from snapshot
      event = {
        over: 0, ball: 0,
        result: hostResult.type as BallEvent["result"],
        runs: RESULT_RUNS[hostResult.type] || 0,
        label: hostResult.label,
      };
    } else {
      // Host: generate locally
      event = onNextBall();
    }
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

    // Sync resolved ball state to multiplayer (host only)
    if (!hostResult) {
      onBallStateChange?.(
        { id: ballId, label: balls.find(b => b.id === ballId)?.ballLabel || "", state: "resolved", openedAt: 0, result: { label: event.label, type: event.result } },
        { runs: match.runs, wickets: match.wickets, overs: match.overs, balls: match.balls, currentBowler: match.currentBowler || "Bumrah", target: match.target }
      );
    }

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

    // AI Players for solo mode - virtual players that comment and pick teams
    const AI_PLAYERS: FriendDef[] = [
      { name: "CricketGuru", avatar: "🧠", team: "DC" },
      { name: "BoundaryKing", avatar: "👑", team: "MI" },
      { name: "WicketHunter", avatar: "🎯", team: "DC" },
      { name: "SixMachine", avatar: "💥", team: "MI" },
    ];

    // Team-specific reactions for AI players
    const TEAM_REACTIONS: Record<string, Record<string, string[]>> = {
      DC: {
        four: ["SHOT! That's my DC! 🔵", "Delhi dominating! 💙", "Class from DC! 🔥"],
        six: ["INTO THE STANDS! DC power! 🚀💙", "That's what DC do! MASSIVE! 🔵", "DC DNA right there! 💪"],
        wicket: ["MI down! Let's go DC! 💙", "Huge for us! DC! DC! DC! 🔵", "That's the breakthrough we needed! 🎯"],
        dot: ["Pressure building! 💪", "Good bowling from our boys! 🎯", "Keep it tight! 🔒"],
      },
      MI: {
        four: ["MI class! That's how we do it! 💛", "Mumbai magic! 🌟", "Paltan power! 💪💙"],
        six: ["ROHIT WOULD BE PROUD! 🚀💛", "MI MI MI! What a hit! 💙", "5 TIME CHAMPIONS! 👑"],
        wicket: ["DC crumbling! MI on top! 💛", "That's our moment! Paltan! 💙", "Big wicket for Mumbai! 🔥"],
        dot: ["Squeeeeze! 🔒", "MI bowlers doing their thing! 💪", "No runs! We're on top! 🎯"],
      },
    };

    // In solo play, use AI players instead of real friends
    const playersToUse = activeFriends.length === 0 ? AI_PLAYERS : activeFriends;
    
    // Determine if AI should send team-specific messages (for key moments)
    const isKeyMoment = event.result === "four" || event.result === "six" || event.result === "wicket";
    
    // Solo mode: AI players react with team allegiance, but don't spam (random chance to comment)
    const shouldAiComment = activeFriends.length === 0 ? Math.random() < 0.7 : true;
    
    if (!shouldAiComment && activeFriends.length === 0) {
      // Skip comments occasionally in solo mode to avoid spam
      // Still add system commentary for key moments
    } else {
      for (let i = 0; i < numMessages; i++) {
        const user = playersToUse[Math.floor(Math.random() * playersToUse.length)];
        idRef.current += 1;
        const chatId = idRef.current;

        // For AI players, sometimes use team-specific messages
        let messageText = shuffled[i % shuffled.length];
        if (activeFriends.length === 0 && isKeyMoment && user.team && Math.random() < 0.6) {
          const teamReactions = TEAM_REACTIONS[user.team]?.[event.result];
          if (teamReactions && teamReactions.length > 0) {
            messageText = teamReactions[Math.floor(Math.random() * teamReactions.length)];
          }
        }

        setTimeout(() => {
          setChats(prev => {
            return [
              ...prev,
              {
                id: chatId,
                parentBallId: ballId,
                user: user.name,
                avatar: user.avatar,
                text: messageText,
                timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
                team: user.team,
                isSystem: activeFriends.length === 0, // Mark AI messages differently
              },
            ];
          });
          scrollToBottom();
        }, 500 + i * 600);
      }
    }

    // Add commentary for key moments with guess-the-style game (merged into single system message)
    const commentaryPool = COMMENTARY_LINES[event.result];
    if (commentaryPool && (event.result === "six" || event.result === "four" || event.result === "wicket" || (event.result === "noball" && Math.random() < 0.5))) {
      const line = commentaryPool[Math.floor(Math.random() * commentaryPool.length)];
      idRef.current += 1;
      const guessId = idRef.current;
      const options = getCommentaryOptions(line.style);

      setTimeout(() => {
        setChats(prev => [
          ...prev,
          {
            id: guessId,
            parentBallId: ballId,
            user: "Commentary",
            avatar: "🎙️",
            text: line.text,
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
      }, numMessages * 600 + 400);
    }

    // Set contextual waiting message
    const resultKey = isOverBreak.current ? "overBreak" : (event.result as string);
    const msgPool = WAITING_MESSAGES[resultKey] || WAITING_MESSAGES.dot;
    const pickedMsg = msgPool.messages[Math.floor(Math.random() * msgPool.messages.length)];

    setTimeout(() => { 
      setWaitingMessage({ emoji: msgPool.emoji, text: pickedMsg });
      setWaitingForNext(true); 
      scrollToBottom(); 
    }, numMessages * 600 + 1000);
    setTimeout(() => { 
      setWaitingForNext(false); 
      isOverBreak.current = false;
      if (isHost) {
        startNewBallRef.current(); 
      }
      // Non-host: next ball triggered by snapshot watcher
    }, numMessages * 600 + WAIT_AFTER_BALL); // ~28s total cycle: 10s lock + 1.5s pending + ~2s messages + 12s wait
  }, [onNextBall, activeFriends, allPlayerStandings, scrollToBottom, onBallStateChange, match, balls, isHost]);
  resolveBallRef.current = resolveBall;

  const startNewBall = useCallback(() => {
    setWaitingForNext(false);
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

    // Sync ball state to multiplayer (host only)
    if (isHost) {
      onBallStateChange?.(
        { id: ballId, label, state: "idle", openedAt: Date.now(), result: null },
        { runs: match.runs, wickets: match.wickets, overs: match.overs, balls: match.balls, currentBowler: match.currentBowler || "Bumrah", target: match.target }
      );
    }

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
        if (isHost) {
          setTimeout(() => resolveBallRef.current(ballId), 1500);
        }
        // Non-host: resolution comes from snapshot
      }
    }, 1000);
  }, [addFriendPicks, resolveBall, scrollToBottom, onBallStateChange, match]);
  startNewBallRef.current = startNewBall;

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
      if (isHost) {
        setTimeout(() => resolveBallRef.current(ballId), 1500);
      }
      // Non-host: resolution comes from snapshot
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
    };
    setChats(prev => [...prev, newChat]);
    scrollToBottom();
  }, [userTeam, scrollToBottom, detectStyle]);

  const handleReaction = useCallback((chatId: number, type: "up" | "down") => {
    setChatReactions(prev => {
      const existing = prev[chatId] || { up: 0, down: 0 };
      if (existing.myVote === type) return prev; // already voted this way
      const undoPrev = existing.myVote ? (existing.myVote === "up" ? { up: -1, down: 0 } : { up: 0, down: -1 }) : { up: 0, down: 0 };
      return {
        ...prev,
        [chatId]: {
          up: existing.up + undoPrev.up + (type === "up" ? 1 : 0),
          down: existing.down + undoPrev.down + (type === "down" ? 1 : 0),
          myVote: type,
        },
      };
    });
  }, []);

  const handleToggleSound = useCallback(() => {
    onToggleSound?.();
  }, [onToggleSound]);

  useEffect(() => {
    if (isHost) {
      startNewBall();
    }
    return () => clearInterval(countdownRef.current);
  }, []);

  // Non-host: watch game snapshot to drive game loop
  const lastSnapBallRef = useRef<{ id: number; state: string } | null>(null);

  useEffect(() => {
    if (isHost || !gameSnapshot?.ball) return;

    const snapBall = gameSnapshot.ball;
    const prev = lastSnapBallRef.current;

    if (!prev || snapBall.id !== prev.id) {
      // New ball from host
      if (snapBall.state === "idle" || snapBall.state === "pending") {
        startNewBallRef.current();
      } else if (snapBall.state === "resolved" && snapBall.result) {
        // Missed prediction window — show result directly
        startNewBallRef.current();
        setTimeout(() => {
          const currentBallId = activeBallIdRef.current;
          if (currentBallId) {
            resolveBallRef.current(currentBallId, snapBall.result!);
          }
        }, 500);
      }
    } else if (
      snapBall.id === prev.id &&
      snapBall.state === "resolved" &&
      prev.state !== "resolved" &&
      snapBall.result
    ) {
      // Ball we're tracking got resolved by host
      clearInterval(countdownRef.current);
      const currentBallId = activeBallIdRef.current;
      if (currentBallId) {
        setBalls(bprev => bprev.map(b =>
          b.id === currentBallId && b.predictionState !== "resolved"
            ? { ...b, predictionState: "pending" as PredictionState }
            : b
        ));
        setTimeout(() => {
          resolveBallRef.current(currentBallId, snapBall.result!);
        }, 1500);
      }
    }

    lastSnapBallRef.current = { id: snapBall.id, state: snapBall.state };
  }, [isHost, gameSnapshot?.ball?.id, gameSnapshot?.ball?.state]);

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


  // Determine if user's team is batting
  const myTeamBatting = battingTeamShort ? userTeam === battingTeamShort : undefined;

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
                    myTeamBatting={myTeamBatting}
                  />
                );
              }

              if (item.type === "ball-divider" && item.dividerLabel) {
                return (
                  <div key={`divider-${item.dividerLabel}`} className="flex items-center gap-2 px-4 pt-1.5 pb-0.5">
                    <div className="h-px flex-1 bg-border/50" />
                    <span className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {item.dividerLabel}
                    </span>
                    <div className="h-px flex-1 bg-border/50" />
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

                // Commentary guess card - compact combined view with text + guess
                if (isCommentaryGuess && c.commentaryGuessData && !isPredictionActive) {
                  const gd = c.commentaryGuessData;
                  return (
                    <motion.div
                      key={`chat-${c.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...spring }}
                      className="px-4 py-1.5"
                    >
                      <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                        {/* Commentary text */}
                        <p className="text-[12px] text-foreground leading-relaxed mb-2">{c.text}</p>
                        
                        {/* Guess section */}
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-semibold text-primary">Guess the style</span>
                          {commentaryScore.total > 0 && (
                            <span className="text-[9px] text-muted-foreground">
                              {commentaryScore.correct}/{commentaryScore.total}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {gd.options.map(opt => {
                            const isSelected = gd.selectedOption === opt;
                            const isCorrectAnswer = gd.answered && opt === STYLE_LABELS[gd.correctStyle as CommentaryStyle];
                            return (
                              <motion.button
                                key={opt}
                                whileTap={gd.answered ? {} : { scale: 0.95 }}
                                onClick={() => !gd.answered && handleCommentaryGuess(c.id, opt)}
                                disabled={gd.answered}
                                className={`flex-1 py-1.5 px-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                                  gd.answered
                                    ? isCorrectAnswer
                                      ? "bg-neon/15 text-neon"
                                      : isSelected && !gd.wasCorrect
                                      ? "bg-destructive/10 text-destructive"
                                      : "bg-secondary/50 text-muted-foreground opacity-40"
                                    : "bg-secondary text-foreground active:bg-muted"
                                }`}
                              >
                                {opt.replace(" 🫖", "").replace(" 🦘", "").replace(" 🌴", "").replace(" 🇮🇳", "")}
                              </motion.button>
                            );
                          })}
                        </div>
                        {gd.answered && (
                          <p className={`text-[9px] mt-1 font-medium ${gd.wasCorrect ? "text-neon" : "text-muted-foreground"}`}>
                            {gd.wasCorrect ? "🎯 Correct!" : `It was ${STYLE_LABELS[gd.correctStyle as CommentaryStyle].split(" ")[0]}`}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={`chat-${c.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring }}
                    className={`px-4 py-0.5 group transition-opacity duration-300 ${isPredictionActive ? "opacity-40" : "opacity-100"}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] flex-shrink-0 ${
                        isSystem ? "bg-primary/15" : "bg-secondary"
                      }`}>
                        {c.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className={`text-[11px] font-semibold ${
                            isSystem ? "text-primary" : isYou ? "text-primary" : "text-foreground"
                          }`}>{c.user}</span>
                          {c.team && !isSystem && (
                            <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${
                              c.team === "DC" ? "bg-primary/10 text-primary" : "bg-primary/10 text-primary"
                            }`}>{c.team}</span>
                          )}
                          {!isYou && !isSystem && userScores[c.user]?.total > 0 && (
                            <span className="text-[8px] font-medium text-muted-foreground">
                              {userScores[c.user].wins}/{userScores[c.user].total}
                            </span>
                          )}
                          <span className="text-[9px] text-muted-foreground ml-auto flex-shrink-0">
                            {c.timestamp}
                          </span>
                        </div>
                        {isSoundToggle ? (
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[11px] text-muted-foreground italic">
                              {soundMuted ? "🔇 Sounds OFF" : "🔊 Sounds ON"}
                            </p>
                            <button
                              onClick={handleToggleSound}
                              className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-secondary text-foreground active:scale-95 transition-transform"
                            >
                              {soundMuted ? "Turn On" : "Mute"}
                            </button>
                          </div>
                        ) : (
                          <p className={`text-[12px] mt-0.5 leading-snug ${
                            isSystem ? "text-muted-foreground italic text-[11px]" : "text-foreground"
                          }`}>{c.text}</p>
                        )}
                        {!isSystem && !isYou && (
                          <div className="mt-1 flex items-center gap-2">
                            <button
                              onClick={() => handleReaction(c.id, "up")}
                              className={`flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full transition-all active:scale-95 ${
                                chatReactions[c.id]?.myVote === "up"
                                  ? "bg-primary/15 text-primary font-semibold"
                                  : "text-muted-foreground hover:bg-secondary"
                              }`}
                            >
                              <ThumbsUp size={10} />
                              {(chatReactions[c.id]?.up || 0) > 0 && <span>{chatReactions[c.id].up}</span>}
                            </button>
                            <button
                              onClick={() => handleReaction(c.id, "down")}
                              className={`flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full transition-all active:scale-95 ${
                                chatReactions[c.id]?.myVote === "down"
                                  ? "bg-destructive/15 text-destructive font-semibold"
                                  : "text-muted-foreground hover:bg-secondary"
                              }`}
                            >
                              <ThumbsDown size={10} />
                              {(chatReactions[c.id]?.down || 0) > 0 && <span>{chatReactions[c.id].down}</span>}
                            </button>
                          </div>
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


      <ChatInput onSend={handleUserChat} userTeam={userTeam} matchContext={matchContext} userStyle={userChatStyle} />
    </div>
  );
};

export default BanterStream;
