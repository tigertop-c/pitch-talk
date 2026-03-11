import { useEffect, useRef, useState, useCallback } from "react";
import { isAiPlayer } from "@/lib/aiPlayers";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
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

// Commentary lines for key moments — plain text, no style guessing
const COMMENTARY_LINES: Record<string, string[]> = {
  six: [
    "🎙️ THAT'S GONE INTO THE PEOPLE! MASSIVE! Absolutely ENORMOUS! 🚀",
    "🎙️ Like a tracer bullet into the stands! The crowd is BERSERK!",
    "🎙️ A six is like a smile — it lights up the whole ground! ☀️",
    "🎙️ That ball didn't just cross the rope, it left the ZIP CODE! 📮",
    "🎙️ The boys just need to bat well, bowl well, and field well to stop THAT! 😂",
    "🎙️ Oh my word. That is simply… extraordinary. Into row Z, I believe. 🫖",
    "🎙️ BANG! That's been absolutely TONKED! See ya later! 🏏💥",
    "🎙️ That's out of the ground, mate! Grab yer passports, that ball's TRAVELLING!",
    "🎙️ Flat bat, full face, gone like a rocket. You BEAUTY! 🇦🇺",
    "🎙️ That's not cricket, that's DEMOLITION! The bowler needs a cuddle after that one.",
    "🎙️ OH YESSS! Into the PEOPLE dem! That's CALYPSO cricket, baby! 🎶",
    "🎙️ Big man hit BIG shot! The ball gone clear outta di stadium! 🌴",
    "🎙️ That went straight into the confectionery stall and out again! 🍬",
  ],
  four: [
    "🎙️ SHOT! That's gone like a tracer bullet to the boundary! 🔥",
    "🎙️ Timing so sweet, even the bowler had to admire that one!",
    "🎙️ A good shot is like poetry — and that was Shakespeare! 📖",
    "🎙️ The ball kissed the bat and said GOODBYE! Glorious stroke! ✨",
    "🎙️ The boys just need to field well! But that went through 3 of them! 😂",
    "🎙️ Exquisitely done. Threaded through the covers like silk. Lovely. 🧵",
    "🎙️ That is a PROPER cricket shot. Textbook. Coaching manual stuff.",
    "🎙️ Oh, how pleasing to the eye. The fielder didn't even bother chasing.",
    "🎙️ CRACKED to the fence! No messing about, that's four all day! 💪",
    "🎙️ Mate, the fielder just watched that go by like a bus! 🚌",
    "🎙️ LASH through the covers! Style, elegance, POWER! 🔥",
  ],
  wicket: [
    "🎙️ HE'S GONE! And the bowler is PUMPED! That's the moment of the match!",
    "🎙️ Wickets fall like autumn leaves when the pressure mounts! 🍂",
    "🎙️ CLEANED HIM UP! The stumps are doing cartwheels! 🎯",
    "🎙️ That's the end of the road. Long walk back. Cricket is CRUEL! 😈",
    "🎙️ The boys needed to bat well. That was NOT batting well! 💀",
    "🎙️ Oh, he's gone. And he knows it. That was a terrible shot, really. 😬",
    "🎙️ Bowled 'im! What a JAFFA! Absolute peach of a delivery. 🍑",
    "🎙️ Well, that's rather ruined his afternoon, hasn't it? Off you pop.",
    "🎙️ SEE YA LATER, MATE! That's absolutely PLUMB! Walk of shame! 🚶",
    "🎙️ Got 'im! The bowler's giving him a SEND-OFF! Love the aggression! 🔥",
    "🎙️ RIPPED through the gate! That's knocked back middle stump, you RIPPER!",
    "🎙️ HE GONE! Pack yuh bags! The bowler ROARING! 🦁",
    "🎙️ Timber! Stumps flying everywhere like Carnival decorations! 🎊",
  ],
  dot: [
    "🎙️ DOT BALL! Pressure building like a pressure cooker without a whistle! 😤",
    "🎙️ Nothing doing! The bowler is on TOP here!",
    "🎙️ The key to scoring is hitting the ball. He forgot that part! 🙃",
    "🎙️ Defended solidly. Nothing on offer there. Good, disciplined bowling.",
    "🎙️ Dot ball. The squeeze is ON. Scoreboard pressure is a real thing, you know.",
    "🎙️ Morning, everyone. Nothing happening here. Absolutely nothing. Marvellous. ☕",
    "🎙️ NOTHING! Can't lay bat on ball! The pressure is ON, mate! 🔒",
    "🎙️ Nuttin' doin'! The bowler got him TIED UP in knots! 🪢",
  ],
  noball: [
    "🎙️ NO BALL! And it's a FREE HIT! The crowd smells BLOOD! 🩸",
    "🎙️ Overstepped! That's a gift wrapped with a bow! 🎁",
    "🎙️ Oh no no no, he's overstepped! FREE HIT coming up and the batsman is LICKING his lips! 😋",
    "🎙️ That's sloppy, very sloppy. And now it's a free hit. The batsman will fancy this.",
    "🎙️ NO BALL, mate! That's a freebie! Bowler's done his hammy AND overstepped! 🤦",
  ],
};

