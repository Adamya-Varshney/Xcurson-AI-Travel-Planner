import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ChipSelector from "../ChipSelector";
import type { OnboardingData } from "../OnboardingWizard";

interface Props {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
}

const FREQUENCIES = [
  { label: "First trip!", icon: "🌟" },
  { label: "Once a year", icon: "📅" },
  { label: "2-3 times/year", icon: "🗓️" },
  { label: "Monthly", icon: "🔄" },
  { label: "Digital nomad", icon: "💻" },
];

const POPULAR_DESTINATIONS = [
  "Goa", "Paris", "Bali", "Tokyo", "London", "Dubai", "New York", "Jaipur",
  "Manali", "Bangkok", "Rome", "Maldives",
];

const StepPastTrips = ({ data, onChange }: Props) => {
  const [newDest, setNewDest] = useState("");

  const addDestination = (dest?: string) => {
    const trimmed = (dest || newDest).trim();
    if (trimmed && !data.pastDestinations.includes(trimmed)) {
      onChange({ pastDestinations: [...data.pastDestinations, trimmed] });
      setNewDest("");
    }
  };

  const removeDestination = (dest: string) => {
    onChange({ pastDestinations: data.pastDestinations.filter((d) => d !== dest) });
  };

  return (
    <div className="space-y-8">
      <div>
        <label className="text-sm font-medium text-foreground mb-3 block">
          How often do you travel?
        </label>
        <ChipSelector
          options={FREQUENCIES}
          selected={[data.travelFrequency]}
          onChange={(s) => onChange({ travelFrequency: s[0] || "once_a_year" })}
          multiple={false}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-3 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-primary" />
          Places you've been to <span className="text-muted-foreground font-normal">(optional)</span>
        </label>

        {/* Quick-add popular destinations */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {POPULAR_DESTINATIONS.filter((d) => !data.pastDestinations.includes(d)).map((dest) => (
            <button
              key={dest}
              type="button"
              onClick={() => addDestination(dest)}
              className="px-2.5 py-1 rounded-full text-xs border border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all"
            >
              + {dest}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-3">
          <Input
            placeholder="Type a destination & press Enter"
            value={newDest}
            onChange={(e) => setNewDest(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addDestination();
              }
            }}
          />
          <Button type="button" size="icon" variant="outline" onClick={() => addDestination()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <AnimatePresence>
          <div className="flex flex-wrap gap-2">
            {data.pastDestinations.map((dest) => (
              <motion.span
                key={dest}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/15 text-secondary text-sm font-medium border border-secondary/20"
              >
                📍 {dest}
                <button
                  onClick={() => removeDestination(dest)}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.span>
            ))}
          </div>
        </AnimatePresence>

        {data.pastDestinations.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            {data.pastDestinations.length} destination{data.pastDestinations.length > 1 ? "s" : ""} added
          </p>
        )}
      </div>
    </div>
  );
};

export default StepPastTrips;
