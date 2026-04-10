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

const normalizeLandscapeType = (value: string | undefined) => {
  const v = (value || "").toLowerCase().trim();
  if (["mountain", "coastal", "urban", "forest", "desert", "tropical", "rural", "arctic"].includes(v)) return v;
  if (/(city|urban|street|building|interior|architectural|architecture|temple|palace|hall|museum)/.test(v)) return "urban";
  if (/(coast|coastal|beach|ocean|sea|shore|island)/.test(v)) return "coastal";
  if (/(forest|wood|woods|jungle|rainforest)/.test(v)) return "forest";
  if (/(desert|dune|canyon)/.test(v)) return "desert";
  if (/(tropical|palm|lagoon)/.test(v)) return "tropical";
  if (/(rural|village|farmland|countryside)/.test(v)) return "rural";
  if (/(snow|ice|glacier|arctic)/.test(v)) return "arctic";
  return "urban";
};

const normalizeCrowdDensity = (value: string | undefined) => {
  const v = (value || "").toLowerCase().trim();
  if (["empty", "sparse", "moderate", "busy", "packed"].includes(v)) return v;
  if (/(empty|none|deserted|quiet)/.test(v)) return "empty";
  if (/(few|minimal|light|sparse)/.test(v)) return "sparse";
  if (/(moderate|some|medium)/.test(v)) return "moderate";
  if (/(busy|crowded|active)/.test(v)) return "busy";
  if (/(packed|jammed|dense)/.test(v)) return "packed";
  return "moderate";
};

const normalizePace = (value: string | undefined) => {
  const v = (value || "").toLowerCase().trim();
  if (["slow", "moderate", "fast"].includes(v)) return v;
  if (/(slow|calm|serene|leisurely|gentle)/.test(v)) return "slow";
  if (/(fast|rapid|energetic|dynamic)/.test(v)) return "fast";
  return "moderate";
};

const normalizeLightQuality = (value: string | undefined) => {
  const v = (value || "").toLowerCase().trim();
  if (["golden_hour", "bright", "overcast", "twilight", "night"].includes(v)) return v;
  if (/(golden|sunset|sunrise)/.test(v)) return "golden_hour";
  if (/(bright|sunny|daylight|well-lit)/.test(v)) return "bright";
  if (/(twilight|dusk|dawn|evening)/.test(v)) return "twilight";
  if (/(night|dark)/.test(v)) return "night";
  return "overcast";
};

const normalizePrimaryActivity = (value: string | undefined) => {
  const v = (value || "").toLowerCase().trim();
  if (["relaxation", "adventure", "culture", "nightlife", "nature", "gastronomy", "spirituality"].includes(v)) return v;
  if (/(culture|history|museum|architecture|sightseeing|heritage|art)/.test(v)) return "culture";
  if (/(adventure|hiking|trekking|climbing|exploring)/.test(v)) return "adventure";
  if (/(nature|wildlife|landscape|outdoors)/.test(v)) return "nature";
  if (/(food|dining|cuisine|gastronomy)/.test(v)) return "gastronomy";
  if (/(spiritual|temple|meditation|ritual)/.test(v)) return "spirituality";
  if (/(party|nightlife|club|bar)/.test(v)) return "nightlife";
  return "relaxation";
};

