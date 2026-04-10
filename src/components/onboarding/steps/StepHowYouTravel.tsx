import ChipSelector from "../ChipSelector";
import { OnboardingData } from "../OnboardingWizard";

interface Props {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
}

const TRAVEL_STYLES = ["Backpacker", "Luxury", "Budget-friendly", "Adventure", "Cultural", "Foodie", "Wellness", "Party"];
const PACES = ["Packed", "Balanced", "Relaxed"];
const BUDGETS = ["Budget", "Mid-range", "Premium", "Luxury"];

const StepHowYouTravel = ({ data, onChange }: Props) => (
  <div className="space-y-8">
    <div>
      <label className="text-sm font-medium text-foreground mb-3 block">Travel style (pick all that fit)</label>
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
      <label className="text-sm font-medium text-foreground mb-3 block">Budget preference</label>
      <ChipSelector
        options={BUDGETS}
        selected={[data.budgetRange]}
        onChange={(s) => onChange({ budgetRange: s[0] || "mid" })}
        multiple={false}
      />
    </div>
  </div>
);

export default StepHowYouTravel;
