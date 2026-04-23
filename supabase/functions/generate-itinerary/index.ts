import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Missing auth" }, 401);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return jsonResponse({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const { cities, days_count, trip_mode, trip_id, start_date } = body;

    if (!cities || !Array.isArray(cities) || cities.length === 0) {
      return jsonResponse({ error: "cities[] is required" }, 400);
    }
    if (!days_count || days_count < 1 || days_count > 14) {
      return jsonResponse({ error: "days_count must be 1-14" }, 400);
    }

    const { data: profile } = await supabase
      .from("user_profiles").select("*").eq("user_id", user.id).maybeSingle();

    // ---- Pull the full traveller profile so Gemini can personalise deeply ----
    const fullName = profile?.full_name || "Traveller";
    const homeCity = profile?.home_city || "";
    const homeCountry = profile?.home_country || "";
    const experienceLevel = profile?.experience_level || "first_timer";

    const place = (profile?.place_preferences as any) || {};
    const exp = (profile?.experience_preferences as any) || {};
    const culture = (profile?.cultural_preferences as any) || {};
    const food = (profile?.food_preferences as any) || {};
    const pastTrips = (profile?.past_trips as any[]) || [];

    const dietary = food?.dietary || [];
    const cuisines = food?.cuisines || food?.favourite_cuisines || [];
    const foodAdventurousness = food?.adventurousness || food?.openness || "";
    const interests = exp?.interests || [];
    const activityTypes = exp?.activity_types || [];
    const budgetRange = place?.budget_range || "mid";
    const pace = place?.travel_pace || "balanced";
    const accommodationPref = place?.accommodation || place?.stay_type || "";
    const climatePref = place?.climate || "";
    const landscapePref = place?.landscapes || place?.landscape_type || [];
    const languages = culture?.languages || [];
    const age = culture?.age || "";
    const gender = culture?.gender || "";
    const profession = culture?.profession || culture?.occupation || "";
    const companions = culture?.companions || "";
    const mobility = culture?.mobility || culture?.accessibility || "";
    const culturalInterests = culture?.interests || [];

    const profileBlock = `TRAVELLER PROFILE (use this to personalise EVERY recommendation):
- Name: ${fullName}
- Home base: ${[homeCity, homeCountry].filter(Boolean).join(", ") || "unspecified"}
- Travel experience level: ${experienceLevel}
- Age: ${age || "unspecified"} | Gender: ${gender || "unspecified"} | Profession: ${profession || "unspecified"}
- Languages spoken: ${languages.length ? languages.join(", ") : "unspecified"}
- Usual companions: ${companions || "unspecified"} | Mobility/accessibility needs: ${mobility || "none stated"}
- Cultural interests: ${culturalInterests.length ? culturalInterests.join(", ") : "unspecified"}
- Experience interests: ${interests.length ? interests.join(", ") : "general exploration"}
- Preferred activity types: ${activityTypes.length ? activityTypes.join(", ") : "unspecified"}
- Budget level: ${budgetRange} | Travel pace: ${pace}
- Accommodation preference: ${accommodationPref || "unspecified"} | Climate preference: ${climatePref || "unspecified"}
- Landscape preference: ${Array.isArray(landscapePref) && landscapePref.length ? landscapePref.join(", ") : (landscapePref || "unspecified")}
- Dietary restrictions: ${dietary.length ? dietary.join(", ") : "none"}
- Favourite cuisines: ${cuisines.length ? cuisines.join(", ") : "open to anything"} | Food adventurousness: ${foodAdventurousness || "unspecified"}
- Past trips (avoid repeating identical experiences, build on these): ${pastTrips.length ? pastTrips.map((t: any) => t?.destination || t?.name || t).filter(Boolean).slice(0, 8).join("; ") : "none recorded"}
- Trip mode for THIS trip: ${trip_mode || "solo"}${start_date ? ` | Trip starts: ${start_date}` : ""}

Personalisation rules:
- Reflect the traveller's age, profession, and companions when picking venues (e.g. nightlife vs family-friendly vs accessibility-friendly).
- If mobility needs are stated, avoid strenuous hikes / long walks and call out accessibility in travel_note.
- Match accommodation_cost_inr to their accommodation preference and budget level.
- Lean food picks toward favourite cuisines while strictly respecting dietary restrictions.
- Skip activities that closely duplicate their past trips; suggest fresh angles instead.
- If they speak the local language, you can suggest more local/off-beat spots; if not, lean toward English-friendly venues.
- Pace and density of activities must match their travel_pace preference.`;

    const prompt = `You are a travel itinerary generator with access to Google Search. You MUST use Google Search to look up CURRENT, REAL-WORLD prices for the destination(s) before producing costs. Search for things like: "average meal cost in <city> 2026", "<city> metro fare", "taxi fare <city>", "entry fee <attraction>", "budget hotel price <city> per night", etc. Base every cost field on what you actually find — do not guess from memory. After searching, generate a detailed day-by-day itinerary as strict JSON.

${profileBlock}

Rules:
- Output ONLY valid JSON, no markdown, no code fences. The JSON must be the LAST thing in your response.
- The JSON must be an object with keys: "title", "days", "budget_summary".
- "title" is a short catchy trip title (max 8 words).
- "days" is an array of day objects. Each day has:
  - "day_number" (int, starting from 1)
  - "city" (string)
  - "morning": activity object
  - "afternoon": activity object
  - "evening": activity object
- Each activity object has:
  - "activity" (string, short name)
  - "description" (string, 1-2 sentences — reference WHY it fits this traveller's profile when relevant)
  - "start_time" (string, e.g. "09:00 AM")
  - "end_time" (string, e.g. "12:00 PM")
  - "duration_hrs" (number, e.g. 2.5)
  - "cost_inr" (integer, activity/entry fee cost in INR)
  - "commute_cost_inr" (integer, estimated commute/transport cost to reach the venue)
  - "food_cost_inr" (integer, estimated meal/snack cost during this slot, 0 if no meal)
  - "accommodation_cost_inr" (integer, only for evening slot if overnight stay is relevant, 0 otherwise)
  - "transport_mode" (string, one of: "Walk", "Auto/Rickshaw", "Taxi/Cab", "Metro", "Bus", "Train", "Bicycle", "Motorbike/Scooter", "Private Car", "Ferry/Boat", "Flight", "Other")
  - "travel_note" (string, how to get there or tips, max 1 sentence)
- Morning activities should start around 8-9 AM, afternoon around 1-2 PM, evening around 6-7 PM. Times should flow naturally.
- "budget_summary" has: "estimated_total" (int), "per_head" (int), "breakdown" (object with keys "accommodation", "food", "transport", "activities" each as int)

Generate a ${days_count}-day itinerary for: ${cities.join(", ")}.`;

    console.log("Generating itinerary for:", cities, days_count, trip_mode, start_date);

    const model = "gemini-2.5-pro";
    const aiResponse = await fetch(
      `${GEMINI_API}/${model}:generateContent?key=${GOOGLE_AI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("Gemini API error:", aiResponse.status, errText);

      if (aiResponse.status === 429) {
        return jsonResponse({ error: "Google AI rate limit exceeded. Please try again in a moment.", code: "AI_RATE_LIMITED" });
      }
      if (aiResponse.status === 403 || aiResponse.status === 401) {
        return jsonResponse({ error: "Google AI API key is invalid or has insufficient permissions.", code: "AI_AUTH_FAILED" });
      }
      return jsonResponse({ error: "AI itinerary generation failed.", code: "AI_UPSTREAM_FAILED" });
    }

    const aiData = await aiResponse.json();
    const rawText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const finishReason = aiData.candidates?.[0]?.finishReason || "";

    if (!rawText || rawText.trim().length < 10) {
      console.error("Empty or blocked AI response. finishReason:", finishReason, "rawText:", rawText);
      return jsonResponse({ error: "The AI could not generate an itinerary for this destination. Try a different city or rephrasing.", code: "AI_EMPTY_RESPONSE" });
    }

    let parsed: any;
    try {
      let cleaned = rawText.replace(/```(?:json)?\s*/gi, "").replace(/```\s*/g, "").trim();
      const jsonStart = cleaned.search(/\{/);
      const jsonEnd = cleaned.lastIndexOf("}");
      if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON found");
      parsed = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
    } catch (e) {
      console.error("Failed to parse itinerary JSON:", e, rawText);
      return jsonResponse({ error: "Failed to parse generated itinerary.", code: "AI_RESPONSE_PARSE_FAILED" });
    }

    const title = parsed.title || `${cities.join(" → ")} Trip`;
    const days = parsed.days || [];
    const budgetSummary = parsed.budget_summary || {};
    const totalCost = budgetSummary.estimated_total || 0;

    const { data: itinerary, error: insertError } = await supabase
      .from("itineraries")
      .insert({
        user_id: user.id,
        trip_id: trip_id || null,
        title, cities, days_count,
        content: days,
        budget_summary: budgetSummary,
        generated_by: "gemini",
        total_est_cost_inr: totalCost,
      })
      .select().single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return jsonResponse({ error: "Failed to save itinerary.", code: "SAVE_FAILED" });
    }

    console.log("Itinerary generated and saved:", itinerary.id);
    return jsonResponse({ itinerary, start_date });
  } catch (err: any) {
    console.error("generate-itinerary error:", err);
    return jsonResponse({ error: err?.message || "Unexpected failure.", code: "GENERATE_FAILED" });
  }
});
