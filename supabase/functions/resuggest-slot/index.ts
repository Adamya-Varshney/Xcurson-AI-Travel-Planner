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
    const { itinerary_id, day_number, time_slot } = body;

    if (!itinerary_id || !day_number || !time_slot) {
      return jsonResponse({ error: "itinerary_id, day_number, and time_slot are required" }, 400);
    }
    if (!["morning", "afternoon", "evening"].includes(time_slot)) {
      return jsonResponse({ error: "time_slot must be morning, afternoon, or evening" }, 400);
    }

    const { data: itinerary, error: fetchError } = await supabase
      .from("itineraries").select("content, cities").eq("id", itinerary_id).eq("user_id", user.id).single();

    if (fetchError || !itinerary) return jsonResponse({ error: "Itinerary not found" }, 404);

    const days = itinerary.content as any[];
    const targetDay = days.find((d: any) => d.day_number === day_number);
    if (!targetDay) return jsonResponse({ error: `Day ${day_number} not found` }, 404);

    const currentActivity = targetDay[time_slot];
    const city = targetDay.city || itinerary.cities?.[0] || "the city";

    const { data: profile } = await supabase
      .from("user_profiles").select("food_preferences, experience_preferences").eq("user_id", user.id).maybeSingle();

    const dietary = (profile?.food_preferences as any)?.dietary || [];
    const interests = (profile?.experience_preferences as any)?.interests || [];

    const prompt = `You suggest 3 alternative activities for a specific time slot in a travel itinerary. Return ONLY a JSON object with key "alternatives" containing an array of 3 activity objects, each with: "activity" (string), "description" (string, 1-2 sentences), "duration_hrs" (number), "cost_inr" (integer), "travel_note" (string, 1 sentence). No markdown.

City: ${city}. Day ${day_number}, ${time_slot}. Current activity: "${currentActivity?.activity || "free time"}". Suggest 3 different alternatives. Dietary: ${dietary.join(", ") || "none"}. Interests: ${interests.join(", ") || "general"}.`;

    console.log("Re-suggesting slot:", day_number, time_slot, "in", city);

    const model = "gemini-2.5-flash-lite";
    const aiResponse = await fetch(
      `${GEMINI_API}/${model}:generateContent?key=${GOOGLE_AI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.8,
            maxOutputTokens: 800,
          },
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("Gemini API error:", aiResponse.status, errText);
      return jsonResponse({ error: "AI suggestion failed. Please try again.", code: "AI_ERROR" });
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
      console.error("Failed to parse suggestions:", e, rawText);
      return jsonResponse({ error: "Failed to parse AI suggestions." });
    }

    return jsonResponse({
      day_number,
      time_slot,
      current_activity: currentActivity,
      alternatives: parsed.alternatives || [],
    });
  } catch (err: any) {
    console.error("resuggest-slot error:", err);
    return jsonResponse({ error: err.message });
  }
});
