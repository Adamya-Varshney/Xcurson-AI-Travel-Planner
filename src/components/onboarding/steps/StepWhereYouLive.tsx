import { Input } from "@/components/ui/input";
import { OnboardingData } from "../OnboardingWizard";

interface Props {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
}

const StepWhereYouLive = ({ data, onChange }: Props) => (
  <div className="space-y-6">
    <div>
      <label className="text-sm font-medium text-foreground mb-2 block">Your city</label>
      <Input
        placeholder="e.g. Mumbai, Bangalore, Delhi"
        value={data.homeCity}
        onChange={(e) => onChange({ homeCity: e.target.value })}
        className="h-12"
      />
    </div>
    <div>
      <label className="text-sm font-medium text-foreground mb-2 block">Country</label>
      <Input
        placeholder="e.g. India"
        value={data.homeCountry}
        onChange={(e) => onChange({ homeCountry: e.target.value })}
        className="h-12"
      />
    </div>
  </div>
);

export default StepWhereYouLive;