const normalizeExtractedVibe = (raw: any) => ({
  landscape_type: normalizeLandscapeType(raw?.landscape_type),
  crowd_density: normalizeCrowdDensity(raw?.crowd_density),
  pace: normalizePace(raw?.pace),
  light_quality: normalizeLightQuality(raw?.light_quality),
  primary_activity: normalizePrimaryActivity(raw?.primary_activity),
  mood_tags: Array.isArray(raw?.mood_tags)
    ? raw.mood_tags.map((tag: unknown) => String(tag).toLowerCase().trim()).filter(Boolean).slice(0, 5)
    : ["atmospheric", "travel", "scenic"],
  match_explanation: typeof raw?.match_explanation === "string" && raw.match_explanation.trim()
    ? raw.match_explanation.trim()
    : "Matches because — this image evokes a unique travel vibe.",
});

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

    // Fetch the image URL — if it's a webpage, try to extract the OG image
    let actualImageUrl = image_url;
    const probeResp = await fetch(image_url, { redirect: "follow" });
    if (!probeResp.ok) {
      return new Response(
        JSON.stringify({ error: "Could not fetch the provided URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const probeContentType = probeResp.headers.get("content-type") || "";

    if (probeContentType.startsWith("text/html")) {
      // It's a webpage — try to extract og:image
      const html = await probeResp.text();
      const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
      if (ogMatch && ogMatch[1]) {
        actualImageUrl = ogMatch[1];
        console.log("Extracted OG image URL:", actualImageUrl);
      } else {
        return new Response(
          JSON.stringify({ error: "That URL is a webpage, not an image. Please paste a direct image URL (ending in .jpg, .png, etc.) or upload a file instead." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // It was already an image, but we consumed the body in probeResp — we'll re-fetch below
    }

    // Now fetch the actual image
    const imageResp = probeContentType.startsWith("text/html")
      ? await fetch(actualImageUrl)
      : probeResp;

    if (probeContentType.startsWith("text/html") && !imageResp.ok) {
      return new Response(
        JSON.stringify({ error: "Could not fetch the image from the page" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const finalContentType = imageResp.headers.get("content-type") || "image/jpeg";
    if (!finalContentType.startsWith("image/")) {
      return new Response(
        JSON.stringify({ error: "The URL does not point to an image. Please use a direct image URL or upload a file." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const imageBuffer = await imageResp.arrayBuffer();
    const bytes = new Uint8Array(imageBuffer);
    const CHUNK = 8192;
    let binary = "";
    for (let i = 0; i < bytes.length; i += CHUNK) {
      const chunk = bytes.subarray(i, Math.min(i + CHUNK, bytes.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64Image = btoa(binary);
    const contentType = finalContentType;

    const vibeExtractionResponse = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "Analyze the provided travel image and return ONLY a JSON object with the exact keys landscape_type, crowd_density, pace, light_quality, primary_activity, mood_tags, match_explanation. Use these enum values only: landscape_type=mountain|coastal|urban|forest|desert|tropical|rural|arctic, crowd_density=empty|sparse|moderate|busy|packed, pace=slow|moderate|fast, light_quality=golden_hour|bright|overcast|twilight|night, primary_activity=relaxation|adventure|culture|nightlife|nature|gastronomy|spirituality. mood_tags must be 3-5 short words. match_explanation must be one sentence starting with 'Matches because —'. No markdown.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Return the vibe attributes as strict JSON using the allowed values.",
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
        temperature: 0.1,
        max_tokens: 350,
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
    const vibeChoice = vibeAiData.choices?.[0];
    const vibeContent = vibeChoice?.message?.content || "";
    const finishReason = vibeChoice?.finish_reason;

    // Parse vibe JSON
    let extractedVibe: any;
    let matchExplanation: string;
    try {
      let cleaned = vibeContent
        .replace(/```(?:json)?\s*/gi, "")
        .replace(/``` ?\s*/g, "")
        .replace(/[\x00-\x1F\x7F]/g, "")
        .trim();

      const jsonStart = cleaned.search(/[\{\[]/);
      const jsonEnd = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));

      if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
        throw new Error(`No JSON found in AI response (finish_reason=${finishReason || "unknown"})`);
      }

      cleaned = cleaned.slice(jsonStart, jsonEnd + 1)
        .replace(/,\s*}/g, "}")
        .replace(/,\s*]/g, "]");

      extractedVibe = normalizeExtractedVibe(JSON.parse(cleaned));
      matchExplanation = extractedVibe.match_explanation;
      delete extractedVibe.match_explanation;
    } catch (parseErr) {
      console.error("Failed to parse vibe JSON:", parseErr, { finishReason, vibeContent });
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
        resolved_image_url: actualImageUrl,
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
