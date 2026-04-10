import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import ChipSelector from "../ChipSelector";
import type { OnboardingData } from "../OnboardingWizard";

interface Props {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
}

const FREQUENCIES = ["First trip!", "Once a year", "2-3 times/year", "Monthly", "Digital nomad"];

const StepPastTrips = ({ data, onChange }: Props) => {
  const [newDest, setNewDest] = useState("");

  const addDestination = () => {
    const trimmed = newDest.trim();
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
        <label className="text-sm font-medium text-foreground mb-3 block">How often do you travel?</label>
        <ChipSelector
          options={FREQUENCIES}
          selected={[data.travelFrequency]}
          onChange={(s) => onChange({ travelFrequency: s[0] || "once_a_year" })}
          multiple={false}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-3 block">Places you've been to (optional)</label>
        <div className="flex gap-2 mb-3">
          <Input
            placeholder="e.g. Goa, Paris, Bali"
            value={newDest}
            onChange={(e) => setNewDest(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDestination())}
          />
          <Button type="button" size="icon" variant="outline" onClick={addDestination}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.pastDestinations.map((dest) => (
            <span key={dest} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm">
              {dest}
              <button onClick={() => removeDestination(dest)} className="hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepPastTrips;
