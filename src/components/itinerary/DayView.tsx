import { format, addDays } from "date-fns";
import TimeBlockCard, { type Activity } from "./TimeBlockCard";
import { MapPin, CalendarDays } from "lucide-react";

interface DayData {
  day_number: number;
  city: string;
  morning: Activity;
  afternoon: Activity;
  evening: Activity;
}

interface DayViewProps {
  day: DayData;
  startDate?: string | null; // ISO date string e.g. "2026-04-10"
  onUpdateSlot: (dayNumber: number, slot: "morning" | "afternoon" | "evening", activity: Activity) => void;
  onResuggestSlot: (dayNumber: number, slot: "morning" | "afternoon" | "evening") => void;
  resuggestingSlot: string | null;
}

const DayView = ({ day, startDate, onUpdateSlot, onResuggestSlot, resuggestingSlot }: DayViewProps) => {
  const slots: Array<"morning" | "afternoon" | "evening"> = ["morning", "afternoon", "evening"];

  let dateLabel: string | null = null;
  if (startDate) {
    try {
      const base = new Date(startDate + "T00:00:00");
      const dayDate = addDays(base, day.day_number - 1);
      dateLabel = format(dayDate, "EEE, d MMM yyyy");
    } catch {
      // ignore parse errors
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
          {day.day_number}
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground text-sm">Day {day.day_number}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {day.city}
            </p>
            {dateLabel && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CalendarDays className="w-3 h-3" /> {dateLabel}
              </p>
            )}
          </div>
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
