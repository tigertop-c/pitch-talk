import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Reply } from "lucide-react";
import PredictionCard, { type PredictionState, type BallResult, type FriendPick } from "./PredictionCard";
import OverSummary, { type OverSummaryData } from "./OverSummary";
import { type PredictionRecord } from "./ShareableReceipt";
import ChatInput, { type TeamId } from "./ChatInput";
import { type MatchState, type BallEvent, formatBall } from "@/hooks/useMatchState";
import { isSoundMuted } from "@/lib/sounds";

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
}

export interface FriendDef {
  name: string;
  avatar: string;
  team?: TeamId;
}

const PICK_LABELS = ["Dot", "Single", "Boundary", "Six", "Wicket", "Wide", "No Ball"];

const BANTER_BY_RESULT: Record<string, string[]> = {
  dot: ["Dot ball! Batsman's frozen 🥶", "Can't lay bat on ball 💀", "BORING! Hit something 🥱", "That's some hostile bowling 🎯"],
  single: ["Just a single? My nan runs faster 👵", "Rotating strike, at least they're trying 😂", "Smart cricket... said no one ever 🙄"],
  double: ["Quick two! Decent hustle 🏃‍♂️", "Running like their dinner's getting cold 🍽️"],
  triple: ["THREE! That's proper running between wickets 🏃‍♂️💨", "Even the camera couldn't keep up!"],
  four: ["BOUNDARY! Slapped into the covers 💥", "That ball had a family! 🔥", "Tracer bullet! Bowler's in shambles 💀"],
  six: ["SIX! INTO THE STANDS! Get the stretcher for the bowler 🚑", "That's OUTTA HERE! 🚀", "MONSTER hit! Bowler questioning his career 😭"],
  wicket: ["OUT! WALK OF SHAME! 🚶💀", "SEE YA! Pack your bags! 👋", "TIMBER! That's embarrassing 😂", "Bowler's absolutely buzzing 🤩"],
  wide: ["WIDE! Can't even bowl straight 💀", "That's going to the next pitch 😂", "My 5-year-old bowls better 👶"],
  noball: ["NO BALL! Free hit! Bowler's having a MARE 🤡", "Overstepped! Absolute clown moment 🎪", "FREE HIT! Bowler in the mud 😤"],
};

// Smart reply suggestions based on what the original message says
const REPLY_SUGGESTIONS: Record<string, string[]> = {
  positive: ["Dream on 😂", "Relax, it's one ball", "Sure buddy 🙄", "Easy there 😏"],
  negative: ["Cope harder 💀", "Stay salty 😂", "Tears incoming 🥲", "Rent free 😎"],
  neutral: ["Facts though", "No cap 🧢", "Hmm debatable", "Fair point 🤝"],
  cheeky: ["That's rich coming from you 😂", "Bold talk, weak team", "Screenshot this for later 📸", "Say that again when you're winning 😏"],
};

