import { useEffect, useState } from "react";
import { Clock, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

interface VibeSearch {
  id: string;
  image_url_temp: string | null;
  extracted_vibe: any;
  match_explanation: string | null;
  matched_destinations: any[] | null;
  created_at: string;
}

interface VibeHistoryProps {
  refreshKey?: number;
  onRestore: (search: {
    imagePreview: string | null;
    extractedVibe: any;
    matchExplanation: string;
    matchedDestinations: any[];
  }) => void;
}

const VibeHistory = ({ refreshKey = 0, onRestore }: VibeHistoryProps) => {
  const { user } = useAuth();
  const [searches, setSearches] = useState<VibeSearch[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("vibe_searches")
        .select("id, image_url_temp, extracted_vibe, match_explanation, matched_destinations, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      setSearches((data as VibeSearch[]) || []);
      setLoading(false);
    };
    fetch();
  }, [user, refreshKey]);

  if (loading || searches.length === 0) return null;

  return (
    <div className="mt-8">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        <Clock className="w-4 h-4" />
        <span>Vibe History</span>
        <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{searches.length}</span>
        {expanded ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {searches.map((s) => {
            const vibe = s.extracted_vibe || {};
            const tags: string[] = [
              ...(vibe.landscape_type ? [vibe.landscape_type] : []),
              ...(vibe.mood ? [vibe.mood] : []),
              ...(vibe.pace ? [vibe.pace] : []),
            ].slice(0, 3);
            const destCount = Array.isArray(s.matched_destinations) ? s.matched_destinations.length : 0;

            return (
              <button
                key={s.id}
                onClick={() =>
                  onRestore({
                    imagePreview: null,
                    extractedVibe: s.extracted_vibe,
                    matchExplanation: s.match_explanation || "",
                    matchedDestinations: (s.matched_destinations as any[]) || [],
                  })
                }
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-lg">
                  ✨
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {tags.map((tag, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium capitalize">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span>{destCount} match{destCount !== 1 ? "es" : ""}</span>
                    <span>·</span>
                    <span>{formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VibeHistory;
