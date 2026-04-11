import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface WishlistItem {
  id: string;
  destination_name: string;
  country: string;
  region?: string;
  description?: string;
  experience_tags?: string[];
  budget_level?: string;
  fit_score?: number;
  match_reason?: string;
  source: string;
  created_at: string;
}

export const useWishlist = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [wishlistedNames, setWishlistedNames] = useState<Set<string>>(new Set());

  const fetchWishlist = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("wishlist")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const list = (data || []) as WishlistItem[];
      setItems(list);
      setWishlistedNames(new Set(list.map((i) => i.destination_name)));
    } catch (err: any) {
      console.error("Wishlist fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const toggle = useCallback(
    async (dest: {
      name: string;
      country: string;
      region?: string;
      description?: string;
      experience_tags?: string[];
      budget_level?: string;
      fit_score?: number;
      match_reason?: string;
    }, source: string) => {
      if (!user) return;

      if (wishlistedNames.has(dest.name)) {
        // Remove
        const { error } = await supabase
          .from("wishlist")
          .delete()
          .eq("user_id", user.id)
          .eq("destination_name", dest.name);
        if (error) {
          toast({ title: "Error", description: error.message, variant: "destructive" });
          return;
        }
        setWishlistedNames((prev) => { const n = new Set(prev); n.delete(dest.name); return n; });
        setItems((prev) => prev.filter((i) => i.destination_name !== dest.name));
        toast({ title: "Removed from wishlist" });
      } else {
        // Add
        const { data, error } = await supabase
          .from("wishlist")
          .insert({
            user_id: user.id,
            destination_name: dest.name,
            country: dest.country,
            region: dest.region || null,
            description: dest.description || null,
            experience_tags: dest.experience_tags || [],
            budget_level: dest.budget_level || null,
            fit_score: dest.fit_score || null,
            match_reason: dest.match_reason || null,
            source,
          })
          .select()
          .single();
        if (error) {
          toast({ title: "Error", description: error.message, variant: "destructive" });
          return;
        }
        setWishlistedNames((prev) => new Set(prev).add(dest.name));
        setItems((prev) => [data as WishlistItem, ...prev]);
        toast({ title: "Added to wishlist ❤️" });
      }
    },
    [user, wishlistedNames]
  );

  const isWishlisted = useCallback((name: string) => wishlistedNames.has(name), [wishlistedNames]);

  return { items, loading, toggle, isWishlisted, refresh: fetchWishlist };
};
