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
    const { itinerary_id, edit_instruction } = body;

    if (!itinerary_id || !edit_instruction) {
      return jsonResponse({ error: "itinerary_id and edit_instruction are required" }, 400);
    }

    const { data: itinerary, error: fetchError } = await supabase
      .from("itineraries").select("*").eq("id", itinerary_id).eq("user_id", user.id).single();

    if (fetchError || !itinerary) return jsonResponse({ error: "Itinerary not found" }, 404);

    const { data: profile } = await supabase
      .from("user_profiles").select("food_preferences").eq("user_id", user.id).maybeSingle();

    const dietary = (profile?.food_preferences as any)?.dietary || [];

    const prompt = `You are an itinerary editor. Apply ONLY the requested change to the itinerary. Keep all other days exactly as they are. Flag conflicts with dietary/cultural constraints and offer an alternative.

Dietary restrictions: ${dietary.length > 0 ? dietary.join(", ") : "none"}.

Return the COMPLETE updated itinerary as strict JSON with keys:
- "days": array of day objects (same format as input)
- "budget_summary": updated budget if costs changed
- "change_summary": 1 sentence describing what was changed

Output ONLY valid JSON, no markdown, no code fences.

Current itinerary:
${JSON.stringify(itinerary.content)}

Budget: ${JSON.stringify(itinerary.budget_summary)}

Edit request: "${edit_instruction}"`;

    console.log("Editing itinerary:", itinerary_id, "Instruction:", edit_instruction);

    const model = "gemini-2.5-flash-preview-05-20";
    const aiResponse = await fetch(
      `${GEMINI_API}/${model}:generateContent?key=${GOOGLE_AI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
            maxOutputTokens: 4000,
          },
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("Gemini API error:", aiResponse.status, errText);
      return jsonResponse({ error: "AI edit failed. Please try again.", code: "AI_ERROR" });
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
      console.error("Failed to parse edit JSON:", e, rawText);
      return jsonResponse({ error: "Failed to parse AI edit response." });
    }

    const updatedDays = parsed.days || itinerary.content;
    const updatedBudget = parsed.budget_summary || itinerary.budget_summary;
    const changeSummary = parsed.change_summary || "Itinerary updated.";

    const prevHistory: any[] = itinerary.edit_history || [];
    const newHistory = [
      ...prevHistory.slice(-4),
      { content: itinerary.content, budget_summary: itinerary.budget_summary, edited_at: new Date().toISOString() },
    ];

    const { data: updated, error: updateError } = await supabase
      .from("itineraries")
      .update({
        content: updatedDays,
        budget_summary: updatedBudget,
        edit_history: newHistory,
        is_user_edited: true,
        total_est_cost_inr: updatedBudget.estimated_total || itinerary.total_est_cost_inr,
      })
      .eq("id", itinerary_id).eq("user_id", user.id)
      .select().single();

    if (updateError) {
      console.error("Update error:", updateError);
      return jsonResponse({ error: "Failed to save edited itinerary." });
    }

    console.log("Itinerary edited:", itinerary_id);
    return jsonResponse({ itinerary: updated, change_summary: changeSummary });
  } catch (err: any) {
    console.error("edit-itinerary error:", err);
    return jsonResponse({ error: err.message });
  }
});
