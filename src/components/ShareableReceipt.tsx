import { useRef } from "react";
import { motion } from "framer-motion";
import { Share2, Copy, Check, Twitter, MessageCircle } from "lucide-react";
import { useState } from "react";

export interface PredictionRecord {
  ballLabel: string;
  predicted: string | null;
  result: string;
  resultType: string;
  won: boolean | null;
}

export interface ReceiptData {
  predictions: PredictionRecord[];
  totalBalls: number;
  correctPicks: number;
  accuracy: number;
  bestStreak: number;
  matchTitle: string;
}

const spring = { type: "spring" as const, damping: 25, stiffness: 350 };

const ShareableReceipt = ({ data }: { data: ReceiptData }) => {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const getTitle = (accuracy: number) => {
    if (accuracy >= 80) return { title: "Nostradamus 🔮", color: "text-neon" };
    if (accuracy >= 60) return { title: "Cricket Brain 🧠", color: "text-primary" };
    if (accuracy >= 40) return { title: "Decent Read 👀", color: "text-foreground" };
    if (accuracy >= 20) return { title: "Village Cricketer 🏏", color: "text-muted-foreground" };
    return { title: "Certified Clown 🤡", color: "text-destructive" };
  };

  const { title, color } = getTitle(data.accuracy);

  const shareText = `🏏 PitchTalk — ${data.matchTitle}\n\n🎯 ${data.correctPicks}/${data.totalBalls} predictions correct (${data.accuracy}%)\n🔥 Best streak: ${data.bestStreak}\n🏆 Title: ${title}\n\nThink you can do better? Try PitchTalk!`;

  const shareUrl = window.location.origin;

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + "\n" + shareUrl)}`, "_blank");
  };

  const handleTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText + "\n" + shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="mx-4 mb-4"
    >
      {/* The Card */}
      <div ref={cardRef} className="ios-card p-5 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-neon/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-4">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
              Your Scorecard
            </p>
            <p className="text-[12px] text-muted-foreground">{data.matchTitle}</p>
          </div>

          {/* Big Stats */}
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="text-center">
              <p className="text-3xl font-black text-foreground">{data.correctPicks}/{data.totalBalls}</p>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Correct</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <p className="text-3xl font-black text-primary">{data.accuracy}%</p>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Accuracy</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <p className="text-3xl font-black text-neon">🔥{data.bestStreak}</p>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Best Streak</p>
            </div>
          </div>

          {/* Title Badge */}
          <div className="text-center mb-4">
            <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold bg-secondary ${color}`}>
              {title}
            </span>
          </div>

          {/* Ball-by-ball mini grid */}
          <div className="flex flex-wrap gap-1 justify-center mb-3">
            {data.predictions.map((p, i) => (
              <div
                key={i}
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                  p.won === true
                    ? "bg-neon/15 text-neon"
                    : p.won === false
                    ? "bg-destructive/15 text-destructive"
                    : "bg-secondary text-muted-foreground"
                }`}
                title={`${p.ballLabel}: Picked ${p.predicted || "—"}, Got ${p.result}`}
              >
                {p.won === true ? "✓" : p.won === false ? "✗" : "—"}
              </div>
            ))}
          </div>

          {/* Branding */}
          <p className="text-center text-[9px] text-muted-foreground/50 font-medium tracking-wider">
            PITCHTALK • PREDICT EVERY BALL
          </p>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="flex gap-2 mt-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleWhatsApp}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-[hsl(142,70%,45%)] text-white font-semibold text-[12px] rounded-xl"
        >
          <MessageCircle size={16} />
          WhatsApp
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleTwitter}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-foreground text-background font-semibold text-[12px] rounded-xl"
        >
          <Twitter size={16} />
          Twitter / X
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleCopy}
          className="flex items-center justify-center gap-1.5 py-3 px-4 bg-secondary text-foreground font-semibold text-[12px] rounded-xl"
        >
          {copied ? <Check size={16} className="text-neon" /> : <Copy size={16} />}
          {copied ? "Copied!" : "Copy"}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ShareableReceipt;
