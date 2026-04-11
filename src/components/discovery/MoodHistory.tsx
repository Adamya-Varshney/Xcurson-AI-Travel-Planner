import { useEffect, useState } from "react";
import { Clock, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

interface MoodSession {
  id: string;
  mood_state: string;
  energy_level: string;
  planning_horizon: string;
  trip_mode: string;
  ranked_destinations: any[] | null;
  created_at: string;
}

interface MoodHistoryProps {
  onRestore: (session: {
    mood: { mood_state: string; energy_level: string; planning_horizon: string };
    tripMode: string;
    destinations: any[];
  }) => void;
}

const MOOD_LABELS: Record<string, { icon: string; label: string }> = {
  burned_out: { icon: "😮‍💨", label: "Burned out" },
  adventurous: { icon: "🤩", label: "Adventurous" },
  social: { icon: "🎉", label: "Social" },
  reflective: { icon: "🧘", label: "Reflective" },
};

const ENERGY_ICONS: Record<string, string> = {
  low: "🔋",
  medium: "⚡",
  high: "🔥",
};

const MoodHistory = ({ onRestore }: MoodHistoryProps) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<MoodSession[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("mood_sessions")
        .select("id, mood_state, energy_level, planning_horizon, trip_mode, ranked_destinations, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setSessions((data as MoodSession[]) || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading || sessions.length === 0) return null;

  return (
    <div className="mt-8">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        <Clock className="w-4 h-4" />
        <span>Mood History</span>
        <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{sessions.length}</span>
        {expanded ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {sessions.map((s) => {
            const mood = MOOD_LABELS[s.mood_state] || { icon: "🌍", label: s.mood_state };
            const destCount = Array.isArray(s.ranked_destinations) ? s.ranked_destinations.length : 0;

            return (
              <button
                key={s.id}
                onClick={() =>
                  onRestore({
                    mood: { mood_state: s.mood_state, energy_level: s.energy_level, planning_horizon: s.planning_horizon },
                    tripMode: s.trip_mode,
                    destinations: (s.ranked_destinations as any[]) || [],
                  })
                }
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all text-left"
              >
                <span className="text-2xl">{mood.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <span>{mood.label}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{ENERGY_ICONS[s.energy_level] || "⚡"} {s.energy_level}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="capitalize text-muted-foreground">{s.trip_mode}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{destCount} destination{destCount !== 1 ? "s" : ""}</span>
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

export default MoodHistory;
