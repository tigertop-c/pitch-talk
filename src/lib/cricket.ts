export const checkPickWon = (pick: string | null, result: string): boolean => {
  if (!pick) return false;
  return (
    (pick === "Dot" && result === "dot") ||
    (pick === "Boundary" && result === "four") ||
    (pick === "Six" && result === "six") ||
    (pick === "Single" && result === "single") ||
    (pick === "Two" && result === "double") ||
    (pick === "Three" && result === "triple") ||
    (pick === "Wicket" && result === "wicket") ||
    (pick === "Wide" && result === "wide") ||
    (pick === "No Ball" && result === "noball")
  );
};

export const LOCK_TIME = 15; // seconds — real T20 bowlers take ~40s between balls; 15s prediction + 2s lock + 1.5s pending + ~3s messages + ~18s wait ≈ 40s
