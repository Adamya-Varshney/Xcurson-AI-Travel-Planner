const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UA = "LovableTravelApp/1.0 (https://lovable.dev)";

async function fetchImagesForDestination(name: string): Promise<string[]> {
  // Step 1: Get image file titles from Wikipedia article
  const listUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(name)}&prop=images&imlimit=15&format=json`;
  const listResp = await fetch(listUrl, { headers: { "User-Agent": UA } });
  if (!listResp.ok) return [];

  const listData = await listResp.json();
  const pages = listData.query?.pages || {};
  const page = Object.values(pages)[0] as any;
  if (!page?.images) return [];

  // Filter to only .jpg/.jpeg/.png files, skip SVGs, flags, logos, icons, maps
  const imageFiles: string[] = page.images
    .map((img: any) => img.title as string)
    .filter((title: string) => {
      const lower = title.toLowerCase();
      return (
        (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png")) &&
        !lower.includes("flag") &&
        !lower.includes("logo") &&
        !lower.includes("icon") &&
        !lower.includes("coat_of_arms") &&
        !lower.includes("map") &&
        !lower.includes("locator") &&
        !lower.includes("commons-logo") &&
        !lower.includes("wiki")
      );
    })
    .slice(0, 6);

  if (imageFiles.length === 0) return [];

  // Step 2: Get thumb URLs for these files (batch up to 6)
  const titles = imageFiles.join("|");
  const infoUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=url&iiurlwidth=600&format=json`;
  const infoResp = await fetch(infoUrl, { headers: { "User-Agent": UA } });
  if (!infoResp.ok) return [];

  const infoData = await infoResp.json();
  const infoPages = infoData.query?.pages || {};
  const urls: string[] = [];

  for (const p of Object.values(infoPages) as any[]) {
    const thumbUrl = p.imageinfo?.[0]?.thumburl;
    if (thumbUrl) urls.push(thumbUrl);
  }

  return urls.slice(0, 5);
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
          results[dest.name] = await fetchImagesForDestination(dest.name);
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
