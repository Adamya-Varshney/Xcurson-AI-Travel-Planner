import { motion } from "framer-motion";
import { Sparkles, MapPin, ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VibeData {
  landscape_type: string;
  crowd_density: string;
  pace: string;
  light_quality: string;
  primary_activity: string;
  mood_tags: string[];
}

interface MatchedDestination {
  destination_id: string;
  name: string;
  country: string;
  region?: string;
  description?: string;
  landscape_type?: string[];
  experience_tags?: string[];
  budget_level?: string;
  fit_score: number;
  match_reason?: string;
}

interface VibeResultsProps {
  extractedVibe: VibeData;
  matchExplanation: string;
  matchedDestinations: MatchedDestination[];
  imagePreview?: string;
  onDestinationClick: (dest: MatchedDestination) => void;
  onReset: () => void;
}

const VIBE_EMOJI: Record<string, string> = {
  mountain: "🏔️", coastal: "🌊", urban: "🏙️", forest: "🌲",
  desert: "🏜️", tropical: "🌴", rural: "🌾", arctic: "❄️",
  empty: "🤫", sparse: "🧘", moderate: "👥", busy: "🎉", packed: "🎊",
  slow: "🐢", fast: "⚡",
  golden_hour: "🌅", bright: "☀️", overcast: "☁️", twilight: "🌆", night: "🌙",
  relaxation: "🏖️", adventure: "🎒", culture: "🏛️", nightlife: "🎶",
  nature: "🌿", gastronomy: "🍜", spirituality: "🙏",
};

const VibeResults = ({
  extractedVibe,
  matchExplanation,
  matchedDestinations,
  imagePreview,
  onDestinationClick,
  onReset,
}: VibeResultsProps) => {
  const vibeAttributes = [
    { label: "Landscape", value: extractedVibe.landscape_type, emoji: VIBE_EMOJI[extractedVibe.landscape_type] },
    { label: "Crowd", value: extractedVibe.crowd_density, emoji: VIBE_EMOJI[extractedVibe.crowd_density] },
    { label: "Pace", value: extractedVibe.pace, emoji: VIBE_EMOJI[extractedVibe.pace] },
    { label: "Light", value: extractedVibe.light_quality, emoji: VIBE_EMOJI[extractedVibe.light_quality] },
    { label: "Activity", value: extractedVibe.primary_activity, emoji: VIBE_EMOJI[extractedVibe.primary_activity] },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Vibe Summary Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="rounded-2xl border border-border bg-card overflow-hidden"
      >
        {imagePreview && (
          <div className="relative h-32 sm:h-40">
            <img src={imagePreview} alt="Your vibe" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          </div>
        )}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="font-display font-bold text-foreground">Your Vibe</h3>
          </div>
          <p className="text-sm text-muted-foreground italic">{matchExplanation}</p>

          {/* Vibe attribute chips */}
          <div className="flex flex-wrap gap-1.5">
            {vibeAttributes.map((attr) => (
              <span
                key={attr.label}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-xs font-medium text-foreground"
              >
                <span>{attr.emoji || "✨"}</span>
                <span className="capitalize">{attr.value?.replace(/_/g, " ")}</span>
              </span>
            ))}
          </div>

          {/* Mood tags */}
          {extractedVibe.mood_tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {extractedVibe.mood_tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wider"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Matched Destinations */}
      <div className="space-y-3">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Vibe Matches
          <span className="text-xs font-normal text-muted-foreground">({matchedDestinations.length})</span>
        </h3>

        {matchedDestinations.map((dest, i) => (
          <motion.div
            key={dest.destination_id}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => onDestinationClick(dest)}
            className="group flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/50 cursor-pointer transition-all"
          >
            {/* Rank + Score */}
            <div className="flex flex-col items-center min-w-[40px]">
              <span className="text-xs text-muted-foreground font-mono">#{i + 1}</span>
              <div className="relative w-10 h-10 flex items-center justify-center">
                <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-muted"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-primary"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={`${dest.fit_score}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[10px] font-bold text-foreground">{dest.fit_score}</span>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-primary shrink-0" />
                <span className="font-display font-semibold text-sm text-foreground truncate">{dest.name}</span>
                <span className="text-xs text-muted-foreground">{dest.country}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{dest.match_reason}</p>
              {dest.experience_tags && dest.experience_tags.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {dest.experience_tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-1.5 py-0.5 rounded bg-muted text-[9px] text-muted-foreground capitalize">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </motion.div>
        ))}
      </div>

      {/* Try Again */}
      <div className="flex justify-center pt-2">
        <Button variant="outline" onClick={onReset} className="rounded-xl gap-2">
          <Sparkles className="w-4 h-4" />
          Try another image
        </Button>
      </div>
    </motion.div>
  );
};

export default VibeResults;
