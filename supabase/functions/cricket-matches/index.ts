import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CRIC_API_BASE = "https://api.cricapi.com/v1";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("CRICKET_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "CRICKET_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get("endpoint") || "matches";

    // Forward all query params (except 'endpoint') to CricAPI so callers
    // can pass id=, offset=, etc. without the edge function needing to know about them.
    const forwardedParams = new URLSearchParams();
    forwardedParams.set("apikey", apiKey!);
    url.searchParams.forEach((val, key) => {
      if (key !== "endpoint") forwardedParams.set(key, val);
    });

    const apiUrl = `${CRIC_API_BASE}/${endpoint}?${forwardedParams.toString()}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`CricAPI error [${response.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Cricket API error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
