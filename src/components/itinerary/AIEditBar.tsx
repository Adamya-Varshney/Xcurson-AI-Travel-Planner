import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wand2, Send } from "lucide-react";

interface AIEditBarProps {
  onSubmit: (instruction: string) => void;
  isEditing: boolean;
  changeSummary: string | null;
}

const AIEditBar = ({ onSubmit, isEditing, changeSummary }: AIEditBarProps) => {
  const [instruction, setInstruction] = useState("");

  const handleSubmit = () => {
    if (!instruction.trim() || isEditing) return;
    onSubmit(instruction.trim());
    setInstruction("");
  };

  return (
    <div className="fixed bottom-[4.5rem] left-0 right-0 z-50 px-3 sm:px-4 pb-2">
      <div className="max-w-lg mx-auto">
        {changeSummary && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-t-xl px-3 sm:px-4 py-2 text-[10px] sm:text-xs text-green-700 dark:text-green-300">
            ✓ {changeSummary}
          </div>
        )}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-card border border-border rounded-xl shadow-lg p-1.5 sm:p-2">
          <Wand2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary ml-1.5 sm:ml-2 shrink-0" />
          <Input
            placeholder="e.g. Swap Day 3 for something vegetarian..."
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="border-0 shadow-none focus-visible:ring-0 text-xs sm:text-sm bg-transparent"
            disabled={isEditing}
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!instruction.trim() || isEditing}
            className="shrink-0 h-7 w-7 sm:h-8 sm:w-8 rounded-lg gradient-primary border-0"
          >
            {isEditing ? (
              <span className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIEditBar;
