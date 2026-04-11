import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { itinerary_id, day_number, time_slot } = body;

    if (!itinerary_id || !day_number || !time_slot) {
      return new Response(JSON.stringify({ error: "itinerary_id, day_number, and time_slot (morning|afternoon|evening) are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["morning", "afternoon", "evening"].includes(time_slot)) {
      return new Response(JSON.stringify({ error: "time_slot must be morning, afternoon, or evening" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch itinerary
    const { data: itinerary, error: fetchError } = await supabase
      .from("itineraries")
      .select("content, cities")
      .eq("id", itinerary_id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !itinerary) {
      return new Response(JSON.stringify({ error: "Itinerary not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const days = itinerary.content as any[];
    const targetDay = days.find((d: any) => d.day_number === day_number);
    if (!targetDay) {
      return new Response(JSON.stringify({ error: `Day ${day_number} not found` }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currentActivity = targetDay[time_slot];
    const city = targetDay.city || itinerary.cities?.[0] || "the city";

    // Fetch user profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("food_preferences, experience_preferences")
      .eq("user_id", user.id)
      .maybeSingle();

    const dietary = (profile?.food_preferences as any)?.dietary || [];
    const interests = (profile?.experience_preferences as any)?.interests || [];

    const systemPrompt = `You suggest 3 alternative activities for a specific time slot in a travel itinerary. Return ONLY a JSON object with key "alternatives" containing an array of 3 activity objects, each with: "activity" (string), "description" (string, 1-2 sentences), "duration_hrs" (number), "cost_inr" (integer), "travel_note" (string, 1 sentence). No markdown.`;

    const userPrompt = `City: ${city}. Day ${day_number}, ${time_slot}. Current activity: "${currentActivity?.activity || "free time"}". Suggest 3 different alternatives. Dietary: ${dietary.join(", ") || "none"}. Interests: ${interests.join(", ") || "general"}.`;

    console.log("Re-suggesting slot:", day_number, time_slot, "in", city);

    const aiResponse = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 800,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI suggestion failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    let parsed: any;
    try {
      let cleaned = content.replace(/```(?:json)?\s*/gi, "").replace(/```\s*/g, "").trim();
      const jsonStart = cleaned.search(/\{/);
      const jsonEnd = cleaned.lastIndexOf("}");
      if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON found");
      parsed = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
    } catch (e) {
      console.error("Failed to parse suggestions:", e, content);
      return new Response(JSON.stringify({ error: "Failed to parse AI suggestions" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const alternatives = parsed.alternatives || [];

    return new Response(JSON.stringify({
      day_number,
      time_slot,
      current_activity: currentActivity,
      alternatives,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("resuggest-slot error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
