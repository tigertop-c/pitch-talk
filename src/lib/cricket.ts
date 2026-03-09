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

export const LOCK_TIME = 10; // seconds — 30% faster: ~28s total cycle vs ~40s real T20 pace
