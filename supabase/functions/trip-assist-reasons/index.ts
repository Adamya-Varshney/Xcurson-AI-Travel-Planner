import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_AI_STUDIO_API_KEY = Deno.env.get("GOOGLE_AI_STUDIO_API_KEY")!;

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
    if (!destination || destination.length > 120) {
      return new Response(JSON.stringify({ error: "Invalid destination" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `For the destination "${destination}", list the 6 MOST LIKELY reasons a traveller would visit right now or in the coming months. Mix categories: famous annual/seasonal festivals or cultural events, popular tourism experiences, business/work, visiting friends or relatives, pilgrimage/spiritual, food & shopping, adventure/sports, romantic getaways, etc. Tailor to what "${destination}" is actually known for.

Return ONLY a valid JSON object in this exact shape, no markdown, no commentary:
{"reasons":[{"label":"<short reason, max 5 words>","icon":"<single emoji>","description":"<one helpful sentence, max 18 words>"}]}
Exactly 6 reasons. Most popular/likely first.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_STUDIO_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 800, responseMimeType: "application/json" },
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
    const text = aiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let reasons: Array<{ label: string; icon: string; description: string }> = [];
    try {
      const parsed = JSON.parse(text);
      reasons = Array.isArray(parsed?.reasons) ? parsed.reasons : [];
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try { reasons = JSON.parse(match[0])?.reasons || []; } catch {}
      }
    }

    reasons = reasons.slice(0, 6).map((r: any) => ({
      label: String(r?.label || "").slice(0, 60),
      icon: String(r?.icon || "✨").slice(0, 4),
      description: String(r?.description || "").slice(0, 160),
    })).filter((r) => r.label);

    if (reasons.length === 0) {
      return new Response(JSON.stringify({ error: "Could not generate reasons" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ destination, reasons }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("trip-assist-reasons error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