function getSmartReplies(originalText: string, myTeam: TeamId, theirTeam?: TeamId): string[] {
  const text = originalText.toLowerCase();
  const isRivalTeam = theirTeam && theirTeam !== myTeam;
  
  if (text.includes("six") || text.includes("shot") || text.includes("boundary") || text.includes("🚀") || text.includes("💥")) {
    return isRivalTeam 
      ? ["Lucky shot, won't happen again 🙄", "One swallow doesn't make a summer", "Calm down it's one ball 😂"]
      : ["YESSS! More of that please! 🔥", "That's what we came for!", "Take a bow! 🙌"];
  }
  if (text.includes("wicket") || text.includes("out") || text.includes("gone") || text.includes("💀") || text.includes("👋")) {
    return isRivalTeam
      ? ["Your whole team's next 💀", "That's just the start 😈", "Wicket merchant activated 🎯"]
      : ["Ugh, we'll come back stronger 💪", "Still got this!", "One wicket doesn't change anything 😤"];
  }
  if (text.includes("clown") || text.includes("embarrass") || text.includes("shame") || text.includes("🤡")) {
    return ["Keep that energy for later 📸", "We'll see who's laughing at the end 😏", "Bold words, weak team 😂"];
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

// Ravi Shastri / Sidhu style one-liner commentary
const COMMENTARY_LINES: Record<string, string[]> = {
  six: [
    "🎙️ THAT'S GONE INTO THE PEOPLE! MASSIVE! — Ravi Shastri energy",
    "🎙️ Six runs, and the crowd goes absolutely BERSERK! Like a tracer bullet! 🚀",
    "🎙️ A six is like a smile — it lights up the whole ground! — Sidhu vibes ☀️",
    "🎙️ That ball didn't just cross the rope, it left the ZIP CODE! 📮",
  ],
  four: [
    "🎙️ SHOT! That's gone like a tracer bullet to the boundary! 🔥",
    "🎙️ Timing so sweet, even the bowler had to admire that one!",
    "🎙️ A good shot is like poetry — and that was Shakespeare! — Sidhu vibes 📖",
    "🎙️ The ball hit the bat and said GOODBYE! Glorious stroke! ✨",
  ],
  wicket: [
    "🎙️ HE'S GONE! And the bowler is PUMPED! That's the moment of the match!",
    "🎙️ Wickets fall like autumn leaves when the pressure mounts! — Sidhu wisdom 🍂",
    "🎙️ CLEANED HIM UP! The stumps are doing cartwheels! 🎯",
    "🎙️ That's the end of the road for the batsman. Long walk back. Cricket is CRUEL! 😈",
  ],
  dot: [
    "🎙️ DOT BALL! Pressure building like a pressure cooker without a whistle! — Sidhu 😤",
  ],
  noball: [
    "🎙️ NO BALL! And it's a FREE HIT! The crowd smells BLOOD! 🩸",
    "🎙️ Overstepped! That's a gift wrapped with a bow! 🎁",
  ],
};

const LOCK_TIME = 15;
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
}

const BanterStream = ({
  match, onNextBall, onHype, onPredictionResolved, onFriendScoresUpdate,
  soundMuted, activeFriends, onOverComplete, allPlayerStandings, userTeam,
  activePlayers, maxPlayers, roomId, onInvite, onToggleSound, onFirstOverComplete,
}: BanterStreamProps) => {
  const [balls, setBalls] = useState<BallBlock[]>([]);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [shakeScreen, setShakeScreen] = useState(false);
  const [waitingForNext, setWaitingForNext] = useState(false);
  const [overSummaries, setOverSummaries] = useState<{ afterBallId: number; data: OverSummaryData }[]>([]);
  const [lastBallResult, setLastBallResult] = useState<string | null>(null);
  const [userScores, setUserScores] = useState<Record<string, { wins: number; total: number; streak: number }>>(
    () => Object.fromEntries(activeFriends.map(u => [u.name, { wins: 0, total: 0, streak: 0 }]))
  );
  const [replyingTo, setReplyingTo] = useState<ChatItem | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

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

        // Build team allegiances
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

        legalBallsThisOver.current = 0;
        overFriendResults.current = {};
        overParticipation.current = {};
        overRunsRef.current = 0;
        overWicketsRef.current = 0;
        overBoundariesRef.current = 0;
        overExtrasRef.current = 0;
      }
    }

    // Generate banter - sometimes as replies to recent chats
    const banterPool = BANTER_BY_RESULT[event.result] || BANTER_BY_RESULT.dot;
    const numMessages = 1 + Math.floor(Math.random() * 2);
    const shuffled = [...banterPool].sort(() => Math.random() - 0.5);

    for (let i = 0; i < numMessages; i++) {
      const user = activeFriends[Math.floor(Math.random() * activeFriends.length)];
      idRef.current += 1;
      const chatId = idRef.current;
      
      // 30% chance of replying to a recent chat from a different-team friend
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

    setTimeout(() => { setWaitingForNext(true); scrollToBottom(); }, numMessages * 800 + 1500);
    setTimeout(() => { setWaitingForNext(false); startNewBall(); }, numMessages * 800 + 5000);
  }, [onNextBall, activeFriends, allPlayerStandings, scrollToBottom]);

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
  }, [addFriendPicks, resolveBall, scrollToBottom]);

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
  }, [replyingTo, userTeam, scrollToBottom]);

  const handleReply = useCallback((chat: ChatItem) => {
    // Don't allow replying to system messages or own messages
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
  const renderItems: { type: "ball" | "chat" | "over-summary"; ball?: BallBlock; chat?: ChatItem; overSummary?: OverSummaryData }[] = [];
  
  chats.filter(c => c.parentBallId === 0).forEach(chat => {
    renderItems.push({ type: "chat", chat });
  });

  balls.forEach(ball => {
    renderItems.push({ type: "ball", ball });
    chats.filter(c => c.parentBallId === ball.id).forEach(chat => {
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

  // Smart reply suggestions for the user when replying
  const replySuggestions = replyingTo
    ? getSmartReplies(replyingTo.text, userTeam, replyingTo.team)
    : [];

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
                  />
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
                        {/* Reply context */}
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
                        {/* Reply button - visible on mobile too */}
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
                  >🏏</motion.span>
                  <span className="text-[12px] text-muted-foreground font-medium">
                    Bowler walking back...
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

        {/* Scroll to bottom button */}
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
              {/* Smart reply suggestions */}
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

      <ChatInput onSend={handleUserChat} userTeam={userTeam} matchContext={matchContext} />
    </div>
  );
};

export default BanterStream;
