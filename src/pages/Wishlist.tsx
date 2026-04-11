import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, MapPin, Sparkles, Trash2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface WishlistItem {
  id: string;
  destination_name: string;
  country: string;
  region?: string | null;
  description?: string | null;
  fit_score?: number | null;
  match_reason?: string | null;
  budget_level?: string | null;
  experience_tags?: string[] | null;
  source?: string | null;
  created_at: string;
}

const Wishlist = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("wishlist")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setItems((data as WishlistItem[]) || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleRemove = async (id: string) => {
    await supabase.from("wishlist").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast({ title: "Removed from wishlist" });
  };

  const handleCreateItinerary = (item: WishlistItem) => {
    const dest = `${item.destination_name}, ${item.country}`;
    navigate(`/itinerary?destination=${encodeURIComponent(dest)}`);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-2 border-b border-border">
        <Link to="/">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <Heart className="w-5 h-5 text-primary fill-primary" />
        <h1 className="text-base sm:text-lg font-display font-bold text-foreground">Wishlist</h1>
        <span className="text-xs text-muted-foreground ml-auto">{items.length} saved</span>
      </header>

      <main className="max-w-lg mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <div className="w-12 h-12 rounded-2xl gradient-primary animate-pulse" />
            <p className="text-muted-foreground text-sm">Loading wishlist...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">Your wishlist is empty.</p>
            <p className="text-xs text-muted-foreground">Tap the ❤️ on any destination to save it here.</p>
            <Link to="/discover">
              <Button variant="outline" className="mt-4">Discover destinations</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            <AnimatePresence>
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-2xl border border-border bg-card p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display font-bold text-foreground">{item.destination_name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {item.country}{item.region ? ` · ${item.region}` : ""}
                      </p>
                    </div>
                    {item.fit_score && (
                      <span className="text-sm font-bold text-gradient">{item.fit_score}</span>
                    )}
                  </div>

                  {item.match_reason && (
                    <p className="text-xs text-muted-foreground italic">"{item.match_reason}"</p>
                  )}

                  {item.experience_tags && item.experience_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.experience_tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] bg-muted text-muted-foreground border border-border">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleCreateItinerary(item)}
                      size="sm"
                      className="flex-1 gradient-primary border-0 text-primary-foreground text-xs font-semibold gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Create Itinerary
                    </Button>
                    <Button
                      onClick={() => handleRemove(item.id)}
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default Wishlist;
