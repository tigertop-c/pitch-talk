import { motion } from "framer-motion";

const LiveHeader = () => {
  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 bg-card border-b-[3px] border-foreground px-4 py-3"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-live opacity-75 animate-live-pulse" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-live" />
          </span>
          <span className="text-xs font-mono uppercase tracking-widest text-live font-semibold">Live</span>
        </div>
        <span className="text-xs font-mono text-muted-foreground">IND vs AUS • 2nd T20I</span>
      </div>

      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-3xl font-bold font-mono tracking-tight text-foreground">184</span>
          <span className="text-xl font-mono text-muted-foreground">/4</span>
          <span className="ml-3 text-sm font-mono text-neon font-semibold">(18.2)</span>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground font-mono">CRR</div>
          <div className="text-lg font-bold font-mono text-primary">10.05</div>
        </div>
      </div>

      {/* Bowler run-up progress */}
      <div className="mt-2 h-1 w-full bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-neon rounded-full animate-run-up" />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] font-mono text-muted-foreground">Bumrah bowling</span>
        <span className="text-[10px] font-mono text-neon">Next ball</span>
      </div>
    </motion.div>
  );
};

export default LiveHeader;
