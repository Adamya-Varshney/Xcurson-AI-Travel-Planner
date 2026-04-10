import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { Compass, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import MoodCheckIn from "@/components/discovery/MoodCheckIn";
import TripModeSwitcher from "@/components/discovery/TripModeSwitcher";
import DestinationCard from "@/components/discovery/DestinationCard";
import DestinationDetail from "@/components/discovery/DestinationDetail";
import DestinationImageCarousel from "@/components/discovery/DestinationImageCarousel";

interface RankedDestination {
  destination_id: string;
  name: string;
  country: string;
  region?: string;
  description?: string;
  landscape_type?: string[];
  crowd_level?: number;
  visa_status_in?: string;
  budget_level?: string;
  freshness_score?: number;
  trend_direction?: string;
  experience_tags?: string[];
  dietary_friendly?: string[];
  fit_score: number;
  match_reason?: string;
  mood_score?: number;
}

const Discover = () => {
  const { user, signOut } = useAuth();
  const [showMoodCheckIn, setShowMoodCheckIn] = useState(true);
  const [tripMode, setTripMode] = useState("solo");
  const [destinations, setDestinations] = useState<RankedDestination[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDest, setSelectedDest] = useState<RankedDestination | null>(null);
  const [currentMood, setCurrentMood] = useState<{ mood_state: string; energy_level: string; planning_horizon: string } | null>(null);
  const [destinationImages, setDestinationImages] = useState<Record<string, string[]>>({});

  const fetchDiscovery = useCallback(async (mood: { mood_state: string; energy_level: string; planning_horizon: string }, mode: string) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await supabase.functions.invoke("discover-destinations", {
        body: { ...mood, trip_mode: mode },
      });

      if (response.error) throw response.error;
      setDestinations(response.data.ranked || []);
    } catch (err: any) {
      console.error("Discovery error:", err);
      toast({ title: "Discovery error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  // Check for existing valid mood session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("mood_sessions")
        .select("*")
        .eq("user_id", user.id)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setCurrentMood({
          mood_state: data.mood_state,
          energy_level: data.energy_level,
          planning_horizon: data.planning_horizon,
        });
        setTripMode(data.trip_mode || "solo");
        if (data.ranked_destinations) {
          setDestinations(data.ranked_destinations as unknown as RankedDestination[]);
          setShowMoodCheckIn(false);
        }
      }
    };
    checkExistingSession();
  }, [user]);

  const handleMoodSubmit = async (mood: { mood_state: string; energy_level: string; planning_horizon: string }) => {
    setCurrentMood(mood);
    setShowMoodCheckIn(false);
    await fetchDiscovery(mood, tripMode);
  };

  const handleSkipMood = async () => {
    setShowMoodCheckIn(false);
    if (!currentMood) {
      const defaultMood = { mood_state: "adventurous", energy_level: "high", planning_horizon: "exploring" };
      setCurrentMood(defaultMood);
      await fetchDiscovery(defaultMood, tripMode);
    }
  };

  const handleTripModeChange = async (mode: string) => {
    setTripMode(mode);
    if (currentMood) {
      await fetchDiscovery(currentMood, mode);
    }
  };

  const handleAddToTrip = async () => {
    if (!selectedDest || !user) return;
    try {
      const { error } = await supabase.from("trips").insert({
        user_id: user.id,
        title: `Trip to ${selectedDest.name}`,
        destination: `${selectedDest.name}, ${selectedDest.country}`,
        status: "planning",
        trip_mode: tripMode,
      });
      if (error) throw error;
      toast({ title: "Trip created! 🎉", description: `${selectedDest.name} added to your trips.` });
      setSelectedDest(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const MOOD_LABELS: Record<string, { icon: string; label: string }> = {
    burned_out: { icon: "😮‍💨", label: "Burned out" },
    adventurous: { icon: "🤩", label: "Adventurous" },
    social: { icon: "🎉", label: "Social" },
    reflective: { icon: "🧘", label: "Reflective" },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mood check-in overlay */}
      <AnimatePresence>
        {showMoodCheckIn && (
          <MoodCheckIn onSubmit={handleMoodSubmit} onSkip={handleSkipMood} />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 glass px-4 sm:px-6 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-primary" />
              <h1 className="font-display font-bold text-lg text-foreground">Discover</h1>
            </div>
            <div className="flex items-center gap-2">
              {currentMood && (
                <button
                  onClick={() => setShowMoodCheckIn(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm font-medium text-foreground hover:bg-muted/80 transition-colors"
                >
                  <span>{MOOD_LABELS[currentMood.mood_state]?.icon}</span>
                  <span className="hidden sm:inline">{MOOD_LABELS[currentMood.mood_state]?.label}</span>
                  <RefreshCw className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
              <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <TripModeSwitcher value={tripMode} onChange={handleTripModeChange} />
        </div>
      </header>

      {/* Feed */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <div className="w-12 h-12 rounded-2xl gradient-primary animate-pulse" />
            <p className="text-muted-foreground text-sm">Finding your perfect destinations...</p>
          </div>
        ) : destinations.length > 0 ? (
          <div className="grid gap-4">
            {destinations.map((dest, i) => (
              <DestinationCard
                key={dest.destination_id}
                destination={dest}
                rank={i}
                onClick={() => setSelectedDest(dest)}
              />
            ))}
          </div>
        ) : !showMoodCheckIn ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No destinations found. Try changing your mood!</p>
          </div>
        ) : null}
      </main>

      {/* Detail overlay */}
      <AnimatePresence>
        {selectedDest && (
          <DestinationDetail
            destination={selectedDest}
            onClose={() => setSelectedDest(null)}
            onAddToTrip={handleAddToTrip}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Discover;
