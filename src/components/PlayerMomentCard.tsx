import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface PlayerMomentCardProps {
  photoUrl: string | null;
  playerName: string;
  caption: string;
  onDismiss: () => void;
}

const CAPTION_CONFIG: {
  match: string;
  color: string;
  bg: string;
  glow: string;
}[] = [
  { match: "SIX",     color: "text-[hsl(210,100%,70%)]", bg: "bg-[hsl(210,100%,55%,0.12)]", glow: "shadow-[0_0_20px_hsl(210,100%,55%,0.25)]" },
  { match: "FOUR",    color: "text-[hsl(142,70%,55%)]",  bg: "bg-[hsl(142,70%,45%,0.12)]",  glow: "shadow-[0_0_20px_hsl(142,70%,45%,0.25)]" },
  { match: "WICKET",  color: "text-[hsl(0,90%,60%)]",    bg: "bg-[hsl(0,90%,50%,0.12)]",    glow: "shadow-[0_0_20px_hsl(0,90%,50%,0.25)]"   },
  { match: "BATSMAN", color: "text-[hsl(280,80%,70%)]",  bg: "bg-[hsl(280,80%,60%,0.12)]",  glow: "shadow-[0_0_16px_hsl(280,80%,60%,0.20)]" },
];

function getCaptionConfig(caption: string) {
  const upper = caption.toUpperCase();
  return CAPTION_CONFIG.find(c => upper.includes(c.match)) ?? {
    color: "text-primary",
    bg: "bg-primary/10",
    glow: "",
  };
}

const DISMISS_AFTER_MS = 3200;

const PlayerMomentCard = ({ photoUrl, playerName, caption, onDismiss }: PlayerMomentCardProps) => {
  const [imgError, setImgError] = useState(false);
  const cfg = getCaptionConfig(caption);

  // Keep a ref so the timer callback always calls the latest onDismiss
  // without re-creating the timer on every parent re-render.
  const onDismissRef = useRef(onDismiss);
  useEffect(() => { onDismissRef.current = onDismiss; });

  // Fire exactly once on mount — not on every re-render from parent.
  useEffect(() => {
    const t = setTimeout(() => onDismissRef.current(), DISMISS_AFTER_MS);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset img error state when player changes
  useEffect(() => { setImgError(false); }, [photoUrl]);

  return (
    <motion.div
      initial={{ y: 70, opacity: 0, scale: 0.92 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 70, opacity: 0, scale: 0.92 }}
      transition={{ type: "spring", damping: 22, stiffness: 320 }}
      onClick={onDismiss}
      className={`absolute bottom-[68px] left-3 right-3 z-40 cursor-pointer select-none ${cfg.glow}`}
    >
      <div className={`${cfg.bg} border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md`}>
        {/* Main content row */}
        <div className="flex items-center gap-3 px-3 py-2.5">
          {/* Player photo */}
          <div className="flex-shrink-0 w-[52px] h-[52px] rounded-full overflow-hidden border-2 border-white/15 bg-secondary">
            {photoUrl && !imgError ? (
              <img
                src={photoUrl}
                alt={playerName}
                className="w-full h-full object-cover object-top"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[22px]">🏏</div>
            )}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className={`text-[19px] font-black leading-none tracking-tight ${cfg.color}`}>{caption}</p>
            <p className="text-[12px] font-semibold text-foreground/80 truncate mt-0.5">{playerName}</p>
          </div>

          {/* Tap to dismiss hint */}
          <p className="text-[9px] text-muted-foreground/50 flex-shrink-0 self-start mt-1">tap</p>
        </div>

        {/* Progress bar */}
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: DISMISS_AFTER_MS / 1000, ease: "linear" }}
          style={{ transformOrigin: "left" }}
          className="h-[2px] bg-white/20 mx-3 mb-2 rounded-full"
        />
      </div>
    </motion.div>
  );
};

export default PlayerMomentCard;
