import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "lucide-react";
import type { OnboardingData } from "../OnboardingWizard";

interface Props {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
}

const StepWhoYouAre = ({ data, onChange }: Props) => {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Avatar placeholder */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center shadow-lg">
          <User className="w-9 h-9 text-primary-foreground" />
        </div>
        <p className="text-xs text-muted-foreground">
          {user?.email}
        </p>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          What should we call you?
        </label>
        <Input
          placeholder="Enter your full name"
          value={data.fullName}
          onChange={(e) => onChange({ fullName: e.target.value })}
          className="text-lg h-12"
          autoFocus
        />
      </div>
    </div>
  );
};

export default StepWhoYouAre;
