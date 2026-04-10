import ChipSelector from "../ChipSelector";
import { OnboardingData } from "../OnboardingWizard";

interface Props {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
}

const INTERESTS = [
  "Beaches", "Mountains", "Temples", "History", "Art & museums",
  "Nightlife", "Shopping", "Wildlife", "Trekking", "Scuba diving",
  "Photography", "Road trips", "Yoga & meditation", "Festivals",
  "Architecture", "Local markets",
];

const CULTURAL = ["Spiritual", "Traditional", "Modern", "Offbeat", "Mainstream", "Family-friendly"];

const StepWhatYouLove = ({ data, onChange }: Props) => (
  <div className="space-y-8">
    <div>
      <label className="text-sm font-medium text-foreground mb-3 block">Interests & activities</label>
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
