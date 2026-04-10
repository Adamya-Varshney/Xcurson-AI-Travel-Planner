const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

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

    // Verify user
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { mood_state, energy_level, planning_horizon, trip_mode } = body;

    // 1. Upsert mood session
    const { data: existingSession } = await supabase
      .from("mood_sessions")
      .select("id")
      .eq("user_id", user.id)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const sessionData = {
      user_id: user.id,
      mood_state: mood_state || "adventurous",
      energy_level: energy_level || "high",
      planning_horizon: planning_horizon || "exploring",
      trip_mode: trip_mode || "solo",
      expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    };

    let sessionId: string;
    if (existingSession) {
      await supabase
        .from("mood_sessions")
        .update(sessionData)
        .eq("id", existingSession.id);
      sessionId = existingSession.id;
    } else {
      const { data: newSession } = await supabase
        .from("mood_sessions")
        .insert(sessionData)
        .select("id")
        .single();
      sessionId = newSession!.id;
    }

    // 2. Fetch all destinations
    const { data: destinations } = await supabase
      .from("destinations")
      .select("*");

    if (!destinations || destinations.length === 0) {
      return new Response(JSON.stringify({ ranked: [], session_id: sessionId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Fetch user profile for personalization
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    // 4. Build condensed profile for AI
    const condensedProfile = profile ? {
      interests: (profile.experience_preferences as any)?.interests || [],
      travel_style: (profile.experience_preferences as any)?.travel_style || [],
      dietary: (profile.food_preferences as any)?.dietary || [],
      cuisines: (profile.food_preferences as any)?.cuisines || [],
      budget: (profile.place_preferences as any)?.budget_range || "mid",
      pace: (profile.place_preferences as any)?.travel_pace || "balanced",
      cultural: (profile.cultural_preferences as any)?.preferences || [],
      home_country: profile.home_country || "",
    } : {};

    // 5. Score destinations using mood affinities + profile match (local scoring, fast)
    const moodKey = mood_state || "adventurous";
    const scoredDestinations = destinations.map((dest: any) => {
      const affinities = dest.mood_affinities || {};
      const moodScore = affinities[moodKey] || 0.5;

      // Profile interest overlap
      const userInterests: string[] = condensedProfile.interests || [];
      const destTags: string[] = dest.experience_tags || [];
      const interestOverlap = userInterests.length > 0
        ? destTags.filter((t: string) => userInterests.some((i: string) => i.toLowerCase() === t.toLowerCase())).length / Math.max(userInterests.length, 1)
        : 0.5;

      // Budget match
      const budgetLevels: Record<string, number> = { budget: 0, mid: 1, premium: 2, luxury: 3 };
      const userBudget = budgetLevels[condensedProfile.budget || "mid"] ?? 1;
      const destBudget = budgetLevels[dest.budget_level || "mid"] ?? 1;
      const budgetMatch = 1 - Math.abs(userBudget - destBudget) / 3;

      // Pace match
      const paceMap: Record<string, number> = { slow: 0, moderate: 1, fast: 2 };
      const userPace = paceMap[condensedProfile.pace || "moderate"] ?? 1;
      const destPace = paceMap[dest.pace || "moderate"] ?? 1;
      const paceMatch = 1 - Math.abs(userPace - destPace) / 2;

      // Energy boost: high energy → prefer higher crowd, low → prefer lower
      const energyFactor = energy_level === "high" ? dest.crowd_level / 10 : (10 - dest.crowd_level) / 10;

      // Freshness bonus
      const freshnessBonus = (dest.freshness_score || 50) / 200;

      // Trip mode adjustment
      let modeMultiplier = 1;
      if (trip_mode === "solo") modeMultiplier = dest.crowd_level <= 5 ? 1.1 : 0.9;
      if (trip_mode === "group" || trip_mode === "family") modeMultiplier = dest.crowd_level >= 4 ? 1.1 : 0.9;

      const fitScore = Math.round(
        (moodScore * 0.30 + interestOverlap * 0.25 + budgetMatch * 0.15 + paceMatch * 0.10 + energyFactor * 0.10 + freshnessBonus * 0.10) * modeMultiplier * 100
      );

      return {
        destination_id: dest.id,
        name: dest.name,
        country: dest.country,
        region: dest.region,
        description: dest.description,
        landscape_type: dest.landscape_type,
        crowd_level: dest.crowd_level,
        pace: dest.pace,
        experience_tags: dest.experience_tags,
        visa_status_in: dest.visa_status_in,
        budget_level: dest.budget_level,
        freshness_score: dest.freshness_score,
        trend_direction: dest.trend_direction,
        dietary_friendly: dest.dietary_friendly,
        cover_image_url: dest.cover_image_url,
        fit_score: Math.min(fitScore, 99),
        mood_score: Math.round(moodScore * 100),
      };
    });

    // Sort by fit_score descending
    scoredDestinations.sort((a: any, b: any) => b.fit_score - a.fit_score);

    // 6. Use AI to generate match reasons for top 15
    const top15 = scoredDestinations.slice(0, 15);

    try {
      const aiResponse = await fetch("https://lovable.dev/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: `You generate ultra-short travel match reasons. Return a JSON array of objects with "name" and "reason" keys. Each reason must be exactly 1 sentence, max 15 words, explaining why this destination fits the user's current mood (${moodKey}, energy: ${energy_level || "high"}). Be specific and evocative. No markdown, just valid JSON array.`,
            },
            {
              role: "user",
              content: JSON.stringify(
                top15.map((d: any) => ({
                  name: d.name,
                  country: d.country,
                  tags: d.experience_tags?.slice(0, 3),
                  fit: d.fit_score,
                }))
              ),
            },
          ],
          temperature: 0.7,
          max_tokens: 800,
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || "";
        // Parse JSON from response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const reasons = JSON.parse(jsonMatch[0]);
          for (const r of reasons) {
            const match = top15.find((d: any) => d.name === r.name);
            if (match) (match as any).match_reason = r.reason;
          }
        }
      }
    } catch (aiErr) {
      console.error("AI match reason generation failed, using fallback:", aiErr);
    }

    // Fallback reasons for any without
    for (const dest of top15) {
      if (!(dest as any).match_reason) {
        (dest as any).match_reason = `Great ${moodKey} escape with ${dest.experience_tags?.[0] || "unique experiences"}.`;
      }
    }

    // Add match_reason to remaining (below top 15)
    for (const dest of scoredDestinations.slice(15)) {
      (dest as any).match_reason = `Matches your ${moodKey} mood.`;
    }

    // 7. Cache ranked results in session
    await supabase
      .from("mood_sessions")
      .update({ ranked_destinations: scoredDestinations.slice(0, 30) })
      .eq("id", sessionId);

    return new Response(
      JSON.stringify({
        ranked: scoredDestinations.slice(0, 30),
        session_id: sessionId,
        mood: { mood_state: moodKey, energy_level, planning_horizon, trip_mode },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("discover-destinations error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
