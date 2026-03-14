import { useRef } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Instagram } from "lucide-react";

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
  const cardRef = useRef<HTMLDivElement>(null);

  const getTitle = (accuracy: number) => {
    if (accuracy >= 80) return { title: "Nostradamus 🔮", color: "text-neon", bg: "bg-neon/10 ring-1 ring-neon/20" };
    if (accuracy >= 60) return { title: "Cricket Brain 🧠", color: "text-primary", bg: "bg-primary/10 ring-1 ring-primary/20" };
    if (accuracy >= 40) return { title: "Decent Read 👀", color: "text-foreground", bg: "bg-secondary ring-1 ring-border" };
    if (accuracy >= 20) return { title: "Village Cricketer 🏏", color: "text-muted-foreground", bg: "bg-secondary" };
    return { title: "Certified Clown 🤡", color: "text-destructive", bg: "bg-destructive/10 ring-1 ring-destructive/20" };
  };

  const { title, color, bg } = getTitle(data.accuracy);

  const shareText = `🏏 Pitch Talk — ${data.matchTitle}\n\n🎯 ${data.correctPicks}/${data.totalBalls} predictions correct (${data.accuracy}%)\n🔥 Best streak: ${data.bestStreak}\n🏆 Title: ${title}\n\nThink you can do better? Join Pitch Talk!`;

  const shareUrl = window.location.origin;

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + "\n" + shareUrl)}`, "_blank");
  };

  const handleInstagram = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "PitchTalk Scorecard",
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or not supported
      }
    }
    await navigator.clipboard.writeText(shareText + "\n" + shareUrl);
    alert("Scorecard copied! Paste it in your Instagram Story ✨");
  };

  const getStatColor = (accuracy: number) => {
    if (accuracy >= 70) return "text-neon";
    if (accuracy >= 50) return "text-primary";
    if (accuracy >= 30) return "text-amber-400";
    return "text-foreground";
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
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-neon/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold mb-1">
              Your Scorecard
            </p>
            <p className="text-[12px] text-muted-foreground font-medium">{data.matchTitle}</p>
          </div>

          {/* Stats row — bigger and bolder */}
          <div className="flex items-center justify-center gap-5 mb-5">
            <div className="text-center">
              <p className="text-3xl font-black text-foreground">{data.correctPicks}<span className="text-lg text-muted-foreground font-light">/{data.totalBalls}</span></p>
              <p className="text-[10px] text-muted-foreground font-bold mt-0.5 uppercase tracking-wide">Correct</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <p className={`text-3xl font-black ${getStatColor(data.accuracy)}`}>{data.accuracy}%</p>
              <p className="text-[10px] text-muted-foreground font-bold mt-0.5 uppercase tracking-wide">Accuracy</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <p className="text-3xl font-black text-amber-400">🔥{data.bestStreak}</p>
              <p className="text-[10px] text-muted-foreground font-bold mt-0.5 uppercase tracking-wide">Best Streak</p>
            </div>
          </div>

          {/* Title badge — more prominent */}
          <div className="text-center mb-5">
            <motion.span
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12 }}
              className={`inline-block px-5 py-2 rounded-full text-sm font-black ${bg} ${color}`}
            >
              {title}
            </motion.span>
          </div>

          {/* Ball-by-ball grid */}
          <div className="flex flex-wrap gap-1 justify-center mb-4">
            {data.predictions.map((p, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.02, type: "spring", damping: 20 }}
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                  p.won === true
                    ? "bg-neon/15 text-neon ring-1 ring-neon/20"
                    : p.won === false
                    ? "bg-destructive/15 text-destructive ring-1 ring-destructive/15"
                    : "bg-secondary text-muted-foreground"
                }`}
                title={`${p.ballLabel}: Picked ${p.predicted || "—"}, Got ${p.result}`}
              >
                {p.won === true ? "✓" : p.won === false ? "✗" : "—"}
              </motion.div>
            ))}
          </div>

          <p className="text-center text-[9px] text-muted-foreground/40 font-bold tracking-[0.2em] uppercase">
            Pitch Talk • Predict Every Ball
          </p>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="flex gap-2 mt-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleWhatsApp}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-[12px] shadow-sm"
          style={{ backgroundColor: "hsl(142, 70%, 45%)", color: "white" }}
        >
          <MessageCircle size={16} />
          Share on WhatsApp
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleInstagram}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-[12px] text-primary-foreground shadow-sm"
          style={{
            background: "linear-gradient(45deg, hsl(37, 97%, 55%), hsl(333, 80%, 55%), hsl(270, 80%, 55%))",
          }}
        >
          <Instagram size={16} />
          Share Story
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ShareableReceipt;
