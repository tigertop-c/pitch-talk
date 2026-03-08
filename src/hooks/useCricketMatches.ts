import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CricApiMatch {
  id: string;
  name: string;
  matchType: string;
  status: string;
  venue: string;
  date: string;
  dateTimeGMT: string;
  teams: string[];
  teamInfo?: Array<{
    name: string;
    shortname: string;
    img: string;
  }>;
  score?: Array<{
    r: number;
    w: number;
    o: number;
    inning: string;
  }>;
  series_id?: string;
  fantasyEnabled?: boolean;
  bbbEnabled?: boolean;
  hasSquad?: boolean;
  matchStarted?: boolean;
  matchEnded?: boolean;
}

interface CricApiResponse {
  apikey: string;
  data: CricApiMatch[];
  status: string;
  info: {
    hitsToday: number;
    hitsUsed: number;
    hitsLimit: number;
    credits: number;
    server: number;
    offsetRows: number;
    totalRows: number;
    queryTime: number;
    s: number;
    cache: number;
  };
}

export function useCricketMatches() {
  const [matches, setMatches] = useState<CricApiMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchMatches() {
      try {
        setLoading(true);
        setError(null);

        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const fnUrl = `https://${projectId}.supabase.co/functions/v1/cricket-matches?endpoint=matches&offset=0`;

        const res = await fetch(fnUrl, {
          headers: {
            "apikey": anonKey,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error(`Function error: ${res.status}`);
        const response = (await res.json()) as CricApiResponse;

        if (response.status !== "success") {
          throw new Error("API returned non-success status");
        }

        if (!cancelled) {
          // Filter for T20 / IPL-type matches, sort upcoming first
          const now = new Date();
          const sorted = (response.data || [])
            .filter((m) => !m.matchEnded)
            .sort((a, b) => new Date(a.dateTimeGMT).getTime() - new Date(b.dateTimeGMT).getTime());
          setMatches(sorted);
        }
      } catch (err: unknown) {
        console.error("Failed to fetch cricket matches:", err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load matches");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchMatches();
    return () => { cancelled = true; };
  }, []);

  return { matches, loading, error, refetch: () => {} };
}
