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
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
        <CheckCircle2 className="w-5 h-5" />
        <span className="font-medium text-sm">Itinerary confirmed & added to trips!</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 bg-card border border-border px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
      <p className="text-sm text-muted-foreground">Happy with this plan?</p>
      <Button
        size="sm"
        className="gradient-primary border-0 gap-1"
        onClick={handleConfirm}
        disabled={isConfirming}
      >
        {isConfirming ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Confirming...</>
        ) : (
          <><CheckCircle2 className="w-4 h-4" /> Confirm Itinerary</>
        )}
      </Button>
    </div>
  );
};

export default ConfirmItineraryBar;
