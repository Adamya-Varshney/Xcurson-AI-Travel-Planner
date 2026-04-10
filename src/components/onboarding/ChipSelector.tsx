import { cn } from "@/lib/utils";

interface ChipSelectorProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  multiple?: boolean;
}

const ChipSelector = ({ options, selected, onChange, multiple = true }: ChipSelectorProps) => {
  const toggle = (option: string) => {
    if (multiple) {
      onChange(
        selected.includes(option)
          ? selected.filter((s) => s !== option)
          : [...selected, option]
      );
    } else {
      onChange([option]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => toggle(option)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
            selected.includes(option)
              ? "gradient-primary text-primary-foreground border-transparent shadow-md scale-105"
              : "bg-card text-foreground border-border hover:border-primary/50"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
};

export default ChipSelector;
