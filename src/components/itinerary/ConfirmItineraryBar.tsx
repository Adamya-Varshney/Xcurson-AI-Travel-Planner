import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";

interface ConfirmItineraryBarProps {
  onConfirm: () => Promise<void>;
  isConfirmed: boolean;
}

const ConfirmItineraryBar = ({ onConfirm, isConfirmed }: ConfirmItineraryBarProps) => {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  };

  if (isConfirmed) {
    return (
      <div className="fixed bottom-[7.5rem] sm:bottom-36 left-1/2 -translate-x-1/2 z-40 bg-green-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 max-w-[calc(100vw-2rem)]">
        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
        <span className="font-medium text-xs sm:text-sm">Itinerary confirmed & added to trips!</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-[7.5rem] sm:bottom-36 left-1/2 -translate-x-1/2 z-40 bg-card border border-border px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl shadow-xl flex items-center gap-2 sm:gap-3 animate-in fade-in slide-in-from-bottom-4 max-w-[calc(100vw-2rem)]">
      <p className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Happy with this plan?</p>
      <Button
        size="sm"
        className="gradient-primary border-0 gap-1 text-xs sm:text-sm shrink-0"
        onClick={handleConfirm}
        disabled={isConfirming}
      >
        {isConfirming ? (
          <><Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> Confirming...</>
        ) : (
          <><CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Confirm</>
        )}
      </Button>
    </div>
  );
};

export default ConfirmItineraryBar;
