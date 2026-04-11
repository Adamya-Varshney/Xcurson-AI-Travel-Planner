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
    const { itinerary_id, edit_instruction } = body;

    if (!itinerary_id || !edit_instruction) {
      return new Response(JSON.stringify({ error: "itinerary_id and edit_instruction are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch existing itinerary
    const { data: itinerary, error: fetchError } = await supabase
      .from("itineraries")
      .select("*")
      .eq("id", itinerary_id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !itinerary) {
      return new Response(JSON.stringify({ error: "Itinerary not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user profile for dietary constraints
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("food_preferences")
      .eq("user_id", user.id)
      .maybeSingle();

    const dietary = (profile?.food_preferences as any)?.dietary || [];

    const systemPrompt = `You are an itinerary editor. Apply ONLY the requested change to the itinerary. Keep all other days exactly as they are. Flag conflicts with dietary/cultural constraints and offer an alternative.

Dietary restrictions: ${dietary.length > 0 ? dietary.join(", ") : "none"}.

Return the COMPLETE updated itinerary as strict JSON with the same structure:
- "days": array of day objects (same format as input)
- "budget_summary": updated budget if costs changed
- "change_summary": 1 sentence describing what was changed

Output ONLY valid JSON, no markdown, no code fences.`;

    const userPrompt = `Current itinerary:\n${JSON.stringify(itinerary.content)}\n\nBudget: ${JSON.stringify(itinerary.budget_summary)}\n\nEdit request: "${edit_instruction}"`;

    console.log("Editing itinerary:", itinerary_id, "Instruction:", edit_instruction);

    const aiResponse = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
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
      return new Response(JSON.stringify({ error: "AI edit failed" }), {
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
      console.error("Failed to parse edit JSON:", e, content);
      return new Response(JSON.stringify({ error: "Failed to parse AI edit response" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const updatedDays = parsed.days || itinerary.content;
    const updatedBudget = parsed.budget_summary || itinerary.budget_summary;
    const changeSummary = parsed.change_summary || "Itinerary updated.";

    // Save previous version in edit_history (max 5)
    const prevHistory: any[] = itinerary.edit_history || [];
    const newHistory = [
      ...prevHistory.slice(-(4)), // keep last 4
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
      .eq("id", itinerary_id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to save edited itinerary" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Itinerary edited:", itinerary_id);

    return new Response(JSON.stringify({ itinerary: updated, change_summary: changeSummary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("edit-itinerary error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
