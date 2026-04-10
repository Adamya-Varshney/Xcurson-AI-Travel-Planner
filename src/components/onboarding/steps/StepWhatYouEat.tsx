import ChipSelector from "../ChipSelector";
import type { OnboardingData } from "../OnboardingWizard";

interface Props {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
}

const DIETARY = [
  { label: "Vegetarian", icon: "🥬" },
  { label: "Vegan", icon: "🌱" },
  { label: "Non-vegetarian", icon: "🍖" },
  { label: "Pescatarian", icon: "🐟" },
  { label: "Jain", icon: "🙏" },
  { label: "Halal", icon: "🌙" },
  { label: "Kosher", icon: "✡️" },
  { label: "Gluten-free", icon: "🌾" },
  { label: "No restrictions", icon: "✅" },
];

const CUISINES = [
  { label: "Indian", icon: "🇮🇳" },
  { label: "Italian", icon: "🇮🇹" },
  { label: "Japanese", icon: "🇯🇵" },
  { label: "Thai", icon: "🇹🇭" },
  { label: "Mexican", icon: "🇲🇽" },
  { label: "Mediterranean", icon: "🫒" },
  { label: "Chinese", icon: "🇨🇳" },
  { label: "Korean", icon: "🇰🇷" },
  { label: "Middle Eastern", icon: "🧆" },
  { label: "Street food", icon: "🛒" },
  { label: "French", icon: "🇫🇷" },
  { label: "American", icon: "🇺🇸" },
];

const StepWhatYouEat = ({ data, onChange }: Props) => (
  <div className="space-y-8">
    <div>
      <label className="text-sm font-medium text-foreground mb-3 block">
        Dietary preferences
      </label>
      <ChipSelector
        options={DIETARY}
        selected={data.dietaryPrefs}
        onChange={(s) => onChange({ dietaryPrefs: s })}
      />
    </div>
    <div>
      <label className="text-sm font-medium text-foreground mb-3 block">
        Favourite cuisines
      </label>
      <ChipSelector
        options={CUISINES}
        selected={data.cuisinePrefs}
        onChange={(s) => onChange({ cuisinePrefs: s })}
      />
    </div>
  </div>
);

export default StepWhatYouEat;
