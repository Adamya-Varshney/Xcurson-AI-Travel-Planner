import { Input } from "@/components/ui/input";
import { MapPin, Globe } from "lucide-react";
import type { OnboardingData } from "../OnboardingWizard";

interface Props {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
}

const POPULAR_COUNTRIES = [
  { label: "India", icon: "🇮🇳" },
  { label: "USA", icon: "🇺🇸" },
  { label: "UK", icon: "🇬🇧" },
  { label: "Canada", icon: "🇨🇦" },
  { label: "Australia", icon: "🇦🇺" },
  { label: "Germany", icon: "🇩🇪" },
  { label: "Singapore", icon: "🇸🇬" },
  { label: "UAE", icon: "🇦🇪" },
];

const StepWhereYouLive = ({ data, onChange }: Props) => (
  <div className="space-y-6">
    <div>
      <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
        <MapPin className="w-4 h-4 text-primary" />
        Your city
      </label>
      <Input
        placeholder="e.g. Mumbai, Bangalore, Delhi"
        value={data.homeCity}
        onChange={(e) => onChange({ homeCity: e.target.value })}
        className="h-12"
        autoFocus
      />
    </div>

    <div>
      <label className="text-sm font-medium text-foreground mb-3 flex items-center gap-1.5">
        <Globe className="w-4 h-4 text-primary" />
        Country
      </label>
      <div className="flex flex-wrap gap-2 mb-3">
        {POPULAR_COUNTRIES.map(({ label, icon }) => (
          <button
            key={label}
            type="button"
            onClick={() => onChange({ homeCountry: label })}
            className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200 border inline-flex items-center gap-1.5 ${
              data.homeCountry === label
                ? "gradient-primary text-primary-foreground border-transparent shadow-md"
                : "bg-card text-foreground border-border hover:border-primary/50"
            }`}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </div>
      <Input
        placeholder="Or type your country..."
        value={data.homeCountry}
        onChange={(e) => onChange({ homeCountry: e.target.value })}
        className="h-10 text-sm"
      />
    </div>
  </div>
);

export default StepWhereYouLive;
