import { useRef } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Instagram } from "lucide-react";
import { formatRs, formatStakeValue, getWagerTierLabel, type PairwiseSettlement, type WagerTier } from "@/lib/wagers";

export interface PredictionRecord {
  ballLabel: string;
  predicted: string | null;
  stake: number;
  grossPayout: number;
  result: string;
  resultType: string;
  won: boolean | null;
  net: number;
  expired?: boolean;
}

export interface ReceiptData {
  predictions: PredictionRecord[];
  totalBalls: number;
  correctPicks: number;
  accuracy: number;
  bestStreak: number;
  matchTitle: string;
  netWinnings: number;
  amountWagered: number;
  biggestHit: number;
  roiPercent: number;
  roomStakeTier: WagerTier;
  roomStakeAmount: number;
  wagerMode: boolean;
  finalNetByPlayer: { name: string; avatar?: string; net: number }[];
  pairwiseSettlements: PairwiseSettlement[];
  isDevOverride?: boolean;
  devPitchPaisaMode?: "off" | "force_wager" | "simulate_second_human";
}

const spring = { type: "spring" as const, damping: 25, stiffness: 350 };

const ShareableReceipt = ({ data }: { data: ReceiptData }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const getTitle = () => {
    if (!data.wagerMode) {
      if (data.accuracy >= 80) return { title: "Cricket Brain", color: "text-neon", bg: "bg-neon/10 ring-1 ring-neon/20" };
      if (data.accuracy >= 60) return { title: "Sharp Reader", color: "text-primary", bg: "bg-primary/10 ring-1 ring-primary/20" };
      return { title: "Still Reading It", color: "text-muted-foreground", bg: "bg-secondary" };
    }

    if (data.netWinnings >= 250) return { title: "Patiala Punisher", color: "text-neon", bg: "bg-neon/10 ring-1 ring-neon/20" };
    if (data.accuracy >= 80) return { title: "Nostradamus", color: "text-neon", bg: "bg-neon/10 ring-1 ring-neon/20" };
    if (data.accuracy >= 60) return { title: "Cricket Brain", color: "text-primary", bg: "bg-primary/10 ring-1 ring-primary/20" };
    if (data.netWinnings > 0) return { title: "Slip Hustler", color: "text-primary", bg: "bg-primary/10 ring-1 ring-primary/20" };
    return { title: "Bold Guesser", color: "text-muted-foreground", bg: "bg-secondary" };
  };

  const { title, color, bg } = getTitle();
  const topSettlements = data.pairwiseSettlements.slice(0, 4);

  const shareLines = [
    `${data.wagerMode ? "Pitch Talk Settlement Slip" : "Pitch Talk Scorecard"} - ${data.matchTitle}`,
    "",
    ...(data.isDevOverride ? ["Development test mode only"] : []),
    ...(data.wagerMode
      ? [`Room stake: ${getWagerTierLabel(data.roomStakeTier)} ${formatStakeValue(data.roomStakeAmount)} per ball`, `Net: ${formatRs(data.netWinnings)}`]
      : ["Prediction-only mode"]),
    `Accuracy: ${data.correctPicks}/${data.totalBalls} (${data.accuracy}%)`,
    ...(data.wagerMode ? [`Total Pitch Paisa: ${formatStakeValue(data.amountWagered)}`] : []),
    "",
    ...(data.wagerMode
      ? [
          "Final nets:",
          ...data.finalNetByPlayer.map((entry) => `- ${entry.name}: ${formatRs(entry.net)}`),
          "",
          data.pairwiseSettlements.length > 0 ? "Settle like this:" : "Settle like this: Nobody owes anyone anything.",
          ...data.pairwiseSettlements.map((settlement) => `- ${settlement.from} pays ${settlement.to} ${formatStakeValue(settlement.amount)}`),
          "",
          "Each ball was its own pool. If nobody won a ball, that pool expired.",
          ...(data.isDevOverride && data.devPitchPaisaMode === "force_wager" ? ["Force wager mode uses solo dev-only totals. No real settle-up is generated."] : []),
          "Informal only. Settle outside the app.",
        ]
      : ["Invite one more human next time to unlock Pitch Paisa settle-up."]),
  ];
  const shareText = shareLines.join("\n");
  const shareUrl = window.location.origin;

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + "\n" + shareUrl)}`, "_blank");
  };

  const handleInstagram = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: data.wagerMode ? "Pitch Talk Settlement Slip" : "Pitch Talk Scorecard",
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(shareText + "\n" + shareUrl);
    alert("Slip copied. Paste it into your Story.");
  };

  const getNetColor = (net: number) => {
    if (net > 0) return "text-neon";
    if (net < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="mx-4 mb-4"
    >
      <div ref={cardRef} className="ios-card p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-neon/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative z-10">
          <div className="text-center mb-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold mb-1">
              {data.wagerMode ? "Your Settlement Slip" : "Your Scorecard"}
            </p>
            <p className="text-[12px] text-muted-foreground font-medium">{data.matchTitle}</p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              {data.wagerMode
                ? `${getWagerTierLabel(data.roomStakeTier)} room • ${formatStakeValue(data.roomStakeAmount)} per ball • settle outside the app`
                : "Prediction-only room • no settle-up for this match"}
            </p>
            {data.isDevOverride && (
              <p className="text-[10px] text-primary mt-1 font-semibold">Development test mode</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-2xl bg-secondary/70 px-4 py-3 text-center">
              <p className={`text-3xl font-black ${data.wagerMode ? getNetColor(data.netWinnings) : "text-primary"}`}>
                {data.wagerMode ? formatRs(data.netWinnings) : `${data.correctPicks}/${data.totalBalls}`}
              </p>
              <p className="text-[10px] text-muted-foreground font-bold mt-0.5 uppercase tracking-wide">
                {data.wagerMode ? "Net" : "Correct"}
              </p>
            </div>
            <div className="rounded-2xl bg-secondary/70 px-4 py-3 text-center">
              <p className="text-3xl font-black text-foreground">{data.accuracy}%</p>
              <p className="text-[10px] text-muted-foreground font-bold mt-0.5 uppercase tracking-wide">Accuracy</p>
            </div>
            {data.wagerMode ? (
              <>
                <div className="rounded-2xl bg-secondary/50 px-4 py-3 text-center">
                  <p className="text-2xl font-black text-primary">{formatStakeValue(data.amountWagered)}</p>
                  <p className="text-[10px] text-muted-foreground font-bold mt-0.5 uppercase tracking-wide">Total Wagered</p>
                </div>
                <div className="rounded-2xl bg-secondary/50 px-4 py-3 text-center">
                  <p className="text-2xl font-black text-neon">{formatRs(data.biggestHit)}</p>
                  <p className="text-[10px] text-muted-foreground font-bold mt-0.5 uppercase tracking-wide">Biggest Hit</p>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-2xl bg-secondary/50 px-4 py-3 text-center">
                  <p className="text-2xl font-black text-primary">{data.bestStreak}</p>
                  <p className="text-[10px] text-muted-foreground font-bold mt-0.5 uppercase tracking-wide">Best Streak</p>
                </div>
                <div className="rounded-2xl bg-secondary/50 px-4 py-3 text-center">
                  <p className="text-2xl font-black text-foreground">{data.totalBalls}</p>
                  <p className="text-[10px] text-muted-foreground font-bold mt-0.5 uppercase tracking-wide">Balls Called</p>
                </div>
              </>
            )}
          </div>

          <div className="text-center mb-5">
            <motion.span
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12 }}
              className={`inline-block px-5 py-2 rounded-full text-sm font-black ${bg} ${color}`}
            >
              {title}
            </motion.span>
            <p className="text-[10px] text-muted-foreground mt-2">
              {data.wagerMode
                ? `ROI ${data.roiPercent > 0 ? "+" : ""}${data.roiPercent}% • Best streak ${data.bestStreak}`
                : `Best streak ${data.bestStreak}`}
            </p>
          </div>

          {data.wagerMode ? (
            <>
              <div className="mb-4 rounded-xl border border-primary/10 bg-primary/5 px-3 py-2 text-[10px] text-muted-foreground leading-snug">
                Each ball was its own pool. Correct picks split that ball&apos;s pool. If nobody won, that ball expired and no one owed anything.
              </div>

              <div className="mb-4 rounded-xl bg-secondary/50 px-3 py-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold mb-2">Room Nets</p>
                <div className="space-y-1.5">
                  {data.finalNetByPlayer.map((entry) => (
                    <div key={entry.name} className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-foreground">{entry.avatar ? `${entry.avatar} ` : ""}{entry.name}</span>
                      <span className={`font-bold ${getNetColor(entry.net)}`}>{formatRs(entry.net)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4 rounded-xl bg-secondary/50 px-3 py-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold mb-2">Settle Up</p>
                {topSettlements.length > 0 ? (
                  <div className="space-y-1.5">
                    {topSettlements.map((settlement, index) => (
                      <div key={`${settlement.from}-${settlement.to}-${index}`} className="flex items-center justify-between text-[11px]">
                        <span className="text-foreground">{settlement.from} pays {settlement.to}</span>
                        <span className="font-bold text-primary">{formatStakeValue(settlement.amount)}</span>
                      </div>
                    ))}
                    {data.pairwiseSettlements.length > 4 && (
                      <p className="text-[10px] text-muted-foreground">+{data.pairwiseSettlements.length - 4} more in the WhatsApp slip</p>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    {data.isDevOverride && data.devPitchPaisaMode === "force_wager"
                      ? "Solo dev override: no real settle-up generated."
                      : "No one owes anyone anything."}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="mb-4 rounded-xl border border-secondary bg-secondary/40 px-3 py-2 text-[10px] text-muted-foreground leading-snug">
              Pitch Paisa stayed off for this match. AI picks still counted for banter, but only rooms with 2+ humans unlock settle-up.
            </div>
          )}

          <div className="flex flex-wrap gap-1 justify-center mb-4">
            {data.predictions.map((prediction, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.02, type: "spring", damping: 20 }}
                className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center text-[9px] font-bold ${
                  prediction.expired
                    ? "bg-secondary text-muted-foreground"
                    : prediction.won === true
                    ? "bg-neon/15 text-neon ring-1 ring-neon/20"
                    : prediction.won === false
                    ? "bg-destructive/15 text-destructive ring-1 ring-destructive/15"
                    : "bg-secondary text-muted-foreground"
                }`}
                title={`${prediction.ballLabel}: Picked ${prediction.predicted || "-"}${data.wagerMode ? ` • ${formatRs(prediction.net)}` : ""}`}
              >
                <span>{prediction.expired ? "Ø" : prediction.won === true ? "✓" : prediction.won === false ? "✕" : "-"}</span>
                <span className="text-[7px]">
                  {data.wagerMode && prediction.stake > 0 ? formatStakeValue(prediction.stake) : prediction.ballLabel}
                </span>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-[9px] text-muted-foreground/40 font-bold tracking-[0.2em] uppercase">
            Pitch Talk • Pitch Paisa • Informal slips only
          </p>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleWhatsApp}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-[12px] shadow-sm"
          style={{ backgroundColor: "hsl(142, 70%, 45%)", color: "white" }}
        >
          <MessageCircle size={16} />
          {data.wagerMode ? "WhatsApp Settlement Slip" : "Share Scorecard"}
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
