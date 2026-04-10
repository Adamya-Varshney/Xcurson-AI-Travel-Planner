const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function fetchImagesForDestination(name: string, country: string, apiKey: string, cx: string): Promise<string[]> {
  const query = `${name} ${country} tourism attractions landmarks`;
  const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${cx}&key=${apiKey}&searchType=image&num=5&imgSize=large&safe=active`;

  const resp = await fetch(url);
  if (!resp.ok) {
    console.error(`Google API error for ${name}: ${resp.status} ${await resp.text()}`);
    return [];
  }

  const data = await resp.json();
  const items = data.items || [];
  return items.map((item: any) => item.link as string).filter(Boolean).slice(0, 5);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GOOGLE_CLOUD_API_KEY");
    const cx = Deno.env.get("GOOGLE_SEARCH_ENGINE_ID");

    if (!apiKey || !cx) {
      return new Response(
        JSON.stringify({ error: "Google API credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { destinations } = await req.json();

    if (!destinations || !Array.isArray(destinations) || destinations.length === 0) {
      return new Response(
        JSON.stringify({ error: "destinations array required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: Record<string, string[]> = {};

    await Promise.all(
      destinations.slice(0, 15).map(async (dest: { name: string; country: string }) => {
        try {
          results[dest.name] = await fetchImagesForDestination(dest.name, dest.country, apiKey, cx);
        } catch (err) {
          console.error(`Failed for ${dest.name}:`, err);
          results[dest.name] = [];
        }
      })
    );

    return new Response(
      JSON.stringify({ images: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("fetch-destination-images error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
