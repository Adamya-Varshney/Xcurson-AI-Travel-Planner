import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_AI_STUDIO_API_KEY = Deno.env.get("GOOGLE_AI_STUDIO_API_KEY")!;

// TODO: replace with the user-provided system prompt.
const SYSTEM_PROMPT = `You are Xcurson's Trip Assist — a warm, sharp travel concierge.

Given a DESTINATION and the user's REASON for visiting, produce a crisp, aesthetic, easy-to-scan recommendation in MARKDOWN.

Guidelines:
- Open with a 1-line vivid hook tying the destination to the reason.
- Use short H3 section headings with relevant emojis (e.g. "### 🛍 Where to Shop", "### 👗 What to Wear", "### 🎁 Best Gifts to Bring Back", "### 🍽 Must-Try Food", "### 💡 Insider Tips").
- Use bullet lists; each bullet 1 line, concrete and specific (real market names, neighbourhoods, dishes, etiquette tips, ideal outfits).
- Pick only the 4–6 sections most relevant to the user's stated reason. Don't pad.
- Use **bold** sparingly for key names.
- No fluff, no disclaimers, no "I hope this helps".
- Keep total response under 350 words.`;

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
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    const isCustom = !!body?.is_custom_reason;
    const suggestedReasons = Array.isArray(body?.suggested_reasons) ? body.suggested_reasons : [];

    if (!destination || destination.length > 120 || !reason || reason.length > 240) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `DESTINATION: ${destination}\nREASON FOR VISITING: ${reason}\n\nProduce the markdown recommendation now.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GOOGLE_AI_STUDIO_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.85, maxOutputTokens: 2048 },
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
    const markdown = aiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!markdown) {
      return new Response(JSON.stringify({ error: "Empty AI response" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: saved } = await supabase
      .from("trip_assist_queries")
      .insert({
        user_id: user.id,
        destination,
        reason,
        is_custom_reason: isCustom,
        response_md: markdown,
        suggested_reasons: suggestedReasons,
      })
      .select("id, created_at")
      .single();

    return new Response(JSON.stringify({ markdown, id: saved?.id, created_at: saved?.created_at }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("trip-assist-recommend error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
