export type OutcomeType =
  | "dot"
  | "single"
  | "double"
  | "triple"
  | "four"
  | "six"
  | "wicket"
  | "wide"
  | "noball";

export type WagerTier = "small" | "medium" | "patiala";

export interface OutcomeOdds {
  outcomeType: OutcomeType;
  probabilityWeight: number;
  multiplier: number;
}

export interface BallPotEntry {
  name: string;
  pick: string;
  stake: number;
  avatar?: string;
}

export interface BallSettlementEntry extends BallPotEntry {
  won: boolean;
  weight: number;
  grossPayout: number;
  net: number;
}

export interface BallSettlement {
  poolTotal: number;
  winningPlayers: string[];
  weightedShares: Record<string, number>;
  expired: boolean;
  settlements: BallSettlementEntry[];
}

export interface FinalNetEntry {
  name: string;
  avatar?: string;
  net: number;
}

export interface PairwiseSettlement {
  from: string;
  to: string;
  amount: number;
}

export const WAGER_TIER_CONFIG: Record<WagerTier, { label: string; stake: number }> = {
  small: { label: "Chai", stake: 5 },
  medium: { label: "Martini", stake: 25 },
  patiala: { label: "Patiala", stake: 50 },
};

export const OUTCOME_ODDS: Record<OutcomeType, OutcomeOdds> = {
  single: { outcomeType: "single", probabilityWeight: 22, multiplier: 1.25 },
  dot: { outcomeType: "dot", probabilityWeight: 20, multiplier: 1.4 },
  four: { outcomeType: "four", probabilityWeight: 18, multiplier: 1.6 },
  six: { outcomeType: "six", probabilityWeight: 12, multiplier: 3.0 },
  double: { outcomeType: "double", probabilityWeight: 10, multiplier: 2.5 },
  wicket: { outcomeType: "wicket", probabilityWeight: 5, multiplier: 6.0 },
  wide: { outcomeType: "wide", probabilityWeight: 5, multiplier: 6.0 },
  triple: { outcomeType: "triple", probabilityWeight: 4, multiplier: 7.0 },
  noball: { outcomeType: "noball", probabilityWeight: 4, multiplier: 7.0 },
};

export const PICK_TO_OUTCOME_TYPE: Record<string, OutcomeType> = {
  Dot: "dot",
  Single: "single",
  Two: "double",
  Three: "triple",
  Boundary: "four",
  Six: "six",
  Wicket: "wicket",
  Wide: "wide",
  "No Ball": "noball",
};

export const WAGER_TIER_ORDER: WagerTier[] = ["small", "medium", "patiala"];
export const PITCH_PAISA_SYMBOL = "₹";

export function getStakeForTier(tier: WagerTier): number {
  return WAGER_TIER_CONFIG[tier].stake;
}

export function getWagerTierLabel(tier: WagerTier): string {
  return WAGER_TIER_CONFIG[tier].label;
}

export function getOutcomeMultiplier(outcomeType: OutcomeType): number {
  return OUTCOME_ODDS[outcomeType].multiplier;
}

export function getOutcomeTypeForPick(pick: string): OutcomeType {
  return PICK_TO_OUTCOME_TYPE[pick] ?? "dot";
}

export function getPickWeight(pick: string, stake: number): number {
  return stake * getOutcomeMultiplier(getOutcomeTypeForPick(pick));
}

export function checkPickWon(pick: string, result: string): boolean {
  return getOutcomeTypeForPick(pick) === result;
}

export function estimateShareForPick(entries: BallPotEntry[], pick: string, stake: number): number {
  const poolTotal = entries.reduce((sum, entry) => sum + entry.stake, 0);
  const winners = entries.filter((entry) => entry.pick === pick);
  if (poolTotal === 0 || winners.length === 0) return 0;
  const totalWinnerWeight = winners.reduce((sum, entry) => sum + getPickWeight(entry.pick, entry.stake), 0);
  const myWeight = getPickWeight(pick, stake);
  if (totalWinnerWeight === 0) return 0;
  return Math.floor((poolTotal * myWeight) / totalWinnerWeight);
}

