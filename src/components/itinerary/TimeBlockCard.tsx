import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Pencil, RefreshCw, Check, X, Clock, IndianRupee } from "lucide-react";

export interface Activity {
  activity: string;
  description: string;
  start_time?: string;
  end_time?: string;
  duration_hrs: number;
  cost_inr: number;
  travel_note: string;
}

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
          <div className="flex gap-2">
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
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Cost (₹)</label>
              <Input
                type="number"
                value={draft.cost_inr}
                onChange={(e) => setDraft({ ...draft, cost_inr: parseInt(e.target.value) || 0 })}
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

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <Badge className={slotColors[timeSlot]}>{slotEmojis[timeSlot]} {timeSlot}</Badge>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(true)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onResuggest}
              disabled={isResuggesting}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResuggesting ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
        <h4 className="font-semibold text-foreground text-sm">{activity.activity}</h4>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{activity.description}</p>
        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
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
            <IndianRupee className="w-3 h-3" /> {activity.cost_inr?.toLocaleString("en-IN")}
          </span>
        </div>
        {activity.travel_note && (
          <p className="text-xs text-muted-foreground/70 mt-2 italic">💡 {activity.travel_note}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default TimeBlockCard;
