import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, RefreshCw, Check, X, Clock, IndianRupee, Car, UtensilsCrossed, BedDouble, Navigation } from "lucide-react";

export interface TransportAlternative {
  mode: string;
  provider?: string;
  duration_mins?: number;
  cost_inr: number;
  note?: string;
}

export interface Activity {
  activity: string;
  description: string;
  start_time?: string;
  end_time?: string;
  duration_hrs: number;
  cost_inr: number;
  commute_cost_inr?: number;
  food_cost_inr?: number;
  accommodation_cost_inr?: number;
  travel_note: string;
  transport_mode?: string;
  transport_alternatives?: TransportAlternative[];
}

const TRANSPORT_MODES = [
  "Walk", "Auto/Rickshaw", "Taxi/Cab", "Metro", "Bus", "Train",
  "Bicycle", "Motorbike/Scooter", "Private Car", "Ferry/Boat", "Flight", "Other",
];

interface TimeBlockCardProps {
  timeSlot: "morning" | "afternoon" | "evening";
  activity: Activity;
  onUpdate: (updated: Activity) => void;
  onResuggest: () => void;
  isResuggesting?: boolean;
}

const slotColors: Record<string, string> = {
  morning: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  afternoon: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  evening: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
};

const slotEmojis: Record<string, string> = {
  morning: "🌅",
  afternoon: "☀️",
  evening: "🌙",
};

const TimeBlockCard = ({ timeSlot, activity, onUpdate, onResuggest, isResuggesting }: TimeBlockCardProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Activity>(activity);

  const handleSave = () => {
    onUpdate(draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(activity);
    setEditing(false);
  };

  if (editing) {
    return (
      <Card className="border border-primary/30 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Badge className={slotColors[timeSlot]}>{slotEmojis[timeSlot]} {timeSlot}</Badge>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSave}>
                <Check className="w-4 h-4 text-green-600" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancel}>
                <X className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
          <Input
            value={draft.activity}
            onChange={(e) => setDraft({ ...draft, activity: e.target.value })}
            placeholder="Activity name"
            className="text-sm font-medium"
          />
          <Textarea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="Description"
            rows={2}
            className="text-sm"
          />
          {/* Timing */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Start Time</label>
              <Input
                type="time"
                value={draft.start_time ? convertTo24h(draft.start_time) : ""}
                onChange={(e) => setDraft({ ...draft, start_time: convertTo12h(e.target.value) })}
                className="text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">End Time</label>
              <Input
                type="time"
                value={draft.end_time ? convertTo24h(draft.end_time) : ""}
                onChange={(e) => setDraft({ ...draft, end_time: convertTo12h(e.target.value) })}
                className="text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Hours</label>
              <Input
                type="number"
                step="0.5"
                value={draft.duration_hrs}
                onChange={(e) => setDraft({ ...draft, duration_hrs: parseFloat(e.target.value) || 0 })}
                className="text-sm"
              />
            </div>
          </div>
          {/* Transport mode */}
          <div>
            <label className="text-xs text-muted-foreground">Mode of Transport</label>
            <Select
              value={draft.transport_mode || ""}
              onValueChange={(val) => setDraft({ ...draft, transport_mode: val })}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select transport" />
              </SelectTrigger>
              <SelectContent>
                {TRANSPORT_MODES.map((mode) => (
                  <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Costs breakdown */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Activity Cost (₹)</label>
              <Input
                type="number"
                value={draft.cost_inr}
                onChange={(e) => setDraft({ ...draft, cost_inr: parseInt(e.target.value) || 0 })}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Commute (₹)</label>
              <Input
                type="number"
                value={draft.commute_cost_inr ?? 0}
                onChange={(e) => setDraft({ ...draft, commute_cost_inr: parseInt(e.target.value) || 0 })}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Food (₹)</label>
              <Input
                type="number"
                value={draft.food_cost_inr ?? 0}
                onChange={(e) => setDraft({ ...draft, food_cost_inr: parseInt(e.target.value) || 0 })}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Accommodation (₹)</label>
              <Input
                type="number"
                value={draft.accommodation_cost_inr ?? 0}
                onChange={(e) => setDraft({ ...draft, accommodation_cost_inr: parseInt(e.target.value) || 0 })}
                className="text-sm"
              />
            </div>
          </div>
          <Input
            value={draft.travel_note}
            onChange={(e) => setDraft({ ...draft, travel_note: e.target.value })}
            placeholder="Travel tip"
            className="text-sm"
          />
        </CardContent>
      </Card>
    );
  }

  const totalSlotCost = (activity.cost_inr || 0) + (activity.commute_cost_inr || 0) + (activity.food_cost_inr || 0) + (activity.accommodation_cost_inr || 0);

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <Badge className={slotColors[timeSlot]}>{slotEmojis[timeSlot]} {timeSlot}</Badge>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setDraft(activity); setEditing(true); }}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onResuggest} disabled={isResuggesting}>
              <RefreshCw className={`w-3.5 h-3.5 ${isResuggesting ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
        <h4 className="font-semibold text-foreground text-sm">{activity.activity}</h4>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{activity.description}</p>
        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
          {activity.start_time && activity.end_time && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {activity.start_time} – {activity.end_time}
            </span>
          )}
          {!activity.start_time && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {activity.duration_hrs}h
            </span>
          )}
          <span className="flex items-center gap-1">
            <IndianRupee className="w-3 h-3" /> {totalSlotCost.toLocaleString("en-IN")}
          </span>
          {activity.transport_mode && (
            <span className="flex items-center gap-1">
              <Navigation className="w-3 h-3" /> {activity.transport_mode}
            </span>
          )}
        </div>
        {(activity.commute_cost_inr || activity.food_cost_inr || activity.accommodation_cost_inr) ? (
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground/60 flex-wrap">
            {activity.commute_cost_inr ? (
              <span className="flex items-center gap-1"><Car className="w-3 h-3" /> ₹{activity.commute_cost_inr.toLocaleString("en-IN")}</span>
            ) : null}
            {activity.food_cost_inr ? (
              <span className="flex items-center gap-1"><UtensilsCrossed className="w-3 h-3" /> ₹{activity.food_cost_inr.toLocaleString("en-IN")}</span>
            ) : null}
            {activity.accommodation_cost_inr ? (
              <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" /> ₹{activity.accommodation_cost_inr.toLocaleString("en-IN")}</span>
            ) : null}
          </div>
        ) : null}
        {activity.travel_note && (
          <p className="text-xs text-muted-foreground/70 mt-2 italic">💡 {activity.travel_note}</p>
        )}
      </CardContent>
    </Card>
  );
};

// Helper: "09:30 AM" → "09:30"
function convertTo24h(time12h: string): string {
  if (!time12h) return "";
  const match = time12h.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return time12h;
  let [, h, m, period] = match;
  let hours = parseInt(h);
  if (period.toUpperCase() === "PM" && hours !== 12) hours += 12;
  if (period.toUpperCase() === "AM" && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, "0")}:${m}`;
}

// Helper: "09:30" → "09:30 AM"
function convertTo12h(time24h: string): string {
  if (!time24h) return "";
  const [hStr, m] = time24h.split(":");
  let hours = parseInt(hStr);
  const period = hours >= 12 ? "PM" : "AM";
  if (hours === 0) hours = 12;
  else if (hours > 12) hours -= 12;
  return `${hours.toString().padStart(2, "0")}:${m} ${period}`;
}

export default TimeBlockCard;
