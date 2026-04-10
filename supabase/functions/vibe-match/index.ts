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
    // Auth
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
    const { image_url } = body;

    if (!image_url) {
      return new Response(
        JSON.stringify({ error: "image_url is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ─── STEP 1: Vibe Extraction via Gemini Pro Vision ───
    console.log("Step 1: Extracting vibe from image...");

    // Fetch the image and convert to base64
    const imageResp = await fetch(image_url);
    if (!imageResp.ok) {
      return new Response(
        JSON.stringify({ error: "Could not fetch image" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    const imageBuffer = await imageResp.arrayBuffer();
    const base64Image = btoa(
      String.fromCharCode(...new Uint8Array(imageBuffer))
    );
    const contentType = imageResp.headers.get("content-type") || "image/jpeg";

    const vibeExtractionResponse = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: `You are a travel vibe analyst. Analyze the provided travel/landscape image and extract structured vibe data. Return ONLY a valid JSON object with these exact keys:
{
  "landscape_type": "one of: mountain, coastal, urban, forest, desert, tropical, rural, arctic",
  "crowd_density": "one of: empty, sparse, moderate, busy, packed",
  "pace": "one of: slow, moderate, fast",
  "light_quality": "one of: golden_hour, bright, overcast, twilight, night",
  "primary_activity": "one of: relaxation, adventure, culture, nightlife, nature, gastronomy, spirituality",
  "mood_tags": ["array", "of", "3-5", "mood", "words"],
  "match_explanation": "A 1-sentence explanation starting with 'Matches because —' explaining the travel vibe this image evokes"
}
Do NOT include any markdown formatting or code fences. Return ONLY the raw JSON object.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this travel image and extract the vibe attributes.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${contentType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!vibeExtractionResponse.ok) {
      const errText = await vibeExtractionResponse.text();
      console.error("Vibe extraction AI error:", vibeExtractionResponse.status, errText);
      
      if (vibeExtractionResponse.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (vibeExtractionResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(
        JSON.stringify({ error: "AI vibe extraction failed" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const vibeAiData = await vibeExtractionResponse.json();
    const vibeContent = vibeAiData.choices?.[0]?.message?.content || "";

    // Parse vibe JSON
    let extractedVibe: any;
    let matchExplanation: string;
    try {
      const jsonMatch = vibeContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in AI response");
      extractedVibe = JSON.parse(jsonMatch[0]);
      matchExplanation = extractedVibe.match_explanation || "Matches because — this image evokes a unique travel vibe.";
      delete extractedVibe.match_explanation;
    } catch (parseErr) {
      console.error("Failed to parse vibe JSON:", parseErr, vibeContent);
      return new Response(
        JSON.stringify({ error: "Failed to parse vibe data from image" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Extracted vibe:", JSON.stringify(extractedVibe));

    // ─── STEP 2: Destination Matching via Gemini Flash ───
    console.log("Step 2: Matching destinations...");

    // Fetch destinations + user profile
    const [destResult, profileResult] = await Promise.all([
      supabase.from("destinations").select("*"),
      supabase.from("user_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    ]);

    const destinations = destResult.data || [];
    const profile = profileResult.data;

    if (destinations.length === 0) {
      return new Response(
        JSON.stringify({
          extracted_vibe: extractedVibe,
          match_explanation: matchExplanation,
          matched_destinations: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build condensed destination list for AI
    const destSummary = destinations.map((d: any) => ({
      id: d.id,
      name: d.name,
      country: d.country,
      landscape: d.landscape_type,
      pace: d.pace,
      crowd: d.crowd_level,
      budget: d.budget_level,
      tags: d.experience_tags?.slice(0, 5),
      mood_affinities: d.mood_affinities,
    }));

    const userConstraints = profile
      ? {
          interests: (profile.experience_preferences as any)?.interests || [],
          budget: (profile.place_preferences as any)?.budget_range || "mid",
          pace: (profile.place_preferences as any)?.travel_pace || "balanced",
          dietary: (profile.food_preferences as any)?.dietary || [],
        }
      : {};

    const matchingResponse = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a destination matching engine. Given an extracted image vibe and a list of destinations, rank the top 10 destinations that best match the vibe. Return ONLY a valid JSON array of objects with keys: "id" (destination UUID), "fit_score" (0-99), "reason" (1 sentence, max 15 words). No markdown, no code fences.`,
          },
          {
            role: "user",
            content: JSON.stringify({
              vibe: extractedVibe,
              user_constraints: userConstraints,
              destinations: destSummary,
            }),
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    let matchedDestinations: any[] = [];

    if (matchingResponse.ok) {
      const matchData = await matchingResponse.json();
      const matchContent = matchData.choices?.[0]?.message?.content || "";
      try {
        const jsonMatch = matchContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const ranked = JSON.parse(jsonMatch[0]);
          // Merge with full destination data
          matchedDestinations = ranked
            .map((r: any) => {
              const dest = destinations.find((d: any) => d.id === r.id);
              if (!dest) return null;
              return {
                destination_id: dest.id,
                name: dest.name,
                country: dest.country,
                region: dest.region,
                description: dest.description,
                landscape_type: dest.landscape_type,
                crowd_level: dest.crowd_level,
                experience_tags: dest.experience_tags,
                budget_level: dest.budget_level,
                dietary_friendly: dest.dietary_friendly,
                visa_status_in: dest.visa_status_in,
                freshness_score: dest.freshness_score,
                trend_direction: dest.trend_direction,
                fit_score: Math.min(r.fit_score || 50, 99),
                match_reason: r.reason || "Matches your image vibe.",
              };
            })
            .filter(Boolean);
        }
      } catch (parseErr) {
        console.error("Failed to parse matching JSON:", parseErr, matchContent);
      }
    } else {
      console.error("Matching AI error:", matchingResponse.status, await matchingResponse.text());
    }

    // ─── STEP 3: Save results + cleanup image ───
    console.log("Step 3: Saving results...");

    // Save to vibe_searches
    await supabase.from("vibe_searches").insert({
      user_id: user.id,
      image_url_temp: image_url,
      extracted_vibe: extractedVibe,
      match_explanation: matchExplanation,
      matched_destinations: matchedDestinations,
    });

    // Delete temp image from storage (fire-and-forget)
    try {
      const urlObj = new URL(image_url);
      const pathParts = urlObj.pathname.split("/storage/v1/object/public/vibe-images/");
      if (pathParts.length > 1) {
        const filePath = decodeURIComponent(pathParts[1]);
        await supabase.storage.from("vibe-images").remove([filePath]);
        console.log("Deleted temp image:", filePath);
      }
    } catch (cleanupErr) {
      console.error("Image cleanup error (non-fatal):", cleanupErr);
    }

    return new Response(
      JSON.stringify({
        extracted_vibe: extractedVibe,
        match_explanation: matchExplanation,
        matched_destinations: matchedDestinations,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("vibe-match error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
