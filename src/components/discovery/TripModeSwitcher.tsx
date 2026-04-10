import { cn } from "@/lib/utils";

interface TripModeSwitcherProps {
  value: string;
  onChange: (mode: string) => void;
}

const MODES = [
  { key: "solo", label: "Solo", icon: "🧑" },
  { key: "partner", label: "Partner", icon: "👫" },
  { key: "group", label: "Group", icon: "👥" },
  { key: "family", label: "Family", icon: "👨‍👩‍👧" },
];

const TripModeSwitcher = ({ value, onChange }: TripModeSwitcherProps) => (
  <div className="flex rounded-xl border border-border bg-card p-1 gap-0.5">
    {MODES.map((m) => (
      <button
        key={m.key}
        onClick={() => onChange(m.key)}
        className={cn(
          "flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5",
          value === m.key
            ? "gradient-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <span className="text-sm">{m.icon}</span>
        <span className="hidden sm:inline">{m.label}</span>
      </button>
    ))}
  </div>
);

export default TripModeSwitcher;
