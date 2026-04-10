import ChipSelector from "../ChipSelector";
import { Slider } from "@/components/ui/slider";
import type { OnboardingData } from "../OnboardingWizard";

interface Props {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
}

const TRAVEL_STYLES = [
  { label: "Backpacker", icon: "🎒" },
  { label: "Luxury", icon: "💎" },
  { label: "Budget-friendly", icon: "💰" },
  { label: "Adventure", icon: "🧗" },
  { label: "Cultural", icon: "🏛️" },
  { label: "Foodie", icon: "🍕" },
  { label: "Wellness", icon: "🧘" },
  { label: "Party", icon: "🎉" },
  { label: "Road Trip", icon: "🚗" },
  { label: "Solo", icon: "🧑" },
];

const PACES = [
  { label: "Packed", icon: "⚡" },
  { label: "Balanced", icon: "⚖️" },
  { label: "Relaxed", icon: "🌴" },
];

const BUDGET_LABELS = ["Budget", "Mid-range", "Premium", "Luxury"];
const BUDGET_MAP: Record<number, string> = { 0: "budget", 1: "mid", 2: "premium", 3: "luxury" };
const BUDGET_REVERSE: Record<string, number> = { budget: 0, mid: 1, premium: 2, luxury: 3 };

const StepHowYouTravel = ({ data, onChange }: Props) => {
  const budgetIdx = BUDGET_REVERSE[data.budgetRange] ?? 1;

  return (
    <div className="space-y-8">
      <div>
        <label className="text-sm font-medium text-foreground mb-3 block">
          Travel style <span className="text-muted-foreground font-normal">(pick all that fit)</span>
        </label>
        <ChipSelector
          options={TRAVEL_STYLES}
          selected={data.travelStyle}
          onChange={(s) => onChange({ travelStyle: s })}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-3 block">Preferred pace</label>
        <ChipSelector
          options={PACES}
          selected={[data.travelPace]}
          onChange={(s) => onChange({ travelPace: s[0] || "balanced" })}
          multiple={false}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Budget preference</label>
        <div className="px-1">
          <Slider
            value={[budgetIdx]}
            onValueChange={(v) => onChange({ budgetRange: BUDGET_MAP[v[0]] || "mid" })}
            min={0}
            max={3}
            step={1}
            className="mt-3"
          />
          <div className="flex justify-between mt-2">
            {BUDGET_LABELS.map((label, i) => (
              <span
                key={label}
                className={`text-xs transition-colors ${
                  i === budgetIdx ? "text-primary font-semibold" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepHowYouTravel;
