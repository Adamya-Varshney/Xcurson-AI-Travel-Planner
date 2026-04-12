const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getUnsplashImages(name: string, country: string): string[] {
  const queries = [
    `${name} ${country} landmark`,
    `${name} tourism`,
    `${name} attractions`,
    `${name} scenery`,
    `${name} ${country} travel`,
  ];
  return queries.map(
    (q) => `https://source.unsplash.com/800x600/?${encodeURIComponent(q)}`
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { destinations } = await req.json();

    if (!destinations || !Array.isArray(destinations) || destinations.length === 0) {
      return new Response(
        JSON.stringify({ error: "destinations array required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: Record<string, string[]> = {};

    for (const dest of destinations.slice(0, 15)) {
      results[dest.name] = getUnsplashImages(dest.name, dest.country);
    }

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
