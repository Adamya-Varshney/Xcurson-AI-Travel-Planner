import { corsHeaders } from "@supabase/supabase-js/cors";

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

    // Fetch images for each destination using Wikimedia Commons API
    const results: Record<string, string[]> = {};

    await Promise.all(
      destinations.slice(0, 15).map(async (dest: { name: string; country: string }) => {
        try {
          const query = `${dest.name} ${dest.country} landmark attraction`;
          const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=6&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=600&format=json&origin=*`;

          const resp = await fetch(url, {
            headers: { "User-Agent": "LovableTravelApp/1.0" },
          });

          if (!resp.ok) {
            results[dest.name] = [];
            return;
          }

          const data = await resp.json();
          const pages = data.query?.pages || {};
          const imageUrls: string[] = [];

          for (const page of Object.values(pages) as any[]) {
            const info = page.imageinfo?.[0];
            if (info?.thumburl) {
              // Filter out SVGs, icons, logos
              const thumbUrl: string = info.thumburl;
              if (
                !thumbUrl.endsWith(".svg") &&
                !thumbUrl.includes("logo") &&
                !thumbUrl.includes("icon") &&
                !thumbUrl.includes("Flag_of")
              ) {
                imageUrls.push(thumbUrl);
              }
            }
          }

          results[dest.name] = imageUrls.slice(0, 5);
        } catch (err) {
          console.error(`Failed to fetch images for ${dest.name}:`, err);
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
