import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "lucide-react";
import ChipSelector from "../ChipSelector";
import type { OnboardingData } from "../OnboardingWizard";

interface Props {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
}

const GENDERS = [
  { label: "Male", icon: "♂️" },
  { label: "Female", icon: "♀️" },
  { label: "Non-binary", icon: "⚧️" },
  { label: "Prefer not to say", icon: "🤐" },
];

const LANGUAGES = [
  { label: "English", icon: "🇬🇧" },
  { label: "Hindi", icon: "🇮🇳" },
  { label: "Spanish", icon: "🇪🇸" },
  { label: "French", icon: "🇫🇷" },
  { label: "German", icon: "🇩🇪" },
  { label: "Mandarin", icon: "🇨🇳" },
  { label: "Japanese", icon: "🇯🇵" },
  { label: "Arabic", icon: "🇸🇦" },
  { label: "Portuguese", icon: "🇵🇹" },
  { label: "Korean", icon: "🇰🇷" },
];

const StepWhoYouAre = ({ data, onChange }: Props) => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center shadow-lg">
          <User className="w-9 h-9 text-primary-foreground" />
        </div>
        <p className="text-xs text-muted-foreground">{user?.email}</p>
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

      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Age <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <Input
          placeholder="e.g. 28"
          type="number"
          value={data.age}
          onChange={(e) => onChange({ age: e.target.value })}
          className="h-10"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-3 block">
          Gender <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <ChipSelector
          options={GENDERS}
          selected={data.gender ? [data.gender] : []}
          onChange={(s) => onChange({ gender: s[0] || "" })}
          multiple={false}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-3 block">
          Languages you speak <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <ChipSelector
          options={LANGUAGES}
          selected={data.languages}
          onChange={(s) => onChange({ languages: s })}
        />
      </div>
    </div>
  );
};

export default StepWhoYouAre;
