import type { TeamId } from "@/components/ChatInput";

export interface AiPlayer {
  name: string;
  avatar: string;
  team: TeamId;
}

export const AI_PLAYERS: AiPlayer[] = [
  { name: "CricketGuru", avatar: "🧠", team: "DC" },
  { name: "BoundaryKing", avatar: "👑", team: "MI" },
  { name: "WicketHunter", avatar: "🎯", team: "DC" },
  { name: "SixMachine", avatar: "💥", team: "MI" },
];

export function isAiPlayer(name: string): boolean {
  return AI_PLAYERS.some(p => p.name === name);
}
