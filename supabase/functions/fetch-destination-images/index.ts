const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const WIKIPEDIA_API_URL = "https://en.wikipedia.org/w/api.php";
const WIKIPEDIA_USER_AGENT = "Xcurson/1.0 (travel image discovery service)";

async function fetchImagesForDestination(name: string, country: string): Promise<string[]> {
  const query = `\"${name}\" ${country} travel landmarks tourism`;
  const url = new URL(WIKIPEDIA_API_URL);
  url.searchParams.set("action", "query");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", query);
  url.searchParams.set("gsrlimit", "8");
  url.searchParams.set("prop", "pageimages");
  url.searchParams.set("piprop", "thumbnail");
  url.searchParams.set("pithumbsize", "960");
  url.searchParams.set("pilimit", "8");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");

  const resp = await fetch(url.toString(), {
    headers: {
      "User-Agent": WIKIPEDIA_USER_AGENT,
      "Accept": "application/json",
    },
  });

  if (!resp.ok) {
    console.error(`Wikipedia API error for ${name}: ${resp.status} ${await resp.text()}`);
    return [];
  }

  const data = await resp.json();
  const pages = Object.values(data?.query?.pages ?? {}) as Array<{
    index?: number;
    title?: string;
    thumbnail?: { source?: string };
  }>;

  return pages
    .sort((a, b) => (a.index ?? Number.MAX_SAFE_INTEGER) - (b.index ?? Number.MAX_SAFE_INTEGER))
    .map((page) => page.thumbnail?.source)
    .filter((src): src is string => Boolean(src))
    .filter((src, index, arr) => arr.indexOf(src) === index)
    .slice(0, 5);
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

    await Promise.all(
      destinations.slice(0, 15).map(async (dest: { name: string; country: string }) => {
        try {
          results[dest.name] = await fetchImagesForDestination(dest.name, dest.country);
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
