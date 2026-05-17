import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { PURPOSE_ENGINE_PROMPT } from "../_shared/purpose-engine-prompt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_AI_STUDIO_API_KEY = Deno.env.get("GOOGLE_AI_STUDIO_API_KEY")!;

const ALLOWED_CATEGORIES = new Set([
  "festival_event","iconic_tourism","religious_pilgrimage","food_cuisine",
  "shopping_goods","wedding_family","wellness_retreat","adventure_outdoor",
  "solo_self_discovery","bleisure_workation","content_creation",
  "screen_inspired","education_campus","sports_fan",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const destination = typeof body?.destination === "string" ? body.destination.trim() : "";
    if (!destination || destination.length > 120) {
      return new Response(JSON.stringify({ error: "Invalid destination" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pull user signals server-side
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("home_city, home_country, past_trips")
      .eq("user_id", user.id)
      .maybeSingle();

    const pastTripPurposes = Array.isArray(profile?.past_trips)
      ? profile!.past_trips.map((t: any) => t?.purpose).filter(Boolean).slice(0, 10)
      : [];

    const userTurn = {
      task: "suggest_reasons",
      destination,
      current_date: new Date().toISOString().slice(0, 10),
      user_home_city: profile?.home_city || null,
      user_home_country: profile?.home_country || null,
      user_age_band: "18-28",
      past_trip_purposes: pastTripPurposes,
    };

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_STUDIO_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: PURPOSE_ENGINE_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: JSON.stringify(userTurn) }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 8192, responseMimeType: "application/json" },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini error:", geminiRes.status, errText);
      return new Response(JSON.stringify({ error: "AI request failed", details: errText }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await geminiRes.json();
    const candidate = aiData?.candidates?.[0];
    const text = candidate?.content?.parts?.map((p: any) => p?.text || "").join("") || "";
    const finishReason = candidate?.finishReason;
    console.log("Gemini finishReason:", finishReason, "text length:", text.length);

    let parsed: any = null;
    try { parsed = JSON.parse(text); }
    catch {
      const m = text.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch {} }
    }

    if (!parsed || parsed.task_echo === "error") {
      console.error("Parse failed. finishReason:", finishReason, "raw text:", text.slice(0, 2000));
      return new Response(JSON.stringify({
        error: parsed?.error_message || "Could not parse reasons",
        finishReason,
        raw_preview: text.slice(0, 500),
      }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawReasons: any[] = Array.isArray(parsed?.reasons) ? parsed.reasons : [];
    const reasons = rawReasons.slice(0, 6).map((r: any, i: number) => ({
      id: String(r?.id || `r${i+1}`),
      title: String(r?.title || "").slice(0, 80),
      category: ALLOWED_CATEGORIES.has(r?.category) ? r.category : "iconic_tourism",
      icon_hint: String(r?.icon_hint || "sparkles").slice(0, 30),
      tagline: String(r?.tagline || "").slice(0, 120),
      time_relevance: ["active_now","upcoming_30d","upcoming_90d","year_round"].includes(r?.time_relevance) ? r.time_relevance : "year_round",
      specific_anchor: r?.specific_anchor ? String(r.specific_anchor).slice(0, 160) : null,
      approximate_dates: r?.approximate_dates ? String(r.approximate_dates).slice(0, 60) : null,
      confidence: typeof r?.confidence === "number" ? Math.max(0, Math.min(1, r.confidence)) : 0.6,
    })).filter((r) => r.title);

    if (reasons.length < 4) {
      return new Response(JSON.stringify({ error: "Could not generate enough reasons" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      destination,
      destination_resolved: parsed?.destination_resolved || destination,
      current_season: parsed?.current_season || null,
      reasons,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("trip-assist-reasons error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
