import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ChipSelectorProps {
  options: { label: string; icon?: string }[] | string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  multiple?: boolean;
}

const ChipSelector = ({ options, selected, onChange, multiple = true }: ChipSelectorProps) => {
  const normalizedOptions = options.map((o) =>
    typeof o === "string" ? { label: o, icon: undefined } : o
  );

  const toggle = (label: string) => {
    if (multiple) {
      onChange(
        selected.includes(label)
          ? selected.filter((s) => s !== label)
          : [...selected, label]
      );
    } else {
      onChange([label]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {normalizedOptions.map(({ label, icon }) => {
        const isSelected = selected.includes(label);
        return (
          <motion.button
            key={label}
            type="button"
            onClick={() => toggle(label)}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border inline-flex items-center gap-1.5",
              isSelected
                ? "gradient-primary text-primary-foreground border-transparent shadow-md"
                : "bg-card text-foreground border-border hover:border-primary/50 hover:shadow-sm"
            )}
          >
            {icon && <span className="text-base leading-none">{icon}</span>}
            {label}
          </motion.button>
        );
      })}
    </div>
  );
};

export default ChipSelector;
