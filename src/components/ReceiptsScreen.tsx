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
  { id: 1, user: "Rahul", claim: "He's a walking wicket", result: "SIX — 108m into the stands", emoji: "🤡" },
  { id: 2, user: "Priya", claim: "Bumrah will go for 50+ today", result: "3/18 in 4 overs", emoji: "🤡" },
  { id: 3, user: "Arjun", claim: "India can't chase 180", result: "Won by 7 wickets, 2 overs left", emoji: "🤡" },
  { id: 4, user: "Vikram", claim: "Pant is overrated", result: "97(43) match-winning knock", emoji: "🤡" },
  { id: 5, user: "Sneha", claim: "This pitch has nothing for spinners", result: "Kuldeep: 4/22", emoji: "🤡" },
  { id: 6, user: "Rahul", claim: "Easy win for Australia", result: "India won by 65 runs", emoji: "💀" },
];

const handleShare = (card: ShameCard) => {
  const text = `🏏 THE SLEDGE - Wall of Shame ${card.emoji}\n\n${card.user} said: "${card.claim}"\n→ Result: ${card.result}\n\nGet rekt. 💀`;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
};

const ReceiptsScreen = () => {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold font-mono text-neon uppercase tracking-wider">
          🏆 Wall of Shame
        </h2>
        <p className="text-xs font-mono text-muted-foreground mt-1">
          Where bad takes live forever
        </p>
      </div>

      <div className="space-y-3">
        {SHAME_DATA.map((card, i) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card border-[3px] border-foreground rounded-lg p-4"
            style={{ boxShadow: "4px 4px 0px hsl(0 0% 0%)" }}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs font-mono font-bold text-primary uppercase">
                {card.user} said:
              </span>
              <span className="text-2xl">{card.emoji}</span>
            </div>

            <p className="text-sm font-semibold text-foreground mb-1 italic">
              "{card.claim}"
            </p>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-mono text-muted-foreground">→ Result:</span>
              <span className="text-xs font-mono font-bold text-neon">{card.result}</span>
            </div>

            <button
              onClick={() => handleShare(card)}
              className="w-full flex items-center justify-center gap-2 py-2 bg-neon text-neon-foreground font-mono font-bold text-xs uppercase rounded-md border-2 border-foreground transition-transform active:scale-95"
              style={{ boxShadow: "2px 2px 0px hsl(0 0% 0%)" }}
            >
              <Share2 size={14} />
              Share to WhatsApp
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ReceiptsScreen;
