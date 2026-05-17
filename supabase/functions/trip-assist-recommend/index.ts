import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { PURPOSE_ENGINE_PROMPT } from "../_shared/purpose-engine-prompt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_AI_STUDIO_API_KEY = Deno.env.get("GOOGLE_AI_STUDIO_API_KEY")!;

const PRICE_BANDS = new Set(["₹","₹₹","₹₹₹","₹₹₹₹","free","n/a"]);

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
    const userQuery = typeof body?.user_query === "string" ? body.user_query.trim() : "";
    const selectedReason = body?.selected_reason && typeof body.selected_reason === "object" ? body.selected_reason : null;
    const reasonLabel = typeof body?.reason === "string" ? body.reason.trim() : (selectedReason?.title || "");
    const isCustom = !!body?.is_custom_reason;

    if (!destination || destination.length > 120 || !reasonLabel || !userQuery || userQuery.length > 500) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("home_city, home_country")
      .eq("user_id", user.id)
      .maybeSingle();

    const userTurn = {
      task: "generate_recommendations",
      destination,
      current_date: new Date().toISOString().slice(0, 10),
      selected_reason: selectedReason || { title: reasonLabel, category: isCustom ? "custom" : "iconic_tourism" },
      user_query: userQuery,
      user_home_city: profile?.home_city || null,
      user_home_country: profile?.home_country || null,
      user_age_band: "18-28",
    };

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GOOGLE_AI_STUDIO_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: PURPOSE_ENGINE_PROMPT + "\n\nUse Google Search to ground every recommendation in real, current, named places, markets, events, and prices. Cross-check dates and openings before answering. Return STRICT JSON only — no markdown fences, no prose." }] },
          contents: [{ role: "user", parts: [{ text: JSON.stringify(userTurn) }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
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

    const parsed: any = extractJson(text);

    if (!parsed) {
      return new Response(JSON.stringify({ error: "Could not parse AI response" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (parsed?.task_echo === "error") {
      return new Response(JSON.stringify({ error: parsed?.error_message || "AI returned error" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize recommendations
    const rawRecs: any[] = Array.isArray(parsed?.recommendations) ? parsed.recommendations : [];
    const recommendations = rawRecs.slice(0, 6).map((r: any, i: number) => ({
      id: String(r?.id || `rec_${i+1}`),
      title: String(r?.title || "").slice(0, 120),
      type: ["place","item","route","tip","how_to"].includes(r?.type) ? r.type : "tip",
      neighborhood: r?.neighborhood ? String(r.neighborhood).slice(0, 80) : null,
      why_it_fits: String(r?.why_it_fits || "").slice(0, 300),
      details: String(r?.details || "").slice(0, 800),
      price_band: PRICE_BANDS.has(r?.price_band) ? r.price_band : "n/a",
      best_time: r?.best_time ? String(r.best_time).slice(0, 120) : null,
      insider_tip: r?.insider_tip ? String(r.insider_tip).slice(0, 240) : null,
      tags: Array.isArray(r?.tags) ? r.tags.slice(0, 5).map((t: any) => String(t).slice(0, 30)) : [],
    })).filter((r) => r.title);

    const cleaned = {
      task_echo: "generate_recommendations",
      answer_summary: String(parsed?.answer_summary || "").slice(0, 280),
      intent_understood: String(parsed?.intent_understood || "").slice(0, 240),
      recommendations,
      what_to_pack: Array.isArray(parsed?.what_to_pack) ? parsed.what_to_pack.slice(0, 8).map((s: any) => String(s).slice(0, 80)) : [],
      watch_outs: Array.isArray(parsed?.watch_outs) ? parsed.watch_outs.slice(0, 6).map((s: any) => String(s).slice(0, 200)) : [],
      follow_up_prompts: Array.isArray(parsed?.follow_up_prompts) ? parsed.follow_up_prompts.slice(0, 3).map((s: any) => String(s).slice(0, 160)) : [],
      data_freshness_warning: parsed?.data_freshness_warning ? String(parsed.data_freshness_warning).slice(0, 280) : null,
    };

    const { data: saved } = await supabase
      .from("trip_assist_queries")
      .insert({
        user_id: user.id,
        destination,
        reason: reasonLabel,
        is_custom_reason: isCustom,
        user_query: userQuery,
        response_json: cleaned,
        answer_summary: cleaned.answer_summary,
        selected_reason_category: selectedReason?.category || null,
        suggested_reasons: Array.isArray(body?.suggested_reasons) ? body.suggested_reasons : [],
      })
      .select("id, created_at")
      .single();

    return new Response(JSON.stringify({ ...cleaned, id: saved?.id, created_at: saved?.created_at }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("trip-assist-recommend error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
