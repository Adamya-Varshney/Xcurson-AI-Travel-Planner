import ChipSelector from "../ChipSelector";
import type { OnboardingData } from "../OnboardingWizard";

interface Props {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
}

const DIETARY = ["Vegetarian", "Vegan", "Non-vegetarian", "Pescatarian", "Jain", "Halal", "Kosher", "Gluten-free", "No restrictions"];
const CUISINES = ["Indian", "Italian", "Japanese", "Thai", "Mexican", "Mediterranean", "Chinese", "Korean", "Middle Eastern", "Local street food"];

const StepWhatYouEat = ({ data, onChange }: Props) => (
  <div className="space-y-8">
    <div>
      <label className="text-sm font-medium text-foreground mb-3 block">Dietary preferences</label>
      <ChipSelector options={DIETARY} selected={data.dietaryPrefs} onChange={(s) => onChange({ dietaryPrefs: s })} />
    </div>
    <div>
      <label className="text-sm font-medium text-foreground mb-3 block">Favourite cuisines</label>
      <ChipSelector options={CUISINES} selected={data.cuisinePrefs} onChange={(s) => onChange({ cuisinePrefs: s })} />
    </div>
  </div>
);

export default StepWhatYouEat;
