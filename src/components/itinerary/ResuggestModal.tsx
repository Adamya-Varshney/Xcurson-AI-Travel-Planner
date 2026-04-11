import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, IndianRupee, Check } from "lucide-react";
import type { Activity } from "./TimeBlockCard";

interface ResuggestModalProps {
  open: boolean;
  onClose: () => void;
  alternatives: Activity[];
  onPick: (activity: Activity) => void;
  dayNumber: number;
  timeSlot: string;
}

const ResuggestModal = ({ open, onClose, alternatives, onPick, dayNumber, timeSlot }: ResuggestModalProps) => {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">
            Day {dayNumber} — {timeSlot} alternatives
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {alternatives.map((alt, i) => (
            <Card key={i} className="border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-foreground">{alt.activity}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{alt.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {alt.duration_hrs}h
                      </span>
                      <span className="flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" /> {alt.cost_inr?.toLocaleString("en-IN")}
                      </span>
                    </div>
                    {alt.travel_note && (
                      <p className="text-xs text-muted-foreground/70 mt-1 italic">💡 {alt.travel_note}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 ml-3"
                    onClick={() => onPick(alt)}
                  >
                    <Check className="w-3.5 h-3.5 mr-1" /> Pick
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResuggestModal;
