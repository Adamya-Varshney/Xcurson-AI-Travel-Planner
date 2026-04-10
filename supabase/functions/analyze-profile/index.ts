import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const { onboardingData } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `Analyze this traveler's onboarding data and determine their experience level.

Onboarding Data:
${JSON.stringify(onboardingData, null, 2)}

Based on past destinations count/variety, travel frequency, travel style, and budget range, determine:
- "first_timer" (0-2 trips, new to travel)
- "building" (3-9 trips, growing confidence)
- "experienced" (10+ trips or diverse/complex travel patterns)

Return ONLY one of: first_timer, building, experienced`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are a travel profile analyzer. Respond with exactly one of: first_timer, building, experienced" },
          { role: "user", content: prompt },
        ],
      }),
    });

    let experienceLevel = "first_timer";

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const rawLevel = aiData.choices?.[0]?.message?.content?.trim()?.toLowerCase() || "";
      const validLevels = ["first_timer", "building", "experienced"];
      experienceLevel = validLevels.includes(rawLevel) ? rawLevel : "first_timer";
    } else {
      // Fallback to rule-based
      const tripCount = onboardingData.pastDestinations?.length || 0;
      if (tripCount >= 10) experienceLevel = "experienced";
      else if (tripCount >= 3) experienceLevel = "building";
    }

    // Update profile with service role
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await adminClient
      .from("user_profiles")
      .update({ experience_level: experienceLevel })
      .eq("user_id", userId);

    return new Response(JSON.stringify({ experience_level: experienceLevel }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-profile error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
