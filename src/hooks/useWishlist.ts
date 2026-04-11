import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useWishlist = () => {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("wishlist")
        .select("destination_name")
        .eq("user_id", user.id);
      if (data) setWishlistIds(new Set(data.map((d) => d.destination_name)));
    };
    fetch();
  }, [user]);

  const toggle = useCallback(
    async (dest: {
      name: string;
      country: string;
      region?: string;
      description?: string;
      fit_score?: number;
      match_reason?: string;
      budget_level?: string;
      experience_tags?: string[];
    }) => {
      if (!user) return;
      const isInWishlist = wishlistIds.has(dest.name);
      if (isInWishlist) {
        await supabase
          .from("wishlist")
          .delete()
          .eq("user_id", user.id)
          .eq("destination_name", dest.name);
        setWishlistIds((prev) => {
          const next = new Set(prev);
          next.delete(dest.name);
          return next;
        });
      } else {
        await supabase.from("wishlist").insert({
          user_id: user.id,
          destination_name: dest.name,
          country: dest.country,
          region: dest.region || null,
          description: dest.description || null,
          fit_score: dest.fit_score || null,
          match_reason: dest.match_reason || null,
          budget_level: dest.budget_level || null,
          experience_tags: dest.experience_tags || [],
          source: "mood_match",
        });
        setWishlistIds((prev) => new Set(prev).add(dest.name));
      }
    },
    [user, wishlistIds]
  );

  const isWishlisted = useCallback(
    (name: string) => wishlistIds.has(name),
    [wishlistIds]
  );

  return { toggle, isWishlisted };
};
