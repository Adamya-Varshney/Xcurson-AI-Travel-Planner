import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_AI_KEY = Deno.env.get("GOOGLE_AI_STUDIO_API_KEY")!;
const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models";

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Missing auth" }, 401);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return jsonResponse({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const { from, to, start_date, trip_mode } = body;

    if (!from || !to) return jsonResponse({ error: "from and to are required" }, 400);

    const prompt = `You are a travel logistics expert with access to Google Search. Find REAL, currently-bookable ways to travel from "${from}" to "${to}"${start_date ? ` around ${start_date}` : ""} for ${trip_mode || "a solo traveller"}.

Search Google for current fares & schedules. Use queries like:
- "flights ${from} to ${to} price ${start_date || ""}"
- "trains from ${from} to ${to}"
- "cruise ${from} to ${to}" (only if it's a coastal/island route that actually has cruises)
- "taxi/cab fare ${from} to ${to}" or "drive ${from} to ${to} distance" (only for domestic, sub ~1500 km routes)

Determine which transport categories are realistically viable for this specific route:
- "Flight" — for international or long domestic routes
- "Train" — for domestic / connected rail routes
- "Cruise" — ONLY if cruises actually operate this route
- "Private Conveyance" — taxi, cab, or self-drive, ONLY for domestic routes under ~1500 km
- "Bus" — long-distance coach, when realistic

Return 3 to 6 options TOTAL across the viable categories. Skip categories that don't make sense for this route.

Output ONLY valid JSON, no markdown, no code fences. The JSON must be the LAST thing in your response. Schema:
{
  "options": [
    {
      "id": "opt-1",                    // unique short id
      "category": "Flight",             // one of the categories above
      "provider": "IndiGo 6E-1407",     // specific airline/train/operator name found via search
      "from": "${from}",
      "to": "${to}",
      "departure_time": "08:30",        // 24h HH:MM if known, else ""
      "arrival_time": "10:45",          // 24h HH:MM if known, else ""
      "duration_hrs": 2.25,             // number, total door-to-door incl. transfers
      "cost_inr": 5500,                 // integer per-person in INR
      "stops": 0,                       // for flights/trains
      "class_or_cabin": "Economy",      // e.g. Economy / Sleeper / AC 3 Tier / Standard, "" if N/A
      "booking_hint": "Cheapest on Tue–Wed; book 3 weeks ahead.",
      "pros": ["Fastest", "Direct"],    // 1-3 short bullets
      "cons": ["Pricier than train"]    // 1-3 short bullets
    }
  ]
}

Generate now for: ${from} → ${to}.`;

    const model = "gemini-2.5-pro";
    const aiResponse = await fetch(
      `${GEMINI_API}/${model}:generateContent?key=${GOOGLE_AI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 4096 },
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("Gemini error:", aiResponse.status, errText);
      if (aiResponse.status === 429) return jsonResponse({ error: "AI rate limited. Try again shortly." });
      return jsonResponse({ error: "Failed to fetch transport options." });
    }

    const aiData = await aiResponse.json();
    const rawText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!rawText) return jsonResponse({ error: "No transport options returned." });

    let parsed: any;
    try {
      const cleaned = rawText.replace(/```(?:json)?\s*/gi, "").replace(/```\s*/g, "").trim();
      const s = cleaned.search(/\{/);
      const e = cleaned.lastIndexOf("}");
      if (s === -1 || e === -1) throw new Error("No JSON");
      parsed = JSON.parse(cleaned.slice(s, e + 1));
    } catch (e) {
      console.error("Parse error:", e, rawText);
      return jsonResponse({ error: "Failed to parse transport options." });
    }

    const options = Array.isArray(parsed.options) ? parsed.options : [];
    return jsonResponse({ options });
  } catch (err: any) {
    console.error("fetch-transport-options error:", err);
    return jsonResponse({ error: err?.message || "Unexpected failure." });
  }
});
