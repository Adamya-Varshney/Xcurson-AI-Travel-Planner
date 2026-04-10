import ChipSelector from "../ChipSelector";
import type { OnboardingData } from "../OnboardingWizard";

interface Props {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
}

const INTERESTS = [
  { label: "Beaches", icon: "🏖️" },
  { label: "Mountains", icon: "🏔️" },
  { label: "Temples", icon: "⛩️" },
  { label: "History", icon: "📜" },
  { label: "Art & museums", icon: "🎨" },
  { label: "Nightlife", icon: "🌃" },
  { label: "Shopping", icon: "🛍️" },
  { label: "Wildlife", icon: "🦁" },
  { label: "Trekking", icon: "🥾" },
  { label: "Scuba diving", icon: "🤿" },
  { label: "Photography", icon: "📸" },
  { label: "Road trips", icon: "🚗" },
  { label: "Yoga & meditation", icon: "🧘" },
  { label: "Festivals", icon: "🎊" },
  { label: "Architecture", icon: "🏗️" },
  { label: "Local markets", icon: "🏪" },
  { label: "Camping", icon: "⛺" },
  { label: "Water sports", icon: "🏄" },
];

const CULTURAL = [
  { label: "Spiritual", icon: "🕉️" },
  { label: "Traditional", icon: "🎎" },
  { label: "Modern", icon: "🌆" },
  { label: "Offbeat", icon: "🗿" },
  { label: "Mainstream", icon: "⭐" },
  { label: "Family-friendly", icon: "👨‍👩‍👧" },
];

const StepWhatYouLove = ({ data, onChange }: Props) => (
  <div className="space-y-8">
    <div>
      <label className="text-sm font-medium text-foreground mb-3 block">
        Interests & activities <span className="text-muted-foreground font-normal">(pick as many as you like)</span>
      </label>
      <ChipSelector
        options={INTERESTS}
        selected={data.interests}
        onChange={(s) => onChange({ interests: s })}
      />
    </div>
    <div>
      <label className="text-sm font-medium text-foreground mb-3 block">Cultural vibe</label>
      <ChipSelector
        options={CULTURAL}
        selected={data.culturalPrefs}
        onChange={(s) => onChange({ culturalPrefs: s })}
      />
    </div>
  </div>
);

export default StepWhatYouLove;
