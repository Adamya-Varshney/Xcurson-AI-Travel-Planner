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

    const dietary = (profile?.food_preferences as any)?.dietary || [];
    const interests = (profile?.experience_preferences as any)?.interests || [];
    const budgetRange = (profile?.place_preferences as any)?.budget_range || "mid";
    const pace = (profile?.place_preferences as any)?.travel_pace || "balanced";

    const prompt = `You are a travel itinerary generator. Generate a detailed day-by-day itinerary as strict JSON.

Rules:
- Output ONLY valid JSON, no markdown, no code fences.
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
  - "description" (string, 1-2 sentences)
  - "start_time" (string, e.g. "09:00 AM")
  - "end_time" (string, e.g. "12:00 PM")
  - "duration_hrs" (number, e.g. 2.5)
  - "cost_inr" (integer, activity/entry fee cost in INR)
  - "commute_cost_inr" (integer, estimated commute/transport cost to reach the venue)
  - "food_cost_inr" (integer, estimated meal/snack cost during this slot, 0 if no meal)
  - "accommodation_cost_inr" (integer, only for evening slot if overnight stay is relevant, 0 otherwise)
  - "transport_mode" (string, one of: "Walk", "Auto/Rickshaw", "Taxi/Cab", "Metro", "Bus", "Train", "Bicycle", "Motorbike/Scooter", "Private Car", "Ferry/Boat", "Flight", "Other" — the recommended mode of transport to reach this venue)
  - "travel_note" (string, how to get there or tips, max 1 sentence)
- Morning activities should start around 8-9 AM, afternoon around 1-2 PM, evening around 6-7 PM. Times should flow naturally.
- "budget_summary" has: "estimated_total" (int), "per_head" (int), "breakdown" (object with keys like "accommodation", "food", "transport", "activities" each as int)
- Respect the traveler's dietary restrictions: ${dietary.length > 0 ? dietary.join(", ") : "none specified"}.
- Tailor to interests: ${interests.length > 0 ? interests.join(", ") : "general exploration"}.
- Budget level: ${budgetRange}. Pace: ${pace}.
- Trip mode: ${trip_mode || "solo"}.
${start_date ? `- The trip starts on ${start_date}.` : ""}

Generate a ${days_count}-day itinerary for: ${cities.join(", ")}. Trip mode: ${trip_mode || "solo"}.`;

    console.log("Generating itinerary for:", cities, days_count, trip_mode, start_date);

    const model = "gemini-2.5-pro";
    const aiResponse = await fetch(
      `${GEMINI_API}/${model}:generateContent?key=${GOOGLE_AI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7,
            maxOutputTokens: 4000,
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