export function settleBallPot(entries: BallPotEntry[], resultType: string): BallSettlement {
  const poolTotal = entries.reduce((sum, entry) => sum + entry.stake, 0);
  const winners = entries.filter((entry) => checkPickWon(entry.pick, resultType));

  if (winners.length === 0) {
    return {
      poolTotal,
      winningPlayers: [],
      weightedShares: {},
      expired: true,
      settlements: entries.map((entry) => ({
        ...entry,
        won: false,
        weight: 0,
        grossPayout: 0,
        net: 0,
      })),
    };
  }

  const weighted = winners.map((entry) => ({
    name: entry.name,
    weight: getPickWeight(entry.pick, entry.stake),
  }));
  const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  const rawShares = weighted.map((entry) => ({
    name: entry.name,
    exact: (poolTotal * entry.weight) / totalWeight,
  }));
  const flooredShares = rawShares.map((entry) => ({
    name: entry.name,
    amount: Math.floor(entry.exact),
    remainder: entry.exact - Math.floor(entry.exact),
  }));
  let allocated = flooredShares.reduce((sum, entry) => sum + entry.amount, 0);
  let remaining = poolTotal - allocated;
  const rankedRemainders = [...flooredShares].sort((a, b) => b.remainder - a.remainder);

  while (remaining > 0 && rankedRemainders.length > 0) {
    const target = rankedRemainders[(poolTotal - allocated - remaining) % rankedRemainders.length];
    target.amount += 1;
    remaining -= 1;
  }

  const grossPayouts = Object.fromEntries(rankedRemainders.map((entry) => [entry.name, entry.amount])) as Record<string, number>;
  const weightedShares = Object.fromEntries(weighted.map((entry) => [entry.name, entry.weight])) as Record<string, number>;

  return {
    poolTotal,
    winningPlayers: winners.map((entry) => entry.name),
    weightedShares,
    expired: false,
    settlements: entries.map((entry) => {
      const grossPayout = grossPayouts[entry.name] ?? 0;
      const won = grossPayout > 0;
      return {
        ...entry,
        won,
        weight: weightedShares[entry.name] ?? 0,
        grossPayout,
        net: grossPayout - entry.stake,
      };
    }),
  };
}

export function buildPairwiseSettlements(finalNets: FinalNetEntry[]): PairwiseSettlement[] {
  const creditors = finalNets
    .filter((entry) => entry.net > 0)
    .map((entry) => ({ name: entry.name, amount: entry.net }))
    .sort((a, b) => b.amount - a.amount);
  const debtors = finalNets
    .filter((entry) => entry.net < 0)
    .map((entry) => ({ name: entry.name, amount: Math.abs(entry.net) }))
    .sort((a, b) => b.amount - a.amount);

  const settlements: PairwiseSettlement[] = [];
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];
    const amount = Math.min(creditor.amount, debtor.amount);

    if (amount > 0) {
      settlements.push({ from: debtor.name, to: creditor.name, amount });
      creditor.amount -= amount;
      debtor.amount -= amount;
    }

    if (creditor.amount === 0) creditorIndex += 1;
    if (debtor.amount === 0) debtorIndex += 1;
  }

  return settlements;
}

export function formatRs(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${PITCH_PAISA_SYMBOL}${Math.abs(value)}`;
}

export function formatStake(tier: WagerTier): string {
  return `${PITCH_PAISA_SYMBOL}${getStakeForTier(tier)}`;
}

export function formatStakeValue(value: number): string {
  return `${PITCH_PAISA_SYMBOL}${value}`;
}

export function parseSerializedPrediction(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as { pick?: string };
    return parsed.pick ?? raw;
  } catch {
    return raw;
  }
}
