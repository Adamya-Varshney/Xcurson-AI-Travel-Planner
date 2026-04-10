import { Input } from "@/components/ui/input";
import type { OnboardingData } from "../OnboardingWizard";

interface Props {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
}

const StepWhoYouAre = ({ data, onChange }: Props) => (
  <div className="space-y-6">
    <div>
      <label className="text-sm font-medium text-foreground mb-2 block">What's your name?</label>
      <Input
        placeholder="Enter your full name"
        value={data.fullName}
        onChange={(e) => onChange({ fullName: e.target.value })}
        className="text-lg h-12"
      />
    </div>
  </div>
);

export default StepWhoYouAre;
