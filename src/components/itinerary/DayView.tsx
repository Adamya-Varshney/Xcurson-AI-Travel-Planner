import TimeBlockCard, { type Activity } from "./TimeBlockCard";
import { MapPin } from "lucide-react";

interface DayData {
  day_number: number;
  city: string;
  morning: Activity;
  afternoon: Activity;
  evening: Activity;
}

interface DayViewProps {
  day: DayData;
  onUpdateSlot: (dayNumber: number, slot: "morning" | "afternoon" | "evening", activity: Activity) => void;
  onResuggestSlot: (dayNumber: number, slot: "morning" | "afternoon" | "evening") => void;
  resuggestingSlot: string | null;
}

const DayView = ({ day, onUpdateSlot, onResuggestSlot, resuggestingSlot }: DayViewProps) => {
  const slots: Array<"morning" | "afternoon" | "evening"> = ["morning", "afternoon", "evening"];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
          {day.day_number}
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground text-sm">Day {day.day_number}</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {day.city}
          </p>
        </div>
      </div>
      {slots.map((slot) => (
        <TimeBlockCard
          key={slot}
          timeSlot={slot}
          activity={day[slot]}
          onUpdate={(updated) => onUpdateSlot(day.day_number, slot, updated)}
          onResuggest={() => onResuggestSlot(day.day_number, slot)}
          isResuggesting={resuggestingSlot === `${day.day_number}-${slot}`}
        />
      ))}
    </div>
  );
};

export default DayView;