const LOCK_TIME_AUTO = 10;      // 10s prediction window in auto mode
const LOCK_TIME_MANUAL = 20;    // 20s prediction window in manual mode (user controls pace)
const WAIT_AFTER_BALL_AUTO = 12000;  // 12s wait between balls in auto mode
const WAIT_AFTER_BALL_MANUAL = 3000; // 3s wait after ball in manual mode (host controls pace)
const MULTIPLAYER_AUTO_THROW_MS = 15000; // 15s auto-throw in multiplayer after prediction
const spring = { type: "spring" as const, damping: 25, stiffness: 350 };

interface BanterStreamProps {
  match: MatchState;
  onNextBall: () => BallEvent;
  onHype?: (type: "four" | "six" | "wicket", isDuck?: boolean) => void;
  isManualMode?: boolean;
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
  bowlingTeamShort?: string;
  team1Short?: string;
  team2Short?: string;
  onAiPick?: (ballId: number, pick: string, playerName: string) => void;
}

// Exported so Index.tsx can read it
export type { BanterStreamProps };

const BanterStream = ({
  match, onNextBall, onHype, onPredictionResolved, onFriendScoresUpdate,
  soundMuted, activeFriends, onOverComplete, allPlayerStandings, userTeam,
  activePlayers, maxPlayers, roomId, onInvite, onToggleSound, onFirstOverComplete,
  onBallStateChange, isHost, gameSnapshot, onInningsComplete, battingTeamShort, bowlingTeamShort, team1Short, team2Short, onAiPick,
  isManualMode,
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
  const [showManualButton, setShowManualButton] = useState(false); // Item 4
  const [showScrollButton, setShowScrollButton] = useState(false);
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
  const pendingHostResolvedRef = useRef<{ ballId: number; label: string; result: { label: string; type: string }; expectedBallEventsLen: number } | null>(null);
  const startNewBallRef = useRef<() => void>(() => {});
  // Refs for values used inside callbacks without causing stale closures
  const isManualModeRef = useRef(isManualMode);
  isManualModeRef.current = isManualMode;
  const activePlayersRef = useRef(activePlayers);
  activePlayersRef.current = activePlayers;
  const autoThrowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const isLegal = event.result !== "wide" && event.result !== "noball";
    if (isLegal) {
      ballCountRef.current += 1;
    }

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
    if (!hostResult && isHost) {
      pendingHostResolvedRef.current = {
        ballId,
        label: balls.find(b => b.id === ballId)?.ballLabel || "",
        result: { label: event.label, type: event.result },
        expectedBallEventsLen: match.ballEvents.length + 1,
      };
    }

    // Capture striker info for duck detection
    const strikerBeforeEvent = match.batsmen?.find(b => b.isOnStrike);
    const strikerRuns = strikerBeforeEvent?.runs ?? 0;

    if (event.result === "wicket" || event.result === "six" || event.result === "four") {
      setShakeScreen(true);
      setTimeout(() => setShakeScreen(false), 600);
      const isDuck = event.result === "wicket" && strikerRuns === 0;
      onHype?.(event.result as "four" | "six" | "wicket", isDuck);

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

        const team1 = team1Short || "DC";
        const team2 = team2Short || "MI";
        const team1Count = activeFriends.filter(f => f.team === team1).length + (userTeam === team1 ? 1 : 0);
        const team2Count = activeFriends.filter(f => f.team === team2).length + (userTeam === team2 ? 1 : 0);

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
          teamAllegiances: (team1Count + team2Count) >= 3 ? { team1, team1Count, team2, team2Count } : undefined,
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

    const getDefaultTeamReactions = (team: string) => ({
      four: [`Nice boundary for ${team}!`, `${team} finds the gap.`, `${team} looking sharp.`],
      six: [`Big hit for ${team}!`, `${team} goes long.`, `${team} launches it.`],
      wicket: [`Big wicket for ${team}!`, `${team} gets the breakthrough.`, `${team} on top now.`],
    });

    // Use activeFriends (which now includes AI players from DB)
    const playersToUse = activeFriends;
    
    // Determine if AI should send team-specific messages (for key moments)
    const isKeyMoment = event.result === "four" || event.result === "six" || event.result === "wicket";
    
    // AI players react with team allegiance, but don't spam
    const hasOnlyAiPlayers = activeFriends.every(f => isAiPlayer(f.name));
    const shouldComment = hasOnlyAiPlayers ? Math.random() < 0.7 : true;
    
    if (!shouldComment && hasOnlyAiPlayers) {
      // Skip comments occasionally to avoid spam
    } else {
      for (let i = 0; i < numMessages; i++) {
        const user = playersToUse[Math.floor(Math.random() * playersToUse.length)];
        idRef.current += 1;
        const chatId = idRef.current;

        // For AI players, sometimes use team-specific messages
        let messageText = shuffled[i % shuffled.length];
        if (isAiPlayer(user.name) && isKeyMoment && user.team && Math.random() < 0.6) {
          const key = event.result as "four" | "six" | "wicket";
          const teamReactions = TEAM_REACTIONS[user.team]?.[key] ?? getDefaultTeamReactions(user.team)[key];
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
                isSystem: isAiPlayer(user.name),
              },
            ];
          });
          scrollToBottom();
        }, 500 + i * 600);
      }
    }

    // Add commentary for key moments — plain text, no guessing
    const commentaryPool = COMMENTARY_LINES[event.result];
    if (commentaryPool && (event.result === "six" || event.result === "four" || event.result === "wicket" || (event.result === "noball" && Math.random() < 0.5))) {
      const line = commentaryPool[Math.floor(Math.random() * commentaryPool.length)];
      idRef.current += 1;
      const commentaryId = idRef.current;
      setTimeout(() => {
        setChats(prev => [
          ...prev,
          {
            id: commentaryId,
            parentBallId: ballId,
            user: "Commentary",
            avatar: "🎙️",
            text: line,
            timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
            isSystem: true,
          },
        ]);
        scrollToBottom();
      }, numMessages * 600 + 400);
    }

    // Set contextual waiting message
    const resultKey = isOverBreak.current ? "overBreak" : (event.result as string);
    const msgPool = WAITING_MESSAGES[resultKey] || WAITING_MESSAGES.dot;
    const pickedMsg = msgPool.messages[Math.floor(Math.random() * msgPool.messages.length)];

    const waitTime = isManualModeRef.current ? WAIT_AFTER_BALL_MANUAL : WAIT_AFTER_BALL_AUTO;

    setTimeout(() => {
      setWaitingMessage({ emoji: msgPool.emoji, text: pickedMsg });
      setWaitingForNext(true);
      scrollToBottom();
    }, numMessages * 600 + 1000);
    setTimeout(() => {
      setWaitingForNext(false);
      isOverBreak.current = false;
      if (isHost) {
        // After ball resolves, always auto-start next prediction window.
        // In manual mode the "Throw Next Ball" button will appear after user picks.
        startNewBallRef.current();
      }
      // Non-host: next ball triggered by snapshot watcher
    }, numMessages * 600 + waitTime);
  }, [onNextBall, activeFriends, allPlayerStandings, scrollToBottom, onBallStateChange, match, balls, isHost]);
  resolveBallRef.current = resolveBall;

  useEffect(() => {
    if (!isHost) return;
    const pending = pendingHostResolvedRef.current;
    if (!pending) return;
    if (match.ballEvents.length < pending.expectedBallEventsLen) return;

    onBallStateChange?.(
      { id: pending.ballId, label: pending.label, state: "resolved", openedAt: 0, result: pending.result },
      { runs: match.runs, wickets: match.wickets, overs: match.overs, balls: match.balls, currentBowler: match.currentBowler || "Bumrah", target: match.target }
    );

    pendingHostResolvedRef.current = null;
  }, [
    isHost,
    onBallStateChange,
    match.runs,
    match.wickets,
    match.overs,
    match.balls,
    match.currentBowler,
    match.target,
    match.ballEvents.length,
  ]);

  const startNewBall = useCallback(() => {
    setWaitingForNext(false);
    setShowManualButton(false); // hide any lingering throw button
    // Cancel any pending auto-throw from the previous ball
    if (autoThrowTimerRef.current) {
      clearTimeout(autoThrowTimerRef.current);
      autoThrowTimerRef.current = null;
    }

    idRef.current += 1;
    const ballId = idRef.current;
    activeBallIdRef.current = ballId;

    const lockTime = isManualModeRef.current ? LOCK_TIME_MANUAL : LOCK_TIME_AUTO;

    const tempBallCount = ballCountRef.current + 1;
    const overNum = Math.floor((tempBallCount - 1) / 6);
    const ballNum = ((tempBallCount - 1) % 6) + 1;
    const label = formatBall(overNum, ballNum);

    const newBall: BallBlock = {
      id: ballId,
      ballLabel: label,
      predictionState: "idle",
      countdown: lockTime,
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
    let count = lockTime;
    countdownRef.current = setInterval(() => {
      count -= 1;
      setBalls(prev => prev.map(b =>
        b.id === ballId ? { ...b, countdown: count } : b
      ));
      if (count <= 0) {
        clearInterval(countdownRef.current);
        if (isManualModeRef.current) {
          // Manual mode: time's up — cancel any pending auto-throw, show throw button as fallback
          if (autoThrowTimerRef.current) {
            clearTimeout(autoThrowTimerRef.current);
            autoThrowTimerRef.current = null;
          }
          setBalls(prev => prev.map(b =>
            b.id === ballId && b.predictionState === "idle"
              ? { ...b, predictionState: "locked" as PredictionState }
              : b
          ));
          if (isHost) {
            setShowManualButton(true);
          }
        } else {
          // Auto mode: lock and resolve
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

    if (isManualModeRef.current && isHost) {
      // Manual mode: prediction made — show "Throw Next Ball" button
      // Host throws when ready; in multiplayer, auto-throw after a delay
      setShowManualButton(true);
      if (activePlayersRef.current > 1) {
        // Other real players are in the room — auto-throw after grace period
        if (autoThrowTimerRef.current) clearTimeout(autoThrowTimerRef.current);
        autoThrowTimerRef.current = setTimeout(() => {
          autoThrowTimerRef.current = null;
          setShowManualButton(false);
          setBalls(prev => prev.map(b =>
            b.id === ballId && b.predictionState !== "resolved"
              ? { ...b, predictionState: "pending" as PredictionState }
              : b
          ));
          setTimeout(() => resolveBallRef.current(ballId), 800);
        }, MULTIPLAYER_AUTO_THROW_MS);
      }
    } else {
      // Auto mode (or non-host): proceed with immediate resolution
      setTimeout(() => {
        setBalls(prev => prev.map(b =>
          b.id === ballId ? { ...b, predictionState: "pending" as PredictionState } : b
        ));
        if (isHost) {
          setTimeout(() => resolveBallRef.current(ballId), 1500);
        }
        // Non-host: resolution comes from snapshot
      }, 2000);
    }
  }, [isHost, resolveBall]);

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

  const handleToggleSound = useCallback(() => {
    onToggleSound?.();
  }, [onToggleSound]);

  useEffect(() => {
    if (isHost) {
      startNewBall();
    }
    return () => {
      clearInterval(countdownRef.current);
      if (autoThrowTimerRef.current) {
        clearTimeout(autoThrowTimerRef.current);
        autoThrowTimerRef.current = null;
      }
    };
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
    // Extended banter context
    battingTeam:  (battingTeamShort as TeamId) ?? null,
    bowlingTeam:  (bowlingTeamShort as TeamId) ?? null,
    striker: match.batsmen?.find(b => b.isOnStrike)?.name ?? null,
    bowler:  match.currentBowler ?? null,
    innings: match.innings,
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


      {/* Manual mode: "Throw Next Ball" — appears after user locks prediction, resolves the current ball */}
      <AnimatePresence>
        {showManualButton && isHost && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="px-4 pb-2"
          >
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                // Cancel any pending auto-throw
                if (autoThrowTimerRef.current) {
                  clearTimeout(autoThrowTimerRef.current);
                  autoThrowTimerRef.current = null;
                }
                setShowManualButton(false);
                // Move to pending then resolve the CURRENT ball
                const ballId = activeBallIdRef.current;
                if (ballId !== null) {
                  setBalls(prev => prev.map(b =>
                    b.id === ballId && b.predictionState !== "resolved"
                      ? { ...b, predictionState: "pending" as PredictionState }
                      : b
                  ));
                  setTimeout(() => resolveBallRef.current(ballId), 800);
                }
              }}
              className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-[14px] shadow-lg shadow-primary/25 flex items-center justify-center gap-2 active:scale-98 transition-transform"
            >
              🏏 Throw Next Ball
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <ChatInput onSend={handleUserChat} userTeam={userTeam} matchContext={matchContext} userStyle={userChatStyle} />
    </div>
  );
};

export default BanterStream;
