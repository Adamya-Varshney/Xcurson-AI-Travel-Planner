import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ArrowLeft, MapPin, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/hooks/useWishlist";

const Wishlist = () => {
  const { items, loading, toggle } = useWishlist();
  const navigate = useNavigate();

  const handleCreateItinerary = (item: typeof items[0]) => {
    navigate("/itinerary", {
      state: {
        prefillCity: `${item.destination_name}, ${item.country}`,
        autoGenerate: false,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="px-4 sm:px-6 py-3 flex items-center gap-3 border-b border-border">
        <Link to="/">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <Heart className="w-5 h-5 text-red-500" />
        <h1 className="text-lg font-display font-bold text-foreground">Wishlist</h1>
        <span className="text-sm text-muted-foreground">({items.length})</span>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">Your wishlist is empty</p>
            <p className="text-sm text-muted-foreground/70">
              Tap the heart icon on any destination to save it here
            </p>
            <Link to="/discover">
              <Button variant="outline" className="mt-4">Discover Destinations</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
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
                  <div className="flex items-center gap-2">
                    {item.fit_score && (
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {item.fit_score}%
                      </span>
                    )}
                    <button
                      onClick={() => toggle(
                        { name: item.destination_name, country: item.country, region: item.region },
                        item.source
                      )}
                      className="p-1.5 rounded-full text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {item.match_reason && (
                  <p className="text-sm text-foreground/70 italic">"{item.match_reason}"</p>
                )}

                {item.experience_tags && item.experience_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {item.experience_tags.slice(0, 5).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full text-[11px] bg-muted text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <Button
                  onClick={() => handleCreateItinerary(item)}
                  className="w-full gradient-primary border-0 gap-2"
                  size="sm"
                >
                  <Sparkles className="w-4 h-4" />
                  Create Itinerary
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Wishlist;
