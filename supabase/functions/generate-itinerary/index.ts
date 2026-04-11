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
    const { cities, days_count, trip_mode, trip_id } = body;

    if (!cities || !Array.isArray(cities) || cities.length === 0) {
      return new Response(JSON.stringify({ error: "cities[] is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!days_count || days_count < 1 || days_count > 14) {
      return new Response(JSON.stringify({ error: "days_count must be 1-14" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user profile for constraints
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const dietary = (profile?.food_preferences as any)?.dietary || [];
    const interests = (profile?.experience_preferences as any)?.interests || [];
    const budgetRange = (profile?.place_preferences as any)?.budget_range || "mid";
    const pace = (profile?.place_preferences as any)?.travel_pace || "balanced";

    const systemPrompt = `You are a travel itinerary generator. Generate a detailed day-by-day itinerary as strict JSON.

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
  - "duration_hrs" (number, e.g. 2.5)
  - "cost_inr" (integer, estimated cost in INR)
  - "travel_note" (string, how to get there or tips, max 1 sentence)
- "budget_summary" has: "estimated_total" (int), "per_head" (int), "breakdown" (object with keys like "accommodation", "food", "transport", "activities" each as int)
- Respect the traveler's dietary restrictions: ${dietary.length > 0 ? dietary.join(", ") : "none specified"}.
- Tailor to interests: ${interests.length > 0 ? interests.join(", ") : "general exploration"}.
- Budget level: ${budgetRange}. Pace: ${pace}.
- Trip mode: ${trip_mode || "solo"}.`;

    const userPrompt = `Generate a ${days_count}-day itinerary for: ${cities.join(", ")}. Trip mode: ${trip_mode || "solo"}.`;

    console.log("Generating itinerary for:", cities, days_count, trip_mode);

    const aiResponse = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
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
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    let parsed: any;
    try {
      let cleaned = content
        .replace(/```(?:json)?\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();
      const jsonStart = cleaned.search(/\{/);
      const jsonEnd = cleaned.lastIndexOf("}");
      if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON found");
      cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse itinerary JSON:", e, content);
      return new Response(JSON.stringify({ error: "Failed to parse generated itinerary" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const title = parsed.title || `${cities.join(" → ")} Trip`;
    const days = parsed.days || [];
    const budgetSummary = parsed.budget_summary || {};
    const totalCost = budgetSummary.estimated_total || 0;

    // Save to DB
    const { data: itinerary, error: insertError } = await supabase
      .from("itineraries")
      .insert({
        user_id: user.id,
        trip_id: trip_id || null,
        title,
        cities,
        days_count,
        content: days,
        budget_summary: budgetSummary,
        generated_by: "gemini",
        total_est_cost_inr: totalCost,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to save itinerary" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Itinerary generated and saved:", itinerary.id);

    return new Response(JSON.stringify({ itinerary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("generate-itinerary error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
