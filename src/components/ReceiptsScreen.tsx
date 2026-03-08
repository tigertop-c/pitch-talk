import { motion } from "framer-motion";
import { Share2 } from "lucide-react";

interface ShameCard {
  id: number;
  user: string;
  claim: string;
  result: string;
  emoji: string;
}

const SHAME_DATA: ShameCard[] = [
  { id: 1, user: "Rahul", claim: "Pant can't play pace", result: "SIX — 108m into the stands", emoji: "🤡" },
  { id: 2, user: "Priya", claim: "Bumrah will go for 50+ today", result: "3/18 in 4 overs", emoji: "🤡" },
  { id: 3, user: "Arjun", claim: "DC can't chase 180", result: "Won by 7 wickets, 2 overs left", emoji: "🤡" },
  { id: 4, user: "Vikram", claim: "Pant is overrated", result: "97(43) match-winning knock", emoji: "🤡" },
  { id: 5, user: "Sneha", claim: "This pitch has nothing for spinners", result: "Kuldeep: 4/22", emoji: "🤡" },
  { id: 6, user: "Rahul", claim: "Easy win for MI", result: "DC won by 65 runs", emoji: "💀" },
];

const spring = { type: "spring" as const, damping: 25, stiffness: 350 };

const handleShare = (card: ShameCard) => {
  const text = `🏏 THE SLEDGE - Wall of Shame ${card.emoji}\n\n${card.user} said: "${card.claim}"\n→ Result: ${card.result}\n\nGet rekt. 💀`;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
};

const ReceiptsScreen = () => {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          🏆 Wall of Shame
        </h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          Where bad takes live forever
        </p>
      </div>

      <div className="space-y-3">
        {SHAME_DATA.map((card, i) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: i * 0.08 }}
            className="ios-card p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-[12px] font-semibold text-primary">
                {card.user} said:
              </span>
              <span className="text-2xl">{card.emoji}</span>
            </div>

            <p className="text-[15px] font-semibold text-foreground mb-1.5 italic">
              "{card.claim}"
            </p>

            <div className="flex items-center gap-2 mb-3.5">
              <span className="text-[12px] text-muted-foreground">→ Result:</span>
              <span className="text-[12px] font-semibold text-neon">{card.result}</span>
            </div>

            <button
              onClick={() => handleShare(card)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground font-semibold text-[13px] rounded-xl transition-transform duration-150 active:scale-[0.97]"
            >
              <Share2 size={15} />
              Share to WhatsApp
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ReceiptsScreen;
